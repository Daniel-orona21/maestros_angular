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

  togglePanel(activate: boolean): void {
    this.isRightPanelActive = activate;
    if (!activate) {
      this.captchaResponse = '';
      grecaptcha.reset();
    }
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