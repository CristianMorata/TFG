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

interface Aviso {
  mesaId: string;
  tipo: 'camarero' | 'cuenta';
  metodo?: string;
  mensaje: string;
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

  categoriasConDestino: Record<string, { destino: string }> = {};

  intervaloSolicitudes: any = null;

  constructor(private servicios: ServiciosService, private authService: AuthService, private router: Router) {
    // Obtenemos el usuario y su tipo
    this.authService.user$.subscribe(user => {
      if (!user) return; // Esperamos a que se obtenga el usuario

      this.usuario = user;

      this.authService.getUserRole(user.uid).then(tipo => {
        this.tipoUsuario = tipo;
        console.log('Tipo de usuario:', this.tipoUsuario);

        if (tipo !== 'admin' && tipo !== 'empleado') {
          this.router.navigate(['/carta']);
        } else {
          // Solo si es válido continuamos
          this.cargarCategorias(() => {
            this.recargar();

            // Solo si funciona el hacerlo cada 5 segundos

            this.verificarSolicitudes();
          });
        }
      }).catch(err => {
        console.error("Error al obtener el rol del usuario:", err);
        this.router.navigate(['/carta']);
      });
    });
  }

  ngOnInit(): void {
    this.cargarCategorias(() => {
      this.recargar();
    });

    this.cargarCategorias(() => {
      this.recargar();
      this.iniciarBusquedaNotificaciones(); // Inicia la búsqueda cada 5s
    });
  }

  ngOnDestroy(): void {
    if (this.intervaloSolicitudes) {
      clearInterval(this.intervaloSolicitudes);
    }
  }

