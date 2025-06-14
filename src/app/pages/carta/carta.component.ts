import { Component, inject } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'carta',
  imports: [CommonModule, FormsModule],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css',
})
export class CartaComponent implements OnInit {
  service = inject(ServiciosService);
  productos$: Observable<any>;

  productoSeleccionado: any = null;
  productoEditable: any = null;

  auth = inject(Auth);
  authService = inject(AuthService);
  userRole: string | null = null;

  mostrarFormularioNuevo: boolean = false;
  nuevoProducto: any = {
    nombre: '',
    descripcion: '',
    precio: 0,
    alergenos: [],
    visible: false,
    novedad: false,
    tipo_comida: '',
    categoria: ''
  };

  categoriasDisponibles: string[] = [];

  anadirProducto(producto: {
    nombre: string;
    descripcion: string;
    precio: number;
    alergenos: string | any[];
    visible: boolean;
    novedad: boolean;
    tipo_comida: string;
    categoria: string;
  }) {
    const alergenosArray = typeof producto.alergenos === 'string'
      ? producto.alergenos.split(',').map(a => a.trim()).filter(a => a)
      : producto.alergenos;

    this.service.añadirProductoVenta$(
      producto.nombre,
      producto.descripcion,
      producto.precio,
      alergenosArray,
      producto.visible,
      producto.novedad,
      producto.tipo_comida,
      producto.categoria
    ).subscribe({
      next: (response) => {
        console.log('Producto añadido:', response);
        this.productos$ = this.service.listarProductosVenta$();
        // Reiniciar el formulario
        this.nuevoProducto = {
          nombre: '',
          descripcion: '',
          precio: 0,
          alergenos: [],
          visible: false,
          novedad: false,
          tipo_comida: '',
          categoria: ''
        };
      },
      error: (error) => {
        console.error('Error al añadir el producto:', error);
      },
    });
  }

  // Metodos necesarios para abrir popup de detalles del producto para modificacion
  verDetalles(producto: any) {
    this.productoSeleccionado = producto;
    this.productoEditable = { ...producto };
  }

  cerrarDetalles() {
    this.productoSeleccionado = null;
    this.productoEditable = null;
  }

  // Método para abrir el formulario de edición en pagina Carta y modificar el producto
  guardarCambios() {
    const originalCategoria = this.productoSeleccionado.categoria;
    const nuevaCategoria = this.productoEditable.categoria;

    if (originalCategoria !== nuevaCategoria) {
      // Primero eliminamos
      this.service.eliminarProducto({
        id: this.productoEditable.id,
        categoria: originalCategoria
      }).subscribe({
        next: () => {
          // Solo si la eliminación fue exitosa, añadimos
          this.service.añadirProductoVenta$(
            this.productoEditable.nombre,
            this.productoEditable.descripcion,
            this.productoEditable.precio,
            this.productoEditable.alergenos,
            this.productoEditable.visible,
            this.productoEditable.novedad,
            this.productoEditable.tipo_comida,
            nuevaCategoria
          ).subscribe({
            next: () => {
              console.log('Producto movido y añadido correctamente');
              this.cerrarDetalles();
              this.productos$ = this.service.listarProductosVenta$(); // actualizar solo después de confirmación
            },
            error: err => {
              console.error('Error al añadir en nueva categoría:', err);
              alert('No se pudo añadir el producto en la nueva categoría');
            }
          });
        },
        error: err => {
          console.error('Error al eliminar de categoría antigua:', err);
          alert('No se pudo eliminar el producto de la categoría original');
        }
      });
    } else {
      // Modificación normal
      this.service.modificarProducto(this.productoEditable).subscribe({
        next: () => {
          console.log('Producto actualizado correctamente');
          this.cerrarDetalles();
          this.productos$ = this.service.listarProductosVenta$(); // actualizar aquí también
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('No se pudo actualizar el producto');
        }
      });
    }
  }

  // Método para eliminar un producto
  eliminarProducto() {
    if (!this.productoEditable?.id || !this.productoEditable?.categoria) {
      console.error('Faltan ID o categoría');
      return;
    }

    const confirmado = confirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmado) return;

    this.service.eliminarProducto(this.productoEditable).subscribe({
      next: () => {
        console.log('Producto eliminado correctamente');
        this.cerrarDetalles();
        this.productos$ = this.service.listarProductosVenta$();
      },
      error: (err) => {
        console.error('Error al eliminar producto:', err);
      }
    });
  }

  puedeEditar(): boolean {
    return this.userRole === 'admin' || this.userRole === 'empleado';
  }

  constructor() {
    this.productos$ = this.service.listarProductosVenta$();
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userRole = await this.authService.getUserRole(user.uid);
        console.log('ROL DEL USUARIO:', this.userRole);
      } else {
        console.warn('No hay usuario autenticado.');
      }
    });

    // Cargar categorías al iniciar
    this.service.obetenerCategorias().subscribe({
      next: res => {
        const categorias = res?.categorias;
        if (categorias && typeof categorias === 'object') {
          this.categoriasDisponibles = Object.keys(categorias);
        } else {
          console.warn('Categorías no válidas:', res);
        }
      },
      error: err => console.error('Error al cargar categorías', err)
    });
  }
}
