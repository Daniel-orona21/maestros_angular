import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificadosService, Certificado } from '../../../servicios/certificados.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-certificados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './certificados.component.html',
  styleUrl: './certificados.component.css'
})
export class CertificadosComponent implements OnInit {
  mostrarModal = false;
  certificadoSeleccionado: Certificado | null = null;
  certificados: Certificado[] = [];
  cargando = true;
  error: string | null = null;
  modoEdicion = false;
  modoEliminacion = false;
  archivoSeleccionado: File | null = null;
  erroresValidacion: { [key: string]: string } = {};

  constructor(private certificadosService: CertificadosService) {}

  ngOnInit() {
    this.cargarCertificados();
  }

  toggleModoEdicion() {
    this.modoEdicion = !this.modoEdicion;
    if (this.modoEdicion) {
      this.modoEliminacion = false;
    }
  }

  toggleModoEliminacion() {
    this.modoEliminacion = !this.modoEliminacion;
    if (this.modoEliminacion) {
      this.modoEdicion = false;
    }
  }

  handleCardClick(certificado: Certificado) {
    if (this.modoEdicion) {
      this.abrirModal(certificado);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarCertificado(certificado.id!);
      this.modoEliminacion = false;
    }
  }

  cargarCertificados() {
    this.cargando = true;
    this.error = null;
    this.certificadosService.obtenerCertificados().subscribe({
      next: (certificados) => {
        this.certificados = certificados;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los certificados';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los certificados'
        });
      }
    });
  }

  abrirModal(certificado?: Certificado) {
    this.mostrarModal = true;
    if (certificado) {
      const fecha = new Date(certificado.fecha_obtencion);
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      this.certificadoSeleccionado = {
        id: certificado.id,
        nombre: certificado.nombre,
        institucion: certificado.institucion,
        fecha_obtencion: fechaFormateada,
        archivo: certificado.archivo
      };
    } else {
      this.certificadoSeleccionado = {
        nombre: '',
        institucion: '',
        fecha_obtencion: new Date().toISOString().split('T')[0]
      };
    }
    this.archivoSeleccionado = null;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.certificadoSeleccionado = null;
    this.archivoSeleccionado = null;
  }

  handleFileInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!tiposPermitidos.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Tipo de archivo no válido',
          text: 'Solo se permiten archivos PDF, JPEG o PNG'
        });
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo demasiado grande',
          text: 'El archivo no debe superar los 5MB'
        });
        return;
      }

      this.archivoSeleccionado = file;
    }
  }

  validarCampos(): boolean {
    this.erroresValidacion = {};
    let esValido = true;

    if (!this.certificadoSeleccionado) return false;

    // Validar nombre
    if (!this.certificadoSeleccionado.nombre) {
      this.erroresValidacion['nombre'] = 'El nombre es requerido';
      esValido = false;
    } else if (this.certificadoSeleccionado.nombre.length < 3) {
      this.erroresValidacion['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar institución
    if (!this.certificadoSeleccionado.institucion) {
      this.erroresValidacion['institucion'] = 'La institución es requerida';
      esValido = false;
    } else if (this.certificadoSeleccionado.institucion.length < 3) {
      this.erroresValidacion['institucion'] = 'La institución debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar fecha
    if (!this.certificadoSeleccionado.fecha_obtencion) {
      this.erroresValidacion['fecha_obtencion'] = 'La fecha es requerida';
      esValido = false;
    } else {
      const fecha = new Date(this.certificadoSeleccionado.fecha_obtencion);
      const hoy = new Date();
      if (fecha > hoy) {
        this.erroresValidacion['fecha_obtencion'] = 'La fecha no puede ser futura';
        esValido = false;
      }
    }

    // Si es un nuevo certificado, validar que se haya seleccionado un archivo
    if (!this.certificadoSeleccionado.id && !this.archivoSeleccionado) {
      this.erroresValidacion['archivo'] = 'Debes seleccionar un archivo';
      esValido = false;
    }

    return esValido;
  }

  async guardarCertificado() {
    if (!this.certificadoSeleccionado) return;

    if (!this.validarCampos()) {
      let mensajeError = 'Por favor, corrige los siguientes errores:\n';
      Object.values(this.erroresValidacion).forEach(error => {
        mensajeError += `- ${error}\n`;
      });

      Swal.fire({
        icon: 'warning',
        title: 'Campos inválidos',
        text: mensajeError,
        confirmButtonColor: '#1a3d5c'
      });
      return;
    }

    this.cargando = true;
    this.error = null;

    try {
      if (this.certificadoSeleccionado.id) {
        await this.certificadosService.actualizarCertificado(
          this.certificadoSeleccionado.id,
          this.certificadoSeleccionado,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El certificado se actualizó correctamente'
        });
      } else {
        await this.certificadosService.agregarCertificado(
          this.certificadoSeleccionado,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'El certificado se agregó correctamente',
          confirmButtonColor: '#1a3d5c'
        });
      }

      this.cerrarModal();
      this.cargarCertificados();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar el certificado',
        confirmButtonColor: '#1a3d5c'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarCertificado(id: number) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1a3d5c',
      cancelButtonColor: '#b0b0b0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.certificadosService.eliminarCertificado(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'El certificado ha sido eliminado',
          confirmButtonColor: '#1a3d5c'
        });
        
        this.cargarCertificados();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el certificado',
          confirmButtonColor: '#1a3d5c'
        });
      }
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
