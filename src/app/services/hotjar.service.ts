import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HotjarService {
  private hjid = 6381550;

  constructor() {
    this.initializeHotjar();
  }

  private initializeHotjar(): void {
    // Implementamos exactamente el mismo script que proporciona Hotjar
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (function(c: any, s: Document, q: string, u: string, a: number, r: HTMLHeadElement, e: HTMLScriptElement) {
        (c.hj = c.hj || function() {
          (c.hj.q = c.hj.q || []).push(arguments);
        });
        c._hjSettings = { hjid: a };
        r = s.getElementsByTagName('head')[0];
        e = s.createElement('script');
        e.async = true;
        e.src = q + c._hjSettings.hjid + u;
        r.appendChild(e);
      })(win, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', this.hjid, document.getElementsByTagName('head')[0], document.createElement('script'));
    }
  }

  /**
   * Track a custom event in Hotjar
   * @param eventName The name of the event to track
   */
  trackEvent(eventName: string): void {
    if (typeof window !== 'undefined' && (window as any).hj) {
      (window as any).hj('event', eventName);
    }
  }
  
  /**
   * Registra un cambio de página en Hotjar (importante para SPAs)
   * @param url La URL de la nueva página
   */
  trackPageView(url?: string): void {
    if (typeof window !== 'undefined' && (window as any).hj) {
      // Si no se proporciona una URL, usamos la URL actual
      const pageUrl = url || window.location.href;
      (window as any).hj('stateChange', pageUrl);
    }
  }
} 