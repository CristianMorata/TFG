import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { ServiciosService } from '../../services/servicios.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'mesa',
  imports: [CommonModule, FormsModule],
  templateUrl: './mesa.component.html',
  styleUrl: './mesa.component.css'
})
export class MesaComponent {
  mesaId: string | null = null;
  productosPorCategoria: any = {};
  productosSeleccionados: any[] = [];

  usuario: User | null = null;
  tipoUsuario: string | null = null;

  anotaciones: string = '';
  estado: string = 'sirviendo';
  mesaContenido: any[] = [];
  anotacionesPorProducto: { [productoId: string]: string } = {};

  mesaContenidoExistente: any[] = [];
  mesaEstadoActual: string = '';
  mesaExiste: boolean = false;

  mostrarPopupProductos = false;
  todosLosProductos: any[] = [];

  modoEdicion: boolean = false;
  productoEditando: any = null;
  mostrarPopupEditarProducto: boolean = false;
  indiceProductoEditando: number | null = null;

  mesaContenidoBackup: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private service: ServiciosService,
    private authService: AuthService
  ) {
    this.route.paramMap.subscribe(params => {
      this.mesaId = params.get('id');
    });

    this.authService.user$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
        });
      }
    });

    this.cargarProductos();

    this.route.paramMap.subscribe(params => {
      this.mesaId = params.get('id');
      if (this.mesaId) {
        this.cargarMesaDesdeBackend(this.mesaId);
      }
    });
  }

  esEmpleadoOAdmin(): boolean {
    return this.tipoUsuario === 'admin' || this.tipoUsuario === 'empleado';
  }

  cargarProductos() {
    this.service.listarProductosVenta$().subscribe((datos: any[]) => {
      this.todosLosProductos = datos;
      // Si luego necesitas categorizarlos puedes hacerlo aquí
      // this.productosPorCategoria = this.organizarPorCategoria(datos);
    });
  }

  abrirSelectorProductos() {
    this.mostrarPopupProductos = true;
  }

  cerrarPopupProductos() {
    this.mostrarPopupProductos = false;
  }

  seleccionarProducto(producto: any) {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const anotacion = this.anotacionesPorProducto[producto.nombre] || '';

    const productoFinal = {
      nombre: producto.nombre,
      precio: producto.precio,
      anadidoPor: this.usuario?.email || 'desconocido',
      estado: 'En preparación',
      hora: horaActual,
      anotacion: anotacion
    };

    this.mesaContenido.push(productoFinal);
    this.productosSeleccionados.push(productoFinal);

    // Limpieza
    this.anotacionesPorProducto[producto.nombre] = '';
  }

  guardarMesa() {
    const contenidoFinal = [...this.mesaContenidoExistente, ...this.mesaContenido];

    const datos = {
      mesaId: this.mesaId,
      contenido: contenidoFinal,
      estado: 'En preparación',
      anotaciones: this.anotaciones
    };

    fetch('https://guardaromodificarmesa-rs2gjhs4iq-uc.a.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(res => res.json())
      .then(resp => {
        console.log('Mesa guardada:', resp);
        alert('Mesa guardada correctamente');

        // Actualizar interfaz
        this.mesaContenidoExistente = [...contenidoFinal];
        this.productosSeleccionados = [];
        this.mesaContenido = [];
        this.mostrarPopupProductos = false;
        this.mesaExiste = true;
      })
  }

  cargarMesaDesdeBackend(mesaId: string) {
    fetch(`https://listarmesa-rs2gjhs4iq-uc.a.run.app?mesaId=${mesaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Mesa no existe');
        return res.json();
      })
      .then(data => {
        this.mesaExiste = true;
        const mesa = data.datos;
        this.mesaContenidoExistente = mesa.contenido || [];
        this.mesaEstadoActual = mesa.estado || '';
        this.anotaciones = mesa.anotaciones || '';
      })
      .catch(err => {
        console.log('Mesa libre:', err.message);
        this.mesaExiste = false;
      });
  }

  abrirPopupEditarProducto(producto: any, index: number) {
    this.productoEditando = { ...producto };
    this.indiceProductoEditando = index;
    this.mostrarPopupEditarProducto = true;
  }

  cerrarPopupEditarProducto() {
    this.mostrarPopupEditarProducto = false;
    this.productoEditando = null;
    this.indiceProductoEditando = null;
  }

  guardarEdicionProducto() {
    if (this.indiceProductoEditando !== null) {
      this.mesaContenidoExistente[this.indiceProductoEditando] = { ...this.productoEditando };
    }
    this.cerrarPopupEditarProducto();
  }

  eliminarProducto(index: number) {
    this.mesaContenidoExistente.splice(index, 1);
  }

  guardarCambiosMesaEditada() {
    const datos = {
      mesaId: this.mesaId,
      contenido: this.mesaContenidoExistente,
      estado: 'Sirviendo',
      anotaciones: this.anotaciones
    };

    fetch('https://guardaromodificarmesa-rs2gjhs4iq-uc.a.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(res => res.json())
      .then(resp => {
        alert('Cambios guardados correctamente');
        this.modoEdicion = false;
      })
      .catch(err => {
        alert('Error al guardar cambios');
        console.error(err);
      });
  }

  activarModoEdicion() {
    this.modoEdicion = true;
    this.mesaContenidoBackup = JSON.parse(JSON.stringify(this.mesaContenidoExistente));
  }

  deshacerCambios() {
    this.mesaContenidoExistente = JSON.parse(JSON.stringify(this.mesaContenidoBackup)); // recuperamos copia
    this.mesaContenidoExistente = [...this.mesaContenidoExistente]; // forzamos render de Angular
    this.modoEdicion = false;
    this.mesaContenidoBackup = [];
  }
}