/**
 * seed-firestore.js
 * Importa todos os produtos do banco SQLite (produtos.db) para o Firestore.
 * Execute uma vez após configurar o Firebase Admin.
 *
 * Uso: node seed/seed-firestore.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');
const Database = require('better-sqlite3');
const path = require('path');

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestoreDb = admin.firestore();

// Normaliza os nomes de marca do SQLite para os 5 nomes oficiais do sistema
function normalizarMarca(marcaOriginal) {
  const m = (marcaOriginal || '').toLowerCase().replace(/\s+/g, '');
  if (m.includes('aumigos') || m.includes('auamigos')) return 'Aumigos';
  if (m.includes('eudora')) return 'Eudora';
  if (m.includes('o.u.i') || m === 'oui') return 'O.U.I';
  if (m.includes('quemdisse') || m.includes('berenice')) return 'Quem Disse, Berenice?';
  // Fallback: tudo que contém "boticario" ou "boticário"
  return 'O Boticário';
}

async function seed() {
  const dbPath = path.join(__dirname, '../produtos.db');
  const sqliteDb = new Database(dbPath, { readonly: true });

  console.log('📂 Lendo produtos.db...');

  // Lê das três tabelas relevantes
  const produtos = sqliteDb.prepare('SELECT sku, nome, marca FROM produtos').all();
  const iafCabelos = sqliteDb.prepare('SELECT sku, descricao as nome, marca FROM iaf_cabelos').all();
  const iafMake = sqliteDb.prepare('SELECT sku, descricao as nome, marca FROM iaf_make').all();

  sqliteDb.close();

  // Combina e deduplica por SKU (produtos.db tem prioridade)
  const mapa = new Map();

  // iaf_cabelos e iaf_make primeiro (menor prioridade)
  for (const row of [...iafCabelos, ...iafMake]) {
    if (row.sku && !mapa.has(row.sku)) {
      mapa.set(row.sku, { sku: row.sku, nome: row.nome, marca: normalizarMarca(row.marca) });
    }
  }

  // produtos tem prioridade — sobrescreve entradas duplicadas
  for (const row of produtos) {
    if (row.sku) {
      mapa.set(row.sku, { sku: row.sku, nome: row.nome, marca: normalizarMarca(row.marca) });
    }
  }

  const lista = Array.from(mapa.values());
  console.log(`📊 Total de produtos únicos: ${lista.length}`);

  // Escreve no Firestore em batches de 500 (limite do Firestore)
  const TAMANHO_BATCH = 400;
  let totalSalvos = 0;

  for (let i = 0; i < lista.length; i += TAMANHO_BATCH) {
    const lote = lista.slice(i, i + TAMANHO_BATCH);
    const batch = firestoreDb.batch();

    for (const produto of lote) {
      const ref = firestoreDb.collection('produtos').doc(produto.sku);
      batch.set(ref, {
        sku: produto.sku,
        nome: produto.nome,
        marca: produto.marca,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }); // merge: true para não sobrescrever registros existentes com criadoEm
    }

    await batch.commit();
    totalSalvos += lote.length;
    console.log(`✅ Salvos: ${totalSalvos} / ${lista.length}`);
  }

  console.log(`\n🎉 Seed concluído! ${totalSalvos} produtos importados para o Firestore.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
