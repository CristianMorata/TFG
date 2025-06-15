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

        const { mesaId, metodoPago } = req.body;

        if (!mesaId || !metodoPago) {
            return res.status(400).send("Faltan parámetros: mesaId o metodoPago");
        }

        try {
            const mesaRef = db.ref(`mesa/${mesaId}`);
            const snapshot = await mesaRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).send("La mesa no existe");
            }

            const infoMesa = snapshot.val();

            // Fecha y hora del cierre
            const ahora = new Date();
            const dia = String(ahora.getDate()).padStart(2, '0');
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const año = ahora.getFullYear();
            const hora = String(ahora.getHours()).padStart(2, '0');
            const minuto = String(ahora.getMinutes()).padStart(2, '0');
            const segundo = String(ahora.getSeconds()).padStart(2, '0');

            const fechaKey = `${dia}-${mes}-${año}`;
            const horaCierre = `${hora}:${minuto}:${segundo}`;
            const fechaCierreCompleta = `${dia}/${mes}/${año} ${horaCierre}`;

            // 💰 Calcular total pagado
            const contenido = infoMesa.contenido || [];
            const totalPagado = contenido.reduce((sum, prod) => sum + (parseFloat(prod.precio) || 0), 0);

            const historialRef = db.ref(`historial-mesas/${fechaKey}/mesa${mesaId} ${horaCierre}`);

            await historialRef.set({
                fechaCierre: fechaCierreCompleta,
                metodoPago,
                totalPagado,
                anotaciones: infoMesa.anotaciones || '',
                contenido
            });

            await mesaRef.remove();

            return res.status(200).send({
                mensaje: "Mesa cerrada y archivada correctamente",
                historialPath: historialRef.toString()
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

exports.listarTodasLasMesas = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snapshot = await db.ref('mesa').once('value');
            const data = snapshot.val() || {};
            res.status(200).json({ datos: data });
        } catch (error) {
            console.error('Error al listar todas las mesas:', error);
            res.status(500).send('Error interno del servidor');
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