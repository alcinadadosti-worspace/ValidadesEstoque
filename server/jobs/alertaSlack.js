const cron = require('node-cron');
const axios = require('axios');

// Calcula dias restantes para um Firestore Timestamp
function diasRestantes(timestamp) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  validade.setHours(0, 0, 0, 0);
  return Math.round((validade - hoje) / (1000 * 60 * 60 * 24));
}

function formatarMes(timestamp) {
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
}

// Monta e envia a mensagem no Slack via Incoming Webhook
async function enviarAlertaSlack() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const appUrl     = process.env.APP_URL || 'https://validades.onrender.com';
  const diasLimite = parseInt(process.env.SLACK_DIAS_ALERTA || '60', 10); // padrão: 2 meses

  if (!webhookUrl) {
    console.log('[Slack] SLACK_WEBHOOK_URL não definido — alerta ignorado.');
    return;
  }

  let db;
  try {
    const { getDb } = require('../lib/firebase-admin');
    db = getDb();
  } catch (err) {
    console.error('[Slack] Erro ao conectar ao Firestore:', err.message);
    return;
  }

  try {
    const snap = await db.collection('validades').get();

    const emAlerta = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      if (!d.dataValidade) return;
      const dias = diasRestantes(d.dataValidade);
      if (dias >= 0 && dias <= diasLimite) {
        emAlerta.push({ ...d, id: docSnap.id, dias });
      }
    });

    if (emAlerta.length === 0) {
      console.log('[Slack] Nenhum item dentro do prazo de alerta — mensagem não enviada.');
      return;
    }

    // Ordena: mais próximos primeiro
    emAlerta.sort((a, b) => a.dias - b.dias);

    const emoji = (dias) => {
      if (dias === 0) return '💀';
      if (dias <= 30) return '🚨';
      return '⚠️';
    };

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚠️ Alerta de Validades — Grupo Alcina Maria', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${emAlerta.length} item(ns)* vencem nos próximos *${diasLimite} dias*. Verifique o estoque!`,
        },
      },
      { type: 'divider' },
    ];

    // Até 20 itens no Slack (limite de blocos)
    emAlerta.slice(0, 20).forEach(item => {
      const diasTexto = item.dias === 0
        ? '*vence hoje!*'
        : `*${item.dias} dia(s)* restantes`;
      const unidadeTexto = item.unidade ? ` · ${item.unidade === 'Matriz' ? '🏬 Matriz' : '🏪 Filial'}` : '';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `${emoji(item.dias)} *${item.nome}*`,
            `SKU: \`${item.sku}\` · 📦 ${item.quantidade || 1} un. · 📅 ${formatarMes(item.dataValidade)}${unidadeTexto}`,
            `→ ${diasTexto}`,
          ].join('\n'),
        },
      });
    });

    if (emAlerta.length > 20) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `_...e mais ${emAlerta.length - 20} item(ns) em alerta._` },
      });
    }

    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '📋 Ver no App', emoji: true },
          style: 'primary',
          url: appUrl,
        },
      ],
    });

    await axios.post(webhookUrl, { blocks });
    console.log(`[Slack] Alerta enviado — ${emAlerta.length} item(ns) em alerta.`);
  } catch (err) {
    console.error('[Slack] Erro ao enviar alerta:', err.message);
  }
}

// Inicia o cron job: todo dia às 8h (horário de Maceió, UTC-3)
function iniciarJobSlack() {
  cron.schedule(
    '0 8 * * *',
    () => {
      console.log('[Slack] Verificando validades para alerta diário...');
      enviarAlertaSlack();
    },
    { timezone: 'America/Maceio' }
  );
  console.log('[Slack] Job agendado — alertas todo dia às 8h (Maceió).');
}

module.exports = { iniciarJobSlack, enviarAlertaSlack };
