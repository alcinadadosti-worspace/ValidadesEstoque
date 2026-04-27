const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { getDb, admin } = require('../lib/firebase-admin');

// Multer armazena o arquivo em memória (sem salvar em disco)
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/validades — lista todos os registros de validade
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('validades').orderBy('dataValidade', 'asc').get();
    const validades = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      dataValidade: d.data().dataValidade?.toDate?.()?.toISOString() || d.data().dataValidade,
      registradoEm: d.data().registradoEm?.toDate?.()?.toISOString() || d.data().registradoEm,
    }));
    res.json(validades);
  } catch (err) {
    console.error('Erro ao listar validades:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/validades — registra uma nova validade
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { sku, nome, marca, dataValidade } = req.body;

    if (!sku || !nome || !marca || !dataValidade) {
      return res.status(400).json({ erro: 'SKU, nome, marca e dataValidade são obrigatórios' });
    }

    const dados = {
      sku,
      nome,
      marca,
      dataValidade: admin.firestore.Timestamp.fromDate(new Date(dataValidade)),
      registradoEm: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('validades').add(dados);
    res.json({ sucesso: true, id: ref.id });
  } catch (err) {
    console.error('Erro ao registrar validade:', err);
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/validades/:id — remove um registro de validade
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('validades').doc(req.params.id).delete();
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao deletar validade:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/validades/upload — importação em lote via planilha XLSX ou CSV
router.post('/upload', upload.single('planilha'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const db = getDb();
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(sheet, { raw: false });

    if (!linhas.length) {
      return res.status(400).json({ erro: 'Planilha vazia ou formato inválido' });
    }

    const resultados = [];
    const erros = [];

    for (const linha of linhas) {
      const sku = String(linha.SKU || linha.sku || linha['Código'] || '').trim();
      const dataRaw = linha.DataValidade || linha.dataValidade || linha['Data Validade'] || linha['Data de Validade'] || '';

      if (!sku || !dataRaw) {
        erros.push({ linha, motivo: 'SKU ou data ausente' });
        continue;
      }

      const produtoDoc = await db.collection('produtos').doc(sku).get();
      let nome, marca;
      if (produtoDoc.exists) {
        ({ nome, marca } = produtoDoc.data());
      } else {
        nome = linha.Nome || linha.nome || `Produto SKU ${sku}`;
        marca = linha.Marca || linha.marca || 'O Boticário';
      }

      const dataValidade = new Date(dataRaw);
      if (isNaN(dataValidade.getTime())) {
        erros.push({ sku, motivo: `Data inválida: ${dataRaw}` });
        continue;
      }

      await db.collection('validades').add({
        sku,
        nome,
        marca,
        dataValidade: admin.firestore.Timestamp.fromDate(dataValidade),
        registradoEm: admin.firestore.FieldValue.serverTimestamp(),
      });

      resultados.push({ sku, nome, marca, dataValidade: dataValidade.toISOString() });
    }

    res.json({ sucesso: true, importados: resultados.length, erros: erros.length });
  } catch (err) {
    console.error('Erro no upload em lote:', err);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
