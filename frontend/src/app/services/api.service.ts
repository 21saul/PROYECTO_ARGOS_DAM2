// API SERVICE
//
// RESUMEN: SERVICIO CLIENTE HTTP CENTRAL QUE ENCAPSULA LAS
// LLAMADAS AL BACKEND DE ARGOS. APLICA AUTOMATICAMENTE EL
// HEADER Authorization CON EL JWT GUARDADO EN STORAGE Y
// NORMALIZA EL FORMATO DE RESPUESTA {success, data, error}.
//
// LOGICA DE NEGOCIO: TODAS LAS LLAMADAS AL BACKEND PASAN POR
// AQUI. SI EL JWT EXISTE LO INYECTA AUTOMATICAMENTE. SI LA
// RESPUESTA TRAE success:false LANZA EL error PARA QUE EL
// COMPONENTE LO RECOJA.
//
// RELACIONES:
// - AuthService, VaultService, AuditorService, NewsService

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL CLIENTE HTTP Y TIPOS RELACIONADOS
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
// IMPORTACION DE OBSERVABLE Y UTILIDADES RXJS
import { Observable, throwError } from 'rxjs';
// IMPORTACION DE OPERADORES RXJS PARA TRANSFORMAR FLUJOS
import { catchError, map } from 'rxjs/operators';
// IMPORTACION DE LA CONFIGURACION DE ENTORNO
import { environment } from '../../environments/environment';

// FORMATO ESTANDAR DE RESPUESTA DEL BACKEND
export interface ApiResponse<T> {
  // INDICA SI LA OPERACION FUE EXITOSA
  success: boolean;
  // PAYLOAD DEVUELTO POR EL ENDPOINT O NULL SI ERROR
  data: T | null;
  // INFORMACION DE ERROR O NULL SI EXITO
  error: ApiError | null;
}

// ESTRUCTURA DE ERROR ESTANDAR DEL BACKEND
export interface ApiError {
  // CODIGO MAQUINA-LEGIBLE DEL ERROR
  code: string;
  // MENSAJE LEGIBLE EN ESPANOL
  message: string;
  // DETALLES OPCIONALES (POR EJEMPLO ERRORES DE VALIDACION)
  details?: any;
}

@Injectable({ providedIn: 'root' })
export class ApiService {

  // URL BASE DEL BACKEND DESDE LA CONFIGURACION DE ENTORNO
  private readonly baseUrl = environment.apiBaseUrl;

  // CLAVE EN LOCALSTORAGE DONDE SE GUARDA EL JWT
  private readonly TOKEN_KEY = 'argos-jwt';

  // CONSTRUCTOR QUE INYECTA EL HTTPCLIENT DE ANGULAR
  constructor(private http: HttpClient) {}

  // GUARDA EL JWT EN STORAGE TRAS LOGIN O REGISTER
  setToken(token: string): void {
    // PERSISTE EL TOKEN EN LOCALSTORAGE BAJO LA CLAVE DEFINIDA
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // RECUPERA EL JWT GUARDADO O NULL SI NO EXISTE
  getToken(): string | null {
    // LEE EL TOKEN DESDE LOCALSTORAGE
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ELIMINA EL JWT (USADO EN LOGOUT)
  clearToken(): void {
    // BORRA LA ENTRADA DEL TOKEN EN LOCALSTORAGE
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // CONSTRUYE LOS HEADERS BASE CON CONTENT-TYPE Y AUTHORIZATION
  private buildHeaders(): HttpHeaders {
    // CABECERAS BASE CON CONTENT-TYPE JSON
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // INYECTA EL HEADER AUTHORIZATION SI HAY JWT GUARDADO
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // DEVUELVE EL HEADERSET CONFIGURADO
    return headers;
  }

  // PETICION GET A UN ENDPOINT DEL BACKEND
  get<T>(path: string, params?: any): Observable<T> {
    // EJECUTA EL GET CON HEADERS Y PARAMS, EXTRAE data Y NORMALIZA ERRORES
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
      params: params,
    }).pipe(
      map(response => this.extractData(response)),
      catchError(error => this.handleError(error)),
    );
  }

  // PETICION POST A UN ENDPOINT DEL BACKEND
  post<T>(path: string, body: any): Observable<T> {
    // EJECUTA EL POST CON BODY JSON, EXTRAE data Y NORMALIZA ERRORES
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.buildHeaders(),
    }).pipe(
      map(response => this.extractData(response)),
      catchError(error => this.handleError(error)),
    );
  }

  // PETICION PUT A UN ENDPOINT DEL BACKEND
  put<T>(path: string, body: any): Observable<T> {
    // EJECUTA EL PUT PARA ACTUALIZAR UN RECURSO EXISTENTE
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.buildHeaders(),
    }).pipe(
      map(response => this.extractData(response)),
      catchError(error => this.handleError(error)),
    );
  }

  // PETICION DELETE A UN ENDPOINT DEL BACKEND
  delete<T>(path: string): Observable<T> {
    // EJECUTA EL DELETE PARA ELIMINAR UN RECURSO
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`, {
      headers: this.buildHeaders(),
    }).pipe(
      map(response => this.extractData(response)),
      catchError(error => this.handleError(error)),
    );
  }

  // EXTRAE EL CAMPO data DE LA RESPUESTA O LANZA EL ERROR
  private extractData<T>(response: ApiResponse<T>): T {
    // SI EL BACKEND INDICA FALLO LANZAMOS EL ERROR ESTRUCTURADO
    if (!response.success || response.error) {
      throw response.error || { code: 'UNKNOWN', message: 'Error desconocido' };
    }
    // EN EXITO DEVOLVEMOS EL PAYLOAD TIPADO
    return response.data as T;
  }

  // NORMALIZA LOS ERRORES HTTP A UN FORMATO ESTANDAR
  private handleError(error: HttpErrorResponse): Observable<never> {
    // CONTENEDOR DEL ERROR NORMALIZADO QUE SE PROPAGA
    let normalizedError: ApiError;

    // SI EL BACKEND DEVOLVIO UN ERROR ESTRUCTURADO LO USAMOS
    if (error.error && error.error.error) {
      normalizedError = error.error.error;
    } else if (error.status === 0) {
      // ERROR DE RED O CORS (NO LLEGO RESPUESTA HTTP)
      normalizedError = {
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor',
      };
    } else if (error.status === 401) {
      // TOKEN AUSENTE O INVALIDO
      normalizedError = {
        code: 'UNAUTHORIZED',
        message: 'Sesion no autenticada',
      };
    } else {
      // CUALQUIER OTRO ERROR HTTP NO MAPEADO
      normalizedError = {
        code: 'HTTP_ERROR',
        message: `Error HTTP ${error.status}`,
      };
    }

    // PROPAGA EL ERROR NORMALIZADO POR EL OBSERVABLE
    return throwError(() => normalizedError);
  }
}
