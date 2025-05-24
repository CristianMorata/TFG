const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.guardarOModificarMesa = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const { mesaId, contenido, estado, anotaciones } = req.body;

        if (!mesaId) {
            return res.status(400).send("Falta el ID de la mesa (mesaId)");
        }

        try {
            const mesaRef = db.ref(`mesa/${mesaId}`);

            // Leer mesa existente (si hay)
            const snapshot = await mesaRef.once("value");
            const mesaActual = snapshot.val() || {};

            // Construir nuevo objeto mesa fusionando lo anterior y lo nuevo
            const nuevaMesa = {
                ...mesaActual,
                actualizadoEn: admin.database.ServerValue.TIMESTAMP
            };

            if (contenido !== undefined) nuevaMesa.contenido = contenido;
            if (estado !== undefined) nuevaMesa.estado = estado;
            if (anotaciones !== undefined) nuevaMesa.anotaciones = anotaciones;

            await mesaRef.set(nuevaMesa);

            return res.status(200).send({
                mensaje: snapshot.exists() ? "Mesa actualizada correctamente" : "Mesa creada correctamente",
                id: mesaId
            });
        } catch (error) {
            console.error("Error al guardar o modificar la mesa:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});

exports.cerrarMesa = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const { mesaId } = req.body;

        if (!mesaId) {
            return res.status(400).send("Falta el ID de la mesa (mesaId)");
        }

        try {
            const mesaRef = db.ref(`mesa/${mesaId}`);
            const snapshot = await mesaRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).send("La mesa no existe");
            }

            const infoMesa = snapshot.val();
            const fechaMesa = Date.now();

            const historialRef = db.ref("historial-mesas").push();
            await historialRef.set({
                fecha_mesa: fechaMesa,
                info_mesa: infoMesa
            });

            await mesaRef.remove();

            return res.status(200).send({
                mensaje: "Mesa cerrada y archivada exitosamente",
                historialId: historialRef.key
            });
        } catch (error) {
            console.error("Error al cerrar mesa:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});