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
            // Generar ID incremental
            const contadorRef = db.ref("empleado-contador");
            const result = await contadorRef.transaction(current => (current || 0) + 1);

            if (!result.committed) {
                return res.status(500).send("Error al generar ID");
            }

            const nuevoId = result.snapshot.val();
            const empleadoRef = db.ref(`empleado/${nuevoId}`);

            const nuevoEmpleado = {
                // creadoEn: admin.database.ServerValue.TIMESTAMP
                nombre,
                apellidos,
                telefono,
                email,
                puesto,
                salario,
                estado,
            };

            if (fecha_nacimiento !== undefined) nuevoEmpleado.fecha_nacimiento = fecha_nacimiento;
            if (fecha_contratacion !== undefined) nuevoEmpleado.fecha_contratacion = fecha_contratacion;
            if (tipo_jornada !== undefined) nuevoEmpleado.tipo_jornada = tipo_jornada;
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

exports.modificarEmpleado = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const {
            id,
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

        if (!id) {
            return res.status(400).send("Falta el ID del empleado");
        }

        try {
            const empleadoRef = db.ref(`empleado/${id}`);
            const snapshot = await empleadoRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).send("El empleado no existe");
            }

            const actualizaciones = {
                actualizadoEn: admin.database.ServerValue.TIMESTAMP
            };

            if (nombre !== undefined) actualizaciones.nombre = nombre;
            if (apellidos !== undefined) actualizaciones.apellidos = apellidos;
            if (fecha_nacimiento !== undefined) actualizaciones.fecha_nacimiento = fecha_nacimiento;
            if (telefono !== undefined) actualizaciones.telefono = telefono;
            if (email !== undefined) actualizaciones.email = email;
            if (puesto !== undefined) actualizaciones.puesto = puesto;
            if (fecha_contratacion !== undefined) actualizaciones.fecha_contratacion = fecha_contratacion;
            if (tipo_jornada !== undefined) actualizaciones.tipo_jornada = tipo_jornada;
            if (salario !== undefined) actualizaciones.salario = salario;
            if (estado !== undefined) actualizaciones.estado = estado;
            if (horario !== undefined) actualizaciones.horario = horario;
            if (idiomas !== undefined) actualizaciones.idiomas = idiomas;
            if (observaciones !== undefined) actualizaciones.observaciones = observaciones;

            await empleadoRef.update(actualizaciones);

            return res.status(200).send({
                mensaje: "Empleado actualizado correctamente",
                id
            });
        } catch (error) {
            console.error("Error al modificar empleado:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});

exports.eliminarEmpleado = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Método no permitido");
        }

        const { id } = req.body;

        if (!id) {
            return res.status(400).send("Falta el ID del empleado");
        }

        try {
            const empleadoRef = db.ref(`empleado/${id}`);
            const snapshot = await empleadoRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).send("El empleado no existe");
            }

            await empleadoRef.remove();

            return res.status(200).send({
                mensaje: `Empleado con ID '${id}' eliminado correctamente`
            });
        } catch (error) {
            console.error("Error al eliminar empleado:", error);
            return res.status(500).send("Error interno del servidor");
        }
    });
});