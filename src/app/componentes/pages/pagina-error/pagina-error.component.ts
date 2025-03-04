import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-error',
  templateUrl: './pagina-error.component.html',
  styleUrls: ['./pagina-error.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PaginaErrorComponent {
  constructor(private router: Router) {}

  dashboard() {
    this.router.navigate(['/inicio']);
  }
}