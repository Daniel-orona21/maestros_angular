import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EducacionService, Educacion } from '../../../servicios/educacion.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-educacion',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './educacion.component.html',
  styleUrl: './educacion.component.css'
})
export class EducacionComponent implements OnInit {
  mostrarModal = false;
  educacionSeleccionada: Educacion | null = null;
  educaciones: Educacion[] = [];
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

  constructor(private educacionService: EducacionService) {}

  ngOnInit() {
    this.cargarEducacion();
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

  handleCardClick(educacion: Educacion) {
    if (this.modoEdicion) {
      this.abrirModal(educacion);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarEducacion(educacion.id!);
      this.modoEliminacion = false;
    }
  }

  cargarEducacion() {
    this.cargando = true;
    this.error = null;
    this.educacionService.obtenerEducacion().subscribe({
      next: (educaciones) => {
        this.educaciones = educaciones;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar la educación';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información educativa'
        });
      }
    });
  }

  abrirModal(educacion?: Educacion) {
    this.mostrarModal = true;
    if (educacion) {
      this.educacionSeleccionada = { ...educacion };
    } else {
      this.educacionSeleccionada = {
        institucion: '',
        ciudad: '',
        titulo: '',
        especialidad: '',
        mes_inicio: new Date().getMonth() + 1,
        ano_inicio: this.anioActual,
        mes_fin: null,
        ano_fin: null
      };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.educacionSeleccionada = null;
  }

  async guardarEducacion(): Promise<void> {
    if (!this.educacionSeleccionada) return;

    // Validación básica
    if (!this.educacionSeleccionada.institucion || 
        !this.educacionSeleccionada.ciudad || 
        !this.educacionSeleccionada.titulo) {
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
      if (this.educacionSeleccionada.id) {
        await this.educacionService.actualizarEducacion(
          this.educacionSeleccionada.id,
          this.educacionSeleccionada
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La información educativa se actualizó correctamente'
        });
      } else {
        await this.educacionService.agregarEducacion(
          this.educacionSeleccionada
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'La información educativa se agregó correctamente'
        });
      }

      this.cerrarModal();
      this.cargarEducacion();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar la información educativa'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarEducacion(id: number): Promise<void> {
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
        await this.educacionService.eliminarEducacion(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La información educativa ha sido eliminada',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
        });
        
        this.cargarEducacion();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la información educativa',
          confirmButtonColor: '#1a3d5c' // Azul para el botón OK
        });
      }
    }
  }

  obtenerNombreMes(mes: number): string {
    return this.meses.find(m => m.valor === mes)?.nombre || '';
  }

  formatearPeriodo(educacion: Educacion): string {
    const inicio = `${this.obtenerNombreMes(educacion.mes_inicio)} ${educacion.ano_inicio}`;
    
    if (educacion.mes_fin && educacion.ano_fin) {
      return `${inicio} - ${this.obtenerNombreMes(educacion.mes_fin)} ${educacion.ano_fin}`;
    }
    
    return `${inicio} - Presente`;
  }
}
