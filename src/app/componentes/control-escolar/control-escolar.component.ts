import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GruposService } from './services/grupos.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  asistenciaTomada: boolean = false;
  fechaHoy: string = '';
  modoEliminacion: boolean = false; 
  modoEdicion: boolean = false; 
  alumnoEditando: any = null; 
  nuevoNombre: string = '';
  nuevoApellido: string = '';
  filtroAlumno: string = '';
  alumnosFiltrados: any[] = [];

  @Output() actualizarBreadcrumb = new EventEmitter<string | null>();

  constructor(private gruposService: GruposService) {}

  ngOnInit(): void {
    this.obtenerGrupos();
    this.fechaHoy = this.obtenerFechaActual();
  }
  
  obtenerGrupos(): void {
    this.gruposService.obtenerGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
        this.alumnos = [];
        this.grupoSeleccionado = null;
        this.asistenciaTomada = false;
        if (!this.grupoSeleccionado) {
          this.actualizarBreadcrumb.emit('Control escolar');
        }
      },
      error: (err) => {
        console.error('Error obteniendo grupos:', err);
      }
    });
  }
  
  seleccionarGrupo(grupo: any): void {
    this.grupoSeleccionado = grupo;
    this.asistenciaTomada = false;
    
    const breadcrumbTexto = `${grupo.grado}° ${grupo.grupo}`;
    this.actualizarBreadcrumb.emit(breadcrumbTexto);
  
    this.gruposService.obtenerAlumnosPorGrupo(grupo.id).subscribe({
      next: (data) => {
        this.alumnos = data.map(alumno => ({
          ...alumno,
          asistencia: undefined,
          checkboxAsistencia: false
        }));
        this.alumnosFiltrados = [...this.alumnos];
      },
      error: (err) => {
        console.error('Error obteniendo alumnos:', err);
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

registrarAsistencia(alumno: any, asistencia: boolean): void {
  alumno.asistencia = asistencia ? '/' : '.';

  this.alumnos.sort((a, b) => (a.asistencia === undefined ? -1 : 1));
  this.alumnosFiltrados = [...this.alumnos];

  if (this.alumnos.every(a => a.asistencia !== undefined)) {
    this.asistenciaTomada = false;
  }
}

  activarAsistencia(): void {
    this.asistenciaTomada = true;
    this.alumnos.forEach(alumno => {
      alumno.asistencia = undefined;
      alumno.checkboxAsistencia = false;
    });
  }
  
  obtenerFechaActual(): string {
    const hoy = new Date();
    return `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
  }

  activarModoEliminacion(): void {
    this.modoEliminacion = !this.modoEliminacion;
    this.alumnos.forEach(alumno => (alumno.seleccionado = false)); 
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

  activarModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
  }
  
  abrirModalEdicion(alumno: any): void {
    if (!this.modoEdicion) return; 
    this.alumnoEditando = { ...alumno };
    this.nuevoNombre = alumno.nombre;
    this.nuevoApellido = alumno.apellido;
  }

  cerrarModal(): void {
    this.alumnoEditando = null;
  }

  guardarEdicion(): void {
    if (!this.alumnoEditando) return;
  
    const alumnoActualizado = {
      ...this.alumnoEditando,
      nombre: this.nuevoNombre,
      apellido: this.nuevoApellido
    };
  
    this.gruposService.editarAlumno(alumnoActualizado.id, this.nuevoNombre, this.nuevoApellido).subscribe({
      next: () => {
        const index = this.alumnos.findIndex(a => a.id === alumnoActualizado.id);
        if (index !== -1) {
          this.alumnos[index] = alumnoActualizado;
          this.alumnosFiltrados = [...this.alumnos];
        }
        
        alert('Alumno actualizado con éxito.'); 
  
        this.cerrarModal(); 
      },
      error: err => console.error('Error actualizando alumno:', err)
    });
  }

  descargarPDF() {
    const doc = new jsPDF();
  
    doc.text(`Lista de Alumnos - ${this.grupoSeleccionado?.grado}° ${this.grupoSeleccionado?.grupo}`, 10, 10);
  
    const columnas = ['Nombre', 'Apellido', 'Grado', this.fechaHoy, 'Asistencia'];
  
    const filas = this.alumnos.map(alumno => [
      alumno.nombre,
      alumno.apellido,
      alumno.grado,
      alumno.asistencia !== undefined ? alumno.asistencia : '',
      (alumno.asistencia && alumno.asistencia !== '.') ? 'Presente' : 'Ausente' 
    ]);
  
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 20,
    });
  
    doc.save(`Lista_Alumnos_${this.grupoSeleccionado?.grado}_${this.grupoSeleccionado?.grupo}.pdf`);
  }

}