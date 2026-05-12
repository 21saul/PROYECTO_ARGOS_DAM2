// AUTH SERVICE
//
// RESUMEN: SERVICIO QUE ORQUESTA EL REGISTRO Y LOGIN DEL
// USUARIO BAJO EL MODELO ZERO-KNOWLEDGE.
//
// LOGICA DE NEGOCIO:
// REGISTRO: GENERA SALT NUEVO, DERIVA EL auth_hash CON
//   ARGON2ID EN LOCAL, CIFRA UN VAULT BLOB VACIO Y ENVIA AL
//   BACKEND email, auth_hash, kdf_salt, kdf_params Y vault_blob.
// LOGIN: PIDE EL CHALLENGE AL BACKEND (kdf_salt y kdf_params),
//   DERIVA LOCALMENTE EL auth_hash CON LOS MISMOS PARAMETROS Y
//   LO ENVIA. RECIBE JWT Y vault_blob CIFRADO, LOS GUARDA EN
//   STORAGE.
//
// EL SERVIDOR NUNCA VE LA CONTRASENA MAESTRA.

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL CLIENTE HTTP CENTRAL
import { ApiService } from './api.service';
// IMPORTACION DEL SERVICIO DE CIFRADO Y SU TIPADO
import { CryptoService, KdfParams } from './crypto.service';
// IMPORTACION DE RXJS PARA EXPONER EL USUARIO ACTUAL
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

// RESPUESTA DEL ENDPOINT DE CHALLENGE
interface ChallengeResponse {
  // SALT HEXADECIMAL DEL USUARIO PERSISTIDO EN EL SERVER
  kdf_salt: string;
  // ALGORITMO USADO (ESPERADO: argon2id)
  kdf_algorithm: string;
  // PARAMETROS DE DERIVACION USADOS EN EL REGISTRO
  kdf_params: KdfParams;
}

// RESPUESTA DE LOGIN O REGISTRO
interface AuthResponse {
  // ID NUMERICO DEL USUARIO
  user_id: number;
  // EMAIL DEL USUARIO REGISTRADO O LOGUEADO
  email: string;
  // JWT EMITIDO POR EL BACKEND
  token: string;
  // BLOB CIFRADO DE LA BOVEDA (PUEDE FALTAR EN REGISTRO INICIAL)
  vault_blob?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // CLAVE EN STORAGE DEL SALT DEL USUARIO
  private readonly SALT_KEY = 'argos-kdf-salt';

  // CLAVE EN STORAGE DEL VAULT BLOB CIFRADO
  private readonly VAULT_BLOB_KEY = 'argos-vault-blob';

  // ESTADO REACTIVO DE LA SESION (EMAIL O NULL SI ANONIMO)
  private currentUser$ = new BehaviorSubject<string | null>(null);

  // REFERENCIA EN MEMORIA A LA CLAVE DE CIFRADO DERIVADA
  // VOLATIL: SE PIERDE AL RECARGAR LA APP (Y ESO ES INTENCIONAL)
  private encryptionKey: CryptoKey | null = null;

  // CONSTRUCTOR QUE INYECTA LOS SERVICIOS DEPENDIENTES
  constructor(
    private api: ApiService,
    private crypto: CryptoService,
  ) {}

  // OBSERVABLE DEL USUARIO ACTUALMENTE LOGUEADO
  get user(): Observable<string | null> {
    return this.currentUser$.asObservable();
  }

