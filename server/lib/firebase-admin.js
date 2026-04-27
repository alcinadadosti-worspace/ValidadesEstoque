const admin = require('firebase-admin');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

let _inicializado = false;

// Inicializa o Firebase Admin uma única vez, com verificação de credenciais
function inicializar() {
  if (_inicializado || admin.apps.length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[Firebase] Credenciais ausentes. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  _inicializado = true;
}

// Retorna a instância do Firestore (inicializa sob demanda na primeira chamada)
function getDb() {
  inicializar();
  return admin.firestore();
}

module.exports = { admin, getDb };
