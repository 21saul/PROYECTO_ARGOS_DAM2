// AUDITOR SERVICE
//
// RESUMEN: GESTIONA EL AUDITOR DE IDENTIDAD DIGITAL.
// CONSULTA HIBP CON K-ANONYMITY, REGISTRA EL PRIVACY SCORE
// EN EL HISTORICO Y RECUPERA LA EVOLUCION TEMPORAL.
//
// LOGICA DE NEGOCIO: PARA VERIFICAR SI UNA CONTRASENA APARECE
// EN FILTRACIONES SE CALCULA EL HASH SHA-1 EN EL CLIENTE Y SOLO
// SE ENVIAN LOS 5 PRIMEROS CHARS. EL BACKEND CONSULTA HIBP CON
// ESE PREFIJO Y DEVUELVE LOS HASHES COMPLETOS QUE COMPARTEN ESE
// PREFIJO. EL CLIENTE COMPARA EL RESTO DEL HASH CONTRA LA LISTA
// EN LOCAL. ASI NUNCA VIAJA EL HASH COMPLETO POR LA RED.
//
// RELACIONES:
// - ApiService (CLIENTE HTTP CENTRAL)
// - AuditorPage (CONSUMIDOR EN UI)

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL SERVICIO CLIENTE HTTP CENTRAL
import { ApiService } from './api.service';

// RESULTADO DE LA CONSULTA HIBP
export interface HibpCheckResult {
  // INDICA SI LA CONTRASENA APARECE EN FILTRACIONES
  found: boolean;
  // NUMERO DE VECES QUE APARECIO EN BRECHAS DE DATOS
  occurrences: number;
}

// REGISTRO HISTORICO DE PRIVACY SCORE
export interface PrivacyScoreRecord {
  // IDENTIFICADOR DEL REGISTRO EN EL BACKEND
  id: number;
  // PUNTUACION GLOBAL DE PRIVACIDAD (0-100)
  score: number;
  // PUNTUACION DEL PILAR DE IDENTIDAD
  identity_score: number;
  // PUNTUACION DEL PILAR DE CONTRASENAS
  passwords_score: number;
  // PUNTUACION DEL PILAR DE DISPOSITIVO
  device_score: number;
  // TIMESTAMP DE CUANDO SE REGISTRO LA PUNTUACION
  recorded_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuditorService {

  // CONSTRUCTOR QUE INYECTA EL CLIENTE HTTP CENTRAL
  constructor(private api: ApiService) {}

  // COMPRUEBA SI UNA CONTRASENA APARECE EN FILTRACIONES HIBP
  async checkPassword(password: string): Promise<HibpCheckResult> {
    // CALCULA EL HASH SHA-1 DE LA CONTRASENA EN EL CLIENTE
    const hashFull = await this.sha1(password);

    // EXTRAE PREFIJO (5 CHARS) Y SUFIJO (RESTO)
    const prefix = hashFull.substring(0, 5).toUpperCase();
    const suffix = hashFull.substring(5).toUpperCase();

    // PIDE AL BACKEND LA LISTA DE HASHES CON ESE PREFIJO
    const response = await this.api.get<any>(`/auditor/hibp/${prefix}`).toPromise();

    // BUSCA EL SUFIJO EN LA LISTA LOCALMENTE
    const match = (response?.matches ?? []).find(
      (m: any) => m.suffix === suffix
    );

    // SI EL SUFIJO APARECE EN LA LISTA LA CONTRASENA ESTA FILTRADA
    if (match) {
      return { found: true, occurrences: match.count };
    }

    // SI NO HAY COINCIDENCIA LA CONTRASENA NO APARECE EN FILTRACIONES
    return { found: false, occurrences: 0 };
  }

  // GUARDA UN NUEVO REGISTRO DE PRIVACY SCORE
  async saveScore(score: {
    score: number;
    identity_score: number;
    passwords_score: number;
    device_score: number;
  }): Promise<{ id: number; recorded_at: string }> {
    // DELEGA EN EL CLIENTE HTTP CENTRAL ENVIANDO EL PAYLOAD
    return this.api.post<any>('/auditor/score', score).toPromise();
  }

  // RECUPERA EL HISTORICO DE LAS ULTIMAS N SEMANAS
  async getScoreHistory(weeks: number = 8): Promise<PrivacyScoreRecord[]> {
    // PIDE AL BACKEND EL HISTORICO LIMITADO POR EL PARAMETRO weeks
    const result = await this.api.get<any>('/auditor/score/history', { weeks }).toPromise();
    // DEVUELVE EL ARRAY history O VACIO SI NO LLEGA
    return result?.history ?? [];
  }

  // RECUPERA EL ULTIMO SCORE REGISTRADO
  async getLatestScore(): Promise<PrivacyScoreRecord | null> {
    // ENVUELVE EN TRY/CATCH PORQUE SI NO HAY REGISTROS DEVOLVEMOS NULL
    try {
      const result = await this.api.get<PrivacyScoreRecord>('/auditor/score/latest').toPromise();
      return result ?? null;
    } catch {
      // CUALQUIER ERROR (404 SIN REGISTROS) SE TRATA COMO AUSENCIA
      return null;
    }
  }

  // SEED DE DATOS HISTORICOS PARA QUE EL GRAFICO NO SE VEA VACIO
  // INSERTA 8 PUNTOS SEMANALES SIMULANDO UNA EVOLUCION REALISTA
  async seedDemoHistory(): Promise<void> {
    // VERIFICA SI YA HAY HISTORICO PARA NO DUPLICAR
    const existing = await this.getScoreHistory(8);
    if (existing.length > 0) return;

    // 8 PUNTOS SEMANALES CON UNA EVOLUCION REALISTA
    // EL USUARIO MEJORA PROGRESIVAMENTE SU PRIVACY SCORE
    const seedPoints = [
      { score: 42, identity_score: 38, passwords_score: 35, device_score: 55 },
      { score: 48, identity_score: 42, passwords_score: 42, device_score: 60 },
      { score: 54, identity_score: 48, passwords_score: 48, device_score: 66 },
      { score: 58, identity_score: 52, passwords_score: 55, device_score: 68 },
      { score: 62, identity_score: 58, passwords_score: 60, device_score: 70 },
      { score: 67, identity_score: 65, passwords_score: 65, device_score: 72 },
      { score: 70, identity_score: 70, passwords_score: 68, device_score: 75 },
      { score: 73, identity_score: 75, passwords_score: 70, device_score: 78 },
    ];

    // INSERTA SECUENCIALMENTE LOS 8 PUNTOS
    // EL BACKEND USA recorded_at = NOW() ASI QUE QUEDARAN MUY JUNTOS
    // EN EL TIEMPO PERO ESO ES SUFICIENTE PARA QUE EL GRAFICO SE VEA
    for (const point of seedPoints) {
      await this.saveScore(point);
    }
  }

  // CALCULA EL HASH SHA-1 DE UNA CADENA EN EL CLIENTE
  private async sha1(text: string): Promise<string> {
    // CODIFICA LA CADENA EN BYTES UTF-8
    const encoded = new TextEncoder().encode(text);
    // CALCULA EL HASH BINARIO MEDIANTE LA WEB CRYPTO API
    const buffer = await crypto.subtle.digest('SHA-1', encoded);
    // CONVIERTE EL BUFFER A STRING HEX EN MINUSCULAS
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
