/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const { onRequest } = require("firebase-functions/v2/https");
const cors = require('cors');  // Importa el paquete CORS

// Crea una instancia de CORS
const corsHandler = cors({ origin: 'http://127.0.0.1:5500/pruebaFront.html' });  // Esto permitirá solicitudes de cualquier origen

exports.helloWorld = onRequest((req, res) => {
  corsHandler(req, res, () => {  // Usamos CORS en la solicitud
    res.send("Hello from Firebase!");
  });
});
