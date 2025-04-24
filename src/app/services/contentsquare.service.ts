import { Injectable } from '@angular/core';
import { injectContentsquareScript } from '@contentsquare/tag-sdk';

@Injectable({
  providedIn: 'root'
})
export class ContentsquareService {

  constructor() {
    this.initializeContentsquare();
  }

  private initializeContentsquare() {
    injectContentsquareScript({
      siteId: "6381550",
      async: true, // Optional: Set to false to wait for script execution until after document parsing
      defer: false // Optional: Set to true to defer script execution after document parsing
    });
  }

  /**
   * Método para crear un evento personalizado en Contentsquare
   * @param eventName Nombre del evento
   * @param data Datos adicionales del evento
   */
  trackEvent(eventName: string, data?: Record<string, any>) {
    // Asegurarse de que el objeto global de Contentsquare esté disponible
    if (typeof window !== 'undefined' && (window as any).CS_CONF) {
      (window as any).CS_CONF.integrations = {
        ...(window as any).CS_CONF.integrations,
        custom: [
          {
            name: eventName,
            data: data || {}
          }
        ]
      };
    }
  }
} 