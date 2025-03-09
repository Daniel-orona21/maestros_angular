import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html',
  styleUrl: './ajustes.component.css'
})
export class AjustesComponent implements OnInit, OnDestroy {
  currentTheme: 'light' | 'dark' | 'system' = 'light';
  selectedLanguage: string = 'es';
  selectedTimezone: string = 'America/Mexico_City';
  private themeSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        if (isDark) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
    );
  }

  ngOnInit() {
    this.loadSavedPreferences();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  loadSavedPreferences() {
    // Cargar el tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme as 'light' | 'dark' | 'system');

    // Cargar otras preferencias
    this.selectedLanguage = localStorage.getItem('language') || 'es';
    this.selectedTimezone = localStorage.getItem('timezone') || 'America/Mexico_City';
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkTheme(prefersDark);
      
      // Agregar listener para cambios en el tema del sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.currentTheme === 'system') {
          this.themeService.setDarkTheme(e.matches);
        }
      });
    } else {
      this.themeService.setDarkTheme(theme === 'dark');
    }
  }

  editarPerfil() {
    // Implementar lógica para editar perfil
    console.log('Editar perfil');
  }

  cambiarPassword() {
    // Implementar lógica para cambiar contraseña
    console.log('Cambiar contraseña');
  }

  configurarNotificaciones() {
    // Implementar lógica para configurar notificaciones
    console.log('Configurar notificaciones');
  }

  cerrarSesion() {
    // Limpiar datos locales
    localStorage.clear();
    
    // Llamar al servicio de autenticación para cerrar sesión
    this.authService.logout().subscribe({
      next: () => {
        // Redirigir al login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Aún así, redirigimos al login
        this.router.navigate(['/login']);
      }
    });
  }
}
