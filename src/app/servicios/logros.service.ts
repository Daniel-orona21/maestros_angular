import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Logro {
  id?: number;
  titulo: string;
  descripcion?: string;
  fecha: string;
  archivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogrosService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerLogros(): Observable<Logro[]> {
    return this.http.get<Logro[]>(`${this.apiUrl}/logros`, {
      headers: this.getHeaders()
    });
  }

  agregarLogro(logro: Logro, archivo?: File): Observable<Logro> {
    const formData = new FormData();
    formData.append('titulo', logro.titulo);
    formData.append('fecha', logro.fecha);
    
    if (logro.descripcion) {
      formData.append('descripcion', logro.descripcion);
    }
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.post<Logro>(`${this.apiUrl}/logros`, formData, {
      headers: this.getHeaders()
    });
  }

  actualizarLogro(id: number, logro: Logro, archivo?: File): Observable<Logro> {
    const formData = new FormData();
    formData.append('titulo', logro.titulo);
    formData.append('fecha', logro.fecha);
    
    if (logro.descripcion) {
      formData.append('descripcion', logro.descripcion);
    }
    
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.put<Logro>(`${this.apiUrl}/logros/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  eliminarLogro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/logros/${id}`, {
      headers: this.getHeaders()
    });
  }
} 