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

// ── Envia DM para um usuário via Slack API ─────────────────────────────
async function enviarDM(botToken, userId, blocks) {
  // Abre (ou reutiliza) o canal de DM com o usuário
  const openRes = await axios.post(
    'https://slack.com/api/conversations.open',
    { users: userId },
    { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
  );

  if (!openRes.data.ok) {
    console.error(`[Slack] Erro ao abrir DM com ${userId}:`, openRes.data.error);
    return;
  }

  const channelId = openRes.data.channel.id;

  const msgRes = await axios.post(
    'https://slack.com/api/chat.postMessage',
    { channel: channelId, blocks },
    { headers: { Authorization: `Bearer ${botToken}`, 'Content-Type': 'application/json' } }
  );

  if (!msgRes.data.ok) {
    console.error(`[Slack] Erro ao enviar mensagem para ${userId}:`, msgRes.data.error);
  } else {
    console.log(`[Slack] ✓ DM enviado para ${userId}.`);
  }
}

// ── Monta os blocos e despacha para todos os destinatários ─────────────
async function enviarAlertaSlack() {
  const botToken      = process.env.SLACK_BOT_TOKEN;
  const destinatarios = process.env.SLACK_DESTINATARIOS;
  const appUrl        = process.env.APP_URL || 'https://validades.onrender.com';
  const diasLimite    = parseInt(process.env.SLACK_DIAS_ALERTA || '180', 10);

  if (!botToken || !destinatarios) {
    console.log('[Slack] SLACK_BOT_TOKEN ou SLACK_DESTINATARIOS não configurados — pulando.');
    return;
  }

  let db;
  try {
    const { getDb } = require('../lib/firebase-admin');
    db = getDb();
  } catch (err) {
    console.error('[Slack] Firestore indisponível:', err.message);
    return;
  }

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

  const emojiDias = d => (d === 0 ? '💀' : d <= 90 ? '🚨' : '⚠️');

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
    const diasTexto   = item.dias === 0 ? '*vence hoje!*' : `*${item.dias} dia(s)* restantes`;
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
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: '📋 Ver no App', emoji: true },
      style: 'primary',
      url: appUrl,
    }],
  });

  const ids = destinatarios.split(',').map(id => id.trim()).filter(Boolean);
  for (const userId of ids) {
    await enviarDM(botToken, userId, blocks);
  }
}

// ── Cron: todo dia às 8h (Maceió, UTC-3) ──────────────────────────────
function iniciarJobSlack() {
  cron.schedule(
    '0 8 * * 1',
    () => {
      console.log('[Slack] Executando verificação semanal...');
      enviarAlertaSlack().catch(err => console.error('[Slack] Erro no job:', err.message));
    },
    { timezone: 'America/Maceio' }
  );
  console.log('[Slack] Job agendado — alertas toda segunda-feira às 8h (Maceió).');
}

module.exports = { iniciarJobSlack, enviarAlertaSlack };
