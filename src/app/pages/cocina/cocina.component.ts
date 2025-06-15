// cocina.component.ts
import { Component, OnInit } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';

interface Producto {
  nombre: string;
  precio: number;
  estado: string;
  categoria?: string;
  tipoProducto?: string;
  anotacion?: string;
  hora: string;
  anadidoPor?: string;
}

interface MesaRaw {
  actualizadoEn: number;
  anotaciones: string;
  contenido: Producto[];
  estado: string;
}

interface Comida extends Producto {
  originalIndex: number;
}

interface MesaConComida {
  mesaId: string;
  platos: Comida[];
}

@Component({
  selector: 'cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent implements OnInit {
  rawMesasData: Record<string, MesaRaw> = {};
  mesasConComida: MesaConComida[] = [];
  cargando = false;
  error: string | null = null;

  usuario: User | null = null;
  tipoUsuario: string | null = null;

  categoriasConDestino: Record<string, { destino: string }> = {};

  constructor(private servicios: ServiciosService, private authService: AuthService, private router: Router) {
    // Obtenemos el usuario y su tipo
    this.authService.user$.subscribe(user => {
      this.usuario = user;

      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
          console.log('Tipo de usuario:', this.tipoUsuario);

          // Verificar si el usuario es permitido en la página
          if (this.tipoUsuario !== 'admin' && this.tipoUsuario !== 'empleado') {
            this.router.navigate(['/carta']);
          }
        });
      } else {
        this.router.navigate(['/carta']);
      }
    });
  }

  ngOnInit(): void {
    this.cargarCategorias(() => {
      this.recargar();
    });
  }

  cargarCategorias(callback: () => void): void {
    this.servicios.obetenerCategorias().subscribe({
      next: res => {
        if (res && res.categorias) {
          this.categoriasConDestino = res.categorias;
          callback(); // llamamos a recargar()
        } else {
          console.warn('No se pudieron cargar las categorías');
          callback();
        }
      },
      error: err => {
        console.error('Error al cargar categorías:', err);
        callback(); // seguimos aunque haya error
      }
    });
  }

  recargar(): void {
    this.cargando = true;
    this.error = null;

    this.servicios.listarTodos().subscribe({
      next: raw => {
        // Validamos que exista raw.datos
        if (!raw || typeof raw !== 'object' || !raw.datos) {
          console.error('Formato inesperado', raw);
          this.error = 'Formato de respuesta inesperado';
          this.cargando = false;
          return;
        }

        // Guardamos el objeto completo
        this.rawMesasData = (raw as any).datos as Record<string, MesaRaw>;

        // Construimos el array para el template
        this.mesasConComida = Object.entries(this.rawMesasData)
          .map(([mesaId, mesa]) => {
            const platos: Comida[] = [];

            mesa.contenido.forEach((item, idx) => {
              const categoria = item.categoria ?? item.tipoProducto ?? '';
              const destino = this.categoriasConDestino[categoria]?.destino;

              if (destino === 'cocina' && item.estado === 'En preparación') {
                platos.push({ ...item, originalIndex: idx });
              }
            });

            return { mesaId, platos };
          })
          // Sólo mesas con platos pendientes
          .filter(m => m.platos.length > 0);

        this.cargando = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error al cargar datos de mesas';
        this.cargando = false;
      }
    });
  }

  enviarAPreparado(mesaId: string, originalIndex: number): void {
    const mesa = this.rawMesasData[mesaId];
    if (!mesa) return;

    const contenidoActualizado = mesa.contenido.map((item, idx) =>
      idx === originalIndex
        ? { ...item, estado: 'Preparado' }
        : item
    );

    this.servicios.guardarOModificarMesa({
      mesaId,
      contenido: contenidoActualizado,
      estado: mesa.estado,
      anotaciones: mesa.anotaciones
    }).subscribe({
      next: () => this.recargar(),
      error: err => {
        console.error(err);
        alert('No se pudo enviar a cocina');
      }
    });
  }

  marcarTodosComoServido(mesaId: string): void {
    const mesa = this.rawMesasData[mesaId];
    if (!mesa) return;

    const contenidoActualizado = mesa.contenido.map((item, idx) => {
      const categoria = item.categoria ?? item.tipoProducto ?? '';
      const destino = this.categoriasConDestino[categoria]?.destino;

      // Solo marcamos los de cocina que estén en preparación
      if (destino === 'cocina' && item.estado === 'En preparación') {
        return { ...item, estado: 'Preparado' };
      }

      return item; // El resto se mantiene igual
    });

    this.servicios.guardarOModificarMesa({
      mesaId,
      contenido: contenidoActualizado,
      estado: mesa.estado,
      anotaciones: mesa.anotaciones
    }).subscribe({
      next: () => this.recargar(),
      error: err => {
        console.error(err);
        alert('No se pudieron marcar todos como servidos');
      }
    });
  }
}
