import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GruposService } from './services/grupos.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  seleccionado?: boolean;
}

@Component({
  selector: 'app-control-escolar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule],
  templateUrl: './control-escolar.component.html',
  styleUrls: ['./control-escolar.component.css']
})
export class ControlEscolarComponent implements OnInit {
  grupos: any[] = [];
  alumnos: any[] = [];
  grupoSeleccionado: any = null;
  modoEliminacion: boolean = false;
  modoEdicion: boolean = false;
  alumnoEditando: any = null;
  nuevoNombre: string = '';
  nuevoApellido: string = '';
  filtroAlumno: string = '';
  alumnosFiltrados: any[] = [];
  cargando = true;
  error: string | null = null;
  mostrarModal = false;
  grupoEditando: any = {
    grado: '',
    grupo: '',
    carrera: '',
    modalidad: 'Clásica'
  };

  @Output() actualizarBreadcrumb = new EventEmitter<string | null>();

  constructor(private gruposService: GruposService) {}

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    this.cargando = true;
    this.error = null;
    this.gruposService.obtenerGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
        this.alumnos = [];
        this.grupoSeleccionado = null;
        if (!this.grupoSeleccionado) {
          this.actualizarBreadcrumb.emit('Control escolar');
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar grupos:', err);
        this.error = 'Error al cargar los grupos';
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los grupos'
        });
      }
    });
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

  handleCardClick(grupo: any) {
    if (this.modoEdicion) {
      this.abrirModal(grupo);
      this.modoEdicion = false;
    } else if (this.modoEliminacion) {
      this.eliminarGrupo(grupo.id);
      this.modoEliminacion = false;
    } else {
      this.seleccionarGrupo(grupo);
    }
  }

  abrirModal(grupo?: any) {
    this.mostrarModal = true;
    if (grupo) {
      this.grupoEditando = { ...grupo };
    } else {
      this.grupoEditando = {
        grado: '',
        grupo: '',
        carrera: '',
        modalidad: 'Clásica'
      };
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetModal();
  }

  resetModal() {
    this.grupoEditando = {
      grado: '',
      grupo: '',
      carrera: '',
      modalidad: 'Clásica'
    };
    this.alumnoEditando = null;
    this.nuevoNombre = '';
    this.nuevoApellido = '';
  }

  async guardarGrupo(): Promise<void> {
    if (!this.grupoEditando) return;

    // Validación básica
    if (!this.grupoEditando.grado || 
        !this.grupoEditando.grupo || 
        !this.grupoEditando.carrera || 
        !this.grupoEditando.modalidad) {
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
      if (this.grupoEditando.id) {
        await this.gruposService.actualizarGrupo(
          this.grupoEditando.id,
          this.grupoEditando
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El grupo se actualizó correctamente'
        });
      } else {
        await this.gruposService.agregarGrupo(
          this.grupoEditando
        ).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'El grupo se agregó correctamente'
        });
      }

      this.cerrarModal();
      this.cargarGrupos();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar el grupo'
      });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarGrupo(id: number): Promise<void> {
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
      try {
        await this.gruposService.eliminarGrupo(id).toPromise();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'El grupo ha sido eliminado',
          confirmButtonColor: '#1a3d5c'
        });
        
        this.cargarGrupos();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el grupo',
          confirmButtonColor: '#1a3d5c'
        });
      }
    }
  }

  seleccionarGrupo(grupo: any): void {
    this.grupoSeleccionado = grupo;
    
    const breadcrumbTexto = `${grupo.grado}° ${grupo.grupo}`;
    this.actualizarBreadcrumb.emit(breadcrumbTexto);
  
    this.gruposService.obtenerAlumnosPorGrupo(grupo.id).subscribe({
      next: (data) => {
        this.alumnos = data.map(alumno => ({
          ...alumno,
          seleccionado: false
        }));
        this.alumnosFiltrados = [...this.alumnos];
      },
      error: (err) => {
        console.error('Error obteniendo alumnos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los alumnos del grupo'
        });
      }
    });
  }

  filtrarAlumnos(): void {
    const filtro = this.filtroAlumno.toLowerCase().trim();
    this.alumnosFiltrados = this.alumnos.filter(alumno =>
      alumno.nombre.toLowerCase().includes(filtro) ||
      alumno.apellido.toLowerCase().includes(filtro)
    );
  }

  eliminarAlumnosSeleccionados(): void {
    const alumnosAEliminar = this.alumnos.filter(alumno => alumno.seleccionado).map(alumno => alumno.id);

    if (alumnosAEliminar.length === 0) {
      alert('Selecciona al menos un alumno para eliminar.');
      return;
    }

    if (!confirm(`¿Eliminar ${alumnosAEliminar.length} alumno(s)?`)) return;

    alumnosAEliminar.forEach(alumnoId => {
      this.gruposService.eliminarAlumno(alumnoId).subscribe({
        next: () => {
          this.alumnos = this.alumnos.filter(alumno => !alumnosAEliminar.includes(alumno.id));
          this.modoEliminacion = false;
        },
        error: err => console.error('Error eliminando alumno:', err)
      });
    });
  }

  abrirModalEdicion(alumno: any): void {
    if (!this.modoEdicion) return; 
    this.alumnoEditando = { ...alumno };
    this.nuevoNombre = alumno.nombre;
    this.nuevoApellido = alumno.apellido;
  }

  guardarEdicion(): void {
    if (!this.nuevoNombre || !this.nuevoApellido) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    this.cargando = true;

    if (this.alumnoEditando) {
      // Editar alumno existente
      this.gruposService.editarAlumno(this.alumnoEditando.id, this.nuevoNombre, this.nuevoApellido).subscribe({
        next: () => {
          const index = this.alumnos.findIndex(a => a.id === this.alumnoEditando.id);
          if (index !== -1) {
            this.alumnos[index] = {
              ...this.alumnoEditando,
              nombre: this.nuevoNombre,
              apellido: this.nuevoApellido
            };
            this.alumnosFiltrados = [...this.alumnos];
          }
          
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'El alumno se actualizó correctamente'
          });
  
          this.mostrarModal = false;
          this.resetModal();
          this.modoEdicion = false;
        },
        error: (error: Error) => {
          console.error('Error actualizando alumno:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el alumno'
          });
        },
        complete: () => {
          this.cargando = false;
        }
      });
    } else {
      // Agregar nuevo alumno
      this.gruposService.agregarAlumno(this.grupoSeleccionado.id, {
        nombre: this.nuevoNombre,
        apellido: this.nuevoApellido
      }).subscribe({
        next: (nuevoAlumno: Alumno) => {
          this.alumnos.push({
            ...nuevoAlumno,
            seleccionado: false
          });
          this.alumnosFiltrados = [...this.alumnos];
          
          Swal.fire({
            icon: 'success',
            title: '¡Agregado!',
            text: 'El alumno se agregó correctamente'
          });
  
          this.mostrarModal = false;
          this.resetModal();
          this.modoEdicion = false;
        },
        error: (error: Error) => {
          console.error('Error agregando alumno:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo agregar el alumno'
          });
        },
        complete: () => {
          this.cargando = false;
        }
      });
    }
  }

  descargarPDF() {
    const doc = new jsPDF();
  
    doc.text(`Lista de Alumnos - ${this.grupoSeleccionado?.grado}° ${this.grupoSeleccionado?.grupo}`, 10, 10);
  
    const columnas = ['Nombre', 'Apellido'];
  
    const filas = this.alumnos.map(alumno => [
      alumno.nombre,
      alumno.apellido
    ]);
  
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 20,
    });
  
    doc.save(`Lista_Alumnos_${this.grupoSeleccionado?.grado}_${this.grupoSeleccionado?.grupo}.pdf`);
  }
}