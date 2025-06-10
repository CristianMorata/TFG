import { Component, OnInit } from '@angular/core';
import { ConfiguracionService, ConfiguracionFlags } from '../../services/configuracion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private configuracionService: ConfiguracionService) { }

  ngOnInit(): void {
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
}
