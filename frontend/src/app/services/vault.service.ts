// VAULT SERVICE
//
// RESUMEN: GESTIONA EL CRUD DE LA BOVEDA CONTRA EL BACKEND.
// CIFRA EN CLIENTE CON AES-256-GCM ANTES DE ENVIAR Y DESCIFRA
// AL RECIBIR. EL SERVIDOR NUNCA VE EL CONTENIDO EN CLARO.

// IMPORTACION DEL DECORADOR Injectable DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DEL CLIENTE HTTP CENTRAL
import { ApiService } from './api.service';
// IMPORTACION DEL SERVICIO DE AUTENTICACION (PARA LA CLAVE DE CIFRADO)
import { AuthService } from './auth.service';
// IMPORTACION DEL SERVICIO DE CIFRADO AES-256-GCM
import { CryptoService } from './crypto.service';

// PAYLOAD EN CLARO DE UN ITEM DE LA BOVEDA (SOLO EXISTE EN CLIENTE)
export interface VaultItemPayload {
  // TITULO DEL ITEM SIEMPRE OBLIGATORIO
  title: string;
  // USUARIO ASOCIADO (OPCIONAL EN NOTAS Y FICHEROS)
  username?: string;
  // CONTRASENA O SECRETO (OPCIONAL EN NOTAS)
  password?: string;
  // URL DE LA CUENTA (OPCIONAL)
  url?: string;
  // NOTAS ADICIONALES O CUERPO DE LA NOTA SEGURA
  notes?: string;
  // FICHERO CODIFICADO EN BASE64 (SOLO ITEMS DE TIPO file)
  fileData?: string;
  // NOMBRE DEL FICHERO ORIGINAL (SOLO ITEMS DE TIPO file)
  fileName?: string;
}

// REPRESENTACION DE UN ITEM YA DESCIFRADO EN MEMORIA
export interface VaultItem {
  // IDENTIFICADOR NUMERICO DEL ITEM EN EL BACKEND
  id: number;
  // CARPETA A LA QUE PERTENECE EL ITEM O NULL SI NO TIENE
  folder_id: number | null;
  // TIPO DE ITEM (CONTRASENA, NOTA O FICHERO)
  item_type: 'password' | 'note' | 'file';
  // PAYLOAD DESCIFRADO LISTO PARA MOSTRARSE EN UI
  payload: VaultItemPayload;
  // TAMANO DEL BLOB CIFRADO EN BYTES (METRICA NO SENSIBLE)
  size_bytes: number;
  // TIMESTAMP DE CREACION
  created_at: string;
  // TIMESTAMP DE ULTIMA MODIFICACION
  updated_at: string;
}

// REPRESENTACION DE UNA CARPETA DE LA BOVEDA
export interface VaultFolder {
  // IDENTIFICADOR NUMERICO DE LA CARPETA EN EL BACKEND
  id: number;
  // NOMBRE VISIBLE DE LA CARPETA
  name: string;
  // COLOR HEXADECIMAL ASOCIADO A LA CARPETA
  color: string;
  // ICONO ASOCIADO A LA CARPETA
  icon: string;
  // CONTADOR DE ITEMS DENTRO DE LA CARPETA
  item_count: number;
  // TIMESTAMP DE CREACION
  created_at: string;
  // TIMESTAMP DE ULTIMA MODIFICACION
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class VaultService {

  // CONSTRUCTOR QUE INYECTA API, AUTH Y CRYPTO
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private crypto: CryptoService,
  ) {}

