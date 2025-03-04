import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5001'; // URL de tu backend

  constructor(private http: HttpClient) {}

  // Registro de usuario
  register(nombre: string, correo: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { nombre, correo, contrasena });
  }

  // Login sin validación de captcha
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { correo, contrasena });
  }

  // Cerrar sesión
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}); 
  }

  // Verificar si el token es válido
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
}

