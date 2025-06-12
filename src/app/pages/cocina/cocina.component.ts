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

interface ItemConIndex extends Producto {
  originalIndex: number;
}

interface MesaConComida {
  mesaId: string;
  platos: ItemConIndex[];
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

  private recargar(): void {
    this.cargando = true;
    this.error = null;

    this.servicios.listarTodos().subscribe({
      next: raw => {
        if (!raw || typeof raw !== 'object' || !raw.datos) {
          this.error = 'Respuesta inesperada del servidor';
          this.cargando = false;
          return;
        }

        this.rawMesasData = (raw as any).datos as Record<string, MesaRaw>;

        this.mesasConComida = Object.entries(this.rawMesasData)
          .map(([mesaId, mesa]) => {
            const platos: ItemConIndex[] = [];
            mesa.contenido.forEach((item, idx) => {
              const cat = (item.categoria ?? item.tipoProducto ?? '').toLowerCase();
              if (cat.includes('comida') && item.estado === 'En preparación') {
                platos.push({ ...item, originalIndex: idx });
              }
            });
            return { mesaId, platos };
          })
          .filter(m => m.platos.length > 0);

        this.cargando = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error cargando datos de mesas';
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
}
