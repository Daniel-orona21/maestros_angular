import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Declaración de gtag para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'maestros_angular';
  
  constructor() {}
  
  ngOnInit() {
    // Track app initialization usando gtag directamente
    if (window.gtag) {
      window.gtag('event', 'app_initialized', {
        'event_category': 'app_lifecycle'
      });
    }
  }
}
