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

exports.listarMesa = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "GET") {
            return res.status(405).send("Método no permitido");
        }

        const mesaId = req.query.mesaId;

        if (!mesaId) {
            return res.status(400).send("Falta el parámetro mesaId");
        }

        try {
            const mesaRef = db.ref(`mesa/${mesaId}`);
            const snapshot = await mesaRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).send("La mesa no existe");
            }

            return res.status(200).json({
                id: mesaId,
                datos: snapshot.val()
            });
        } catch (error) {
            console.error("Error al listar la mesa:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});

exports.obtenerContadorMesas = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snapshot = await db.ref('configuracion/contadorMesas').once('value');
            const contador = snapshot.val() || 0;
            res.status(200).json({ contador });
        } catch (e) {
            res.status(500).send("Error al obtener contador");
        }
    });
});

exports.actualizarContadorMesas = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { nuevoValor } = req.body;
        if (typeof nuevoValor !== 'number') {
            return res.status(400).send("Valor inválido");
        }

        try {
            await db.ref('configuracion/contadorMesas').set(nuevoValor);
            res.status(200).json({ mensaje: "Contador actualizado", valor: nuevoValor });
        } catch (e) {
            res.status(500).send("Error al actualizar contador");
        }
    });
});

exports.listarMesasExtra = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snapshot = await db.ref('mesa').once('value');
            const data = snapshot.val() || {};

            const mesasExtra = Object.entries(data)
                .filter(([key]) => key.startsWith('ex'))
                .map(([id, valor]) => ({
                    id,
                    nombre: `Mesa Extra (${id.replace('ex', '')})`,
                    estado: valor.estado || 'Desconocido',
                    extra: true
                }));

            res.status(200).json({ mesasExtra });
        } catch (error) {
            console.error('Error al listar mesas extra:', error);
            res.status(500).send('Error interno');
        }
    });
});