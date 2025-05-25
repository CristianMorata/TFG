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

exports.eliminarCategoriaProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const { categoria } = req.body;

    if (!categoria) {
      return res.status(400).send("Falta el nombre de la categoría");
    }

    try {
      const categoriaRef = db.ref(`producto-venta/${categoria}`);
      const snapshot = await categoriaRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).send("La categoría no existe");
      }

      // Eliminar productos de la categoría
      await categoriaRef.remove();

      // Eliminar su contador
      await db.ref(`producto-venta-contador/${categoria}`).remove();

      return res.status(200).send({
        mensaje: `Categoría '${categoria}' eliminada correctamente`
      });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.modificarCategoriaProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const { categoriaActual, categoriaNueva } = req.body;

    if (!categoriaActual || !categoriaNueva) {
      return res.status(400).send("Faltan los nombres de la categoría actual y nueva");
    }

    if (categoriaActual === categoriaNueva) {
      return res.status(400).send("Los nombres de categoría no pueden ser iguales");
    }

    try {
      const refActual = db.ref(`producto-venta/${categoriaActual}`);
      const snapshotActual = await refActual.once("value");

      if (!snapshotActual.exists()) {
        return res.status(404).send("La categoría actual no existe");
      }

      const refNueva = db.ref(`producto-venta/${categoriaNueva}`);
      const snapshotNueva = await refNueva.once("value");

      if (snapshotNueva.exists()) {
        return res.status(400).send("La categoría nueva ya existe");
      }

      const productos = snapshotActual.val();

      // Copiar productos al nuevo nodo
      await refNueva.set(productos);

      // (Opcional) Actualizar el campo "categoria" dentro de cada producto
      for (const id in productos) {
        await db.ref(`producto-venta/${categoriaNueva}/${id}/categoria`).set(categoriaNueva);
      }

      // Copiar contador si existe
      const contadorActualSnap = await db.ref(`producto-venta-contador/${categoriaActual}`).once("value");
      if (contadorActualSnap.exists()) {
        await db.ref(`producto-venta-contador/${categoriaNueva}`).set(contadorActualSnap.val());
      }

      // Eliminar nodo antiguo
      await refActual.remove();
      await db.ref(`producto-venta-contador/${categoriaActual}`).remove();

      return res.status(200).send({
        mensaje: `Categoría '${categoriaActual}' renombrada a '${categoriaNueva}' correctamente`
      });
    } catch (error) {
      console.error("Error al modificar categoría:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});