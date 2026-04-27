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

// Rota para disparar alerta manualmente (via cron externo ou teste)
app.post('/api/alertas/slack', async (req, res) => {
  const chave = req.headers['x-alerta-key'];
  if (chave !== process.env.ALERTA_SECRET) {
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
