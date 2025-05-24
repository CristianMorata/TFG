/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
// const admin = require("firebase-admin");

// // Inicializa Firebase Admin solo una vez
// if (!admin.apps.length) {
//   admin.initializeApp({
//     databaseURL: "https://proyecto-hosteleria-b6c98-default-rtdb.firebaseio.com/"
//   });
// }

// Inyectar las funciones de cada módulo
const { agregarEmpleado, listarEmpleados } = require("./funciones/empleados/empleados.js");
const { guardarOModificarMesa, cerrarMesa } = require("./funciones/mesa/mesa.js");
const { agregarPedidoProveedor } = require("./funciones/producto-proveedor/producto-proveedor.js");
const { agregarProductoVenta, listarProductosVenta, modificarProductoVenta } = require("./funciones/producto-venta/producto-venta.js");

// Exportar las funciones a Firebase Functions

// Funciones de empleados
exports.agregarEmpleado = onRequest(agregarEmpleado);
exports.listarEmpleados = onRequest(listarEmpleados);

// Funciones de mesa
exports.guardarOModificarMesa = onRequest(guardarOModificarMesa);
exports.cerrarMesa = onRequest(cerrarMesa);

// Funciones de producto proveedor
exports.agregarPedidoProveedor = onRequest(agregarPedidoProveedor);

// Funciones de producto venta
exports.agregarProductoVenta = onRequest(agregarProductoVenta);
exports.listarProductosVenta = onRequest(listarProductosVenta);
exports.modificarProductoVenta = onRequest(modificarProductoVenta);