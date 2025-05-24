import { Component, inject } from '@angular/core';
import { AdministracionService } from '../../services/administracion.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'carta',
  imports: [CommonModule],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css'
})
export class CartaComponent {

  service = inject(AdministracionService);
  productos$: Observable<any>;

  constructor() {
    this.productos$ = this.service.listarProductosVenta$();

  }
}
