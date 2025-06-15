/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");

// Inyectar las funciones de cada módulo
const { agregarEmpleado, listarEmpleados, modificarEmpleado, eliminarEmpleado } = require("./funciones/empleados/empleados.js");
const { guardarOModificarMesa, cerrarMesa, listarMesa, obtenerContadorMesas, actualizarContadorMesas, listarMesasExtra, listarTodasLasMesas } = require("./funciones/mesa/mesa.js");
const { agregarPedidoProveedor } = require("./funciones/producto-proveedor/pedido-proveedor.js");
const { agregarProductoVenta, listarProductosVenta, modificarProductoVenta, eliminarProductoVenta } = require("./funciones/producto-venta/producto-venta.js");
const { agregarCategoriaProductoVenta, listarCategoriasProductoVenta } = require("./funciones/producto-venta/categorias.js");
const { actualizarConfiguracion, obtenerConfiguracion, modificarCategoria, obtenerCategorias } = require("./funciones/configuracion/configuracion.js");

// Exportar las funciones a Firebase Functions

// Funciones de empleados
exports.agregarEmpleado = onRequest(agregarEmpleado);
exports.listarEmpleados = onRequest(listarEmpleados);
exports.modificarEmpleado = onRequest(modificarEmpleado);
exports.eliminarEmpleado = onRequest(eliminarEmpleado);

// Funciones de mesa
exports.guardarOModificarMesa = onRequest(guardarOModificarMesa);
exports.cerrarMesa = onRequest(cerrarMesa);
exports.listarMesa = onRequest(listarMesa);
exports.obtenerContadorMesas = onRequest(obtenerContadorMesas);
exports.actualizarContadorMesas = onRequest(actualizarContadorMesas);
exports.listarMesasExtra = onRequest(listarMesasExtra);
exports.listarTodasLasMesas = onRequest(listarTodasLasMesas);

// Funciones de producto proveedor
exports.agregarPedidoProveedor = onRequest(agregarPedidoProveedor);

// Funciones de producto venta
exports.agregarProductoVenta = onRequest(agregarProductoVenta);
exports.listarProductosVenta = onRequest(listarProductosVenta);
exports.modificarProductoVenta = onRequest(modificarProductoVenta);
exports.eliminarProductoVenta = onRequest(eliminarProductoVenta);

// Funciones de categorías de producto venta
exports.agregarCategoriaProductoVenta = onRequest(agregarCategoriaProductoVenta);
exports.listarCategoriasProductoVenta = onRequest(listarCategoriasProductoVenta);

// Funciones de configuración
exports.actualizarConfiguracion = onRequest(actualizarConfiguracion);
exports.obtenerConfiguracion = onRequest(obtenerConfiguracion);
exports.modificarCategoria = onRequest(modificarCategoria);
exports.obtenerCategorias = onRequest(obtenerCategorias);