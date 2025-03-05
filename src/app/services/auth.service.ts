import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  especialidad: string;
  foto_perfil: string;
  curriculum: string;
  sobre_mi: string;
  creado_en: string;
  origen: string;
}

export interface UserUpdateData {
  nombre?: string;
  especialidad?: string;
  origen?: string;
  sobre_mi?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  register(nombre: string, correo: string, contrasena: string, captchaToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { 
      nombre, 
      correo, 
      contrasena,
      captchaToken 
    });
  }

  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { correo, contrasena });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}); 
  }

  verifyToken(): Observable<any> {
    const token = localStorage.getItem('token'); // Obtener el token almacenado
    if (!token) {
      return new Observable(observer => {
        observer.error({ error: 'Token no encontrado' });
      });
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/verify-token`, { headers });
  }

  getUserInfo(): Observable<Usuario> {
    const token = localStorage.getItem('token');
    if (!token) {
      return new Observable(observer => {
        observer.error({ error: 'Token no encontrado' });
      });
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Usuario>(`${this.apiUrl}/user-info`, { headers });
  }

  updateUserInfo(data: UserUpdateData): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      return new Observable(observer => {
        observer.error({ error: 'Token no encontrado' });
      });
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/user-info`, data, { headers });
  }
}