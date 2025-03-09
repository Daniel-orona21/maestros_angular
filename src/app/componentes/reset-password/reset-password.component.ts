import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  error: string = '';
  exito: boolean = false;
  mostrarContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;
  contrasenaError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      Swal.fire({
        title: 'Error',
        text: 'No se proporcionó un token válido para restablecer la contraseña',
        icon: 'error',
        background: '#2d2d2d',
        color: '#ffffff',
        confirmButtonColor: '#1976d2'
      }).then(() => {
        this.router.navigate(['/login']);
      });
    }
  }

  validarContrasena(): boolean {
    if (!this.nuevaContrasena) {
      this.contrasenaError = 'La contraseña es requerida';
      return false;
    }
    if (this.nuevaContrasena.length < 8) {
      this.contrasenaError = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }
    if (!/(?=.*[A-Z])/.test(this.nuevaContrasena)) {
      this.contrasenaError = 'Debe incluir al menos una mayúscula';
      return false;
    }
    if (!/(?=.*[a-z])/.test(this.nuevaContrasena)) {
      this.contrasenaError = 'Debe incluir al menos una minúscula';
      return false;
    }
    if (!/(?=.*\d)/.test(this.nuevaContrasena)) {
      this.contrasenaError = 'Debe incluir al menos un número';
      return false;
    }
    if (!/(?=.*[!@#$%^&*])/.test(this.nuevaContrasena)) {
      this.contrasenaError = 'Debe incluir al menos un carácter especial (!@#$%^&*)';
      return false;
    }
    this.contrasenaError = '';
    return true;
  }

  resetearContrasena() {
    this.error = '';
    
    if (!this.validarContrasena()) {
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: 'error',
        background: '#2d2d2d',
        color: '#ffffff',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    Swal.fire({
      title: 'Actualizando...',
      text: 'Procesando tu solicitud',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#2d2d2d',
      color: '#ffffff'
    });

    this.authService.resetPassword(this.token, this.nuevaContrasena).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Tu contraseña ha sido actualizada correctamente',
          icon: 'success',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.error.error || 'Error al restablecer la contraseña',
          icon: 'error',
          background: '#2d2d2d',
          color: '#ffffff',
          confirmButtonColor: '#1976d2'
        });
      }
    });
  }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleMostrarConfirmarContrasena() {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }
}
