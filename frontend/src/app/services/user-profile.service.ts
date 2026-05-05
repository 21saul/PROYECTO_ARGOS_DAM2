// IMPORTACION DEL DECORADOR INJECTABLE DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DE BEHAVIORSUBJECT PARA EXPONER ESTADO REACTIVO CON VALOR INICIAL
import { BehaviorSubject } from 'rxjs';

// SERVICIO SINGLETON QUE GESTIONA AVATAR Y NOMBRE DE USUARIO PERSISTIDOS LOCALMENTE
@Injectable({ providedIn: 'root' })
export class UserProfileService {

  // SUBJECT QUE MANTIENE EL DATAURL DEL AVATAR O NULL SI NO HAY UNO PERSONALIZADO
  private avatarSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('argos-avatar')
  );
  // OBSERVABLE PUBLICO PARA QUE LOS COMPONENTES SE SUSCRIBAN AL AVATAR
  avatar$ = this.avatarSubject.asObservable();

  // SUBJECT QUE MANTIENE EL NOMBRE DE USUARIO MOSTRADO EN EL PERFIL
  private nameSubject = new BehaviorSubject<string>(
    localStorage.getItem('argos-username') || 'Usuario ARGOS'
  );
  // OBSERVABLE PUBLICO PARA QUE LOS COMPONENTES SE SUSCRIBAN AL NOMBRE
  username$ = this.nameSubject.asObservable();

  /**
   * METODO PARA ASIGNAR O ELIMINAR EL AVATAR DEL USUARIO
   * RECIBE: DATAURL EN BASE64 DE LA IMAGEN, O NULL PARA QUITAR EL AVATAR
   * DEVUELVE: VOID — PERSISTE EN LOCALSTORAGE Y EMITE A LOS SUSCRIPTORES
   */
  setAvatar(dataUrl: string | null): void {
    // PASO 1: PERSISTIR O LIMPIAR LA CLAVE DE LOCALSTORAGE SEGUN EL VALOR RECIBIDO
    if (dataUrl) {
      localStorage.setItem('argos-avatar', dataUrl);
    } else {
      localStorage.removeItem('argos-avatar');
    }
    // PASO 2: EMITIR EL NUEVO VALOR PARA QUE LOS COMPONENTES SUSCRITOS SE ACTUALICEN
    this.avatarSubject.next(dataUrl);
  }

  /**
   * METODO PARA ASIGNAR EL NOMBRE DE USUARIO
   * RECIBE: NOMBRE NUEVO DE USUARIO COMO STRING
   * DEVUELVE: VOID — PERSISTE EN LOCALSTORAGE Y EMITE A LOS SUSCRIPTORES
   */
  setUsername(name: string): void {
    // PASO 1: PERSISTIR EL NOMBRE EN LOCALSTORAGE PARA SOBREVIVIR A RECARGAS
    localStorage.setItem('argos-username', name);
    // PASO 2: EMITIR EL NUEVO VALOR A TODOS LOS SUSCRIPTORES DEL OBSERVABLE USERNAME$
    this.nameSubject.next(name);
  }

  // DEVUELVE EL VALOR ACTUAL DEL AVATAR DE FORMA SINCRONA
  getAvatar(): string | null {
    return this.avatarSubject.value;
  }

  // DEVUELVE EL VALOR ACTUAL DEL NOMBRE DE USUARIO DE FORMA SINCRONA
  getUsername(): string {
    return this.nameSubject.value;
  }
}
