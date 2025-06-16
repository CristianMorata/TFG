import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, BookText, Utensils, LogIn, CookingPot, Wine, Settings } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = false;
  readonly BookText = BookText;
  readonly utensils = Utensils;
  readonly login = LogIn;
  readonly cocina = CookingPot;
  readonly cafe = Wine;
  readonly settings = Settings;
  // readonly FileIcon = FileIcon;

  usuario: User | null = null;
  tipoUsuario: string | null = null;

  showMobileMenu = false;

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.authService.getUserRole(user.uid).then(tipo => {
          this.tipoUsuario = tipo;
        });
      }
    });
  }

  esEmpleadoOAdmin(): boolean {
    return this.tipoUsuario === 'admin' || this.tipoUsuario === 'empleado';
  }

  esAdmin(): boolean {
    return this.tipoUsuario === 'admin';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  openMobileMenu() {
    this.showMobileMenu = true;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}
