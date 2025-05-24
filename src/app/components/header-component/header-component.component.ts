// import { Component } from '@angular/core';

// @Component({
//   selector: 'header-component',
//   imports: [],
//   templateUrl: './header-component.component.html',
//   styleUrl: './header-component.component.css'
// })
// export class HeaderComponentComponent {
//   toggleDarkMode() {
//   const html = document.documentElement;
//   html.classList.toggle('dark');
//   localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
// }

// ngOnInit() {
//   const savedTheme = localStorage.getItem('theme');
//   if (savedTheme === 'dark') {
//     document.documentElement.classList.add('dark');
//   }
// }
// }
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'header-component',
  templateUrl: './header-component.component.html',
  styleUrls: ['./header-component.component.css']
})
export class HeaderComponentComponent implements OnInit {
  isDarkMode = false;

  toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    this.isDarkMode = html.classList.contains('dark');
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }
}
