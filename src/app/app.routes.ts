import { Routes } from '@angular/router';
// import { ListadoProductosComponent } from './components/listado-productos/listado-productos.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { CartaComponent } from './pages/carta/carta.component';
import { MesaComponent } from './pages/mesa/mesa.component';

export const routes: Routes = [
    {
        path: '', 
        component: LayoutComponent,
        children: [
            { path: 'carta', component: CartaComponent },
            { path: 'mesa', component: MesaComponent },
            { path: '', redirectTo: 'carta', pathMatch: 'full' }
        ]
    },
];
