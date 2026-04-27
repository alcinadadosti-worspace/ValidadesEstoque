// Copia o build do cliente para server/public após o build do Vite
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'client', 'dist');
const dest = path.join(__dirname, '..', 'server', 'public');

function copiarPasta(origem, destino) {
  if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
  const itens = fs.readdirSync(origem);
  for (const item of itens) {
    const srcPath = path.join(origem, item);
    const destPath = path.join(destino, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copiarPasta(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copiando build do cliente para server/public...');
copiarPasta(src, dest);
console.log('Build copiado com sucesso!');
