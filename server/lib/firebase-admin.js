const admin = require('firebase-admin');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

let _inicializado = false;

function inicializar() {
  if (_inicializado || admin.apps.length > 0) return;

  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Abordagem preferida: JSON completo em base64 (evita problemas com chave privada)
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    // Corrige newlines reais dentro do valor da chave privada (problema comum em alguns exportadores)
    const fixed = raw.replace(
      /-----BEGIN [A-Z ]+ KEY-----[\s\S]*?-----END [A-Z ]+ KEY-----\n?/g,
      m => m.replace(/\n/g, '\\n')
    );
    serviceAccount = JSON.parse(fixed);
  } else {
    // Fallback: variáveis separadas
    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('[Firebase] Credenciais ausentes. Configure FIREBASE_SERVICE_ACCOUNT_BASE64 no Render.');
    }
    serviceAccount = { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  _inicializado = true;
}

// Retorna a instância do Firestore (inicializa sob demanda na primeira chamada)
function getDb() {
  inicializar();
  return admin.firestore();
}

module.exports = { admin, getDb };
