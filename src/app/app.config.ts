import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha'; // 👈 Importa reCAPTCHA

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom(RecaptchaModule, RecaptchaFormsModule) // 👈 Agrega los módulos de reCAPTCHA
  ]
};