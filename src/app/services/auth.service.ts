import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  especialidad: string;
  foto_perfil: string | null;
  curriculum: string;
  sobre_mi: string;
  creado_en: string;
  origen: string;
  numero_telefono: string;
  domicilio: string;
}

export interface UserUpdateData {
  nombre?: string;
  especialidad?: string;
  origen?: string;
  sobre_mi?: string;
  numero_telefono?: string;
  domicilio?: string;
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

  // Método para solicitar recuperación de contraseña
  requestPasswordReset(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { correo });
  }

  // Método para resetear la contraseña con el token
  resetPassword(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { 
      token, 
      nuevaContrasena 
    });
  }

  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { correo, contrasena });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}); 
  }

  verifyToken(): Observable<any> {
    const token = localStorage.getItem('token');
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
      throw new Error('No hay token');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Usuario>(`${this.apiUrl}/user-info`, { headers }).pipe(
      map(user => ({
        ...user,
        foto_perfil: user.foto_perfil ? `${this.apiUrl}${user.foto_perfil}` : null
      }))
    );
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

  updateProfilePicture(file: File): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token');
    }

    const formData = new FormData();
    formData.append('foto', file);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/update-profile-pic`, formData, { headers }).pipe(
      map((response: any) => ({
        ...response,
        foto_perfil: response.foto_perfil ? `${this.apiUrl}${response.foto_perfil}` : null
      }))
    );
  }
}