import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Certificado {
  id?: number;
  usuario_id?: number;
  nombre: string;
  institucion: string;
  fecha_obtencion: string;
  archivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CertificadosService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerCertificados(): Observable<Certificado[]> {
    return this.http.get<Certificado[]>(`${this.apiUrl}/certificados`, {
      headers: this.getHeaders()
    });
  }

  agregarCertificado(certificado: Certificado, archivo?: File): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', certificado.nombre);
    formData.append('institucion', certificado.institucion);
    formData.append('fecha_obtencion', certificado.fecha_obtencion);
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.post(`${this.apiUrl}/certificados`, formData, {
      headers: this.getHeaders()
    });
  }

  actualizarCertificado(id: number, certificado: Certificado, archivo?: File): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', certificado.nombre);
    formData.append('institucion', certificado.institucion);
    formData.append('fecha_obtencion', certificado.fecha_obtencion);
    if (archivo) {
      formData.append('archivo', archivo);
    }

    return this.http.put(`${this.apiUrl}/certificados/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  eliminarCertificado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/certificados/${id}`, {
      headers: this.getHeaders()
    });
  }
} 