  // REGISTRA UN NUEVO USUARIO CON LA CONTRASENA MAESTRA
  async register(email: string, password: string): Promise<AuthResponse> {
    // GENERA UN SALT NUEVO PARA EL USUARIO
    const salt = this.crypto.generateSalt();

    // PARAMETROS POR DEFECTO DE ARGON2ID PARA EL REGISTRO
    const kdfParams: KdfParams = {
      memory_cost: 65536,
      time_cost: 3,
      parallelism: 1,
    };

    // DERIVA EL auth_hash CON LA CONTRASENA Y EL SALT
    const authHash = await this.crypto.deriveAuthHash(password, salt, kdfParams);

    // DERIVA TAMBIEN LA CLAVE DE CIFRADO QUE QUEDA EN MEMORIA
    this.encryptionKey = await this.crypto.deriveEncryptionKey(password, salt);

    // CIFRA UN VAULT INICIAL VACIO PARA QUE SE ALMACENE EN EL SERVER
    const emptyVault = JSON.stringify({ items: [], folders: [], version: 1 });
    const vaultBlob = await this.crypto.encrypt(emptyVault, this.encryptionKey);

    // LLAMA AL ENDPOINT DE REGISTRO DEL BACKEND ESPERANDO LA RESPUESTA
    const response = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/register', {
        email,
        auth_hash: authHash,
        kdf_salt: salt,
        kdf_params: kdfParams,
        vault_blob: vaultBlob,
      }),
    );

    // PROTECCION FRENTE A RESPUESTA VACIA INESPERADA
    if (!response) {
      throw new Error('Respuesta vacia del servidor');
    }

    // GUARDA EL JWT, SALT Y VAULT BLOB EN STORAGE
    this.api.setToken(response.token);
    localStorage.setItem(this.SALT_KEY, salt);
    if (response.vault_blob) {
      localStorage.setItem(this.VAULT_BLOB_KEY, response.vault_blob);
    } else {
      // SI EL SERVER NO DEVUELVE BLOB GUARDAMOS EL QUE ACABAMOS DE CIFRAR
      localStorage.setItem(this.VAULT_BLOB_KEY, vaultBlob);
    }

    // EMITE EL USUARIO ACTUAL EN EL OBSERVABLE
    this.currentUser$.next(email);

    return response;
  }

  // INICIA SESION CON LA CONTRASENA MAESTRA
  async login(email: string, password: string): Promise<AuthResponse> {
    // PIDE EL CHALLENGE AL BACKEND CON EL EMAIL
    const challenge = await firstValueFrom(
      this.api.get<ChallengeResponse>('/auth/challenge', { email }),
    );

    // PROTECCION FRENTE A CHALLENGE NULO
    if (!challenge) {
      throw new Error('No se pudo obtener el challenge');
    }

    // DERIVA EL auth_hash LOCALMENTE CON LOS PARAMETROS RECIBIDOS
    const authHash = await this.crypto.deriveAuthHash(
      password,
      challenge.kdf_salt,
      challenge.kdf_params,
    );

    // DERIVA LA CLAVE DE CIFRADO PARA USAR EN LA BOVEDA
    this.encryptionKey = await this.crypto.deriveEncryptionKey(
      password,
      challenge.kdf_salt,
    );
    // LOG DIAGNOSTICO: CONFIRMA QUE LA CLAVE QUEDA EN MEMORIA TRAS DERIVAR
    console.log('[AuthService] encryptionKey derivada y guardada en memoria');

    // ENVIA LAS CREDENCIALES AL BACKEND
    const response = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/login', {
        email,
        auth_hash: authHash,
      }),
    );

    // PROTECCION FRENTE A RESPUESTA VACIA
    if (!response) {
      throw new Error('Respuesta vacia del servidor');
    }

    // GUARDA EL JWT Y EL VAULT BLOB EN STORAGE
    this.api.setToken(response.token);
    localStorage.setItem(this.SALT_KEY, challenge.kdf_salt);
    if (response.vault_blob) {
      localStorage.setItem(this.VAULT_BLOB_KEY, response.vault_blob);
    }

    // EMITE EL USUARIO ACTUAL
    this.currentUser$.next(email);

    return response;
  }

  // CIERRA SESION LIMPIANDO STORAGE Y MEMORIA
  logout(): void {
    // ELIMINA EL JWT
    this.api.clearToken();
    // ELIMINA EL SALT GUARDADO
    localStorage.removeItem(this.SALT_KEY);
    // ELIMINA EL BLOB CIFRADO
    localStorage.removeItem(this.VAULT_BLOB_KEY);
    // PURGA LA CLAVE DE CIFRADO DE MEMORIA
    this.encryptionKey = null;
    // EMITE QUE YA NO HAY USUARIO LOGUEADO
    this.currentUser$.next(null);
  }

  // INDICA SI EL USUARIO TIENE UNA SESION ACTIVA
  isAuthenticated(): boolean {
    return this.api.getToken() !== null;
  }

  // DEVUELVE LA CLAVE DE CIFRADO EN MEMORIA (NULL SI NO HAY SESION)
  getEncryptionKey(): CryptoKey | null {
    return this.encryptionKey;
  }
}
