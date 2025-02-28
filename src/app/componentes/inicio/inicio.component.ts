import { Component, ViewChild } from '@angular/core';
import { DashboardComponent } from "../dashboard/dashboard.component";
import { ControlEscolarComponent } from "../control-escolar/control-escolar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  imports: [ControlEscolarComponent, DashboardComponent, CommonModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
  vistaSeleccionada: string | null = null;
  breadcrumb: string | null = null;

  @ViewChild(DashboardComponent) dashboardComponent!: DashboardComponent;
  @ViewChild(ControlEscolarComponent) controlEscolarComponent!: ControlEscolarComponent;

  seleccionarVista(vista: string) {
    this.vistaSeleccionada = vista;
    this.breadcrumb = vista;
  }

  resetVista() {
    this.vistaSeleccionada = null;
    this.breadcrumb = null;
  }

  resetDashboard() {
    if (this.vistaSeleccionada === 'Mi perfil') {
      this.breadcrumb = 'Mi perfil > Dashboard';
      if (this.dashboardComponent) {
        this.dashboardComponent.resetToDashboard();
      }
    } else if (this.vistaSeleccionada === 'Control escolar') {
      this.breadcrumb = 'Control escolar';
    }
  }

  actualizarBreadcrumb(valor: string | null) {
    if (this.vistaSeleccionada === 'Mi perfil') {
      this.breadcrumb = `Mi perfil > ${valor}`;
    } else if (this.vistaSeleccionada === 'Control escolar') {
      if (valor && valor !== 'Control escolar') {
        this.breadcrumb = `Control escolar > ${valor}`;
      } else {
        this.breadcrumb = 'Control escolar';
      }
    } else {
      this.breadcrumb = valor;
    }
  }

  handleBreadcrumbClick() {
    if (this.breadcrumb?.startsWith('Control escolar >')) {
      if (this.controlEscolarComponent) {
        this.controlEscolarComponent.obtenerGrupos();
      }
    } else {
      this.resetDashboard();
    }
  }
}