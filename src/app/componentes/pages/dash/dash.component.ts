import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { DashService, Usuario, UserUpdateData } from '../../../servicios/dash.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExperienciaService, Experiencia } from '../../../servicios/experiencia.service';
import { EducacionService, Educacion } from '../../../servicios/educacion.service';
import { HabilidadesService, Habilidad } from '../../../servicios/habilidades.service';
import { CertificadosService, Certificado } from '../../../servicios/certificados.service';
import { LogrosService, Logro } from '../../../servicios/logros.service';
import { ReferenciasService, Referencia } from '../../../servicios/referencias.service';

interface ExperienciaCV extends Experiencia {
  fecha_inicio: string;
  fecha_fin: string;
}

interface EducacionCV extends Educacion {
  fecha_inicio: string;
  fecha_fin: string;
}

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
  mostrarModalGenerarCV = false;
  editandoSobreMi = false;
  datosEdicion: UserUpdateData = {};
  window = window;
  curriculumUrl: SafeResourceUrl | null = null;
  previewUrl: SafeResourceUrl | null = null;
  datosCV = {
    nombre: '',
    especialidad: '',
    origen: '',
    telefono: '',
    domicilio: '',
    sobreMi: ''
  };

  // Propiedades para almacenar la información del CV
  experiencias: Experiencia[] = [];
  educacion: Educacion[] = [];
  habilidades: Habilidad[] = [];
  certificados: Certificado[] = [];
  logros: Logro[] = [];
  referencias: Referencia[] = [];

  // Propiedades para nuevos elementos
  nuevaExperiencia: ExperienciaCV = {
    puesto: '',
    empleador: '',
    ciudad: '',
    pais: '',
    fecha_inicio_mes: 0,
    fecha_inicio_anio: 0,
    fecha_fin_mes: null,
    fecha_fin_anio: null,
    fecha_inicio: '',
    fecha_fin: ''
  };

  nuevaEducacion: EducacionCV = {
    institucion: '',
    ciudad: '',
    titulo: '',
    mes_inicio: 0,
    ano_inicio: 0,
    mes_fin: null,
    ano_fin: null,
    fecha_inicio: '',
    fecha_fin: ''
  };

  nuevaHabilidad: Habilidad = {
    descripcion: ''
  };

  nuevoCertificado: Certificado = {
    nombre: '',
    institucion: '',
    fecha_obtencion: ''
  };

  nuevoLogro: Logro = {
    titulo: '',
    descripcion: '',
    fecha: ''
  };

  nuevaReferencia: Referencia = {
    nombre: '',
    cargo: '',
    institucion: '',
    contacto: '',
    comentario: ''
  };

  // Propiedades para controlar la visibilidad de los campos
  mostrarCamposExperiencia = false;
  mostrarCamposEducacion = false;
  mostrarCamposHabilidad = false;
  mostrarCamposCertificado = false;
  mostrarCamposLogro = false;
  mostrarCamposReferencia = false;

  // Propiedades para controlar la edición
  experienciaEditando: Experiencia | null = null;
  educacionEditando: Educacion | null = null;
  habilidadEditando: Habilidad | null = null;
  certificadoEditando: Certificado | null = null;
  logroEditando: Logro | null = null;
  referenciaEditando: Referencia | null = null;

  // Propiedades para el sistema de pestañas
  tabs = [
    { id: 'personal', nombre: 'Personal', icono: 'person' },
    { id: 'experiencia', nombre: 'Experiencia', icono: 'work' },
    { id: 'educacion', nombre: 'Educación', icono: 'school' },
    { id: 'habilidades', nombre: 'Habilidades', icono: 'psychology' },
    { id: 'certificados', nombre: 'Certificados', icono: 'verified' },
    { id: 'logros', nombre: 'Logros', icono: 'emoji_events' },
    { id: 'referencias', nombre: 'Referencias', icono: 'people' }
  ];
  tabActivo = 'personal';

  constructor(
    private dashService: DashService,
    private experienciaService: ExperienciaService,
    private educacionService: EducacionService,
    private habilidadesService: HabilidadesService,
    private certificadosService: CertificadosService,
    private logrosService: LogrosService,
    private referenciasService: ReferenciasService,
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

  generarCurriculum() {
    this.mostrarModalGenerarCV = true;
    if (this.usuario) {
      this.datosCV = {
        nombre: this.usuario.nombre,
        especialidad: this.usuario.especialidad,
        origen: this.usuario.origen,
        telefono: this.usuario.numero_telefono,
        domicilio: this.usuario.domicilio,
        sobreMi: this.usuario.sobre_mi
      };

      // Cargar todas las secciones del CV
      this.cargarExperiencias();
      this.cargarEducacion();
      this.cargarHabilidades();
      this.cargarCertificados();
      this.cargarLogros();
      this.cargarReferencias();
    }
  }

  private cargarExperiencias() {
    this.experienciaService.obtenerExperiencias().subscribe({
      next: (data) => {
        this.experiencias = data;
      },
      error: (error) => {
        console.error('Error al cargar experiencias:', error);
      }
    });
  }

  private cargarEducacion() {
    this.educacionService.obtenerEducacion().subscribe({
      next: (data) => {
        this.educacion = data;
      },
      error: (error) => {
        console.error('Error al cargar educación:', error);
      }
    });
  }

  private cargarHabilidades() {
    this.habilidadesService.obtenerHabilidades().subscribe({
      next: (data) => {
        this.habilidades = data;
      },
      error: (error) => {
        console.error('Error al cargar habilidades:', error);
      }
    });
  }

  private formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private cargarCertificados() {
    this.certificadosService.obtenerCertificados().subscribe({
      next: (data) => {
        this.certificados = data.map(cert => ({
          ...cert,
          fecha_obtencion: this.formatearFecha(cert.fecha_obtencion)
        }));
      },
      error: (error) => {
        console.error('Error al cargar certificados:', error);
      }
    });
  }

  private cargarLogros() {
    this.logrosService.obtenerLogros().subscribe({
      next: (data) => {
        this.logros = data.map(logro => ({
          ...logro,
          fecha: this.formatearFecha(logro.fecha)
        }));
      },
      error: (error) => {
        console.error('Error al cargar logros:', error);
      }
    });
  }

  private cargarReferencias() {
    this.referenciasService.obtenerReferencias().subscribe({
      next: (data) => {
        this.referencias = data;
      },
      error: (error) => {
        console.error('Error al cargar referencias:', error);
      }
    });
  }

  cerrarModalGenerarCV() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#527F4B',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mostrarModalGenerarCV = false;
        // Limpiar los datos
        this.datosCV = {
          nombre: '',
          especialidad: '',
          origen: '',
          telefono: '',
          domicilio: '',
          sobreMi: ''
        };
        this.experiencias = [];
        this.educacion = [];
        this.habilidades = [];
        this.certificados = [];
        this.logros = [];
        this.referencias = [];
        this.nuevaExperiencia = {
          puesto: '',
          empleador: '',
          ciudad: '',
          pais: '',
          fecha_inicio_mes: 0,
          fecha_inicio_anio: 0,
          fecha_fin_mes: null,
          fecha_fin_anio: null,
          fecha_inicio: '',
          fecha_fin: ''
        };
        this.nuevaEducacion = {
          institucion: '',
          ciudad: '',
          titulo: '',
          mes_inicio: 0,
          ano_inicio: 0,
          mes_fin: null,
          ano_fin: null,
          fecha_inicio: '',
          fecha_fin: ''
        };
        this.nuevaHabilidad = { descripcion: '' };
        this.nuevoCertificado = {
          nombre: '',
          institucion: '',
          fecha_obtencion: ''
        };
        this.nuevoLogro = {
          titulo: '',
          descripcion: '',
          fecha: ''
        };
        this.nuevaReferencia = {
          nombre: '',
          cargo: '',
          institucion: '',
          contacto: '',
          comentario: ''
        };
      }
    });
  }

  generarPDF() {
    // Aquí irá la lógica para generar el PDF
    Swal.fire({
      title: 'Generando PDF...',
      text: 'Esta función estará disponible próximamente',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#527F4B'
    });
  }

  agregarExperiencia() {
    if (!this.nuevaExperiencia.puesto || !this.nuevaExperiencia.empleador) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const fechaInicio = new Date(this.nuevaExperiencia.fecha_inicio);
    const fechaFin = this.nuevaExperiencia.fecha_fin ? new Date(this.nuevaExperiencia.fecha_fin) : null;

    const experiencia: Experiencia = {
      id: this.experiencias.length + 1,
      puesto: this.nuevaExperiencia.puesto,
      empleador: this.nuevaExperiencia.empleador,
      ciudad: this.nuevaExperiencia.ciudad,
      pais: this.nuevaExperiencia.pais,
      fecha_inicio_mes: fechaInicio.getMonth() + 1,
      fecha_inicio_anio: fechaInicio.getFullYear(),
      fecha_fin_mes: fechaFin ? fechaFin.getMonth() + 1 : null,
      fecha_fin_anio: fechaFin ? fechaFin.getFullYear() : null
    };

    this.experiencias.push(experiencia);
    this.nuevaExperiencia = {
      puesto: '',
      empleador: '',
      ciudad: '',
      pais: '',
      fecha_inicio_mes: 0,
      fecha_inicio_anio: 0,
      fecha_fin_mes: null,
      fecha_fin_anio: null,
      fecha_inicio: '',
      fecha_fin: ''
    };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Experiencia agregada correctamente'
    });
  }

  agregarEducacion() {
    if (!this.nuevaEducacion.titulo || !this.nuevaEducacion.institucion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const fechaInicio = new Date(this.nuevaEducacion.fecha_inicio);
    const fechaFin = this.nuevaEducacion.fecha_fin ? new Date(this.nuevaEducacion.fecha_fin) : null;

    const educacion: Educacion = {
      id: this.educacion.length + 1,
      institucion: this.nuevaEducacion.institucion,
      ciudad: this.nuevaEducacion.ciudad,
      titulo: this.nuevaEducacion.titulo,
      mes_inicio: fechaInicio.getMonth() + 1,
      ano_inicio: fechaInicio.getFullYear(),
      mes_fin: fechaFin ? fechaFin.getMonth() + 1 : null,
      ano_fin: fechaFin ? fechaFin.getFullYear() : null
    };

    this.educacion.push(educacion);
    this.nuevaEducacion = {
      institucion: '',
      ciudad: '',
      titulo: '',
      mes_inicio: 0,
      ano_inicio: 0,
      mes_fin: null,
      ano_fin: null,
      fecha_inicio: '',
      fecha_fin: ''
    };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Educación agregada correctamente'
    });
  }

  agregarHabilidad() {
    if (!this.nuevaHabilidad.descripcion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa una habilidad'
      });
      return;
    }

    const habilidad: Habilidad = {
      id: this.habilidades.length + 1,
      descripcion: this.nuevaHabilidad.descripcion
    };

    this.habilidades.push(habilidad);
    this.nuevaHabilidad = { descripcion: '' };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Habilidad agregada correctamente'
    });
  }

  agregarCertificado() {
    if (!this.nuevoCertificado.nombre || !this.nuevoCertificado.institucion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const certificado: Certificado = {
      id: this.certificados.length + 1,
      nombre: this.nuevoCertificado.nombre,
      institucion: this.nuevoCertificado.institucion,
      fecha_obtencion: this.nuevoCertificado.fecha_obtencion
    };

    this.certificados.push(certificado);
    this.nuevoCertificado = {
      nombre: '',
      institucion: '',
      fecha_obtencion: ''
    };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Certificado agregado correctamente'
    });
  }

  agregarLogro() {
    if (!this.nuevoLogro.titulo) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa el título del logro'
      });
      return;
    }

    const logro: Logro = {
      id: this.logros.length + 1,
      titulo: this.nuevoLogro.titulo,
      descripcion: this.nuevoLogro.descripcion,
      fecha: this.nuevoLogro.fecha
    };

    this.logros.push(logro);
    this.nuevoLogro = {
      titulo: '',
      descripcion: '',
      fecha: ''
    };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Logro agregado correctamente'
    });
  }

  agregarReferencia() {
    if (!this.nuevaReferencia.nombre || !this.nuevaReferencia.contacto) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const referencia: Referencia = {
      id: this.referencias.length + 1,
      nombre: this.nuevaReferencia.nombre,
      cargo: this.nuevaReferencia.cargo,
      institucion: this.nuevaReferencia.institucion,
      contacto: this.nuevaReferencia.contacto,
      comentario: this.nuevaReferencia.comentario
    };

    this.referencias.push(referencia);
    this.nuevaReferencia = {
      nombre: '',
      cargo: '',
      institucion: '',
      contacto: '',
      comentario: ''
    };

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Referencia agregada correctamente'
    });
  }

  // Métodos para editar
  editarExperiencia(experiencia: Experiencia) {
    this.experienciaEditando = experiencia;
    this.nuevaExperiencia = {
      ...experiencia,
      fecha_inicio: `${experiencia.fecha_inicio_anio}-${String(experiencia.fecha_inicio_mes).padStart(2, '0')}-01`,
      fecha_fin: experiencia.fecha_fin_anio ? `${experiencia.fecha_fin_anio}-${String(experiencia.fecha_fin_mes).padStart(2, '0')}-01` : ''
    };
    this.mostrarCamposExperiencia = true;
  }

  editarEducacion(educacion: Educacion) {
    this.educacionEditando = educacion;
    this.nuevaEducacion = {
      ...educacion,
      fecha_inicio: `${educacion.ano_inicio}-${String(educacion.mes_inicio).padStart(2, '0')}-01`,
      fecha_fin: educacion.ano_fin ? `${educacion.ano_fin}-${String(educacion.mes_fin).padStart(2, '0')}-01` : ''
    };
    this.mostrarCamposEducacion = true;
  }

  editarHabilidad(habilidad: Habilidad) {
    this.habilidadEditando = habilidad;
    this.nuevaHabilidad = { ...habilidad };
    this.mostrarCamposHabilidad = true;
  }

  editarCertificado(certificado: Certificado) {
    this.certificadoEditando = certificado;
    this.nuevoCertificado = { ...certificado };
    this.mostrarCamposCertificado = true;
  }

  editarLogro(logro: Logro) {
    this.logroEditando = logro;
    this.nuevoLogro = { ...logro };
    this.mostrarCamposLogro = true;
  }

  editarReferencia(referencia: Referencia) {
    this.referenciaEditando = referencia;
    this.nuevaReferencia = { ...referencia };
    this.mostrarCamposReferencia = true;
  }

  // Métodos para guardar
  guardarExperiencia() {
    if (!this.nuevaExperiencia.puesto || !this.nuevaExperiencia.empleador) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const fechaInicio = new Date(this.nuevaExperiencia.fecha_inicio);
    const fechaFin = this.nuevaExperiencia.fecha_fin ? new Date(this.nuevaExperiencia.fecha_fin) : null;

    const experiencia: Experiencia = {
      id: this.experienciaEditando?.id || this.experiencias.length + 1,
      puesto: this.nuevaExperiencia.puesto,
      empleador: this.nuevaExperiencia.empleador,
      ciudad: this.nuevaExperiencia.ciudad,
      pais: this.nuevaExperiencia.pais,
      fecha_inicio_mes: fechaInicio.getMonth() + 1,
      fecha_inicio_anio: fechaInicio.getFullYear(),
      fecha_fin_mes: fechaFin ? fechaFin.getMonth() + 1 : null,
      fecha_fin_anio: fechaFin ? fechaFin.getFullYear() : null
    };

    if (this.experienciaEditando) {
      const index = this.experiencias.findIndex(e => e.id === this.experienciaEditando?.id);
      if (index !== -1) {
        this.experiencias[index] = experiencia;
      }
    } else {
      this.experiencias.push(experiencia);
    }

    this.limpiarExperiencia();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.experienciaEditando ? 'Experiencia actualizada correctamente' : 'Experiencia agregada correctamente'
    });
  }

  guardarEducacion() {
    if (!this.nuevaEducacion.titulo || !this.nuevaEducacion.institucion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const fechaInicio = new Date(this.nuevaEducacion.fecha_inicio);
    const fechaFin = this.nuevaEducacion.fecha_fin ? new Date(this.nuevaEducacion.fecha_fin) : null;

    const educacion: Educacion = {
      id: this.educacionEditando?.id || this.educacion.length + 1,
      institucion: this.nuevaEducacion.institucion,
      ciudad: this.nuevaEducacion.ciudad,
      titulo: this.nuevaEducacion.titulo,
      mes_inicio: fechaInicio.getMonth() + 1,
      ano_inicio: fechaInicio.getFullYear(),
      mes_fin: fechaFin ? fechaFin.getMonth() + 1 : null,
      ano_fin: fechaFin ? fechaFin.getFullYear() : null
    };

    if (this.educacionEditando) {
      const index = this.educacion.findIndex(e => e.id === this.educacionEditando?.id);
      if (index !== -1) {
        this.educacion[index] = educacion;
      }
    } else {
      this.educacion.push(educacion);
    }

    this.limpiarEducacion();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.educacionEditando ? 'Educación actualizada correctamente' : 'Educación agregada correctamente'
    });
  }

  guardarHabilidad() {
    if (!this.nuevaHabilidad.descripcion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa una habilidad'
      });
      return;
    }

    const habilidad: Habilidad = {
      id: this.habilidadEditando?.id || this.habilidades.length + 1,
      descripcion: this.nuevaHabilidad.descripcion
    };

    if (this.habilidadEditando) {
      const index = this.habilidades.findIndex(h => h.id === this.habilidadEditando?.id);
      if (index !== -1) {
        this.habilidades[index] = habilidad;
      }
    } else {
      this.habilidades.push(habilidad);
    }

    this.limpiarHabilidad();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.habilidadEditando ? 'Habilidad actualizada correctamente' : 'Habilidad agregada correctamente'
    });
  }

  guardarCertificado() {
    if (!this.nuevoCertificado.nombre || !this.nuevoCertificado.institucion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const certificado: Certificado = {
      id: this.certificadoEditando?.id || this.certificados.length + 1,
      nombre: this.nuevoCertificado.nombre,
      institucion: this.nuevoCertificado.institucion,
      fecha_obtencion: this.nuevoCertificado.fecha_obtencion
    };

    if (this.certificadoEditando) {
      const index = this.certificados.findIndex(c => c.id === this.certificadoEditando?.id);
      if (index !== -1) {
        this.certificados[index] = certificado;
      }
    } else {
      this.certificados.push(certificado);
    }

    this.limpiarCertificado();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.certificadoEditando ? 'Certificado actualizado correctamente' : 'Certificado agregado correctamente'
    });
  }

  guardarLogro() {
    if (!this.nuevoLogro.titulo) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa el título del logro'
      });
      return;
    }

    const logro: Logro = {
      id: this.logroEditando?.id || this.logros.length + 1,
      titulo: this.nuevoLogro.titulo,
      descripcion: this.nuevoLogro.descripcion,
      fecha: this.nuevoLogro.fecha
    };

    if (this.logroEditando) {
      const index = this.logros.findIndex(l => l.id === this.logroEditando?.id);
      if (index !== -1) {
        this.logros[index] = logro;
      }
    } else {
      this.logros.push(logro);
    }

    this.limpiarLogro();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.logroEditando ? 'Logro actualizado correctamente' : 'Logro agregado correctamente'
    });
  }

  guardarReferencia() {
    if (!this.nuevaReferencia.nombre || !this.nuevaReferencia.contacto) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos requeridos'
      });
      return;
    }

    const referencia: Referencia = {
      id: this.referenciaEditando?.id || this.referencias.length + 1,
      nombre: this.nuevaReferencia.nombre,
      cargo: this.nuevaReferencia.cargo,
      institucion: this.nuevaReferencia.institucion,
      contacto: this.nuevaReferencia.contacto,
      comentario: this.nuevaReferencia.comentario
    };

    if (this.referenciaEditando) {
      const index = this.referencias.findIndex(r => r.id === this.referenciaEditando?.id);
      if (index !== -1) {
        this.referencias[index] = referencia;
      }
    } else {
      this.referencias.push(referencia);
    }

    this.limpiarReferencia();
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: this.referenciaEditando ? 'Referencia actualizada correctamente' : 'Referencia agregada correctamente'
    });
  }

  // Métodos para limpiar
  limpiarExperiencia() {
    this.experienciaEditando = null;
    this.nuevaExperiencia = {
      puesto: '',
      empleador: '',
      ciudad: '',
      pais: '',
      fecha_inicio_mes: 0,
      fecha_inicio_anio: 0,
      fecha_fin_mes: null,
      fecha_fin_anio: null,
      fecha_inicio: '',
      fecha_fin: ''
    };
  }

  limpiarEducacion() {
    this.educacionEditando = null;
    this.nuevaEducacion = {
      institucion: '',
      ciudad: '',
      titulo: '',
      mes_inicio: 0,
      ano_inicio: 0,
      mes_fin: null,
      ano_fin: null,
      fecha_inicio: '',
      fecha_fin: ''
    };
  }

  limpiarHabilidad() {
    this.habilidadEditando = null;
    this.nuevaHabilidad = { descripcion: '' };
  }

  limpiarCertificado() {
    this.certificadoEditando = null;
    this.nuevoCertificado = {
      nombre: '',
      institucion: '',
      fecha_obtencion: ''
    };
  }

  limpiarLogro() {
    this.logroEditando = null;
    this.nuevoLogro = {
      titulo: '',
      descripcion: '',
      fecha: ''
    };
  }

  limpiarReferencia() {
    this.referenciaEditando = null;
    this.nuevaReferencia = {
      nombre: '',
      cargo: '',
      institucion: '',
      contacto: '',
      comentario: ''
    };
  }

  cambiarTab(tabId: string) {
    this.tabActivo = tabId;
  }
}
