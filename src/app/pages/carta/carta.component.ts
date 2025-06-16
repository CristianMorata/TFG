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
  productosFiltrados: any[] = [];
  alergenosDisponibles: string[] = [];
  alergenoSeleccionado: string = '';
  alergenosSeleccionados: string[] = [];
  categoriasSeleccionadas: string[] = [];

  productos: any[] = [];

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

    // Cargar productos y extraer alérgenos únicos
    this.productos$.subscribe(productos => {
      this.productos = productos;
      this.filtrarProductos();
      const alergenosSet = new Set<string>();
      productos.forEach((p: any) => {
        if (Array.isArray(p.alergenos)) {
          p.alergenos.forEach((a: string) => alergenosSet.add(a));
        }
      });
      this.alergenosDisponibles = Array.from(alergenosSet).sort();
    });

    // Cargar alergernos al iniciar
    this.service.getAlergenosDisponibles().subscribe({
      next: (alergenos) => {
        this.alergenosDisponibles = alergenos;
      },
      error: err => console.error('Error al cargar alérgenos disponibles', err)
    });
  }

  limpiarAlergenos() {
    this.alergenosSeleccionados = [];
  }

  toggleAlergeno(alergeno: string, checked: boolean) {
    if (checked) {
      if (!this.alergenosSeleccionados.includes(alergeno)) {
        this.alergenosSeleccionados.push(alergeno);
      }
    } else {
      this.alergenosSeleccionados = this.alergenosSeleccionados.filter(a => a !== alergeno);
    }

    // ✅ Usar el filtro correcto
    this.filtrarProductos();
  }

  onAlergenoCheckboxChange(event: Event, alergeno: string) {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleAlergeno(alergeno, checked);
  }

  onCategoriaCheckboxChange(event: Event, categoria: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.categoriasSeleccionadas.includes(categoria)) {
        this.categoriasSeleccionadas.push(categoria);
      }
    } else {
      this.categoriasSeleccionadas = this.categoriasSeleccionadas.filter(c => c !== categoria);
    }
    this.filtrarProductos();
  }

  limpiarCategorias() {
    this.categoriasSeleccionadas = [];
    this.filtrarProductos();
  }

  filtrarProductos() {
    this.productosFiltrados = this.productos.filter((producto: any) => {
      const pasaAlergenos = this.alergenosSeleccionados.length === 0 ||
        !producto.alergenos?.some((a: string) => this.alergenosSeleccionados.includes(a));

      const pasaCategorias = this.categoriasSeleccionadas.length === 0 ||
        (producto.categoria && this.categoriasSeleccionadas.includes(producto.categoria));

      return pasaAlergenos && pasaCategorias;
    });
  }

  getProductosPorCategoria(categoria: string): any[] {
    return this.productosFiltrados.filter(p => p.categoria?.toLowerCase() === categoria.toLowerCase());
  }

  // Control de alergenos
  toggleAlergenoNuevoProducto(alergeno: string, checked: boolean) {
    const alergenos = this.nuevoProducto.alergenos;
    if (checked && !alergenos.includes(alergeno)) {
      alergenos.push(alergeno);
    } else if (!checked) {
      this.nuevoProducto.alergenos = alergenos.filter((a: string) => a !== alergeno);
    }
  }

  toggleAlergenoEditable(alergeno: string, checked: boolean) {
    if (!this.productoEditable.alergenos) {
      this.productoEditable.alergenos = [];
    }

    if (checked && !this.productoEditable.alergenos.includes(alergeno)) {
      this.productoEditable.alergenos.push(alergeno);
    } else if (!checked) {
      this.productoEditable.alergenos = this.productoEditable.alergenos.filter((a: string) => a !== alergeno);
    }
  }

  onAlergenoCheckboxChangeNuevo(event: Event, alergeno: string) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    if (checked && !this.nuevoProducto.alergenos.includes(alergeno)) {
      this.nuevoProducto.alergenos.push(alergeno);
    } else if (!checked) {
      this.nuevoProducto.alergenos = this.nuevoProducto.alergenos.filter((a: string) => a !== alergeno);
    }
  }

  onAlergenoCheckboxChangeEditable(event: Event, alergeno: string) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    this.toggleAlergenoEditable(alergeno, checked);
  }
}