import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

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

  // Nuevas propiedades para validación
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
      alert('Por favor, completa el captcha');
      return;
    }

    this.authService.register(
      this.nombre, 
      this.correo, 
      this.contrasena,
      this.captchaResponse
    ).subscribe({
      next: res => {
        alert('Registro exitoso');
        this.togglePanel(false);
        this.captchaResponse = '';
        grecaptcha.reset();
      },
      error: err => {
        alert('Error en el registro: ' + err.error.error);
        this.captchaResponse = '';
        grecaptcha.reset();
      }
    });
  }

  entrar() {
    console.log('Valores antes de enviar:', { correo: this.correo, contrasena: this.contrasena }); 
  
    if (!this.correo || !this.contrasena) {
      alert('⚠️ Por favor, ingresa tu correo y contraseña.');
      console.error('❌ Error: No se ingresaron todos los datos');
      return;
    }
  
    this.authService.login(this.correo, this.contrasena).subscribe({
      next: res => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/inicio']);
      },
      error: err => alert('Error al iniciar sesión: ' + err.error.error)
    });
  }
}