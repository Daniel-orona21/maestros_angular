import { Component, OnInit } from '@angular/core';
import { AuthService, Usuario } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dash.component.html',
  styleUrl: './dash.component.css'
})
export class DashComponent implements OnInit {
  usuario: Usuario | null = null;
  cargando = true;
  error = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarInformacionUsuario();
  }

  cargarInformacionUsuario() {
    this.authService.getUserInfo().subscribe({
      next: (data) => {
        this.usuario = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar información del usuario:', error);
        this.error = true;
        this.cargando = false;
      }
    });
  }
}