  // LISTA ITEMS DEL USUARIO DESCIFRANDO EN CLIENTE
  async listItems(folderId?: number, itemType?: string): Promise<VaultItem[]> {
    // CONSTRUYE EL OBJETO DE PARAMETROS QUERY DE FORMA CONDICIONAL
    const params: any = {};
    if (folderId !== undefined) params.folder_id = folderId;
    if (itemType) params.item_type = itemType;

    // PETICION GET AL BACKEND PARA OBTENER LOS ITEMS CIFRADOS
    const items = await this.api.get<any[]>('/vault/items', params).toPromise();
    if (!items) return [];

    // RECUPERA LA CLAVE DE CIFRADO EN MEMORIA DE LA SESION
    const key = this.auth.getEncryptionKey();
    if (!key) throw new Error('Sesion sin clave de cifrado');

    // DESCIFRA CADA BLOB Y PARSEA EL JSON DEL PAYLOAD
    const decrypted = await Promise.all(items.map(async (item) => {
      const plaintext = await this.crypto.decrypt(item.encrypted_blob, key);
      return { ...item, payload: JSON.parse(plaintext) } as VaultItem;
    }));

    // DEVUELVE LA LISTA DE ITEMS YA DESCIFRADOS
    return decrypted;
  }

  // CREA UN ITEM CIFRANDO EL PAYLOAD ANTES DE ENVIAR
  async createItem(
    itemType: 'password' | 'note' | 'file',
    payload: VaultItemPayload,
    folderId?: number,
  ): Promise<VaultItem> {
    // RECUPERA LA CLAVE DE CIFRADO EN MEMORIA
    const key = this.auth.getEncryptionKey();
    if (!key) throw new Error('Sesion sin clave de cifrado');

    // SERIALIZA EL PAYLOAD A JSON Y LO CIFRA CON AES-256-GCM
    const plaintext = JSON.stringify(payload);
    const encryptedBlob = await this.crypto.encrypt(plaintext, key);

    // ENVIA EL BLOB AL BACKEND JUNTO CON METADATOS NO SENSIBLES
    const response = await this.api.post<any>('/vault/items', {
      item_type: itemType,
      folder_id: folderId ?? null,
      encrypted_blob: encryptedBlob,
    }).toPromise();

    // RECONSTRUYE UN VaultItem CON EL PAYLOAD EN CLARO PARA LA UI
    return {
      ...response,
      payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as VaultItem;
  }

  // ACTUALIZA UN ITEM CIFRANDO EL NUEVO PAYLOAD
  async updateItem(
    id: number,
    payload: VaultItemPayload,
    folderId?: number | null,
  ): Promise<void> {
    // RECUPERA LA CLAVE DE CIFRADO EN MEMORIA
    const key = this.auth.getEncryptionKey();
    if (!key) throw new Error('Sesion sin clave de cifrado');

    // SERIALIZA Y CIFRA EL NUEVO PAYLOAD
    const plaintext = JSON.stringify(payload);
    const encryptedBlob = await this.crypto.encrypt(plaintext, key);

    // CONSTRUYE EL BODY DEL PUT CON BLOB Y OPCIONALMENTE folder_id
    const body: any = { encrypted_blob: encryptedBlob };
    if (folderId !== undefined) body.folder_id = folderId;

    // EJECUTA EL PUT CONTRA EL ENDPOINT DEL ITEM
    await this.api.put<any>(`/vault/items/${id}`, body).toPromise();
  }

  // ELIMINA UN ITEM POR SU ID
  async deleteItem(id: number): Promise<void> {
    // EJECUTA EL DELETE CONTRA EL ENDPOINT DEL ITEM
    await this.api.delete<any>(`/vault/items/${id}`).toPromise();
  }

  // LISTA TODAS LAS CARPETAS DEL USUARIO
  async listFolders(): Promise<VaultFolder[]> {
    // PETICION GET AL ENDPOINT DE CARPETAS
    const folders = await this.api.get<VaultFolder[]>('/vault/folders').toPromise();
    return folders ?? [];
  }

  // CREA UNA CARPETA NUEVA
  async createFolder(name: string, color: string, icon: string): Promise<VaultFolder> {
    // POST AL ENDPOINT DE CARPETAS CON METADATOS EN CLARO
    const folder = await this.api.post<VaultFolder>('/vault/folders', {
      name, color, icon,
    }).toPromise();
    if (!folder) throw new Error('No se pudo crear la carpeta');
    return folder;
  }

  // ACTUALIZA UNA CARPETA EXISTENTE
  async updateFolder(
    id: number,
    changes: { name?: string; color?: string; icon?: string },
  ): Promise<void> {
    // PUT AL ENDPOINT DE LA CARPETA CON LOS CAMBIOS PARCIALES
    await this.api.put<any>(`/vault/folders/${id}`, changes).toPromise();
  }

  // ELIMINA UNA CARPETA. LOS ITEMS DENTRO QUEDAN SIN CARPETA
  async deleteFolder(id: number): Promise<void> {
    // DELETE AL ENDPOINT DE LA CARPETA
    await this.api.delete<any>(`/vault/folders/${id}`).toPromise();
  }

  // SEED DE DATOS DE PRUEBA PARA QUE LA BOVEDA NO SE VEA VACIA
  // SE EJECUTA UNA SOLA VEZ POR USUARIO (CONTROLADO CON FLAG)
  async seedDemoData(): Promise<void> {
    // VERIFICA SI YA HAY ITEMS PARA NO DUPLICAR DATOS
    const existing = await this.listItems();
    if (existing.length > 0) return;

    // CREA 5 CARPETAS DE EJEMPLO
    const bancos = await this.createFolder('Bancos', '#10B981', 'bank');
    const email = await this.createFolder('Email', '#7C3AED', 'envelope');
    const redes = await this.createFolder('Redes Sociales', '#EC4899', 'users-three');
    const trabajo = await this.createFolder('Trabajo', '#06B6D4', 'briefcase');
    const familia = await this.createFolder('Familia', '#F59E0B', 'house');

    // CREA 12 ITEMS DE PRUEBA REPARTIDOS EN LAS CARPETAS
    await this.createItem('password', {
      title: 'BBVA',
      username: 'usuario@example.com',
      password: 'BBVA_Demo_2026!',
      url: 'https://www.bbva.es',
    }, bancos.id);

    await this.createItem('password', {
      title: 'Santander',
      username: '12345678A',
      password: 'San_Demo_2026!',
      url: 'https://www.bancosantander.es',
    }, bancos.id);

    await this.createItem('note', {
      title: 'PIN tarjeta BBVA',
      notes: 'PIN: 4 ultimos digitos del telefono\nCVV en sobre del cajon',
    }, bancos.id);

    await this.createItem('password', {
      title: 'Gmail Personal',
      username: 'usuario.demo@gmail.com',
      password: 'Gmail_Strong_2026!',
      url: 'https://mail.google.com',
    }, email.id);

    await this.createItem('password', {
      title: 'Outlook Trabajo',
      username: 'trabajo@empresa.com',
      password: 'OutlookWork_2026!',
      url: 'https://outlook.live.com',
    }, email.id);

    await this.createItem('password', {
      title: 'Instagram',
      username: 'usuario_demo',
      password: 'Insta_2026_Demo!',
      url: 'https://www.instagram.com',
    }, redes.id);

    await this.createItem('password', {
      title: 'Twitter / X',
      username: '@usuario_demo',
      password: 'TwitterX_2026!',
      url: 'https://x.com',
    }, redes.id);

    await this.createItem('password', {
      title: 'LinkedIn',
      username: 'usuario.demo@gmail.com',
      password: 'LinkedIn_2026_Pro!',
      url: 'https://www.linkedin.com',
    }, redes.id);

    await this.createItem('password', {
      title: 'GitHub',
      username: 'usuario-demo',
      password: 'GitHub_Demo_2026!',
      url: 'https://github.com',
    }, trabajo.id);

    await this.createItem('note', {
      title: 'Codigos 2FA Backup GitHub',
      notes: 'a3f2-b8c1\nd4e6-9a2f\n7b5c-1d8e\nf0a3-c6b9\n2e7d-5f4a',
    }, trabajo.id);

    await this.createItem('password', {
      title: 'WiFi Casa',
      username: 'ARGOS_Home_5G',
      password: 'WifiCasa_2026_Seguro!',
    }, familia.id);

    await this.createItem('note', {
      title: 'Codigo alarma casa',
      notes: 'Codigo principal: ****\nCodigo coaccion: ****\nUbicacion del manual: cajon entrada',
    }, familia.id);
  }
}
