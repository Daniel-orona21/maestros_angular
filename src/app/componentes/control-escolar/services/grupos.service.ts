import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
}

interface Asistencia {
  alumno_id: number;
  fecha: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'RETARDO';
}

interface AsistenciaResponse {
  message: string;
  affectedRows: number;
}

interface AsistenciaDetalle {
  alumno_id: number;
  fecha: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  obtenerGrupos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-grupos`, { headers: this.getHeaders() });
  }

  obtenerAlumnosPorGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/grupos/${grupoId}/alumnos`, { headers: this.getHeaders() });
  }

  eliminarAlumno(alumnoId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/alumnos/${alumnoId}`, { headers: this.getHeaders() });
  }

  editarAlumno(id: number, nombre: string, apellido: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/alumnos/${id}`, { nombre, apellido }, { headers: this.getHeaders() });
  }

  agregarAlumno(grupoId: number, alumno: { nombre: string, apellido: string }): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.apiUrl}/grupos/${grupoId}/alumnos`, alumno, { headers: this.getHeaders() });
  }

  agregarGrupo(grupo: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/grupos`, grupo, { headers: this.getHeaders() });
  }

  actualizarGrupo(id: number, grupo: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/grupos/${id}`, grupo, { headers: this.getHeaders() });
  }

  eliminarGrupo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/grupos/${id}`, { headers: this.getHeaders() });
  }

  guardarAsistencias(asistencias: Asistencia[]): Observable<AsistenciaResponse> {
    return this.http.post<AsistenciaResponse>(
      `${this.apiUrl}/asistencias`,
      { asistencias },
      { headers: this.getHeaders() }
    );
  }

  actualizarAsistencias(asistencias: Asistencia[]): Observable<AsistenciaResponse> {
    return this.http.put<AsistenciaResponse>(
      `${this.apiUrl}/asistencias`,
      { asistencias },
      { headers: this.getHeaders() }
    );
  }

  verificarAsistencias(grupoId: number, fecha: string): Observable<boolean> {
    return this.http.get<{ existe: boolean }>(
      `${this.apiUrl}/grupos/${grupoId}/asistencias/${fecha}`,
      { headers: this.getHeaders() }
    ).pipe(map(response => response.existe));
  }

  obtenerAsistenciasPorFecha(grupoId: number, fecha: string): Observable<AsistenciaDetalle[]> {
    return this.http.get<AsistenciaDetalle[]>(
      `${this.apiUrl}/grupos/${grupoId}/asistencias/fecha/${fecha}`,
      { headers: this.getHeaders() }
    );
  }
}