import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = 'http://localhost:5001';

  constructor(private http: HttpClient) {}

  // Método privado para obtener headers con token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener los tipos de logs disponibles
  getLogTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/logs/types`, {
      headers: this.getHeaders()
    });
  }

  // Obtener el contenido de un log específico
  getLogContent(logName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/logs/${logName}`, {
      headers: this.getHeaders()
    });
  }

  // Descargar un archivo de log
  downloadLog(logName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/logs/${logName}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  // Generar un reporte completo de todos los logs
  downloadAllLogs(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/logs/combined/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
} 