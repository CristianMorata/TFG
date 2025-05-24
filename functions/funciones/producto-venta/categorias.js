const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.agregarCategoriaProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const { categoria } = req.body;

    if (!categoria || typeof categoria !== "string") {
      return res.status(400).send("Se requiere un nombre de categoría válido");
    }

    const categoriaNormalizada = categoria.toLowerCase().trim();

    try {
      const refCategoria = db.ref(`producto-venta/${categoriaNormalizada}`);
      const snapshot = await refCategoria.once("value");

      if (snapshot.exists()) {
        return res.status(400).send("La categoría ya existe");
      }

      // Crear el nodo vacío para la categoría
      await refCategoria.set({});

      // Inicializar su contador en 0
      await db.ref(`producto-venta-contador/${categoriaNormalizada}`).set(0);

      return res.status(200).send({
        mensaje: `Categoría '${categoriaNormalizada}' creada correctamente`
      });
    } catch (error) {
      console.error("Error al agregar categoría:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.listarCategoriasProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).send("Método no permitido");
    }

    try {
      const snapshot = await db.ref("producto-venta").once("value");

      if (!snapshot.exists()) {
        return res.status(200).send({ categorias: [] });
      }

      const categorias = Object.keys(snapshot.val());

      return res.status(200).send({ categorias });
    } catch (error) {
      console.error("Error al listar categorías:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});