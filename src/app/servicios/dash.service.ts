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
  curriculum: string | null;
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
export class DashService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  getApiUrl(): string {
    return this.apiUrl;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getUserInfo(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/user-info`, {
      headers: this.getHeaders()
    }).pipe(
      map(user => ({
        ...user,
        foto_perfil: user.foto_perfil ? `${this.apiUrl}${user.foto_perfil}` : null,
        curriculum: user.curriculum ? `${this.apiUrl}${user.curriculum}` : null
      }))
    );
  }

  updateUserInfo(data: UserUpdateData): Observable<any> {
    return this.http.put(`${this.apiUrl}/user-info`, data, {
      headers: this.getHeaders()
    });
  }

  updateProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post(`${this.apiUrl}/update-profile-pic`, formData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => ({
        ...response,
        foto_perfil: response.foto_perfil ? `${this.apiUrl}${response.foto_perfil}` : null
      }))
    );
  }

  updateCurriculum(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('curriculum', file);

    return this.http.post(`${this.apiUrl}/update-curriculum`, formData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => ({
        ...response,
        curriculum: response.curriculum ? `${this.apiUrl}${response.curriculum}` : null
      }))
    );
  }

  deleteCurriculum(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-curriculum`, {
      headers: this.getHeaders()
    });
  }
} 