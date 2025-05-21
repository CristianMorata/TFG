/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const cors = require('cors');
const admin = require("firebase-admin");

// Inicializa Firebase Admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: "https://proyecto-hosteleria-b6c98-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();
const corsHandler = cors({ origin: true });

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
      es_nuevo,
      tipo_producto,
      anadido_por,
      fecha_anadido,
      anotaciones,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !descripcion || precio == null || !tipo_producto) {
      return res.status(400).send("Faltan campos requeridos: nombre, descripcion, precio, tipo_producto");
    }

    try {
      // Transacción para obtener e incrementar el contador
      const contadorRef = db.ref("producto-venta-contador");
      const result = await contadorRef.transaction(current => {
        return (current || 0) + 1;
      });

      if (!result.committed) {
        return res.status(500).send("Error al generar ID");
      }

      const nuevoId = result.snapshot.val();
      const productoRef = db.ref(`producto-venta/${nuevoId}`);

      const nuevoProducto = {
        creadoEn: admin.database.ServerValue.TIMESTAMP
      };

      if (nombre !== undefined) nuevoProducto.nombre = nombre;
      if (descripcion !== undefined) nuevoProducto.descripcion = descripcion;
      if (precio !== undefined) nuevoProducto.precio = precio;
      if (alergenos !== undefined) nuevoProducto.alergenos = alergenos;
      if (intolerancias !== undefined) nuevoProducto.intolerancias = intolerancias;
      nuevoProducto.visible = visible !== undefined ? visible : false;
      nuevoProducto.es_nuevo = es_nuevo !== undefined ? es_nuevo : false;
      if (tipo_producto !== undefined) nuevoProducto.tipo_producto = tipo_producto;
      if (anadido_por !== undefined) nuevoProducto.anadido_por = anadido_por;
      if (fecha_anadido !== undefined) nuevoProducto.fecha_anadido = fecha_anadido;
      if (anotaciones !== undefined) nuevoProducto.anotaciones = anotaciones;

      await productoRef.set(nuevoProducto);

      return res.status(200).send({
        mensaje: "Producto agregado exitosamente",
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

      const productos = snapshot.val();

      if (!productos) {
        return res.status(200).json([]);
      }

      // Convertimos el objeto a array con IDs
      const lista = Object.entries(productos).map(([id, data]) => ({
        id,
        ...data
      }));

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
      id, // ID del producto a modificar
      nombre,
      descripcion,
      precio,
      alergenos,
      intolerancias,
      visible,
      es_nuevo,
      tipo_producto,
      anadido_por,
      fecha_anadido,
      anotaciones
    } = req.body;

    if (!id) {
      return res.status(400).send("Falta el ID del producto (id)");
    }

    try {
      const productoRef = db.ref(`producto-venta/${id}`);
      const snapshot = await productoRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).send("El producto no existe");
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
      if (es_nuevo !== undefined) actualizaciones.es_nuevo = es_nuevo;
      if (tipo_producto !== undefined) actualizaciones.tipo_producto = tipo_producto;
      if (anadido_por !== undefined) actualizaciones.anadido_por = anadido_por;
      if (fecha_anadido !== undefined) actualizaciones.fecha_anadido = fecha_anadido;
      if (anotaciones !== undefined) actualizaciones.anotaciones = anotaciones;

      await productoRef.update(actualizaciones);

      return res.status(200).send({
        mensaje: "Producto actualizado correctamente",
        id
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      return res.status(500).send("Error interno del servidor");
    }
  });
});

exports.agregarPedidoProveedor = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido");
    }

    const {
      proveedor,
      presupuesto,
      fecha_entrega,
      tipo,
      alergenos,
      intolerancias
    } = req.body;

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