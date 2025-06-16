import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'mesa',
  imports: [CommonModule],
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit {
  mesas: any[] = [];
  mesasFijas: any[] = [];
  mesasExtras: any[] = [];

  extraCount = 1;
  mesaCount = 0;
  mostrarPopupTipoMesa = false;

  usuario: User | null = null;
  tipoUsuario: string | null = null;

  cargando = true;

  constructor(private authService: AuthService, private router: Router) {
    // Obtenemos el usuario y su tipo
    this.authService.user$.subscribe(user => {
      this.usuario = user;

      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
          console.log('Tipo de usuario:', this.tipoUsuario);

          // Verificar si el usuario es permitido en la página
          if (this.tipoUsuario !== 'admin' && this.tipoUsuario !== 'empleado') {
            this.router.navigate(['/carta']); // o donde tú decidas
          }
        });
      } else {
        this.router.navigate(['/carta']);
      }
    });
  }

  ngOnInit() {
    this.inicializarMesas();
  }

  async inicializarMesas() {
    try {
      await this.obtenerContadorMesas();
      await this.cargarMesasExtra();
      await this.actualizarEstadosMesas();
    } finally {
      this.actualizarListaMesas();
      this.cargando = false;
    }
  }

  abrirSelectorTipoMesa() {
    if (this.tipoUsuario === 'admin') {
      this.mostrarPopupTipoMesa = true;
    } else {
      this.anadirMesaExtra();
    }
  }

  cerrarPopupTipoMesa() {
    this.mostrarPopupTipoMesa = false;
  }

  actualizarListaMesas() {
    this.mesas = [...this.mesasFijas, ...this.mesasExtras];
  }

  obtenerContadorMesas(): Promise<void> {
    return fetch('https://obtenercontadormesas-rs2gjhs4iq-uc.a.run.app')
      .then(res => res.json())
      .then(data => {
        this.mesaCount = data.contador;

        this.mesasFijas = Array.from({ length: this.mesaCount }).map((_, i) => ({
          id: i + 1,
          nombre: `Mesa ${i + 1}`,
          estado: 'Libre',
          extra: false
        }));
      });
  }

  cargarMesasExtra(): Promise<void> {
    return fetch('https://listarmesasextra-rs2gjhs4iq-uc.a.run.app')
      .then(res => res.json())
      .then(data => {
        if (!data || !data.mesasExtra) return;
        this.mesasExtras = data.mesasExtra;
        this.extraCount = this.mesasExtras.length + 1;
      });
  }

  anadirMesaNormal() {
    this.mesaCount++;
    this.mesasFijas.push({
      id: this.mesaCount,
      nombre: `Mesa ${this.mesaCount}`,
      estado: 'Libre',
      extra: false
    });
    this.actualizarListaMesas();

    fetch('https://actualizarcontadormesas-rs2gjhs4iq-uc.a.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoValor: this.mesaCount })
    });

    this.cerrarPopupTipoMesa();
  }

  anadirMesaExtra() {
    const nuevaMesaExtra = {
      id: `ex${this.extraCount}`,
      nombre: `Mesa Extra (${this.extraCount})`,
      estado: 'Libre',
      extra: true
    };

    this.mesasExtras.push(nuevaMesaExtra);
    this.extraCount++;
    this.actualizarListaMesas();

    this.cerrarPopupTipoMesa();
  }

  actualizarEstadosMesas(): Promise<void> {
    return fetch('https://listartodaslasmesas-rs2gjhs4iq-uc.a.run.app')
      .then(res => res.json())
      .then(data => {
        const todasMesas = data.datos || {};

        const calcularEstadoMesa = (productos: any[]): { estado: string, tiempoEnPreparacion: number } => {
          if (!productos || productos.length === 0) return { estado: 'Libre', tiempoEnPreparacion: 0 };

          const hayEnPreparacion = productos.some(p => p.estado === 'En preparación');
          const todosPreparados = productos.every(p => p.estado === 'Preparado');

          let tiempoEnPreparacion = 0;
          if (hayEnPreparacion) {   
            // Busca el producto en preparación más antiguo
            const productosEnPrep = productos.filter(p => p.estado === 'En preparación' && p.fechaEnPreparacion);
            if (productosEnPrep.length > 0) {
              // Suponiendo que p.fechaEnPreparacion es un timestamp o ISO string
              const minFecha = Math.min(...productosEnPrep.map(p => new Date(p.fechaEnPreparacion).getTime()));
              tiempoEnPreparacion = Math.floor((Date.now() - minFecha) / 60000); // minutos
            }
          }

          if (hayEnPreparacion) return { estado: 'En preparación', tiempoEnPreparacion };
          if (todosPreparados) return { estado: 'Preparada', tiempoEnPreparacion: 0 };

          return { estado: 'Libre', tiempoEnPreparacion: 0 };
        };

        this.mesasFijas.forEach(m => {
          const mesaFirebase = todasMesas[m.id];
          const { estado, tiempoEnPreparacion } = calcularEstadoMesa(mesaFirebase?.contenido || []);
          m.estado = estado;
          m.tiempoEnPreparacion = tiempoEnPreparacion;
        });

        this.mesasExtras.forEach(m => {
          const mesaFirebase = todasMesas[m.id];
          const { estado, tiempoEnPreparacion } = calcularEstadoMesa(mesaFirebase?.contenido || []);
          m.estado = estado;
          m.tiempoEnPreparacion = tiempoEnPreparacion;
        });
      });
  }

  irAMesa(mesa: any) {
    this.router.navigate(['/mesa', mesa.id]);
  }

  getMesaColorClass(mesa: any): string {
    if (mesa.estado === 'Libre') return 'bg-green-100 border-green-600 border-2 ';
    if (mesa.estado === 'Preparada') return 'bg-blue-100 border-blue-600 border-2 ';
    if (mesa.estado === 'En preparación') {
      const min = Math.min(mesa.tiempoEnPreparacion || 0, 2);
      if (min < 1) return 'bg-yellow-100 border-yellow-500 border-2 ';   // suave
      if (min < 2) return 'bg-yellow-300 border-yellow-600 border-2 ';   // medio
      return 'bg-yellow-400 border-yellow-700 border-2 ';                // intenso
    }
    return 'bg-gray-100 border-gray-400 border-2 ';
  }
}
