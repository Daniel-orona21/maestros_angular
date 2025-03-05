import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Educacion {
  id?: number;
  usuario_id?: number;
  institucion: string;
  ciudad: string;
  titulo: string;
  especialidad?: string;
  mes_inicio: number;
  ano_inicio: number;
  mes_fin?: number | null;
  ano_fin?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class EducacionService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerEducacion(): Observable<Educacion[]> {
    return this.http.get<Educacion[]>(`${this.apiUrl}/educacion`, { headers: this.getHeaders() });
  }

  agregarEducacion(educacion: Educacion): Observable<any> {
    return this.http.post(`${this.apiUrl}/educacion`, educacion, { headers: this.getHeaders() });
  }

  actualizarEducacion(id: number, educacion: Educacion): Observable<any> {
    return this.http.put(`${this.apiUrl}/educacion/${id}`, educacion, { headers: this.getHeaders() });
  }

  eliminarEducacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/educacion/${id}`, { headers: this.getHeaders() });
  }
} 