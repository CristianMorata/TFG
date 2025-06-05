import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'mesa',
  imports: [CommonModule],
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent {
  mesas: any[] = [];
  extraCount = 1;
  mesaCount = 10;
  mostrarPopupTipoMesa = false;

  usuario: User | null = null;
  tipoUsuario: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    // Inicializar 10 mesas base
    this.mesas = Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      nombre: `Mesa ${i + 1}`,
      estado: ['Libre', 'Esperando', 'Completada'][Math.floor(Math.random() * 3)],
      extra: false
    }));

    // Obtenemos el usuario y su tipo
    this.authService.user$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
        });
      }
    });
  }

  abrirSelectorTipoMesa() {
    if (this.tipoUsuario === 'admin') {
      this.mostrarPopupTipoMesa = true;
    } else {
      this.anadirMesaExtra(); // automáticamente si no es admin
    }
  }

  cerrarPopupTipoMesa() {
    this.mostrarPopupTipoMesa = false;
  }

  anadirMesaNormal() {
    this.mesaCount++;
    this.mesas.push({
      id: this.mesas.length + 1,
      nombre: `Mesa ${this.mesaCount}`,
      estado: 'Libre',
      extra: false
    });
    this.cerrarPopupTipoMesa();
  }

  anadirMesaExtra() {
    this.mesas.push({
      id: this.mesas.length + 1,
      nombre: `Mesa Extra (${this.extraCount})`,
      estado: 'Libre',
      extra: true
    });
    this.extraCount++;
    this.cerrarPopupTipoMesa();
  }

  irAMesa(mesa: any) {
    this.router.navigate(['/mesa', mesa.id]);
  }
}
