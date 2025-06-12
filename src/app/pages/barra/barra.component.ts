import { Component, OnInit } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';

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

interface Bebida extends Producto {
  originalIndex: number;
}

interface MesaConBebidas {
  mesaId: string;
  bebidas: Bebida[];
}

@Component({
  selector: 'barra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barra.component.html',
  styleUrls: ['./barra.component.css']
})
export class BarraComponent implements OnInit {
  rawMesasData: Record<string, MesaRaw> = {};
  mesasConBebidas: MesaConBebidas[] = [];
  cargando = false;
  error: string | null = null;

  usuario: User | null = null;
  tipoUsuario: string | null = null;

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
    this.recargar();
  }

  recargar(): void {
    this.cargando = true;
    this.error = null;

    this.servicios.listarTodos().subscribe({
      next: raw => {
        // 1) Validamos que exista raw.datos
        if (!raw || typeof raw !== 'object' || !raw.datos) {
          console.error('Formato inesperado', raw);
          this.error = 'Formato de respuesta inesperado';
          this.cargando = false;
          return;
        }

        // 2) Guardamos el objeto completo
        this.rawMesasData = (raw as any).datos as Record<string, MesaRaw>;

        // 3) Construimos el array para el template
        this.mesasConBebidas = Object.entries(this.rawMesasData)
          .map(([mesaId, mesa]) => {
            const bebidas: Bebida[] = [];

            mesa.contenido.forEach((item, idx) => {
              // Unificamos categoría/tipoProducto y chequeamos "bebida"
              const cat = (item.categoria ?? item.tipoProducto ?? '')
                .toLowerCase();
              if (cat.includes('bebida') && item.estado === 'En preparación') {
                bebidas.push({ ...item, originalIndex: idx });
              }
            });

            return { mesaId, bebidas };
          })
          // 4) Sólo mesas con bebidas pendientes
          .filter(m => m.bebidas.length > 0);

        this.cargando = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error al cargar datos de mesas';
        this.cargando = false;
      }
    });
  }

  marcarComoServido(mesaId: string, originalIndex: number): void {
    const mesa = this.rawMesasData[mesaId];
    if (!mesa) return;

    // 1) Clonamos y actualizamos sólo el item marcado
    const contenidoActualizado = mesa.contenido.map((item, idx) =>
      idx === originalIndex
        ? { ...item, estado: 'servido' }
        : item
    );

    // 2) Hacemos POST a guardar/modificar mesa
    this.servicios.guardarOModificarMesa({
      mesaId,
      contenido: contenidoActualizado,
      estado: mesa.estado,
      anotaciones: mesa.anotaciones
    }).subscribe({
      next: () => this.recargar(),
      error: err => {
        console.error(err);
        alert('No se pudo marcar como servido');
      }
    });
  }
}
