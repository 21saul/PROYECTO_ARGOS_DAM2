// CRYPTO SERVICE
//
// RESUMEN: SERVICIO QUE ENCAPSULA TODA LA CRIPTOGRAFIA DEL
// CLIENTE BAJO EL MODELO ZERO-KNOWLEDGE. DERIVA CLAVES CON
// ARGON2ID (LIBRERIA hash-wasm) Y CIFRA/DESCIFRA DATOS CON
// AES-256-GCM USANDO LA WEB CRYPTO API NATIVA DEL NAVEGADOR.
//
// LOGICA DE NEGOCIO: LA CONTRASENA MAESTRA DEL USUARIO NUNCA
// SALE DEL CLIENTE. SE DERIVA CON ARGON2ID (m=64MB, t=3, p=1)
// USANDO UN SALT PERSISTENTE DEVUELTO POR EL CHALLENGE DEL
// SERVIDOR. EL HASH DERIVADO ACTUA COMO auth_hash DE LOGIN.
// LOS DATOS DE LA BOVEDA SE CIFRAN CON UNA CLAVE DERIVADA
// CON UN SALT INDEPENDIENTE MEDIANTE AES-256-GCM CON IV
// ALEATORIO POR CIFRADO.
//
// LIBRERIA: hash-wasm — IMPLEMENTACION DE ARGON2ID EN
// WEBASSEMBLY COMPATIBLE CON VITE Y BUNDLES MODERNOS.

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL ALGORITMO ARGON2ID DE LA LIBRERIA hash-wasm
import { argon2id } from 'hash-wasm';

// PARAMETROS DE ARGON2ID DOCUMENTADOS EN .ENV DEL BACKEND
export interface KdfParams {
  // COSTE DE MEMORIA EN KIBIBYTES (65536 == 64 MIB)
  memory_cost: number;
  // NUMERO DE ITERACIONES (TIME COST)
  time_cost: number;
  // GRADO DE PARALELISMO (LANES)
  parallelism: number;
}

// VALORES POR DEFECTO SI EL CLIENTE NO RECIBE PARAMS DEL SERVER
const DEFAULT_KDF_PARAMS: KdfParams = {
  // 64 MIB DE MEMORIA SEGUN RECOMENDACION RFC 9106
  memory_cost: 65536,
  // 3 ITERACIONES POR DEFECTO
  time_cost: 3,
  // SIN PARALELISMO (1 LANE) PARA COMPATIBILIDAD NAVEGADOR
  parallelism: 1,
};

@Injectable({ providedIn: 'root' })
export class CryptoService {

  // GENERA UN SALT HEXADECIMAL ALEATORIO DE 32 BYTES
  generateSalt(): string {
    // RESERVA UN BUFFER DE 32 BYTES PARA EL SALT
    const bytes = new Uint8Array(32);
    // LLENA EL BUFFER CON BYTES CRIPTOGRAFICAMENTE SEGUROS
    crypto.getRandomValues(bytes);
    // CONVIERTE EL BUFFER A REPRESENTACION HEXADECIMAL
    return this.bytesToHex(bytes);
  }

  // DERIVA EL auth_hash DESDE LA CONTRASENA MAESTRA Y EL SALT
  // DEVUELVE LA SALIDA RAW EN HEXADECIMAL PARA ENVIARLA AL SERVER
  async deriveAuthHash(
    password: string,
    salt: string,
    params: KdfParams = DEFAULT_KDF_PARAMS,
  ): Promise<string> {
    // EJECUTA ARGON2ID CON LOS PARAMETROS ACORDADOS CON EL BACKEND
    const hash = await argon2id({
      password,
      salt: this.hexToBytes(salt),
      iterations: params.time_cost,
      memorySize: params.memory_cost,
      parallelism: params.parallelism,
      hashLength: 32,
      outputType: 'hex',
    });
    // DEVUELVE EL HASH EN HEX (NO EL ENCODING DE ARGON2 CON PARAMS)
    return hash;
  }

