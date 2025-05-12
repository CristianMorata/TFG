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

// const { onRequest } = require("firebase-functions/v2/https");
// const cors = require('cors');  // Importa el paquete CORS

// // Crea una instancia de CORS
// const corsHandler = cors({ origin: true });  // Esto permitirá solicitudes de cualquier origen

// exports.helloWorld = onRequest((req, res) => {
//   corsHandler(req, res, () => {  // Usamos CORS en la solicitud
//     res.send("Hello from Firebase!");
//   });
// });

const { onRequest } = require("firebase-functions/v2/https");
const cors = require('cors');
const admin = require("firebase-admin");

// Inicializa Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: "https://proyecto-hosteleria-b6c98-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();
const corsHandler = cors({ origin: true });

exports.agregarProducto = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).send("Faltan campos requeridos: nombre y descripcion");
    }

    try {
      // Transacción para obtener e incrementar el contador
      const contadorRef = db.ref("producto-venta-contador");
      const result = await contadorRef.transaction(current => {
        return (current || 0) + 1;
      });

      if (!result.committed) {
        return res.status(500).send("Error al generar ID");
      }

      const nuevoId = result.snapshot.val();
      const productoRef = db.ref(`producto-venta/${nuevoId}`);

      await productoRef.set({
        nombre,
        descripcion,
        creadoEn: admin.database.ServerValue.TIMESTAMP
      });

      return res.status(200).send({
        mensaje: "Producto agregado exitosamente",
        id: nuevoId
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});