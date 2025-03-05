import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-experiencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experiencias.component.html',
  styleUrl: './experiencias.component.css'
})
export class ExperienciasComponent {
  mostrarModal = false;
  experienciaSeleccionada: any = null;
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

  abrirModal() {
    this.mostrarModal = true;
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

  cerrarModal() {
    this.mostrarModal = false;
    this.experienciaSeleccionada = null;
  }

  guardarExperiencia() {
    // Aquí irá la lógica para guardar la experiencia
    this.cerrarModal();
  }
}
