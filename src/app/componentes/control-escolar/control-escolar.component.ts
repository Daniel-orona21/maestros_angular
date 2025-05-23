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
  asistencia?: 'presente' | 'ausente' | 'retardo' | null;
}

interface AsistenciaResponse {
  message: string;
  affectedRows: number;
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
  alumnos: Alumno[] = [];
  grupoSeleccionado: any = null;
  modoEliminacion: boolean = false;
  modoEdicion: boolean = false;
  modoAsistencia: boolean = false;
  modoReporte: boolean = false;
  vistaActual: 'grupos' | 'alumnos' | 'reporte' = 'grupos';
  fechaAsistencia: string = new Date().toISOString().split('T')[0];
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
  hayAsistenciasGuardadas = false;
  mesSeleccionado: number;
  anioSeleccionado: number;
  aniosDisponibles: number[] = [];
  diasDelMes: number[] = [];
  asistenciasMes: any[] = [];

  @Output() actualizarBreadcrumb = new EventEmitter<string | null>();

  constructor(private gruposService: GruposService) {
    const fechaActual = new Date();
    this.mesSeleccionado = fechaActual.getMonth() + 1;
    this.anioSeleccionado = fechaActual.getFullYear();
    
    // Generar años disponibles (año actual y 2 años anteriores)
    const anioActual = fechaActual.getFullYear();
    this.aniosDisponibles = [anioActual - 2, anioActual - 1, anioActual];
  }

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    this.cargando = true;
    this.error = null;
    this.vistaActual = 'grupos';
    // Desactivar todos los modos
    this.modoEdicion = false;
    this.modoEliminacion = false;
    this.modoAsistencia = false;
    this.modoReporte = false;
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
      Swal.fire({
        title: 'Modo Edición Activado',
        text: 'Haz clic sobre un alumno para editarlo',
        icon: 'info',
        iconColor: '#ffffff',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1a3d5c',
        color: '#fff'
      });
    }
  }

  toggleModoEliminacion() {
    this.modoEliminacion = !this.modoEliminacion;
    if (this.modoEliminacion) {
      this.modoEdicion = false;
      Swal.fire({
        title: 'Modo Eliminación Activado',
        text: 'Selecciona los alumnos que deseas eliminar',
        icon: 'info',
        iconColor: '#ffffff',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#dc3545',
        color: '#fff'
      });
    }
  }

  toggleModoAsistencia() {
    this.modoAsistencia = !this.modoAsistencia;
    if (this.modoAsistencia) {
      this.modoEdicion = false;
      this.modoEliminacion = false;
      this.fechaAsistencia = new Date().toISOString().split('T')[0];
      
      // Verificar asistencias existentes
      this.gruposService.verificarAsistencias(this.grupoSeleccionado.id, this.fechaAsistencia).subscribe({
        next: (existenAsistencias) => {
          if (existenAsistencias) {
            this.hayAsistenciasGuardadas = true;
            // Cargar las asistencias existentes
            this.gruposService.obtenerAsistenciasPorFecha(this.grupoSeleccionado.id, this.fechaAsistencia).subscribe({
              next: (asistencias) => {
                // Marcar las asistencias en los alumnos
                this.alumnos.forEach(alumno => {
                  const asistenciaExistente = asistencias.find(a => a.alumno_id === alumno.id);
                  if (asistenciaExistente) {
                    alumno.asistencia = asistenciaExistente.estado.toLowerCase() as 'presente' | 'ausente' | 'retardo';
                  }
                });
                this.alumnosFiltrados = [...this.alumnos];
              },
              error: (error) => {
                console.error('Error al cargar asistencias:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'No se pudieron cargar las asistencias existentes',
                  confirmButtonColor: '#1a3d5c'
                });
              }
            });
          } else {
            this.hayAsistenciasGuardadas = false;
            // Limpiar las asistencias previas
            this.alumnos.forEach(alumno => alumno.asistencia = null);
            this.alumnosFiltrados = [...this.alumnos];
          }
        },
        error: (error) => {
          console.error('Error al verificar asistencias:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo verificar si existen asistencias',
            confirmButtonColor: '#1a3d5c'
          });
        }
      });
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
    this.vistaActual = 'alumnos';
    
    const breadcrumbTexto = `${grupo.grado}° ${grupo.grupo}`;
    this.actualizarBreadcrumb.emit(breadcrumbTexto);
  
    this.gruposService.obtenerAlumnosPorGrupo(grupo.id).subscribe({
      next: (data) => {
        this.alumnos = data.map(alumno => ({
          ...alumno,
          seleccionado: false,
          asistencia: null
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

  toggleSeleccionAlumno(alumno: any): void {
    if (!this.modoEliminacion) return;
    alumno.seleccionado = !alumno.seleccionado;
  }

  eliminarAlumnosSeleccionados(): void {
    const alumnosSeleccionados = this.alumnos.filter(alumno => alumno.seleccionado);

    if (alumnosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin selección',
        text: 'Selecciona al menos un alumno para eliminar.',
        confirmButtonColor: '#1a3d5c'
      });
      return;
    }

    const listaAlumnos = alumnosSeleccionados
      .map(alumno => `• ${alumno.nombre} ${alumno.apellido}`)
      .join('\n');

    Swal.fire({
      title: '¿Estás seguro?',
      html: `Se eliminarán los siguientes alumnos:<br><br><pre style="text-align: left; margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; font-family: Arial, sans-serif;">${listaAlumnos}</pre>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const alumnosAEliminar = alumnosSeleccionados.map(alumno => alumno.id);
        
        // Crear un array de promesas para todas las eliminaciones
        const promesasEliminacion = alumnosAEliminar.map(alumnoId =>
          this.gruposService.eliminarAlumno(alumnoId).toPromise()
        );

        // Ejecutar todas las promesas
        Promise.all(promesasEliminacion)
          .then(() => {
            this.alumnos = this.alumnos.filter(alumno => !alumnosAEliminar.includes(alumno.id));
            this.alumnosFiltrados = [...this.alumnos];
            this.modoEliminacion = false;

            Swal.fire({
              icon: 'success',
              title: '¡Eliminados!',
              text: 'Los alumnos han sido eliminados correctamente',
              confirmButtonColor: '#1a3d5c'
            });
          })
          .catch(error => {
            console.error('Error eliminando alumnos:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al eliminar los alumnos',
              confirmButtonColor: '#1a3d5c'
            });
          });
      }
    });
  }

  abrirModalEdicion(alumno: any): void {
    if (!this.modoEdicion) return;
    this.alumnoEditando = { ...alumno };
    this.nuevoNombre = alumno.nombre;
    this.nuevoApellido = alumno.apellido;
    this.mostrarModal = true;
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

  marcarAsistencia(alumno: Alumno, estado: 'presente' | 'ausente' | 'retardo'): void {
    const oldEstado = alumno.asistencia;
    alumno.asistencia = alumno.asistencia === estado ? null : estado;
    
    // Verificar si hay asistencias guardadas para la fecha actual
    this.gruposService.verificarAsistencias(this.grupoSeleccionado.id, this.fechaAsistencia).subscribe({
      next: (existenAsistencias) => {
        // Marcar que hay asistencias guardadas si:
        // 1. Ya existen asistencias para esta fecha
        // 2. O si estamos agregando una nueva asistencia
        this.hayAsistenciasGuardadas = existenAsistencias || (alumno.asistencia !== null);
      },
      error: (error) => {
        console.error('Error al verificar asistencias:', error);
      }
    });
  }

  guardarAsistencia(): void {
    const asistenciasParaGuardar = this.alumnos
      .filter(alumno => alumno.asistencia)
      .map(alumno => ({
        alumno_id: alumno.id,
        fecha: this.fechaAsistencia,
        estado: alumno.asistencia!.toUpperCase() as 'PRESENTE' | 'AUSENTE' | 'RETARDO'
      }));

    if (asistenciasParaGuardar.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin asistencias',
        text: 'No hay asistencias marcadas para guardar',
        confirmButtonColor: '#1a3d5c'
      });
      return;
    }

    const operacion = this.hayAsistenciasGuardadas ? 
      this.gruposService.actualizarAsistencias(asistenciasParaGuardar) :
      this.gruposService.guardarAsistencias(asistenciasParaGuardar);

    operacion.subscribe({
      next: (response: AsistenciaResponse) => {
        Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: this.hayAsistenciasGuardadas ? 
            'Las asistencias se han actualizado correctamente' :
            'Las asistencias se han guardado correctamente',
          confirmButtonColor: '#1a3d5c'
        });
      },
      error: (error: unknown) => {
        console.error('Error al guardar asistencias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al guardar las asistencias',
          confirmButtonColor: '#1a3d5c'
        });
      }
    });
  }

  onFechaChange(): void {
    if (this.modoAsistencia && this.grupoSeleccionado) {
      // Verificar asistencias existentes para la nueva fecha
      this.gruposService.verificarAsistencias(this.grupoSeleccionado.id, this.fechaAsistencia).subscribe({
        next: (existenAsistencias) => {
          this.hayAsistenciasGuardadas = existenAsistencias;
          if (existenAsistencias) {
            // Cargar las asistencias existentes
            this.gruposService.obtenerAsistenciasPorFecha(this.grupoSeleccionado.id, this.fechaAsistencia).subscribe({
              next: (asistencias) => {
                // Limpiar asistencias previas
                this.alumnos.forEach(alumno => alumno.asistencia = null);
                
                // Marcar las asistencias en los alumnos
                this.alumnos.forEach(alumno => {
                  const asistenciaExistente = asistencias.find(a => a.alumno_id === alumno.id);
                  if (asistenciaExistente) {
                    alumno.asistencia = asistenciaExistente.estado.toLowerCase() as 'presente' | 'ausente' | 'retardo';
                  }
                });
                this.alumnosFiltrados = [...this.alumnos];
              },
              error: (error) => {
                console.error('Error al cargar asistencias:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'No se pudieron cargar las asistencias existentes',
                  confirmButtonColor: '#1a3d5c'
                });
              }
            });
          } else {
            // Limpiar las asistencias si no hay registros para la nueva fecha
            this.alumnos.forEach(alumno => alumno.asistencia = null);
            this.alumnosFiltrados = [...this.alumnos];
          }
        },
        error: (error) => {
          console.error('Error al verificar asistencias:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo verificar si existen asistencias',
            confirmButtonColor: '#1a3d5c'
          });
        }
      });
    }
  }

  async generarReporteAsistencias() {
    this.vistaActual = this.vistaActual === 'reporte' ? 'alumnos' : 'reporte';
    if (this.vistaActual === 'reporte') {
      await this.cargarAsistenciasMes();
      this.actualizarBreadcrumb.emit(`${this.grupoSeleccionado.grado}° ${this.grupoSeleccionado.grupo} > Reporte de Asistencias`);
    } else {
      this.actualizarBreadcrumb.emit(`${this.grupoSeleccionado.grado}° ${this.grupoSeleccionado.grupo}`);
    }
  }

  async cargarAsistenciasMes() {
    if (!this.grupoSeleccionado || !this.mesSeleccionado || !this.anioSeleccionado) return;

    try {
      // Calcular el último día del mes
      const ultimoDia = new Date(this.anioSeleccionado, this.mesSeleccionado, 0).getDate();
      
      // Generar array con todos los días del mes
    this.diasDelMes = Array.from({length: ultimoDia}, (_, i) => i + 1);

      // Limpiar asistencias previas
    this.asistenciasMes = [];
      
      // Cargar asistencias para cada día del mes
    for (const dia of this.diasDelMes) {
        const fechaDia = `${this.anioSeleccionado}-${String(this.mesSeleccionado).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      try {
          const asistencias = await this.gruposService.obtenerAsistenciasPorFecha(
            this.grupoSeleccionado.id,
            fechaDia
          ).toPromise();
          
        if (asistencias) {
          this.asistenciasMes.push({
              fecha: fechaDia,
              asistencias: asistencias
          });
        }
      } catch (error) {
          console.error(`Error al cargar asistencias para ${fechaDia}:`, error);
      }
      }
    } catch (error) {
      console.error('Error al cargar las asistencias:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las asistencias del mes',
        confirmButtonColor: '#1a3d5c'
      });
    }
  }

  getAsistenciaEstado(alumno: any, dia: number): string {
    const fechaDia = `${this.anioSeleccionado}-${String(this.mesSeleccionado).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    const asistenciaDia = this.asistenciasMes.find(a => a.fecha === fechaDia);
    if (!asistenciaDia) return '';

    const asistenciaAlumno = asistenciaDia.asistencias.find((a: any) => a.alumno_id === alumno.id);
    return asistenciaAlumno ? asistenciaAlumno.estado.toLowerCase() : '';
  }

  getAsistenciaMarca(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'presente': return 'P';
      case 'ausente': return 'A';
      case 'retardo': return 'L';
      default: return '';
    }
  }

  getTotalAsistencias(alumno: any, tipo: string): number {
    return this.asistenciasMes.reduce((total, dia) => {
      const asistenciaAlumno = dia.asistencias.find((a: any) => a.alumno_id === alumno.id);
      return total + (asistenciaAlumno && asistenciaAlumno.estado.toLowerCase() === tipo ? 1 : 0);
    }, 0);
  }

  obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  }

  descargarReportePDF() {
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(16);
    doc.text(`Reporte de Asistencias - ${this.obtenerNombreMes(this.mesSeleccionado)} ${this.anioSeleccionado}`, 14, 15);
    doc.text(`${this.grupoSeleccionado.grado}° ${this.grupoSeleccionado.grupo}`, 14, 25);
    
    // Configurar leyenda
    doc.setFontSize(10);
    doc.text('Leyendas:', 14, 35);
    doc.setTextColor(76, 175, 80); // Verde
    doc.text('P = Presente', 14, 42);
    doc.setTextColor(0, 0, 0); // Negro
    doc.text('L = Tarde', 50, 42);
    doc.setTextColor(255, 0, 0); // Rojo
    doc.text('A = Ausente', 85, 42);
    doc.setTextColor(0, 0, 0); // Restablecer color

    // Preparar datos para la tabla
    const columnas = ['Estudiantes', ...this.diasDelMes.map(dia => dia.toString()), 'TP', 'TL', 'TA'];
    
    const filas = this.alumnos.map(alumno => [
      `${alumno.nombre} ${alumno.apellido}`,
      ...this.diasDelMes.map(dia => this.getAsistenciaMarca(this.getAsistenciaEstado(alumno, dia))),
      this.getTotalAsistencias(alumno, 'presente').toString(),
      this.getTotalAsistencias(alumno, 'retardo').toString(),
      this.getTotalAsistencias(alumno, 'ausente').toString()
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 50,
      headStyles: {
        fillColor: [25, 118, 210], // Color azul del encabezado
        textColor: 255,
        halign: 'center'
      },
      columnStyles: {
        0: { // Columna de nombres
          cellWidth: 50,
          fillColor: [21, 101, 192],
          textColor: 255,
          halign: 'left'
        },
        [columnas.length - 3]: { // Columna TP
          fillColor: [117, 117, 117],
          textColor: 255,
          halign: 'center'
        },
        [columnas.length - 2]: { // Columna TL
          fillColor: [117, 117, 117],
          textColor: 255,
          halign: 'center'
        },
        [columnas.length - 1]: { // Columna TA
          fillColor: [117, 117, 117],
          textColor: 255,
          halign: 'center'
        }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      didDrawCell: (data) => {
        // Colorear las marcas de asistencia
        if (data.section === 'body' && data.column.index > 0 && data.column.index < columnas.length - 3) {
          const texto = data.cell.text[0];
          if (texto === 'P') {
            doc.setTextColor(76, 175, 80); // Verde para Presente
          } else if (texto === 'A') {
            doc.setTextColor(255, 0, 0); // Rojo para Ausente
          } else if (texto === 'L') {
            doc.setTextColor(0, 0, 0); // Negro para Tarde
          }
        }
      }
    });
    
    // Guardar el PDF
    doc.save(`Asistencias_${this.grupoSeleccionado.grado}${this.grupoSeleccionado.grupo}_${this.obtenerNombreMes(this.mesSeleccionado)}_${this.anioSeleccionado}.pdf`);
  }
}