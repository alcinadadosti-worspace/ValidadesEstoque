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

// Dispara alerta via GET (fácil de testar no navegador)
// Exemplo: /api/alertas/slack/testar?key=SUA_SENHA
app.get('/api/alertas/slack/testar', async (req, res) => {
  if (req.query.key !== process.env.ALERTA_SECRET) {
    return res.status(401).send('Não autorizado.');
  }
  try {
    await enviarAlertaSlack();
    res.send('✅ Alerta enviado! Verifique o Slack.');
  } catch (err) {
    res.status(500).send('❌ Erro: ' + err.message);
  }
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
