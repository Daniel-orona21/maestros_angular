import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Habilidad {
  id?: number;
  usuario_id?: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabilidadesService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerHabilidades(): Observable<Habilidad[]> {
    return this.http.get<Habilidad[]>(`${this.apiUrl}/habilidades`, { headers: this.getHeaders() });
  }

  agregarHabilidades(habilidades: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/habilidades`, { habilidades }, { headers: this.getHeaders() });
  }

  actualizarHabilidad(id: number, descripcion: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/habilidades/${id}`, { descripcion }, { headers: this.getHeaders() });
  }

  eliminarHabilidad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/habilidades/${id}`, { headers: this.getHeaders() });
  }
} 