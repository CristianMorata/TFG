const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.agregarProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    // Extraer los campos del cuerpo de la solicitud
    const {
      nombre,
      descripcion,
      precio,
      alergenos,
      visible,
      novedad,
      categoria,
      tipo_comida,  // Este campo solo se usará para productos de tipo comida
      anotaciones,
    } = req.body;

    // Validaciones de los campos requeridos
    const camposRequeridos = {
      nombre,
      precio,
      categoria
    };

    const camposFaltantes = Object.entries(camposRequeridos)
      .filter(([key, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (camposFaltantes.length > 0) {
      return res.status(400).send(
        `Faltan campos requeridos: ${camposFaltantes.join(", ")}`
      );
    }

    // Validar que la categoría sea una de las permitidas
    // const categoriasValidas = ["bebidas", "comida", "cocktails"];
    // if (!categoriasValidas.includes(categoria)) {
    //   return res.status(400).send("Categoría no válida. Debe ser 'bebidas', 'comida' o 'cocktails'");
    // }

    try {
      // Obtener nuevo ID mediante contador por categoría
      const contadorRef = db.ref(`producto-venta-contador/${categoria}`);
      const result = await contadorRef.transaction(current => (current || 0) + 1);

      if (!result.committed) {
        return res.status(500).send("Error al generar ID");
      }

      const nuevoId = result.snapshot.val();
      const productoRef = db.ref(`producto-venta/${categoria}/${nuevoId}`);

      const nuevoProducto = {
        // creadoEn: admin.database.ServerValue.TIMESTAMP,
        nombre,
        precio,
        categoria,
        visible: visible ?? true, // Por defecto visible es true
        novedad: novedad ?? false,
      };

      // Opcionales
      if (descripcion) nuevoProducto.descripcion = descripcion;
      if (alergenos) nuevoProducto.alergenos = alergenos;
      if (intolerancias) nuevoProducto.intolerancias = intolerancias;
      if (anotaciones) nuevoProducto.anotaciones = anotaciones;
      if (categoria === "comida" && tipo_comida) {
        nuevoProducto.tipo_comida = tipo_comida;
      } else {
        nuevoProducto.tipo_comida = "uncategorized"; // Valor por defecto si no es comida
      }

      await productoRef.set(nuevoProducto);

      return res.status(200).send({
        mensaje: `Producto agregado exitosamente a la categoría '${categoria}'`,
        id: nuevoId
      });

    } catch (error) {
      console.error("Error al agregar producto:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.listarProductosVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).send("Método no permitido");
    }

    try {
      const snapshot = await db.ref("producto-venta").once("value");
      const data = snapshot.val();

      if (!data) {
        return res.status(200).json([]);
      }

      const lista = [];

      for (const [categoria, productos] of Object.entries(data)) {
        for (const [id, producto] of Object.entries(productos)) {
          lista.push({
            id,
            categoria,
            ...producto
          });
        }
      }

      return res.status(200).json(lista);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.modificarProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const {
      id,
      nombre,
      descripcion,
      precio,
      alergenos,
      visible,
      novedad,
      tipo_comida,
      categoria,
      anotaciones,
    } = req.body;

    if (!id || !categoria) {
      return res.status(400).send("Faltan campos requeridos: id y/o categoria");
    }

    try {
      const productoRef = db.ref(`producto-venta/${categoria}/${id}`);
      const snapshot = await productoRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).send("El producto no existe en la categoría indicada");
      }

      const actualizaciones = {
        actualizadoEn: admin.database.ServerValue.TIMESTAMP
      };

      if (nombre !== undefined) actualizaciones.nombre = nombre;
      if (descripcion !== undefined) actualizaciones.descripcion = descripcion;
      if (precio !== undefined) actualizaciones.precio = parseFloat(precio);
      if (alergenos !== undefined) actualizaciones.alergenos = alergenos;
      if (visible !== undefined) actualizaciones.visible = visible;
      if (novedad !== undefined) actualizaciones.novedad = novedad;
      if (tipo_comida !== undefined && categoria === "comida") {
        actualizaciones.tipo_comida = tipo_comida;
      }
      if (anotaciones !== undefined) actualizaciones.anotaciones = anotaciones;

      await productoRef.update(actualizaciones);

      return res.status(200).send({
        mensaje: "Producto actualizado correctamente",
        id,
        categoria
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.eliminarProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const { id, categoria } = req.body;

    if (!id || !categoria) {
      return res.status(400).send("Faltan campos requeridos: id y/o categoria");
    }

    try {
      const productoRef = db.ref(`producto-venta/${categoria}/${id}`);
      const snapshot = await productoRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).send("El producto no existe en la categoría indicada");
      }

      await productoRef.remove();

      return res.status(200).send({
        mensaje: `Producto con ID '${id}' eliminado correctamente de la categoría '${categoria}'`
      });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});