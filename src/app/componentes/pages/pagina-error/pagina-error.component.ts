import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-pagina-error',
  templateUrl: './pagina-error.component.html',
  styleUrls: ['./pagina-error.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PaginaErrorComponent {
[x: string]: any;
dashboard() {
  window.location.href = './src/app/componentes/dash/dash.component.html'; 
}
}







