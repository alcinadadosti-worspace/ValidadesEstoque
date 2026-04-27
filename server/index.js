require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const produtosRoutes = require('./routes/produtos');
const validadesRoutes = require('./routes/validades');
const { iniciarJobSlack, enviarAlertaSlack } = require('./jobs/alertaSlack');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/produtos', produtosRoutes);
app.use('/api/validades', validadesRoutes);

// Dispara alerta via GET com diagnóstico detalhado
app.get('/api/alertas/slack/testar', async (req, res) => {
  if (req.query.key !== process.env.ALERTA_SECRET) {
    return res.status(401).send('Não autorizado.');
  }

  const log = [];
  const ok  = (msg) => log.push('✅ ' + msg);
  const err = (msg) => log.push('❌ ' + msg);
  const inf = (msg) => log.push('ℹ️ ' + msg);

  // Verifica variáveis de ambiente
  const botToken      = process.env.SLACK_BOT_TOKEN;
  const destinatarios = process.env.SLACK_DESTINATARIOS;

  botToken      ? ok('SLACK_BOT_TOKEN configurado')
                : err('SLACK_BOT_TOKEN ausente no Render');
  destinatarios ? ok('SLACK_DESTINATARIOS: ' + destinatarios)
                : err('SLACK_DESTINATARIOS ausente no Render — adicione o ID do usuário');

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    ok(`FIREBASE_SERVICE_ACCOUNT_BASE64: ${b64.length} chars`);
    try {
      const raw = Buffer.from(b64, 'base64').toString('utf8');
      const fixed = raw.replace(
        /-----BEGIN [A-Z ]+ KEY-----[\s\S]*?-----END [A-Z ]+ KEY-----\n?/g,
        m => m.replace(/\n/g, '\\n')
      );
      JSON.parse(fixed);
      ok('Base64 decodifica e parseia corretamente');
    } catch (e) {
      err('Base64 inválido: ' + e.message);
    }
  } else {
    err('FIREBASE_SERVICE_ACCOUNT_BASE64 não configurado no Render');
  }

  // Conta itens em alerta no Firestore
  try {
    const { getDb } = require('./lib/firebase-admin');
    const db = getDb();
    const snap = await db.collection('validades').get();
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let emAlerta = 0;
    snap.forEach(doc => {
      const d = doc.data();
      if (!d.dataValidade) return;
      const v = d.dataValidade.toDate(); v.setHours(0,0,0,0);
      const dias = Math.round((v - hoje) / 86400000);
      if (dias >= 0 && dias <= 60) emAlerta++;
    });
    inf(`${snap.size} registros no Firestore — ${emAlerta} dentro de 60 dias`);
    emAlerta === 0
      ? err('Nenhum item vencendo nos próximos 60 dias — mensagem não seria enviada')
      : ok(`${emAlerta} item(ns) em alerta — mensagem será enviada`);
  } catch (e) {
    err('Firestore: ' + e.message);
  }

  // Envia prévia com dados de exemplo para o usuário ver o formato real
  if (botToken && destinatarios) {
    try {
      const axios = require('axios');

      const itensMock = [
        { nome: 'HOME SPRAY INTENSE 200ML',         sku: '57207', quantidade: 12, marca: 'O Boticário',          unidade: 'Matriz', dias: 5,  mes: '04/2026' },
        { nome: 'DESODORANTE LILY 75ML',             sku: '48391', quantidade: 6,  marca: 'Eudora',               unidade: 'Filial', dias: 18, mes: '04/2026' },
        { nome: 'BATOM MATTE VELVET 3G',             sku: '61045', quantidade: 24, marca: 'Quem Disse, Berenice?', unidade: 'Matriz', dias: 32, mes: '05/2026' },
        { nome: 'PERFUME OUI PARIS EDP 75ML',        sku: '72819', quantidade: 3,  marca: 'O.U.I',                unidade: 'Filial', dias: 47, mes: '05/2026' },
        { nome: 'SHAMPOO CACHOS PERFEITOS 300ML',    sku: '39204', quantidade: 8,  marca: 'O Boticário',          unidade: 'Matriz', dias: 58, mes: '06/2026' },
      ];

      const emojiDias = d => (d === 0 ? '💀' : d <= 30 ? '🚨' : '⚠️');
      const appUrl = process.env.APP_URL || 'https://validadesestoque.onrender.com';

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: '⚠️ Alerta de Validades — Grupo Alcina Maria', emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${itensMock.length} item(ns)* vencem nos próximos *60 dias*. Verifique o estoque!\n_🔔 Esta é uma prévia — o alerta real usará os dados reais do sistema._` },
        },
        { type: 'divider' },
        ...itensMock.map(item => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `${emojiDias(item.dias)} *${item.nome}*`,
              `SKU: \`${item.sku}\` · 📦 ${item.quantidade} un. · 📅 ${item.mes} · ${item.unidade === 'Matriz' ? '🏬 Matriz' : '🏪 Filial'}`,
              `→ *${item.dias} dia(s)* restantes`,
            ].join('\n'),
          },
        })),
        { type: 'divider' },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: '📋 Ver no App', emoji: true },
            style: 'primary',
            url: appUrl,
          }],
        },
      ];

      const ids = destinatarios.split(',').map(s => s.trim()).filter(Boolean);
      for (const userId of ids) {
        const openRes = await axios.post(
          'https://slack.com/api/conversations.open',
          { users: userId },
          { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
        );
        if (!openRes.data.ok) { err(`conversations.open para ${userId}: ${openRes.data.error}`); continue; }
        const msgRes = await axios.post(
          'https://slack.com/api/chat.postMessage',
          { channel: openRes.data.channel.id, blocks },
          { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
        );
        msgRes.data.ok
          ? ok(`Prévia enviada para ${userId}`)
          : err(`chat.postMessage para ${userId}: ${msgRes.data.error}`);
      }
    } catch (e) {
      err('Slack API: ' + e.message);
    }
  }

  res.type('text').send(log.join('\n'));
});

// Dispara alerta via POST (para cron externo como cron-job.org)
app.post('/api/alertas/slack', async (req, res) => {
  if (req.headers['x-alerta-key'] !== process.env.ALERTA_SECRET) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }
  await enviarAlertaSlack();
  res.json({ ok: true });
});

// Em produção, serve o build do React (monorepo)
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));
  // Redireciona todas as rotas não-API para o index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  iniciarJobSlack();
});
