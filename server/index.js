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

  // Tenta enviar mesmo que não haja itens (modo diagnóstico envia mensagem de teste)
  if (botToken && destinatarios) {
    try {
      const axios = require('axios');
      const ids = destinatarios.split(',').map(s => s.trim()).filter(Boolean);
      for (const userId of ids) {
        const openRes = await axios.post(
          'https://slack.com/api/conversations.open',
          { users: userId },
          { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
        );
        if (!openRes.data.ok) {
          err(`conversations.open para ${userId}: ${openRes.data.error}`);
          continue;
        }
        const channelId = openRes.data.channel.id;
        const msgRes = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: channelId,
            text: '🔔 *Teste do bot de validades — Grupo Alcina Maria*\nSe você recebeu essa mensagem, o bot está funcionando! O alerta real será enviado todo dia às 8h.',
          },
          { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
        );
        msgRes.data.ok
          ? ok(`Mensagem de teste enviada para ${userId}`)
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
