import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, BookText, Utensils, LogIn, CookingPot, Wine } from 'lucide-angular';

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
  // readonly FileIcon = FileIcon;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
