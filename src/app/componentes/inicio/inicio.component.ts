import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DashboardComponent } from "../dashboard/dashboard.component";
import { ControlEscolarComponent } from "../control-escolar/control-escolar.component";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inicio',
  imports: [ControlEscolarComponent, DashboardComponent, CommonModule, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
  vistaSeleccionada: string | null = null;
  breadcrumb: string | null = null;
  searchTerm: string = '';
  showSuggestions: boolean = false;
  suggestions: string[] = [
    'Mi perfil',
    'Mis alumnos',
    'Dashboard',
    'Experiencias',
    'Educación',
    'Habilidades',
    'Certificados',
    'Logros',
    'Referencias'
  ];
  filteredSuggestions: string[] = [];
  selectedIndex: number = -1;

  @ViewChild(DashboardComponent) dashboardComponent!: DashboardComponent;
  @ViewChild(ControlEscolarComponent) controlEscolarComponent!: ControlEscolarComponent;
  @ViewChild('searchContainer') searchContainer!: ElementRef;

  constructor(private authService: AuthService, private router: Router) {}

  seleccionarVista(vista: string) {
    this.vistaSeleccionada = vista;
    this.breadcrumb = vista;
    this.searchTerm = '';
    this.showSuggestions = false;
  }

  ngOnInit() {
    this.authService.verifyToken().subscribe({
      next: (response) => {
        console.log('Token válido:', response);
      },
      error: (error) => {
        console.warn('Token inválido:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  resetVista() {
    this.vistaSeleccionada = null;
    this.breadcrumb = null;
    this.searchTerm = '';
    this.showSuggestions = false;
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

  handleBreadcrumbPartClick(part: string, index: number) {
    if (this.breadcrumb?.startsWith('Control escolar')) {
      if (part === 'Control escolar') {
        if (this.controlEscolarComponent) {
          this.controlEscolarComponent.obtenerGrupos();
        }
      }
    } else if (this.breadcrumb?.startsWith('Mi perfil')) {
      if (part === 'Mi perfil') {
        this.resetDashboard();
      }
      // Si es otra parte (Experiencias, Educación, etc.), no hacemos nada
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredSuggestions.length - 1);
        if (this.selectedIndex === -1) this.selectedIndex = 0;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredSuggestions.length) {
          this.selectSuggestion(this.filteredSuggestions[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showSuggestions = false;
        this.selectedIndex = -1;
        break;
    }
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredSuggestions = [...this.suggestions];
    } else {
      this.filteredSuggestions = this.suggestions.filter(s => 
        s.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }
    this.showSuggestions = true;
    this.selectedIndex = -1;
  }

  onFocus() {
    this.showSuggestions = true;
    this.selectedIndex = -1;
    if (!this.searchTerm) {
      this.filteredSuggestions = [...this.suggestions];
    }
  }

  selectSuggestion(suggestion: string) {
    this.selectedIndex = -1;
    if (suggestion === 'Mis alumnos') {
      this.seleccionarVista('Control escolar');
    } else if (suggestion === 'Mi perfil') {
      this.seleccionarVista('Mi perfil');
      if (this.dashboardComponent) {
        this.dashboardComponent.resetToDashboard();
      }
    } else {
      this.seleccionarVista('Mi perfil');
      setTimeout(() => {
        if (this.dashboardComponent) {
          this.dashboardComponent.setSelected(suggestion);
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }

  onBlur() {
    setTimeout(() => {
      if (!this.searchContainer.nativeElement.contains(document.activeElement)) {
        this.showSuggestions = false;
      }
    }, 200);
  }
}