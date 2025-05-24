const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("../../config/firebase.js");
const corsHandler = require("../../config/cors.js");

exports.agregarProductoVenta = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const {
      nombre,
      descripcion,
      precio,
      alergenos,
      intolerancias,
      visible,
      novedad,
      tipo_producto,
      categoria,
      anotaciones,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !descripcion || precio == null || !tipo_producto || !categoria) {
      return res.status(400).send("Faltan campos requeridos: nombre, descripcion, precio, tipo_producto, categoria");
    }

    // Validar que la categoría sea una de las permitidas
    const categoriasValidas = ["bebidas", "comida", "cocktails"];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).send("Categoría no válida. Debe ser 'bebidas', 'comida' o 'cocktails'");
    }

    try {
      // Transacción para obtener e incrementar el contador
      const contadorRef = db.ref(`producto-venta-contador/${categoria}`);
      const result = await contadorRef.transaction(current => {
        return (current || 0) + 1;
      });

      if (!result.committed) {
        return res.status(500).send("Error al generar ID");
      }

      const nuevoId = result.snapshot.val();
      const productoRef = db.ref(`producto-venta/${categoria}/${nuevoId}`);

      const nuevoProducto = {
        creadoEn: admin.database.ServerValue.TIMESTAMP,
        nombre,
        descripcion,
        precio,
        visible: visible !== undefined ? visible : false,
        novedad: novedad !== undefined ? novedad : false,
        tipo_producto
      };

      if (alergenos !== undefined) nuevoProducto.alergenos = alergenos;
      if (intolerancias !== undefined) nuevoProducto.intolerancias = intolerancias;
      if (anotaciones !== undefined) nuevoProducto.anotaciones = anotaciones;

      await productoRef.set(nuevoProducto);

      return res.status(200).send({
        mensaje: `Producto agregado exitosamente a la categoría '${categoria}'`,
        id: nuevoId
      });
    } catch (error) {
      console.error("Error:", error);
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
      id,           // ID del producto a modificar
      categoria,    // ← necesario ahora
      nombre,
      descripcion,
      precio,
      alergenos,
      intolerancias,
      visible,
      novedad,
      tipo_producto,
      anadido_por,
      fecha_anadido,
      anotaciones
    } = req.body;

    if (!id || !categoria) {
      return res.status(400).send("Faltan campos requeridos: id y categoria");
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
      if (intolerancias !== undefined) actualizaciones.intolerancias = intolerancias;
      if (visible !== undefined) actualizaciones.visible = visible;
      if (novedad !== undefined) actualizaciones.novedad = novedad;
      if (tipo_producto !== undefined) actualizaciones.tipo_producto = tipo_producto;
      if (anadido_por !== undefined) actualizaciones.anadido_por = anadido_por;
      if (fecha_anadido !== undefined) actualizaciones.fecha_anadido = fecha_anadido;
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