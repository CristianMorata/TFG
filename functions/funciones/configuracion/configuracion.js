const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

/**
 * Guarda o actualiza dos parámetros booleanos en
 * /configuracion/anadirProductosCamarero y /configuracion/anadirProductosClientes
 */
exports.actualizarConfiguracion = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { anadirProductosCamarero, anadirProductosClientes } = req.body;

        // Validamos que vengan como booleanos
        if (typeof anadirProductosCamarero !== "boolean" || typeof anadirProductosClientes !== "boolean") {
            return res.status(400).json({
                error: "Parámetros inválidos: anadirProductosCamarero y anadirProductosClientes deben ser booleanos"
            });
        }

        try {
            // Usamos update para escribir ambos de una sola vez
            await db.ref("configuracion").update({
                anadirProductosCamarero,
                anadirProductosClientes
            });

            return res.status(200).json({
                mensaje: "Parámetros actualizados",
                valores: { anadirProductosCamarero, anadirProductosClientes }
            });
        } catch (err) {
            console.error("Error al actualizar parámetros:", err);
            return res.status(500).json({ error: "Error al actualizar parámetros" });
        }
    });
});


/**
 * Recupera los dos parámetros booleanos desde
 * /configuracion/anadirProductosCamarero y /configuracion/anadirProductosClientes
 */
exports.obtenerConfiguracion = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snap = await db.ref("configuracion").once("value");
            const config = snap.val() || {};

            // Si no existen, por defecto false
            const anadirProductosCamarero = typeof config.anadirProductosCamarero === "boolean"
                ? config.anadirProductosCamarero
                : false;
            const anadirProductosClientes = typeof config.anadirProductosClientes === "boolean"
                ? config.anadirProductosClientes
                : false;

            return res.status(200).json({ anadirProductosCamarero, anadirProductosClientes });
        } catch (err) {
            console.error("Error al obtener parámetros:", err);
            return res.status(500).json({ error: "Error al obtener parámetros" });
        }
    });
});

// Sección de categorías
exports.modificarCategoria = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { nombreCategoria, destino } = req.body;

        // Validaciones básicas
        if (typeof nombreCategoria !== "string" || typeof destino !== "string") {
            return res.status(400).json({
                error: "Debe incluir 'nombreCategoria' y 'destino', ambos como strings"
            });
        }

        try {
            const ref = db.ref(`configuracion/categorias/${nombreCategoria}`);
            await ref.set({ destino });

            return res.status(200).json({
                mensaje: `Categoría '${nombreCategoria}' actualizada correctamente`,
                categoria: { nombre: nombreCategoria, destino }
            });
        } catch (err) {
            console.error("Error al modificar categoría:", err);
            return res.status(500).json({ error: "Error al modificar categoría" });
        }
    });
});

exports.obtenerCategorias = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snap = await db.ref("configuracion/categorias").once("value");
            const categorias = snap.val() || [];

            return res.status(200).json({ categorias });
        } catch (err) {
            console.error("Error al obtener categorías:", err);
            return res.status(500).json({ error: "Error al obtener categorías" });
        }
    });
});

// Sección de alérgenos
exports.modificarAlergeno = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { nombreAlergenos } = req.body;

        if (typeof nombreAlergenos !== "string" || !nombreAlergenos.trim()) {
            return res.status(400).json({
                error: "Debe incluir 'nombreAlergenos' como string válido"
            });
        }

        try {
            const ref = db.ref(`configuracion/alergenos/${nombreAlergenos}`);
            await ref.set(true);

            return res.status(200).json({
                mensaje: `Alérgeno '${nombreAlergenos}' actualizado correctamente`,
                alergeno: { nombre: nombreAlergenos }
            });
        } catch (err) {
            console.error("Error al modificar alérgeno:", err);
            return res.status(500).json({ error: "Error al modificar alérgeno" });
        }
    });
});

exports.obtenerAlergenos = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snap = await db.ref("configuracion/alergenos").once("value");
            const alergenos = snap.val() || {};

            return res.status(200).json({ alergenos });
        } catch (err) {
            console.error("Error al obtener alérgenos:", err);
            return res.status(500).json({ error: "Error al obtener alérgenos" });
        }
    });
});

exports.eliminarAlergeno = onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { nombre } = req.body;

        if (typeof nombre !== "string" || !nombre.trim()) {
            return res.status(400).json({
                error: "Debe incluir 'nombre' del alérgeno a eliminar"
            });
        }

        try {
            const ref = db.ref(`configuracion/alergenos/${nombre}`);
            await ref.remove();

            return res.status(200).json({
                mensaje: `Alérgeno '${nombre}' eliminado correctamente`
            });
        } catch (err) {
            console.error("Error al eliminar alérgeno:", err);
            return res.status(500).json({ error: "Error al eliminar alérgeno" });
        }
    });
});