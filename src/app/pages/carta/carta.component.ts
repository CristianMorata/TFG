import { Component, inject } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'carta',
  imports: [CommonModule],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css'
})
export class CartaComponent {

  service = inject(ServiciosService);
  productos$: Observable<any>;

  constructor() {
    this.productos$ = this.service.listarProductosVenta$();

  }
}
