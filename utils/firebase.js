const admin = require('firebase-admin');
const serviceAccount = require('../firebase-key.json'); // Make sure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
