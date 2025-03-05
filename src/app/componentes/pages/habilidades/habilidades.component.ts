import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HabilidadesService, Habilidad } from '../../../servicios/habilidades.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-habilidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './habilidades.component.html',
  styleUrl: './habilidades.component.css'
})
export class HabilidadesComponent implements OnInit {
  mostrarModal = false;
  habilidades: Habilidad[] = [];
  nuevasHabilidades: FormControl[] = [new FormControl('')];
  cargando = true;
  error: string | null = null;
  modoEdicion = false;
  modoEliminacion = false;

  constructor(private habilidadesService: HabilidadesService) {}

  ngOnInit() {
    this.cargarHabilidades();
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

  handleCardClick(habilidad: Habilidad) {
    if (this.modoEdicion) {
      this.editarHabilidad(habilidad);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarHabilidad(habilidad.id!);
      this.modoEliminacion = false;
    }
  }

  cargarHabilidades() {
    this.cargando = true;
    this.error = null;
    this.habilidadesService.obtenerHabilidades().subscribe({
      next: (habilidades) => {
        this.habilidades = habilidades;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las habilidades';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las habilidades'
        });
      }
    });
  }

  abrirModal() {
    this.mostrarModal = true;
    this.nuevasHabilidades = [new FormControl('')];
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nuevasHabilidades = [new FormControl('')];
  }

  agregarCampoHabilidad() {
    this.nuevasHabilidades.push(new FormControl(''));
  }

  eliminarCampoHabilidad(index: number) {
    this.nuevasHabilidades.splice(index, 1);
  }

  async guardarHabilidades() {
    // Filtrar habilidades vacías
    const habilidadesValidas = this.nuevasHabilidades
      .map(control => control.value)
      .filter(h => h.trim() !== '');

    if (habilidadesValidas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor, ingresa al menos una habilidad'
      });
      return;
    }

    this.cargando = true;
    try {
      await this.habilidadesService.agregarHabilidades(habilidadesValidas).toPromise();
      
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Las habilidades se guardaron correctamente'
      });

      this.cerrarModal();
      this.cargarHabilidades();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar las habilidades'
      });
    } finally {
      this.cargando = false;
    }
  }

  async editarHabilidad(habilidad: Habilidad) {
    const { value: nuevaDescripcion } = await Swal.fire({
      title: 'Editar habilidad',
      input: 'text',
      inputValue: habilidad.descripcion,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Guardar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes escribir algo';
        }
        return null;
      }
    });

    if (nuevaDescripcion) {
      try {
        await this.habilidadesService.actualizarHabilidad(habilidad.id!, nuevaDescripcion).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La habilidad se actualizó correctamente'
        });
        
        this.cargarHabilidades();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la habilidad'
        });
      }
    }
  }

  async eliminarHabilidad(id: number) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#527F4B',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.habilidadesService.eliminarHabilidad(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La habilidad ha sido eliminada'
        });
        
        this.cargarHabilidades();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la habilidad'
        });
      }
    }
  }
}
