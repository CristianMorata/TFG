producto-venta
	categorias {
		POST - agregarCategoriaProductoVenta - https://agregarcategoriaproductoventa-rs2gjhs4iq-uc.a.run.app {
			categoria: string
		}
			
		GET - listarCategoriasProductoVenta - https://listarcategoriasproductoventa-rs2gjhs4iq-uc.a.run.app
	}

	producto-venta {
		POST - agregarProductoVenta - https://agregarproductoventa-rs2gjhs4iq-uc.a.run.app {
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
		}
		
		GET - listarProductosVenta - https://listarproductosventa-rs2gjhs4iq-uc.a.run.app

		POST - modificarProductoVenta - https://modificarproductoventa-rs2gjhs4iq-uc.a.run.app {
			id,
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
		}
	}
}

producto-proveedor {
	producto-proveedor {
		POST - agregarPedidoProveedor - https://agregarpedidoproveedor-rs2gjhs4iq-uc.a.run.app {
			proveedor,
            		presupuesto,
            		fecha_entrega,
            		tipo,
            		alergenos,
            		intolerancias
		}
	}
}

mesa {
	mesa {
		POST - guardarOModificarMesa - https://guardaromodificarmesa-rs2gjhs4iq-uc.a.run.app {
			mesaId, 
			contenido, 
			estado, 
			anotaciones
		}

		DELETE - cerrarMesa - https://cerrarmesa-rs2gjhs4iq-uc.a.run.app {
			mesaId
		}
	}
}

empelados {
	empelados {
		POST - 	agregarEmpleado - https://agregarempleado-rs2gjhs4iq-uc.a.run.app {
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
		}

		GET - listarEmpleados - https://listarempleados-rs2gjhs4iq-uc.a.run.app
	}
}
	