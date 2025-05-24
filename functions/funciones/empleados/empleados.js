const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.agregarEmpleado = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const {
            nombre,
            apellidos,
            fecha_nacimiento,
            telefono,
            email,
            puesto,
            fecha_contratacion,
            tipo_jornada,
            salario,
            estado,
            horario,
            idiomas,
            observaciones
        } = req.body;

        try {
            // Generar ID incremental
            const contadorRef = db.ref("empleado-contador");
            const result = await contadorRef.transaction(current => (current || 0) + 1);

            if (!result.committed) {
                return res.status(500).send("Error al generar ID");
            }

            const nuevoId = result.snapshot.val();
            const empleadoRef = db.ref(`empleado/${nuevoId}`);

            const nuevoEmpleado = {
                creadoEn: admin.database.ServerValue.TIMESTAMP
            };

            if (nombre !== undefined) nuevoEmpleado.nombre = nombre;
            if (apellidos !== undefined) nuevoEmpleado.apellidos = apellidos;
            if (fecha_nacimiento !== undefined) nuevoEmpleado.fecha_nacimiento = fecha_nacimiento;
            if (telefono !== undefined) nuevoEmpleado.telefono = telefono;
            if (email !== undefined) nuevoEmpleado.email = email;
            if (puesto !== undefined) nuevoEmpleado.puesto = puesto;
            if (fecha_contratacion !== undefined) nuevoEmpleado.fecha_contratacion = fecha_contratacion;
            if (tipo_jornada !== undefined) nuevoEmpleado.tipo_jornada = tipo_jornada;
            if (salario !== undefined) nuevoEmpleado.salario = parseFloat(salario);
            if (estado !== undefined) nuevoEmpleado.estado = estado;
            if (horario !== undefined) nuevoEmpleado.horario = horario;
            if (idiomas !== undefined) nuevoEmpleado.idiomas = idiomas;
            if (observaciones !== undefined) nuevoEmpleado.observaciones = observaciones;

            await empleadoRef.set(nuevoEmpleado);

            return res.status(200).send({
                mensaje: "Empleado agregado correctamente",
                id: nuevoId
            });
        } catch (error) {
            console.error("Error al agregar empleado:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});

exports.listarEmpleados = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "GET") {
            return res.status(405).send("Método no permitido");
        }

        try {
            const snapshot = await db.ref("empleado").once("value");

            const empleados = snapshot.val();

            if (!empleados) {
                return res.status(200).json([]);
            }

            // Convertimos el objeto a array con IDs
            const lista = Object.entries(empleados).map(([id, data]) => ({
                id,
                ...data
            }));

            return res.status(200).json(lista);
        } catch (error) {
            console.error("Error al obtener empleados:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});