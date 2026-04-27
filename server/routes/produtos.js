const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase-admin');

// GET /api/produtos/:sku — busca produto pelo SKU
router.get('/:sku', async (req, res) => {
  try {
    const db = getDb();
    const { sku } = req.params;
    const docSnap = await db.collection('produtos').doc(sku).get();

    if (!docSnap.exists) {
      return res.status(404).json({ encontrado: false });
    }

    return res.json({ encontrado: true, produto: { id: docSnap.id, ...docSnap.data() } });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/produtos — cria ou atualiza produto
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { sku, nome, marca } = req.body;

    if (!sku || !nome || !marca) {
      return res.status(400).json({ erro: 'SKU, nome e marca são obrigatórios' });
    }

    const dados = { sku, nome, marca, criadoEm: new Date() };
    await db.collection('produtos').doc(sku).set(dados, { merge: true });
    res.json({ sucesso: true, produto: dados });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/produtos — lista todos os produtos
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('produtos').get();
    const produtos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
