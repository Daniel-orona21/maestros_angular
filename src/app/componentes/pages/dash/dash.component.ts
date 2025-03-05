import { Component, OnInit } from '@angular/core';
import { AuthService, Usuario, UserUpdateData } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Component({
  selector: 'app-dash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dash.component.html',
  styleUrl: './dash.component.css'
})
export class DashComponent implements OnInit {
  usuario: Usuario | null = null;
  cargando = true;
  error = false;
  mostrarModal = false;
  editandoSobreMi = false;
  datosEdicion: UserUpdateData = {};

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarInformacionUsuario();
  }

  cargarInformacionUsuario() {
    this.cargando = true;
    this.error = false;
    this.authService.getUserInfo().subscribe({
      next: (data) => {
        this.usuario = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar información del usuario:', error);
        this.error = true;
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: '¡Error!',
          text: 'No se pudo cargar la información del usuario',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#527F4B'
        });
      }
    });
  }

  abrirModal(sobreMi: boolean = false) {
    if (this.usuario) {
      this.editandoSobreMi = sobreMi;
      this.datosEdicion = {
        nombre: this.usuario.nombre,
        especialidad: this.usuario.especialidad,
        origen: this.usuario.origen,
        sobre_mi: this.usuario.sobre_mi
      };
      this.mostrarModal = true;
    }
  }

  cerrarModal() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#527F4B',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        this.mostrarModal = false;
        this.datosEdicion = {};
      }
    });
  }

  guardarCambios() {
    Swal.fire({
      title: 'Guardando cambios...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.updateUserInfo(this.datosEdicion).subscribe({
      next: () => {
        this.cargarInformacionUsuario();
        this.mostrarModal = false;
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'La información se actualizó correctamente',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#527F4B'
        });
      },
      error: (error) => {
        console.error('Error al actualizar información:', error);
        Swal.fire({
          icon: 'error',
          title: '¡Error!',
          text: 'No se pudo actualizar la información',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#527F4B'
        });
      }
    });
  }
}
