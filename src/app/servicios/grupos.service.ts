import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  private apiUrl = 'http://localhost:3000'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  obtenerAlumnosDeGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/grupos/${grupoId}/alumnos`);
  }

  agregarAlumno(grupoId: number, alumno: { nombre: string, apellido: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/grupos/${grupoId}/alumnos`, alumno);
  }

  guardarAsistencias(asistencias: { alumno_id: number, fecha: string, estado: 'PRESENTE' | 'AUSENTE' | 'RETARDO' }[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/asistencias`, { asistencias });
  }
} 