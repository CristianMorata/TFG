const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.agregarPedidoProveedor = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const {
            pproducto,
            cantidad,
            proveedor,
            presupuesto,
            fecha_entrega,
        } = req.body;

        // Validaciones de los campos requeridos
        const camposRequeridos = {
            nombre,
            apellidos,
            telefono,
            email,
            puesto,
            salario,
            estado,
        };

        const camposFaltantes = Object.entries(camposRequeridos)
            .filter(([key, value]) => value === undefined || value === null || value === '')
            .map(([key]) => key);

        if (camposFaltantes.length > 0) {
            return res.status(400).send(
                `Faltan campos requeridos: ${camposFaltantes.join(", ")}`
            );
        }

        try {
            // Transacción para generar un nuevo ID incremental
            const contadorRef = db.ref("pedido-proveedor-contador");
            const result = await contadorRef.transaction(current => {
                return (current || 0) + 1;
            });

            if (!result.committed) {
                return res.status(500).send("Error al generar ID");
            }

            const nuevoId = result.snapshot.val();
            const pedidoRef = db.ref(`pedido-proveedor/${nuevoId}`);

            const nuevoPedido = {
                creadoEn: admin.database.ServerValue.TIMESTAMP
            };

            if (proveedor !== undefined) nuevoPedido.proveedor = proveedor;
            if (presupuesto !== undefined) nuevoPedido.presupuesto = parseFloat(presupuesto);
            if (fecha_entrega !== undefined) nuevoPedido.fecha_entrega = fecha_entrega;
            if (tipo !== undefined) nuevoPedido.tipo = tipo;
            if (alergenos !== undefined) nuevoPedido.alergenos = alergenos;
            if (intolerancias !== undefined) nuevoPedido.intolerancias = intolerancias;

            await pedidoRef.set(nuevoPedido);

            return res.status(200).send({
                mensaje: "Pedido agregado correctamente",
                id: nuevoId
            });
        } catch (error) {
            console.error("Error al guardar pedido:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});

