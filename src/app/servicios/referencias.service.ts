import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Referencia {
  id?: number;
  usuario_id?: number;
  nombre: string;
  cargo?: string;
  institucion?: string;
  contacto: string;
  comentario?: string;
  archivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReferenciasService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerReferencias(): Observable<Referencia[]> {
    return this.http.get<Referencia[]>(`${this.apiUrl}/referencias`, {
      headers: this.getHeaders()
    });
  }

  agregarReferencia(referencia: Referencia, archivo?: File): Observable<Referencia> {
    const formData = new FormData();
    formData.append('nombre', referencia.nombre);
    formData.append('contacto', referencia.contacto);
    
    if (referencia.cargo) {
      formData.append('cargo', referencia.cargo);
    }
    if (referencia.institucion) {
      formData.append('institucion', referencia.institucion);
    }
    if (referencia.comentario) {
      formData.append('comentario', referencia.comentario);
    }
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.post<Referencia>(`${this.apiUrl}/referencias`, formData, {
      headers: this.getHeaders()
    });
  }

  actualizarReferencia(id: number, referencia: Referencia, archivo?: File): Observable<Referencia> {
    const formData = new FormData();
    formData.append('nombre', referencia.nombre);
    formData.append('contacto', referencia.contacto);
    
    if (referencia.cargo) {
      formData.append('cargo', referencia.cargo);
    }
    if (referencia.institucion) {
      formData.append('institucion', referencia.institucion);
    }
    if (referencia.comentario) {
      formData.append('comentario', referencia.comentario);
    }
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.put<Referencia>(`${this.apiUrl}/referencias/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  eliminarReferencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/referencias/${id}`, {
      headers: this.getHeaders()
    });
  }
} 