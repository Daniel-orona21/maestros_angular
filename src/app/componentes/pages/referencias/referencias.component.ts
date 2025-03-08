import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReferenciasService, Referencia } from '../../../servicios/referencias.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-referencias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    HttpClientModule
  ],
  providers: [ReferenciasService],
  templateUrl: './referencias.component.html',
  styleUrl: './referencias.component.css'
})
export class ReferenciasComponent implements OnInit {
  mostrarModal = false;
  referenciaSeleccionada: Referencia | null = null;
  referencias: Referencia[] = [];
  cargando = true;
  error: string | null = null;
  modoEdicion = false;
  modoEliminacion = false;
  archivoSeleccionado: File | null = null;
  erroresValidacion: { [key: string]: string } = {};

  constructor(private referenciasService: ReferenciasService) {}

  ngOnInit() {
    this.cargarReferencias();
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

  handleCardClick(referencia: Referencia) {
    if (this.modoEdicion) {
      this.abrirModal(referencia);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarReferencia(referencia.id!);
      this.modoEliminacion = false;
    }
  }

  cargarReferencias() {
    this.cargando = true;
    this.error = null;
    this.referenciasService.obtenerReferencias().subscribe({
      next: (referencias) => {
        this.referencias = referencias;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las referencias';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las referencias'
        });
      }
    });
  }

  abrirModal(referencia?: Referencia) {
    this.mostrarModal = true;
    if (referencia) {
      this.referenciaSeleccionada = {
        id: referencia.id,
        nombre: referencia.nombre,
        cargo: referencia.cargo,
        institucion: referencia.institucion,
        contacto: referencia.contacto,
        comentario: referencia.comentario,
        archivo: referencia.archivo
      };
    } else {
      this.referenciaSeleccionada = {
        nombre: '',
        contacto: '',
        cargo: '',
        institucion: '',
        comentario: ''
      };
    }
    this.archivoSeleccionado = null;
    this.erroresValidacion = {};
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.referenciaSeleccionada = null;
    this.archivoSeleccionado = null;
    this.erroresValidacion = {};
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

    if (!this.referenciaSeleccionada) return false;

    // Validar nombre
    if (!this.referenciaSeleccionada.nombre) {
      this.erroresValidacion['nombre'] = 'El nombre es requerido';
      esValido = false;
    } else if (this.referenciaSeleccionada.nombre.length < 3) {
      this.erroresValidacion['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar contacto
    if (!this.referenciaSeleccionada.contacto) {
      this.erroresValidacion['contacto'] = 'El contacto es requerido';
      esValido = false;
    } else if (this.referenciaSeleccionada.contacto.length < 5) {
      this.erroresValidacion['contacto'] = 'El contacto debe tener al menos 5 caracteres';
      esValido = false;
    }

    // Validar cargo si está presente
    if (this.referenciaSeleccionada.cargo && this.referenciaSeleccionada.cargo.length < 3) {
      this.erroresValidacion['cargo'] = 'El cargo debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar institución si está presente
    if (this.referenciaSeleccionada.institucion && this.referenciaSeleccionada.institucion.length < 3) {
      this.erroresValidacion['institucion'] = 'La institución debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar comentario si está presente
    if (this.referenciaSeleccionada.comentario && this.referenciaSeleccionada.comentario.trim().length < 10) {
      this.erroresValidacion['comentario'] = 'El comentario debe tener al menos 10 caracteres';
      esValido = false;
    }

    return esValido;
  }

  async guardarReferencia() {
    if (!this.referenciaSeleccionada) return;

    if (!this.validarCampos()) {
      let mensajeError = 'Por favor, corrige los siguientes errores:\n';
      Object.values(this.erroresValidacion).forEach(error => {
        mensajeError += `- ${error}\n`;
      });

      Swal.fire({
        icon: 'warning',
        title: 'Campos inválidos',
        text: mensajeError
      });
      return;
    }

    this.cargando = true;
    this.error = null;

    try {
      if (this.referenciaSeleccionada.id) {
        await this.referenciasService.actualizarReferencia(
          this.referenciaSeleccionada.id,
          this.referenciaSeleccionada,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La referencia se actualizó correctamente'
        });
      } else {
        await this.referenciasService.agregarReferencia(
          this.referenciaSeleccionada,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'La referencia se agregó correctamente'
        });
      }

      this.cerrarModal();
      this.cargarReferencias();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar la referencia'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarReferencia(id: number) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1a3d5c', // Azul para confirmar
      cancelButtonColor: '#b0b0b0', // Gris claro para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.referenciasService.eliminarReferencia(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La referencia ha sido eliminada',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
        });
        
        this.cargarReferencias();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la referencia',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
        });
      }
    }
  }
}
