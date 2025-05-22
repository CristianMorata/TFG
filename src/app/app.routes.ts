import { Routes } from '@angular/router';
import { ListadoProductosComponent } from './components/listado-productos/listado-productos.component';

export const routes: Routes = [
    {path: '', redirectTo: 'listado-productos', pathMatch: 'full'},
    {path: 'listado-productos', component: ListadoProductosComponent},
];
