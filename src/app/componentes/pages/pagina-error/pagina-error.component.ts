import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pagina-error',
  templateUrl: './pagina-error.component.html',
  styleUrls: ['./pagina-error.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PaginaErrorComponent implements OnInit {
  errorMessage: string = 'Ha ocurrido un error';
  errorCode: string = 'ERROR_GENERAL';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorMessage = params['message'];
      }
      if (params['code']) {
        this.errorCode = params['code'];
      }
    });
  }

  dashboard() {
    this.router.navigate(['/inicio']);
  }
}