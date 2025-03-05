import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Experiencia {
  id?: number;
  usuario_id?: number;
  puesto: string;
  empleador: string;
  ciudad: string;
  pais: string;
  fecha_inicio_mes: number;
  fecha_inicio_anio: number;
  fecha_fin_mes?: number | null;
  fecha_fin_anio?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ExperienciaService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerExperiencias(): Observable<Experiencia[]> {
    return this.http.get<Experiencia[]>(`${this.apiUrl}/experiencias`, { headers: this.getHeaders() });
  }

  agregarExperiencia(experiencia: Experiencia): Observable<any> {
    return this.http.post(`${this.apiUrl}/experiencias`, experiencia, { headers: this.getHeaders() });
  }

  actualizarExperiencia(id: number, experiencia: Experiencia): Observable<any> {
    return this.http.put(`${this.apiUrl}/experiencias/${id}`, experiencia, { headers: this.getHeaders() });
  }

  eliminarExperiencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/experiencias/${id}`, { headers: this.getHeaders() });
  }
} 