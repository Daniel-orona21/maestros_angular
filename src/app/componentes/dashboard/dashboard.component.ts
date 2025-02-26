import { Component } from '@angular/core';
import { DashComponent } from "../pages/dash/dash.component";
import { ExperienciasComponent } from "../pages/experiencias/experiencias.component";
import { EducacionComponent } from "../pages/educacion/educacion.component";
import { HabilidadesComponent } from "../pages/habilidades/habilidades.component";
import { CertificadosComponent } from "../pages/certificados/certificados.component";
import { LogrosComponent } from "../pages/logros/logros.component";
import { ReferenciasComponent } from "../pages/referencias/referencias.component";
import { AjustesComponent } from "../pages/ajustes/ajustes.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [DashComponent, ExperienciasComponent, EducacionComponent, HabilidadesComponent, CertificadosComponent, LogrosComponent, ReferenciasComponent, AjustesComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  selectedComponent: string = 'Dashboard';

  setSelected(component: string) {
    this.selectedComponent = component;
  }
}
