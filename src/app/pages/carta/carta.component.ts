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

  anadirProducto(producto: {
    nombre: string;
    descripcion: string;
    precio: number;
    alergenos: [];
    visible: boolean;
    novedad: boolean;
    tipo_comida: string;
    categoria: string;
  }) {
    this.service.añadirProductoVenta$(
      producto.nombre,
      producto.descripcion,
      producto.precio,
      producto.alergenos,
      producto.visible,
      producto.novedad,
      producto.tipo_comida,
      producto.categoria
    ).subscribe({
      next: (response) => {
        console.log('Producto añadido:', response);
        
        this.productos$ = this.service.listarProductosVenta$();
      },
      error: (error) => {
        console.error('Error al añadir el producto:', error);
      },
    });
  }

  // Metodos necesarios para abrir popup de detalles del producto para modificacion
  verDetalles(producto: any) {
    this.productoSeleccionado = producto;
    this.productoEditable = { ...producto }; // copia editable
  }

  cerrarDetalles() {
    this.productoSeleccionado = null;
    this.productoEditable = null;
  }

  // Método para abrir el formulario de edición en pagina Carta y modificar el producto
  guardarCambios() {
    this.service.modificarProducto(this.productoEditable).subscribe({
      next: () => {
        // console.log('Producto actualizado');
        this.cerrarDetalles();
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
      }
    });
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
        // console.log('Producto eliminado');
        this.cerrarDetalles();
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
  }
}
