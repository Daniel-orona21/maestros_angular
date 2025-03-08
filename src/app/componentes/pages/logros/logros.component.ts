import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogrosService, Logro } from '../../../servicios/logros.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-logros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    HttpClientModule
  ],
  providers: [LogrosService],
  templateUrl: './logros.component.html',
  styleUrl: './logros.component.css'
})
export class LogrosComponent implements OnInit {
  mostrarModal = false;
  logroSeleccionado: Logro | null = null;
  logros: Logro[] = [];
  cargando = true;
  error: string | null = null;
  modoEdicion = false;
  modoEliminacion = false;
  archivoSeleccionado: File | null = null;
  erroresValidacion: { [key: string]: string } = {};

  constructor(private logrosService: LogrosService) {}

  ngOnInit() {
    this.cargarLogros();
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

  handleCardClick(logro: Logro) {
    if (this.modoEdicion) {
      this.abrirModal(logro);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarLogro(logro.id!);
      this.modoEliminacion = false;
    }
  }

  cargarLogros() {
    this.cargando = true;
    this.error = null;
    this.logrosService.obtenerLogros().subscribe({
      next: (logros) => {
        this.logros = logros;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los logros';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los logros'
        });
      }
    });
  }

  abrirModal(logro?: Logro) {
    this.mostrarModal = true;
    if (logro) {
      const fecha = new Date(logro.fecha);
      const fechaFormateada = fecha.toISOString().split('T')[0];
      
      this.logroSeleccionado = {
        id: logro.id,
        titulo: logro.titulo,
        descripcion: logro.descripcion,
        fecha: fechaFormateada,
        archivo: logro.archivo
      };
    } else {
      this.logroSeleccionado = {
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
      };
    }
    this.archivoSeleccionado = null;
    this.erroresValidacion = {};
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.logroSeleccionado = null;
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

    if (!this.logroSeleccionado) return false;

    // Validar título
    if (!this.logroSeleccionado.titulo) {
      this.erroresValidacion['titulo'] = 'El título es requerido';
      esValido = false;
    } else if (this.logroSeleccionado.titulo.length < 3) {
      this.erroresValidacion['titulo'] = 'El título debe tener al menos 3 caracteres';
      esValido = false;
    }

    // Validar fecha
    if (!this.logroSeleccionado.fecha) {
      this.erroresValidacion['fecha'] = 'La fecha es requerida';
      esValido = false;
    } else {
      const fecha = new Date(this.logroSeleccionado.fecha);
      const hoy = new Date();
      if (fecha > hoy) {
        this.erroresValidacion['fecha'] = 'La fecha no puede ser futura';
        esValido = false;
      }
    }

    // Validar descripción si está presente
    if (this.logroSeleccionado.descripcion && this.logroSeleccionado.descripcion.trim().length < 10) {
      this.erroresValidacion['descripcion'] = 'La descripción debe tener al menos 10 caracteres';
      esValido = false;
    }

    return esValido;
  }

  async guardarLogro() {
    if (!this.logroSeleccionado) return;

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
      if (this.logroSeleccionado.id) {
        await this.logrosService.actualizarLogro(
          this.logroSeleccionado.id,
          this.logroSeleccionado,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El logro se actualizó correctamente'
        });
      } else {
        await this.logrosService.agregarLogro(
          this.logroSeleccionado,
          this.archivoSeleccionado || undefined
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'El logro se agregó correctamente'
        });
      }

      this.cerrarModal();
      this.cargarLogros();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar el logro'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarLogro(id: number) {
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
        await this.logrosService.eliminarLogro(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'El logro ha sido eliminado',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
        });
        
        this.cargarLogros();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el logro',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
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
