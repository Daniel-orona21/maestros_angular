import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajustes.component.html',
  styleUrl: './ajustes.component.css'
})
export class AjustesComponent implements OnInit {
  currentTheme: 'light' | 'dark' | 'system' = 'light';
  selectedLanguage: string = 'es';
  selectedTimezone: string = 'America/Mexico_City';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Cargar preferencias guardadas
    this.loadSavedPreferences();
  }

  loadSavedPreferences() {
    // Aquí cargaríamos las preferencias guardadas del usuario
    // Por ahora usamos valores por defecto
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.currentTheme = savedTheme as 'light' | 'dark' | 'system';
    }
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    // Aplicar el tema
    if (theme === 'system') {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
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
