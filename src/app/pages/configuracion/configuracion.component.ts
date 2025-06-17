import { Component, OnInit } from '@angular/core';
import { ConfiguracionService } from '../../services/configuracion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'configuracion',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  servicioCamarero = false;
  servicioCliente = false;
  cargando = true;
  error: string | null = null;

  constructor(
    private configuracionService: ConfiguracionService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener el usuario y su tipo
    this.authService.user$.subscribe(user => {
      if (!user) return; // Esperamos al usuario

      this.usuario = user;

      this.authService.getUserRole(user.uid).then(tipo => {
        this.tipoUsuario = tipo;

        if (tipo !== 'admin') {
          this.router.navigate(['/carta']);
          return;
        }

        // Solo si es admin, cargamos la configuración
        this.cargarTodo();
      }).catch(err => {
        console.error('Error al obtener el rol del usuario:', err);
        this.router.navigate(['/carta']);
      });
    });

    // Cargar configuración al iniciar
    this.configuracionService.getConfiguracion().subscribe({
      next: (data) => {
        this.servicioCamarero = data.anadirProductosCamarero;
        this.servicioCliente = data.anadirProductosClientes;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la configuración.';
        this.cargando = false;
      }
    });

    // Cargar categorías al iniciar
    this.configuracionService.getCategorias().subscribe({
      next: (data) => this.categorias = data.categorias,
      error: () => this.error = 'No se pudieron cargar las categorías.'
    });

    // Cargar alérgenos al iniciar
    this.configuracionService.getAlergenos().subscribe({
      next: (data) => this.alergenos = data.alergenos,
      error: () => this.error = 'No se pudieron cargar los alérgenos.'
    });
  }

  onChange(): void {
    this.cargando = true;
    this.configuracionService
      .updateConfiguracion(this.servicioCamarero, this.servicioCliente)
      .subscribe({
        next: () => (this.cargando = false),
        error: () => {
          this.error = 'No se pudo guardar la configuración.';
          this.cargando = false;
        }
      });
  }

  //  Manejo de redirecionamiento por rol
  private cargarTodo(): void {
    this.configuracionService.getConfiguracion().subscribe({
      next: (data) => {
        this.servicioCamarero = data.anadirProductosCamarero;
        this.servicioCliente = data.anadirProductosClientes;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la configuración.';
        this.cargando = false;
      }
    });

    this.configuracionService.getCategorias().subscribe({
      next: (data) => this.categorias = data.categorias,
      error: () => this.error = 'No se pudieron cargar las categorías.'
    });

    this.configuracionService.getAlergenos().subscribe({
      next: (data) => this.alergenos = data.alergenos,
      error: () => this.error = 'No se pudieron cargar los alérgenos.'
    });

    this.cargarHistorialMesas();
  }

  // Manejo de categorías
  categorias: any = {};
  mostrarPopup = false;
  modoEdicion = false;

  nombreCategoria = '';
  destino = 'cocina';

  getCategoriasKeys(): string[] {
    return Object.keys(this.categorias || {});
  }

  abrirPopup(nombre?: string): void {
    if (nombre) {
      this.modoEdicion = true;
      this.nombreCategoria = nombre;
      this.destino = this.categorias[nombre].destino;
    } else {
      this.modoEdicion = false;
      this.nombreCategoria = '';
      this.destino = 'cocina';
    }
    this.mostrarPopup = true;
  }

  cerrarPopup(): void {
    this.mostrarPopup = false;
  }

  guardarCategoria(): void {
    if (!this.nombreCategoria.trim()) return;

    this.configuracionService.modificarCategoria(this.nombreCategoria, this.destino).subscribe({
      next: () => {
        this.categorias[this.nombreCategoria] = { destino: this.destino };
        this.cerrarPopup();
      },
      error: () => this.error = 'Error al guardar la categoría.'
    });
  }

  borrarCategoria(nombre: string): void {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;

    this.configuracionService.eliminarCategoria(nombre).subscribe({
      next: () => {
        delete this.categorias[nombre];
        this.cerrarPopup();
      },
      error: () => this.error = 'Error al eliminar la categoría.'
    });
  }

  // Manejo de alérgenos
  alergenos: any = {};
  mostrarPopupAlergeno = false;
  modoEdicionAlergeno = false;
  nombreAlergeno = '';
  nombreAlergenoOriginal = '';

  getAlergenosKeys(): string[] {
    return Object.keys(this.alergenos || {});
  }

  abrirPopupAlergeno(nombre?: string): void {
    if (nombre) {
      this.modoEdicionAlergeno = true;
      this.nombreAlergeno = nombre;
      this.nombreAlergenoOriginal = nombre;
    } else {
      this.modoEdicionAlergeno = false;
      this.nombreAlergeno = '';
      this.nombreAlergenoOriginal = '';
    }
    this.mostrarPopupAlergeno = true;
  }

  cerrarPopupAlergeno(): void {
    this.mostrarPopupAlergeno = false;
  }

  guardarAlergeno(): void {
    const nombreNuevo = this.nombreAlergeno.trim();
    const nombreViejo = this.nombreAlergenoOriginal;

    if (!nombreNuevo) return;

    if (this.modoEdicionAlergeno && nombreNuevo !== nombreViejo) {
      // Eliminar el anterior, luego crear el nuevo
      this.configuracionService.eliminarAlergeno(nombreViejo).subscribe({
        next: () => {
          this.configuracionService.modificarAlergeno(nombreNuevo).subscribe({
            next: () => {
              delete this.alergenos[nombreViejo];
              this.alergenos[nombreNuevo] = true;
              this.cerrarPopupAlergeno();
            },
            error: () => this.error = 'Error al guardar el nuevo nombre del alérgeno.'
          });
        },
        error: () => this.error = 'Error al eliminar el alérgeno anterior.'
      });
    } else {
      // Añadir o modificar sin cambio de nombre
      this.configuracionService.modificarAlergeno(nombreNuevo).subscribe({
        next: () => {
          this.alergenos[nombreNuevo] = true;
          this.cerrarPopupAlergeno();
        },
        error: () => this.error = 'Error al guardar el alérgeno.'
      });
    }
  }

  borrarAlergeno(nombre: string): void {
    if (!confirm(`¿Eliminar el alérgeno "${nombre}"?`)) return;

    this.configuracionService.eliminarAlergeno(nombre).subscribe({
      next: () => {
        delete this.alergenos[nombre],
          this.cerrarPopupAlergeno();
      },
      error: () => this.error = 'Error al eliminar el alérgeno.'
    });
  }

  // Manejo del historial de mesas
  historialMesasRaw: any = {};
  historialAgrupado: { fecha: string; mesas: any[] }[] = [];
  errorHistorial: string | null = null;

  mostrarPopupFiltro = false;
  tipoFiltro: 'dia' | 'rango' | 'semana' | 'mes' | 'anio' | null = null;

  // Inputs de filtro
  filtroDia: string = '';
  filtroRangoInicio: string = '';
  filtroRangoFin: string = '';
  filtroSemana: string = '';
  filtroMes: string = '';
  filtroAnio: string = '';

  private cargarHistorialMesas(): void {
    this.configuracionService.getHistorialMesas().subscribe({
      next: (data) => {
        this.historialMesasRaw = data.historial || {}; // 👈 ESTO FALTABA

        const fechas = Object.keys(this.historialMesasRaw).sort((a, b) => {
          const [d1, m1, y1] = a.split('-').map(Number);
          const [d2, m2, y2] = b.split('-').map(Number);
          return new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
        });

        this.historialAgrupado = fechas.map(fecha => {
          const mesasObj = this.historialMesasRaw[fecha];
          const mesas = Object.entries(mesasObj).map(([mesaHora, datos]) => ({
            mesaHora,
            ...(datos as object)
          }));
          return { fecha, mesas };
        });
      },
      error: () => {
        this.errorHistorial = 'No se pudo cargar el historial de mesas.';
      }
    });
  }

  abrirPopupFiltro(): void {
    this.mostrarPopupFiltro = true;
    this.tipoFiltro = null;
    this.filtroDia = '';
    this.filtroRangoInicio = '';
    this.filtroRangoFin = '';
    this.filtroSemana = '';
    this.filtroMes = '';
    this.filtroAnio = '';
  }

  cerrarPopupFiltro(): void {
    this.mostrarPopupFiltro = false;
  }

  seleccionarTipoFiltro(tipo: typeof this.tipoFiltro): void {
    this.tipoFiltro = tipo;
  }

  filtrarHistorial(): void {
    let fechasFiltradas: string[] = [];

    if (this.tipoFiltro === 'dia' && this.filtroDia) {
      const fecha = new Date(this.filtroDia);
      fechasFiltradas = [this.formatearFecha(fecha)];

    } else if (this.tipoFiltro === 'rango' && this.filtroRangoInicio && this.filtroRangoFin) {
      const inicio = new Date(this.filtroRangoInicio);
      const fin = new Date(this.filtroRangoFin);
      const current = new Date(inicio);
      while (current <= fin) {
        fechasFiltradas.push(this.formatearFecha(current));
        current.setDate(current.getDate() + 1);
      }

    } else if (this.tipoFiltro === 'semana' && this.filtroSemana) {
      const inicio = new Date(this.filtroSemana);
      for (let i = 0; i < 7; i++) {
        const d = new Date(inicio);
        d.setDate(d.getDate() + i);
        fechasFiltradas.push(this.formatearFecha(d));
      }

    } else if (this.tipoFiltro === 'mes' && this.filtroMes) {
      const [anio, mes] = this.filtroMes.split('-');
      fechasFiltradas = Object.keys(this.historialMesasRaw).filter(f => {
        const [d, m, a] = f.split('-');
        return m === mes && a === anio;
      });

    } else if (this.tipoFiltro === 'anio' && this.filtroAnio) {
      fechasFiltradas = Object.keys(this.historialMesasRaw).filter(f => {
        const [, , a] = f.split('-');
        return a === this.filtroAnio.toString();
      });
    }

    const agrupado = fechasFiltradas.reduce((acc: any[], fecha) => {
      const mesasObj = this.historialMesasRaw[fecha];
      if (!mesasObj) return acc;

      const mesas = Object.entries(mesasObj).map(([mesaHora, datos]) => ({
        mesaHora,
        ...(datos as object)
      }));

      acc.push({ fecha, mesas });
      return acc;
    }, []);

    this.historialAgrupado = agrupado;
    this.cerrarPopupFiltro();
  }

  formatearFecha(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }

  // Control de usuario
  usuario: User | null = null;
  tipoUsuario: string | null = null;

  noEsAdmin(): boolean {
    return this.tipoUsuario != 'admin';
  }
}