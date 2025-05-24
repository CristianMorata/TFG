const admin = require("firebase-admin");

// Inicializa Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: "https://proyecto-hosteleria-b6c98-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();

module.exports = { admin, db };