import { Routes } from '@angular/router';
// import { ListadoProductosComponent } from './components/listado-productos/listado-productos.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { CartaComponent } from './pages/carta/carta.component';
import { MesasComponent } from './pages/mesas/mesas.component';
import { MesaComponent } from './pages/mesa/mesa.component';
import { OfertaEmpleoComponent } from './pages/oferta-empleo/oferta-empleo.component';

export const routes: Routes = [
    {
        path: '', 
        component: LayoutComponent,
        children: [
            { path: 'carta', component: CartaComponent },
            { path: 'mesas', component: MesasComponent },
            { path: 'oferta-empleo', component: OfertaEmpleoComponent },
            { path: '', redirectTo: 'carta', pathMatch: 'full' },
            { path: 'mesa/:id', component: MesaComponent },
        ]
    },
];
