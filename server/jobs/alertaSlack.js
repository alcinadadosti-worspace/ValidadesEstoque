const cron  = require('node-cron');
const axios = require('axios');

// ── Helpers ────────────────────────────────────────────────────────────
function diasRestantes(timestamp) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  v.setHours(0, 0, 0, 0);
  return Math.round((v - hoje) / (1000 * 60 * 60 * 24));
}

function formatarMes(timestamp) {
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
}

// ── Envio via Slack Web API (DM para cada destinatário) ────────────────
async function enviarMensagemSlack(blocks) {
  const botToken     = process.env.SLACK_BOT_TOKEN;
  const destinatarios = process.env.SLACK_DESTINATARIOS; // IDs separados por vírgula

  if (!botToken || !destinatarios) {
    console.log('[Slack] SLACK_BOT_TOKEN ou SLACK_DESTINATARIOS não configurados.');
    return;
  }

  const ids = destinatarios.split(',').map(id => id.trim()).filter(Boolean);

  for (const userId of ids) {
    try {
      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel: userId, blocks },
        {
          headers: {
            Authorization: `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.data.ok) {
        console.error(`[Slack] Erro ao enviar para ${userId}:`, res.data.error);
      } else {
        console.log(`[Slack] Mensagem enviada para ${userId}.`);
      }
    } catch (err) {
      console.error(`[Slack] Falha HTTP ao enviar para ${userId}:`, err.message);
    }
  }
}

// ── Monta o payload e chama o envio ────────────────────────────────────
async function enviarAlertaSlack() {
  const appUrl     = process.env.APP_URL || 'https://validades.onrender.com';
  const diasLimite = parseInt(process.env.SLACK_DIAS_ALERTA || '60', 10);

  let db;
  try {
    const { getDb } = require('../lib/firebase-admin');
    db = getDb();
  } catch (err) {
    console.error('[Slack] Firestore indisponível:', err.message);
    return;
  }

  try {
    const snap = await db.collection('validades').get();

    const emAlerta = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (!d.dataValidade) return;
      const dias = diasRestantes(d.dataValidade);
      if (dias >= 0 && dias <= diasLimite) emAlerta.push({ ...d, id: doc.id, dias });
    });

    if (emAlerta.length === 0) {
      console.log('[Slack] Nenhum item em alerta — mensagem não enviada.');
      return;
    }

    emAlerta.sort((a, b) => a.dias - b.dias);

    const emojiDias = (d) => (d === 0 ? '💀' : d <= 30 ? '🚨' : '⚠️');

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

    emAlerta.slice(0, 20).forEach(item => {
      const diasTexto = item.dias === 0
        ? '*vence hoje!*'
        : `*${item.dias} dia(s)* restantes`;
      const unidadeLabel = item.unidade
        ? ` · ${item.unidade === 'Matriz' ? '🏬 Matriz' : '🏪 Filial'}`
        : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `${emojiDias(item.dias)} *${item.nome}*`,
            `SKU: \`${item.sku}\` · 📦 ${item.quantidade || 1} un. · 📅 ${formatarMes(item.dataValidade)}${unidadeLabel}`,
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

    await enviarMensagemSlack(blocks);
  } catch (err) {
    console.error('[Slack] Erro ao montar alerta:', err.message);
  }
}

// ── Cron: todo dia às 8h (Maceió, UTC-3) ──────────────────────────────
function iniciarJobSlack() {
  cron.schedule(
    '0 8 * * *',
    () => {
      console.log('[Slack] Executando verificação diária de validades...');
      enviarAlertaSlack();
    },
    { timezone: 'America/Maceio' }
  );
  console.log('[Slack] Job agendado — alertas todo dia às 8h (Maceió).');
}

module.exports = { iniciarJobSlack, enviarAlertaSlack };
