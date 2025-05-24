import { Component } from '@angular/core';
import { HeaderComponentComponent } from "../../components/header-component/header-component.component";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { FooterComponentComponent } from "../../components/footer-component/footer-component.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout',
  imports: [RouterOutlet, HeaderComponentComponent, SidebarComponent, FooterComponentComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

}