  iniciarBusquedaNotificaciones(): void {
    if (this.intervaloSolicitudes) {
      clearInterval(this.intervaloSolicitudes); // evita duplicar el timer
    }

    this.intervaloSolicitudes = setInterval(() => {
      this.verificarSolicitudes(); // ya tienes esta función implementada
    }, 5000); // cada 5 segundos
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
        this.mesasConBebidas = Object.entries(this.rawMesasData)
          .map(([mesaId, mesa]) => {
            const bebidas: Bebida[] = [];

            mesa.contenido.forEach((item, idx) => {
              const categoria = item.categoria ?? item.tipoProducto ?? '';
              const destino = this.categoriasConDestino[categoria]?.destino;

              if (destino === 'barra' && item.estado === 'En preparación') {
                bebidas.push({ ...item, originalIndex: idx });
              }
            });

            return { mesaId, bebidas };
          })
          // Sólo mesas con bebidas pendientes
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

    // Clonamos y actualizamos sólo el item marcado
    const contenidoActualizado = mesa.contenido.map((item, idx) =>
      idx === originalIndex
        ? { ...item, estado: 'Preparado' }
        : item
    );

    // Hacemos POST a guardar/modificar mesa
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

  marcarTodosComoServido(mesaId: string): void {
    const mesa = this.rawMesasData[mesaId];
    if (!mesa) return;

    const contenidoActualizado = mesa.contenido.map((item, idx) => {
      const categoria = item.categoria ?? item.tipoProducto ?? '';
      const destino = this.categoriasConDestino[categoria]?.destino;

      // Solo marcamos los de barra que estén en preparación
      if (destino === 'barra' && item.estado === 'En preparación') {
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

  // Seccion para notificaciones y toasts
  avisosMostrados: Set<string> = new Set();
  avisosActivos: {
    mesaId: string;
    tipo: 'camarero' | 'cuenta';
    metodo?: string;
    mensaje: string;
  }[] = [];

  verificarSolicitudes() {
    this.servicios.listarTodos().subscribe({
      next: raw => {
        const datos: any = raw.datos || {};

        for (const mesaId in datos) {
          const mesa = datos[mesaId];

          // Verificar llamada a camarero
          if (mesa.llamarCamarero === true) {
            const clave = `camarero-${mesaId}`;
            const yaExiste = this.avisosActivos.some(a => a.mesaId === mesaId && a.tipo === 'camarero');

            if (!this.avisosMostrados.has(clave) && !yaExiste) {
              this.mostrarToast(`Mesa ${mesaId} solicita un camarero`);
              this.avisosMostrados.add(clave);
              this.avisosActivos.push({
                mesaId,
                tipo: 'camarero',
                mensaje: `Mesa ${mesaId} solicita un camarero`
              });
            }
          }

          // Verificar pedir cuenta
          const pedir = mesa.pedirCuenta;
          if (pedir && (pedir.efectivo || pedir.tarjeta || pedir.ambos)) {
            const metodo =
              pedir.efectivo ? 'efectivo' :
                pedir.tarjeta ? 'tarjeta' :
                  pedir.ambos ? 'ambos' : 'desconocido';

            const clave = `cuenta-${mesaId}-${metodo}`;
            const yaExiste = this.avisosActivos.some(a => a.mesaId === mesaId && a.tipo === 'cuenta' && a.metodo === metodo);

            if (!this.avisosMostrados.has(clave) && !yaExiste) {
              this.mostrarToast(`Mesa ${mesaId} solicita la cuenta y pagar con ${metodo}`);
              this.avisosMostrados.add(clave);
              this.avisosActivos.push({
                mesaId,
                tipo: 'cuenta',
                metodo,
                mensaje: `Mesa ${mesaId} solicita la cuenta y pagar con ${metodo}`
              });
            }
          }
        }
      },
      error: err => {
        console.error('Error al verificar solicitudes:', err);
      }
    });
  }

  mostrarToast(mensaje: string) {
    const toastId = `toast-${Date.now()}`;

    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast-element fixed right-5 bottom-[var(--offset)] bg-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 transition-all';
    toastEl.textContent = mensaje;

    // Posicionar los toast en columnas
    const existingToasts = document.querySelectorAll('.toast-element');
    const offset = 20 + (existingToasts.length * 80);
    toastEl.style.setProperty('--offset', `${offset}px`);

    document.body.appendChild(toastEl);

    // Eliminar después de 5 segundos
    setTimeout(() => {
      toastEl.remove();
    }, 5000);
  }

  confirmarSolicitud(mesaId: string, tipo: 'camarero' | 'cuenta') {
    let llamar = null;
    let cuenta = null;

    if (tipo === 'camarero') llamar = false;
    if (tipo === 'cuenta') cuenta = { efectivo: false, tarjeta: false, ambos: false };

    this.servicios.actualizarLlamadaOCuenta(mesaId, llamar, cuenta).subscribe({
      next: () => {
        // Quitamos el aviso visualmente
        this.avisosActivos = this.avisosActivos.filter(a => !(a.mesaId === mesaId && a.tipo === tipo));
        this.avisosMostrados.forEach(clave => {
          if (clave.includes(mesaId)) this.avisosMostrados.delete(clave);
        });
      },
      error: err => {
        console.error("Error al confirmar solicitud:", err);
      }
    });
  }

  confirmarSolicitudesPorMesa(mesaId: string) {
    const solicitudes = this.avisosActivos.filter(a => a.mesaId === mesaId);

    if (solicitudes.length === 0) return;

    let llamar: boolean | null = null;
    let cuenta: any = null;

    for (const aviso of solicitudes) {
      if (aviso.tipo === 'camarero') llamar = false;
      if (aviso.tipo === 'cuenta') cuenta = { efectivo: false, tarjeta: false, ambos: false };
    }

    this.servicios.actualizarLlamadaOCuenta(mesaId, llamar, cuenta).subscribe({
      next: () => {
        // Limpieza visual
        this.avisosActivos = this.avisosActivos.filter(a => a.mesaId !== mesaId);
        this.avisosMostrados.forEach(clave => {
          if (clave.includes(mesaId)) this.avisosMostrados.delete(clave);
        });
      },
      error: err => {
        console.error('Error al confirmar solicitudes de la mesa', err);
      }
    });
  }

  confirmarTodas() {
    const solicitudesPorMesa = new Map<string, { mesaId: string, llamarCamarero?: boolean, pedirCuenta?: any }>();

    for (const aviso of this.avisosActivos) {
      if (!solicitudesPorMesa.has(aviso.mesaId)) {
        solicitudesPorMesa.set(aviso.mesaId, { mesaId: aviso.mesaId });
      }

      const obj = solicitudesPorMesa.get(aviso.mesaId)!;
      if (aviso.tipo === 'camarero') obj.llamarCamarero = false;
      if (aviso.tipo === 'cuenta') obj.pedirCuenta = { efectivo: false, tarjeta: false, ambos: false };
    }

    solicitudesPorMesa.forEach(payload => {
      this.servicios.actualizarLlamadaOCuenta(payload.mesaId, payload.llamarCamarero ?? null, payload.pedirCuenta ?? null).subscribe({
        next: () => {
          this.avisosActivos = this.avisosActivos.filter(a => a.mesaId !== payload.mesaId);
          this.avisosMostrados.forEach(clave => {
            if (clave.includes(payload.mesaId)) this.avisosMostrados.delete(clave);
          });
        },
        error: err => {
          console.error('Error al confirmar todo', err);
        }
      });
    });
  }

  avisosAgrupadosPorMesa(): { mesaId: string, avisos: Aviso[] }[] {
    const agrupado: Record<string, Aviso[]> = {};

    for (const aviso of this.avisosActivos) {
      if (!agrupado[aviso.mesaId]) {
        agrupado[aviso.mesaId] = [];
      }
      agrupado[aviso.mesaId].push(aviso);
    }

    return Object.entries(agrupado).map(([mesaId, avisos]) => ({
      mesaId,
      avisos
    }));
  }
}