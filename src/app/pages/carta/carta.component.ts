import { Component, inject } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'carta',
  imports: [CommonModule, FormsModule],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css',
})
export class CartaComponent {
  service = inject(ServiciosService);
  productos$: Observable<any>;
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
        // Aquí podrías actualizar la lista de productos si es necesario
        this.productos$ = this.service.listarProductosVenta$();
      },
      error: (error) => {
        console.error('Error al añadir el producto:', error);
      },
    });
  }

  constructor() {
    this.productos$ = this.service.listarProductosVenta$();
  }
}
