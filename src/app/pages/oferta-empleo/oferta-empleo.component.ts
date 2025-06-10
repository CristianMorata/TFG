import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'oferta-empleo',
  imports: [CommonModule, FormsModule],
  templateUrl: './oferta-empleo.component.html',
  styleUrl: './oferta-empleo.component.css'
})
export class OfertaEmpleoComponent implements OnInit {
  email = '';
  password = '';
  role = 'usuario';
  error: string | null = null;

  auth = inject(Auth);
  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  async registrar() {
    try {
      await this.authService.register({
        email: this.email,
        password: this.password,
        role: this.role
      });
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('❌ Registro error:', err);
      this.error = err.message ?? 'Error al registrar.';
    }
  }

  async iniciarSesion() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message ?? 'Error al iniciar sesión.';
    }
  }

  logout() {
    this.authService.logout().catch(err => console.error('❌ Logout error:', err));
  }

  ngOnInit(): void {
    // Opción A: con onAuthStateChanged
    onAuthStateChanged(this.auth, async user => {
      if (user) {
        this.userRole = await this.authService.getUserRole(user.uid);
      } else {
        this.userRole = null;
      }
    });

    // ———— o ————
    // Opción B: suscripción al observable user$
    /*
    this.authService.user$.subscribe(async user => {
      this.userRole = user ? await this.authService.getUserRole(user.uid) : null;
    });
    */
  }

  puedeRegistrar(): boolean {
    return this.userRole === 'admin';
  }
}