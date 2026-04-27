// Gera o valor de FIREBASE_SERVICE_ACCOUNT_BASE64 a partir do arquivo JSON do service account
// Uso: node scripts/gerar-base64-credentials.js caminho/para/serviceAccount.json

const fs   = require('fs');
const path = require('path');

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('Uso: node scripts/gerar-base64-credentials.js <arquivo.json>');
  process.exit(1);
}

const json    = fs.readFileSync(path.resolve(arquivo), 'utf8');
const base64  = Buffer.from(json).toString('base64');

console.log('\n✅ Cole o valor abaixo como FIREBASE_SERVICE_ACCOUNT_BASE64 no Render:\n');
console.log(base64);
console.log('\n');
