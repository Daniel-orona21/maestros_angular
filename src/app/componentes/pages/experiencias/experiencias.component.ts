import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExperienciaService, Experiencia } from '../../../servicios/experiencia.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-experiencias',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './experiencias.component.html',
  styleUrl: './experiencias.component.css'
})
export class ExperienciasComponent implements OnInit {
  mostrarModal = false;
  experienciaSeleccionada: Experiencia | null = null;
  experiencias: Experiencia[] = [];
  cargando = true;
  error: string | null = null;
  modoEdicion = false;
  modoEliminacion = false;
  anioActual = new Date().getFullYear();
  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  constructor(private experienciaService: ExperienciaService) {}

  ngOnInit() {
    this.cargarExperiencias();
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

  handleCardClick(experiencia: Experiencia) {
    if (this.modoEdicion) {
      this.abrirModal(experiencia);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarExperiencia(experiencia.id!);
      this.modoEliminacion = false;
    }
  }

  cargarExperiencias() {
    this.cargando = true;
    this.error = null;
    this.experienciaService.obtenerExperiencias().subscribe({
      next: (experiencias) => {
        this.experiencias = experiencias;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las experiencias';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las experiencias'
        });
      }
    });
  }

  abrirModal(experiencia?: Experiencia) {
    this.mostrarModal = true;
    if (experiencia) {
      this.experienciaSeleccionada = { ...experiencia };
    } else {
      this.experienciaSeleccionada = {
        puesto: '',
        empleador: '',
        ciudad: '',
        pais: '',
        fecha_inicio_mes: new Date().getMonth() + 1,
        fecha_inicio_anio: this.anioActual,
        fecha_fin_mes: null,
        fecha_fin_anio: null
      };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.experienciaSeleccionada = null;
  }

  async guardarExperiencia(): Promise<void> {
    if (!this.experienciaSeleccionada) return;

    // Validación básica
    if (!this.experienciaSeleccionada.puesto || 
        !this.experienciaSeleccionada.empleador || 
        !this.experienciaSeleccionada.ciudad || 
        !this.experienciaSeleccionada.pais) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    this.cargando = true;
    this.error = null;

    try {
      if (this.experienciaSeleccionada.id) {
        await this.experienciaService.actualizarExperiencia(
          this.experienciaSeleccionada.id,
          this.experienciaSeleccionada
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La experiencia se actualizó correctamente'
        });
      } else {
        await this.experienciaService.agregarExperiencia(
          this.experienciaSeleccionada
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'La experiencia se agregó correctamente'
        });
      }

      this.cerrarModal();
      this.cargarExperiencias();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar la experiencia'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarExperiencia(id: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1a3d5c',
      cancelButtonColor: '#b0b0b0',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await this.procesarEliminacion(id);
    }
  }

  private async procesarEliminacion(id: number): Promise<void> {
    try {
      await this.experienciaService.eliminarExperiencia(id).toPromise();
      
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'La experiencia ha sido eliminada',
        confirmButtonColor: '#1a3d5c'
      });
      
      this.cargarExperiencias();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la experiencia',
        confirmButtonColor: '#1a3d5c'
      });
    }
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.valor === mes)?.nombre || '';
  }

  formatearPeriodo(experiencia: Experiencia): string {
    const inicio = `${this.obtenerNombreMes(experiencia.fecha_inicio_mes)} ${experiencia.fecha_inicio_anio}`;
    
    if (experiencia.fecha_fin_mes && experiencia.fecha_fin_anio) {
      return `${inicio} - ${this.obtenerNombreMes(experiencia.fecha_fin_mes)} ${experiencia.fecha_fin_anio}`;
    }
    
    return `${inicio} - Presente`;
  }
}
