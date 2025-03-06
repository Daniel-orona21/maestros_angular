import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { DashService, Usuario, UserUpdateData } from '../../../servicios/dash.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  window = window;
  curriculumUrl: SafeResourceUrl | null = null;

  constructor(
    private dashService: DashService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarInformacionUsuario();
  }

  cargarInformacionUsuario() {
    this.cargando = true;
    this.error = false;
    this.dashService.getUserInfo().subscribe({
      next: (data) => {
        this.usuario = data;
        if (data.curriculum) {
          const url = data.curriculum.startsWith('http') ? data.curriculum : `${this.dashService.getApiUrl()}${data.curriculum}`;
          this.curriculumUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          setTimeout(() => {
            const objectElement = document.querySelector('.curriculum-iframe') as HTMLObjectElement;
            if (objectElement) {
              objectElement.data = url;
            }
          }, 0);
        } else {
          this.curriculumUrl = null;
        }
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

  async actualizarCurriculum() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.doc,.docx';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El archivo no debe superar los 5MB'
        });
        return;
      }

      Swal.fire({
        title: 'Subiendo currículum...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.dashService.updateCurriculum(file).subscribe({
        next: (response) => {
          if (response.curriculum) {
            const url = response.curriculum.startsWith('http') ? response.curriculum : `${this.dashService.getApiUrl()}${response.curriculum}`;
            this.curriculumUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          }
          this.cargarInformacionUsuario();
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'El currículum se actualizó correctamente',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#527F4B'
          });
        },
        error: (error) => {
          console.error('Error al actualizar el currículum:', error);
          Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'No se pudo actualizar el currículum',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#527F4B'
          });
        }
      });
    };

    input.click();
  }

  eliminarCurriculum() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#666',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando currículum...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.dashService.deleteCurriculum().subscribe({
          next: () => {
            this.cargarInformacionUsuario();
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'El currículum se eliminó correctamente',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#527F4B'
            });
          },
          error: (error) => {
            console.error('Error al eliminar el currículum:', error);
            Swal.fire({
              icon: 'error',
              title: '¡Error!',
              text: 'No se pudo eliminar el currículum',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#527F4B'
            });
          }
        });
      }
    });
  }

  abrirCurriculum() {
    if (this.curriculumUrl) {
      window.open(this.curriculumUrl.toString(), '_blank');
    }
  }
}