  // DERIVA LA CLAVE AES-256 DESDE LA CONTRASENA MAESTRA
  // USAMOS UN PREFIJO 'ENC' EN EL SALT PARA SEPARAR DOMINIOS
  async deriveEncryptionKey(
    password: string,
    salt: string,
  ): Promise<CryptoKey> {
    // CONCATENA UN PREFIJO ASCII 'ENC' AL SALT PARA OBTENER
    // UN MATERIAL DE CLAVE DISTINTO DEL USADO PARA auth_hash
    const encSalt = this.hexToBytes(this.asciiToHex('ENC') + salt);

    // DERIVA 32 BYTES DE MATERIAL CRIPTOGRAFICO CON ARGON2ID
    const rawHex = await argon2id({
      password,
      salt: encSalt,
      iterations: DEFAULT_KDF_PARAMS.time_cost,
      memorySize: DEFAULT_KDF_PARAMS.memory_cost,
      parallelism: DEFAULT_KDF_PARAMS.parallelism,
      hashLength: 32,
      outputType: 'hex',
    });

    // PASA LA SALIDA HEX A BYTES PARA IMPORTARLA COMO CLAVE AES
    const rawBytes = this.hexToBytes(rawHex);

    // IMPORTA LOS BYTES DERIVADOS COMO CryptoKey PARA AES-GCM
    // SE USA rawBytes.buffer COMO ArrayBuffer PARA COMPATIBILIDAD DE TIPOS
    return crypto.subtle.importKey(
      'raw',
      rawBytes.buffer as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  // CIFRA UNA CADENA CON AES-256-GCM Y DEVUELVE BASE64
  // FORMATO: [IV 12 BYTES][CIPHERTEXT + AUTH TAG]
  async encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    // GENERA UN IV ALEATORIO DE 12 BYTES (RECOMENDADO POR NIST)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    // CODIFICA EL TEXTO PLANO COMO UTF-8
    const encoded = new TextEncoder().encode(plaintext);

    // CIFRA CON AES-GCM USANDO LA CLAVE Y EL IV GENERADOS
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    );

    // CONCATENA IV + CIPHERTEXT EN UN UNICO BUFFER
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // DEVUELVE EL RESULTADO EN BASE64 PARA TRANSPORTE/STORAGE
    return this.bytesToBase64(combined);
  }

  // DESCIFRA UN STRING BASE64 PRODUCIDO POR encrypt
  async decrypt(combinedBase64: string, key: CryptoKey): Promise<string> {
    // DECODIFICA BASE64 A BYTES
    const combined = this.base64ToBytes(combinedBase64);
    // EXTRAE EL IV (PRIMEROS 12 BYTES)
    const iv = combined.slice(0, 12);
    // EXTRAE EL TEXTO CIFRADO CON TAG GCM ANEXADO
    const ciphertext = combined.slice(12);

    // DESCIFRA CON AES-GCM, FALLA SI EL TAG NO COINCIDE
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );

    // DECODIFICA EL UTF-8 A STRING ORIGINAL
    return new TextDecoder().decode(plain);
  }

  // CONVIERTE HEX A UINT8ARRAY
  private hexToBytes(hex: string): Uint8Array {
    // RESERVA UN BUFFER DE LA MITAD DE BYTES (CADA BYTE = 2 HEX CHARS)
    const bytes = new Uint8Array(hex.length / 2);
    // RECORRE LA CADENA HEX EN BLOQUES DE 2 CARACTERES
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    // DEVUELVE EL BUFFER CONVERTIDO
    return bytes;
  }

  // CONVIERTE UINT8ARRAY A HEX
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // CONVIERTE UN STRING ASCII A HEX (USADO PARA PREFIJO 'ENC')
  private asciiToHex(input: string): string {
    // RECORRE CADA CARACTER Y LO PASA A HEX DE 2 DIGITOS
    let hex = '';
    for (let i = 0; i < input.length; i++) {
      hex += input.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  }

  // CONVIERTE UINT8ARRAY A BASE64
  private bytesToBase64(bytes: Uint8Array): string {
    // CONSTRUYE EL STRING BINARIO Y LO PASA POR btoa
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  // CONVIERTE BASE64 A UINT8ARRAY
  private base64ToBytes(base64: string): Uint8Array {
    // DECODIFICA BASE64 A STRING BINARIO
    const binary = atob(base64);
    // RESERVA EL BUFFER Y COPIA CHARCODES
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
