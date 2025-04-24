import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HotjarService } from './services/hotjar.service';
import { filter } from 'rxjs/operators';

// Declaración de gtag para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'maestros_angular';
  
  constructor(
    private hotjarService: HotjarService,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Track app initialization usando gtag directamente
    if (window.gtag) {
      window.gtag('event', 'app_initialized', {
        'event_category': 'app_lifecycle'
      });
    }

    // Configurar seguimiento de navegación para Hotjar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Notificar a Hotjar sobre el cambio de página
      this.hotjarService.trackPageView(event.urlAfterRedirects);
      
      // También podemos enviar evento de página vista a gtag si es necesario
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: event.urlAfterRedirects
        });
      }
    });
  }
}
