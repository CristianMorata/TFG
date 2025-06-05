import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'oferta-empleo',
  imports: [CommonModule, FormsModule],
  templateUrl: './oferta-empleo.component.html',
  styleUrl: './oferta-empleo.component.css'
})
export class OfertaEmpleoComponent implements OnInit {
  email: string = '';
  password: string = '';
  role: string = 'usuario'; // valor por defecto
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
      this.router.navigate(['/']); // redirigir después del registro
    } catch (error: any) {
      this.error = error.message || 'Error al registrar.';
    }
  }

  async iniciarSesion() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']); // redirigir al inicio o a dashboard
    } catch (error: any) {
      this.error = error.message || 'Error al iniciar sesión.';
    }
  }

  logout() {
    this.authService.logout().catch(err => console.error('Error al cerrar sesión:', err));
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userRole = await this.authService.getUserRole(user.uid);
      } else {
        this.userRole = null;
      }
    });
  }

  puedeRegistrar(): boolean {
    return this.userRole === 'admin';
  }
}
