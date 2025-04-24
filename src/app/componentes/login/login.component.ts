import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

declare const grecaptcha: any;
declare global {
  interface Window {
    onCaptchaSuccess: (response: string) => void;
  }
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isRightPanelActive: boolean = false;
  @ViewChild('loginMapContainer', { static: false }) loginMapContainer!: ElementRef;

  nombre: string = '';
  correo: string = '';
  contrasena: string = '';
  username: string = '';
  password: string = '';
  captchaResponse: string = '';

  // Propiedades para el modal de recuperación
  modalRecuperacionVisible: boolean = false;
  correoRecuperacion: string = '';
  errorRecuperacion: string = '';

  // Propiedades para validación
  correoError: string = '';
  contrasenaError: string = '';
  nombreError: string = '';

  // Propiedades para mostrar/ocultar contraseña
  mostrarContrasenaRegistro: boolean = false;
  mostrarContrasenaLogin: boolean = false;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    // Agregar callback global para el captcha
    window['onCaptchaSuccess'] = (response: string) => {
      this.ngZone.run(() => {
        this.captchaResponse = response;
      });
    };
  }

  // Método para validar correo
  validarCorreo(): void {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!this.correo) {
      this.correoError = 'El correo es requerido';
    } else if (!emailRegex.test(this.correo)) {
      this.correoError = 'Ingresa un correo válido';
    } else {
      this.correoError = '';
    }
  }

  // Método para validar contraseña
  validarContrasena(): void {
    if (!this.contrasena) {
      this.contrasenaError = 'La contraseña es requerida';
    } else if (this.contrasena.length < 8) {
      this.contrasenaError = 'Mínimo 8 caracteres';
    } else if (!/(?=.*[A-Z])/.test(this.contrasena)) {
      this.contrasenaError = 'Debe incluir al menos una mayúscula';
    } else if (!/(?=.*[a-z])/.test(this.contrasena)) {
      this.contrasenaError = 'Debe incluir al menos una minúscula';
    } else if (!/(?=.*\d)/.test(this.contrasena)) {
      this.contrasenaError = 'Debe incluir al menos un número';
    } else if (!/(?=.*[!@#$%^&*])/.test(this.contrasena)) {
      this.contrasenaError = 'Debe incluir al menos un carácter especial (!@#$%^&*)';
    } else {
      this.contrasenaError = '';
    }
  }

  // Método para validar nombre
  validarNombre(): void {
    if (!this.nombre) {
      this.nombreError = 'El nombre es requerido';
    } else if (this.nombre.length < 3) {
      this.nombreError = 'El nombre debe tener al menos 3 caracteres';
    } else {
      this.nombreError = '';
    }
  }

  togglePanel(activate: boolean): void {
    this.isRightPanelActive = activate;
    if (!activate) {
      this.captchaResponse = '';
      grecaptcha.reset();
    }
  }

  toggleContrasenaRegistro(): void {
    this.mostrarContrasenaRegistro = !this.mostrarContrasenaRegistro;
  }

  toggleContrasenaLogin(): void {
    this.mostrarContrasenaLogin = !this.mostrarContrasenaLogin;
  }

  registrar() {
    if (!this.captchaResponse) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor, completa el captcha',
        icon: 'warning',
        background: '#2d2d2d',
        color: '#ffffff',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    this.authService.register(
      this.nombre,
      this.correo,
      this.contrasena,
      this.captchaResponse
    ).subscribe({
      next: res => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Registro exitoso',
          icon: 'success',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2'
        });
        this.togglePanel(false);
        this.captchaResponse = '';
        grecaptcha.reset();
      },
      error: err => {
        Swal.fire({
          title: 'Error',
          text: 'Error en el registro: ' + err.error.error,
          icon: 'error',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2'
        });
        this.captchaResponse = '';
        grecaptcha.reset();
      }
    });
  }

  entrar() {
    if (!this.correo || !this.contrasena) {
      Swal.fire({
        title: 'Atención',
        text: 'Por favor, ingresa tu correo y contraseña',
        icon: 'warning',
        background: '#2d2d2d',
        color: '#ffffff',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    console.log('Intentando iniciar sesión con:', this.correo);
    
    this.authService.login(this.correo, this.contrasena).subscribe({
      next: res => {
        console.log('Inicio de sesión exitoso para:', this.correo);
        localStorage.setItem('token', res.token);
        this.router.navigate(['/inicio']);
      },
      error: err => {
        console.error('Error al intentar iniciar sesión:', err);
        Swal.fire({
          title: 'Error',
          text: 'Error al iniciar sesión: ' + err.error.error,
          icon: 'error',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2'
        });
      }
    });
  }

  // Métodos para el modal de recuperación
  mostrarModalRecuperacion(): void {
    this.modalRecuperacionVisible = true;
    this.correoRecuperacion = '';
    this.errorRecuperacion = '';
  }

  cerrarModalRecuperacion(): void {
    this.modalRecuperacionVisible = false;
    this.correoRecuperacion = '';
    this.errorRecuperacion = '';
  }

  enviarRecuperacion(): void {
    if (!this.correoRecuperacion) {
      this.errorRecuperacion = 'Por favor, ingresa tu correo electrónico';
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(this.correoRecuperacion)) {
      this.errorRecuperacion = 'Por favor, ingresa un correo electrónico válido';
      return;
    }

    Swal.fire({
      title: 'Enviando...',
      text: 'Procesando tu solicitud',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#2d2d2d',
      color: '#ffffff'
    });

    this.authService.requestPasswordReset(this.correoRecuperacion).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Enviado!',
          text: 'Se han enviado las instrucciones de recuperación a tu correo electrónico',
          icon: 'success',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2'
        });
        this.cerrarModalRecuperacion();
      },
      error: (error) => {
        if (error.status === 404) {
          this.errorRecuperacion = 'No existe una cuenta con este correo electrónico';
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Error al procesar la solicitud. Por favor, intenta de nuevo más tarde.',
            icon: 'error',
            background: '#2d2d2d',
            color: '#ffffff',
            confirmButtonColor: '#1976d2'
          });
        }
      }
    });
  }
}