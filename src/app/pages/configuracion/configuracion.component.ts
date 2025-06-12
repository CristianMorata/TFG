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

  constructor(private configuracionService: ConfiguracionService, private authService: AuthService, private router: Router) {
    // Obtenemos el usuario y su tipo
    this.authService.user$.subscribe(user => {
      this.usuario = user;

      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
          console.log('Tipo de usuario:', this.tipoUsuario);

          // Verificar si el usuario es permitido en la página
          if (this.tipoUsuario !== 'admin') {
            this.router.navigate(['/carta']);
          }
        });
      } else {
        this.router.navigate(['/carta']);
      }
    });
  }

  ngOnInit(): void {
    // Obtener el usuario y su tipo
    this.authService.user$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
        });
      }
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

  // Control de usuario
  usuario: User | null = null;
  tipoUsuario: string | null = null;

  noEsAdmin(): boolean {
    return this.tipoUsuario != 'admin';
  }
}
