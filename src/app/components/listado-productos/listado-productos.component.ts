import { Component, inject } from '@angular/core';
import { AdministracionService} from '../../services/administracion.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'listado-productos',
  imports: [CommonModule],
  templateUrl: './listado-productos.component.html',
  styleUrl: './listado-productos.component.css'
})
export class ListadoProductosComponent{
  service = inject(AdministracionService);
  productos$: Observable<any>;

  constructor() {
    this.productos$ = this.service.listarProductosVenta$();

  }
}