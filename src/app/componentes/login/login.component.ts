import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 


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

  constructor(private router: Router, private authService: AuthService) {}

  togglePanel(activate: boolean): void {
    this.isRightPanelActive = activate;
  }

  registrar() {
    this.authService.register(this.nombre, this.correo, this.contrasena).subscribe({
      next: res => {
        alert('Registro exitoso');
        this.togglePanel(false);
      },
      error: err => alert('Error en el registro: ' + err.error.error)
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
        this.router.navigate(['/dashboard']);
      },
      error: err => alert('Error al iniciar sesión: ' + err.error.error)
    });
  }
}