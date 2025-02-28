import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  private apiUrl = 'http://localhost:5001/grupos'; // Ajusta la URL según tu servidor

  constructor(private http: HttpClient) {}

  obtenerGrupos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerAlumnosPorGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${grupoId}/alumnos`);
  }

  eliminarAlumno(alumnoId: number): Observable<any> {
    const url = `http://localhost:5001/alumnos/${alumnoId}`;
    return this.http.delete<any>(url);
  }

  editarAlumno(id: number, nombre: string, apellido: string): Observable<any> {
    const url = `http://localhost:5001/alumnos/${id}`;
    return this.http.put<any>(url, { nombre, apellido });
  }
}