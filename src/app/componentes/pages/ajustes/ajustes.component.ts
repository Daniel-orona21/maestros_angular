import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { LogService } from '../../../services/log.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
  isAdmin: boolean = false;
  logTypes: any[] = [];
  selectedLogType: string = 'combined';

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private logService: LogService
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
    this.loadLogTypes();
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

  loadLogTypes() {
    if (!localStorage.getItem('token')) {
      console.warn('No hay token de autenticación disponible');
      return;
    }
    
    this.logService.getLogTypes().subscribe({
      next: (types) => {
        this.logTypes = types;
      },
      error: (error) => {
        console.error('Error al cargar tipos de logs:', error);
        
        // Si hay un error de autenticación, no mostrar mensaje al usuario
        if (error.status === 401 || error.status === 403) {
          console.warn('Error de autenticación al cargar tipos de logs');
          return;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los tipos de logs disponibles',
          confirmButtonColor: '#1a3d5c'
        });
      }
    });
  }

  downloadLog() {
    if (!localStorage.getItem('token')) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión no válida',
        text: 'Debes iniciar sesión para descargar logs del sistema',
        confirmButtonColor: '#1a3d5c'
      });
      return;
    }
    
    Swal.fire({
      title: 'Descargando...',
      text: 'Preparando archivo de logs',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.logService.downloadLog(this.selectedLogType).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `${this.selectedLogType}.log`);
        Swal.fire({
          icon: 'success',
          title: '¡Descarga completada!',
          text: 'El archivo de logs se ha descargado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al descargar log:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo descargar el archivo de logs. Inténtalo de nuevo más tarde.'
        });
      }
    });
  }

  downloadAllLogs() {
    if (!localStorage.getItem('token')) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión no válida',
        text: 'Debes iniciar sesión para descargar logs del sistema',
        confirmButtonColor: '#1a3d5c'
      });
      return;
    }
    
    Swal.fire({
      title: 'Descargando...',
      text: 'Preparando archivo completo de logs',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.logService.downloadAllLogs().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'all_logs.log');
        Swal.fire({
          icon: 'success',
          title: '¡Descarga completada!',
          text: 'El archivo completo de logs se ha descargado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al descargar todos los logs:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo descargar el archivo completo de logs. Inténtalo de nuevo más tarde.'
        });
      }
    });
  }

  downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
