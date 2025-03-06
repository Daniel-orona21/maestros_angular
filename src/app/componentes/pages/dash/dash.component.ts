import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { DashService, Usuario, UserUpdateData } from '../../../servicios/dash.service';

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

  constructor(private dashService: DashService) {}

  ngOnInit() {
    this.cargarInformacionUsuario();
  }

  cargarInformacionUsuario() {
    this.cargando = true;
    this.error = false;
    this.dashService.getUserInfo().subscribe({
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
        sobre_mi: this.usuario.sobre_mi,
        numero_telefono: this.usuario.numero_telefono,
        domicilio: this.usuario.domicilio
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
        // Restaurar los datos originales del usuario
        if (this.usuario) {
          this.datosEdicion = {
            nombre: this.usuario.nombre,
            especialidad: this.usuario.especialidad,
            origen: this.usuario.origen,
            sobre_mi: this.usuario.sobre_mi,
            numero_telefono: this.usuario.numero_telefono,
            domicilio: this.usuario.domicilio
          };
        }
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

    this.dashService.updateUserInfo(this.datosEdicion).subscribe({
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

  async editarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La imagen no debe superar los 5MB'
        });
        return;
      }

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        const result = await Swal.fire({
          title: '¿Quieres usar esta foto?',
          imageUrl: imageUrl,
          imageWidth: 300,
          imageHeight: 300,
          showCancelButton: true,
          confirmButtonText: 'Sí, actualizar',
          cancelButtonText: 'Cancelar',
          imageAlt: 'Vista previa de la foto de perfil',
          customClass: {
            image: 'preview-image'
          },
          didOpen: () => {
            // Agregar estilos para la imagen de vista previa
            const style = document.createElement('style');
            style.textContent = `
              .preview-image {
                object-fit: contain !important;
                width: 300px !important;
                height: 300px !important;
                background-color: #f8f9fa;
                border-radius: 10px;
              }
            `;
            document.head.appendChild(style);
          }
        });

        if (result.isConfirmed) {
          await this.subirFoto(file);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  private subirFoto(file: File) {
    Swal.fire({
      title: 'Subiendo foto...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.dashService.updateProfilePicture(file).subscribe({
      next: (response) => {
        this.cargarInformacionUsuario();
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'La foto de perfil se actualizó correctamente',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#527F4B'
        });
      },
      error: (error) => {
        console.error('Error al actualizar la foto:', error);
        Swal.fire({
          icon: 'error',
          title: '¡Error!',
          text: 'No se pudo actualizar la foto de perfil',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#527F4B'
        });
      }
    });
  }
}
