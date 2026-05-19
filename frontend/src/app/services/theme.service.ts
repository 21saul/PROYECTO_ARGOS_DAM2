// IMPORTACION DEL DECORADOR INJECTABLE Y UTILIDADES REACTIVAS DE ANGULAR
import { Injectable, OnDestroy } from '@angular/core';
// IMPORTACION DEL BEHAVIORSUBJECT PARA EXPONER EL TEMA EFECTIVO COMO STREAM
import { BehaviorSubject, Observable } from 'rxjs';

// CLAVE FIJA UTILIZADA PARA PERSISTIR LA PREFERENCIA DE TEMA EN LOCALSTORAGE
const ARGOS_THEME_STORAGE_KEY = 'argos-theme';

// TIPO PUBLICO QUE REPRESENTA LOS POSIBLES VALORES DE TEMA SOPORTADOS POR ARGOS
export type ArgosTheme = 'light' | 'dark' | 'auto';

// SERVICIO SINGLETON DE TEMA — UNICA RESPONSABILIDAD: GESTIONAR CLARO/OSCURO/AUTO
@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  // ESTADO INTERNO QUE GUARDA EL TEMA SOLICITADO POR EL USUARIO O AUTO POR DEFECTO
  private currentTheme: ArgosTheme = 'auto';

  // REFERENCIA CACHEADA AL MEDIA QUERY DEL SISTEMA PARA DETECTAR MODO OSCURO
  private readonly darkMediaQuery: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  // SUBJECT QUE EMITE TRUE CUANDO EL TEMA EFECTIVO ES OSCURO Y FALSE CUANDO ES CLARO
  private readonly isDarkSubject = new BehaviorSubject<boolean>(false);

  // OBSERVABLE PUBLICO PARA QUE LOS COMPONENTES SE SUSCRIBAN AL TEMA EFECTIVO
  public readonly isDark$: Observable<boolean> = this.isDarkSubject.asObservable();

  // SUBJECT QUE EMITE EL MODO SELECCIONADO POR EL USUARIO (light|dark|auto)
  // EXISTE EN PARALELO A isDark$ — UNO REPRESENTA LA INTENCION DEL USUARIO,
  // EL OTRO EL EFECTO REAL TENIENDO EN CUENTA EL SISTEMA.
  private readonly modeSubject = new BehaviorSubject<ArgosTheme>('auto');

  // OBSERVABLE PUBLICO DEL MODO ELEGIDO POR EL USUARIO
  public readonly mode$: Observable<ArgosTheme> = this.modeSubject.asObservable();

  // CONSTRUCTOR — INICIALIZA EL TEMA LEYENDO LOCALSTORAGE Y SUSCRIBIENDOSE AL SISTEMA
  constructor() {
    // LEEMOS LA PREFERENCIA PERSISTIDA DE SESIONES ANTERIORES
    const stored = this.readStoredTheme();
    // APLICAMOS EL TEMA RECUPERADO O EL VALOR AUTOMATICO POR DEFECTO
    this.applyTheme(stored ?? 'auto');
    // SUSCRIBIMOS A CAMBIOS DEL SISTEMA OPERATIVO PARA REACCIONAR EN MODO AUTO
    this.darkMediaQuery.addEventListener('change', this.handleSystemThemeChange);
  }

  // HOOK DE LIMPIEZA QUE LIBERA EL LISTENER DEL MEDIA QUERY AL DESTRUIR EL SERVICIO
  public ngOnDestroy(): void {
    // ELIMINACION DEL LISTENER PARA EVITAR FUGAS DE MEMORIA
    this.darkMediaQuery.removeEventListener('change', this.handleSystemThemeChange);
  }

  // METODO PUBLICO QUE ALTERNA ENTRE TEMA CLARO Y OSCURO Y PERSISTE LA ELECCION
  public toggleTheme(): void {
    // CALCULA EL TEMA OPUESTO AL EFECTIVO ACTUAL PARA EL TOGGLE
    const next: ArgosTheme = this.isEffectiveDarkMode() ? 'light' : 'dark';
    // APLICA EL NUEVO TEMA AL DOCUMENTO
    this.applyTheme(next);
    // PERSISTE LA NUEVA PREFERENCIA EN LOCALSTORAGE PARA FUTURAS SESIONES
    this.persistTheme(next);
  }

  // METODO PUBLICO QUE FUERZA EL TEMA AUTOMATICO Y LO PERSISTE
  public resetThemeToAuto(): void {
    // REAPLICA AUTO QUITANDO LAS CLASES DE FORZADO DEL BODY
    this.applyTheme('auto');
    // PERSISTE EL VALOR AUTO EN LOCALSTORAGE
    this.persistTheme('auto');
  }

  // ESTABLECE EXPLICITAMENTE EL MODO ELEGIDO (light|dark|auto) Y LO PERSISTE
  public setMode(mode: ArgosTheme): void {
    // APLICAMOS EL TEMA AL DOCUMENTO MUTANDO LAS CLASES DEL BODY
    this.applyTheme(mode);
    // PERSISTIMOS LA PREFERENCIA PARA QUE SOBREVIVA RECARGAS
    this.persistTheme(mode);
  }

  // GETTER DEL MODO ACTUAL ELEGIDO POR EL USUARIO
  public getMode(): ArgosTheme {
    // DEVUELVE EL ULTIMO VALOR EMITIDO POR EL SUBJECT DE MODO
    return this.modeSubject.value;
  }

  // GETTER PUBLICO PARA QUE LOS COMPONENTES CONSULTEN SI EL TEMA EFECTIVO ES OSCURO
  public isEffectiveDarkMode(): boolean {
    // SI EL USUARIO HA FORZADO MANUALMENTE OSCURO LA RESPUESTA ES INMEDIATA
    if (this.currentTheme === 'dark') return true;
    // SI EL USUARIO HA FORZADO MANUALMENTE CLARO LA RESPUESTA ES INMEDIATA
    if (this.currentTheme === 'light') return false;
    // EN MODO AUTO DELEGAMOS EN LA PREFERENCIA DEL SISTEMA OPERATIVO
    return this.darkMediaQuery.matches;
  }

  // APLICA EL TEMA INDICADO MANIPULANDO LAS CLASES DEL ELEMENTO BODY DEL DOCUMENTO
  private applyTheme(theme: ArgosTheme): void {
    // GUARDA EL TEMA SOLICITADO EN EL ESTADO INTERNO DEL SERVICIO
    this.currentTheme = theme;
    // OBTIENE LA REFERENCIA AL CLASSLIST DEL BODY PARA MUTARLO
    const bodyClasses = document.body.classList;
    // ELIMINA LAS CLASES DE FORZADO PARA EMPEZAR DESDE UN ESTADO LIMPIO
    bodyClasses.remove('force-dark', 'force-light');
    // SI EL TEMA ES OSCURO FORZADO AÑADE LA CLASE QUE PISA EL @MEDIA
    if (theme === 'dark') {
      bodyClasses.add('force-dark');
    } else if (theme === 'light') {
      // SI ES CLARO FORZADO INHIBE EL @MEDIA DARK AUTOMATICO
      bodyClasses.add('force-light');
    }
    // EMITIMOS EL NUEVO ESTADO EFECTIVO PARA QUE LOS SUSCRIPTORES SE ACTUALICEN
    this.isDarkSubject.next(this.isEffectiveDarkMode());
    // EMITIMOS TAMBIEN EL MODO SOLICITADO POR EL USUARIO (INTENCION) PARA LOS UI
    // QUE QUIERAN PINTAR EL CHIP ACTIVO (light|dark|auto)
    this.modeSubject.next(theme);
  }

  // LEE LA PREFERENCIA DE TEMA GUARDADA EN LOCALSTORAGE Y LA VALIDA
  private readStoredTheme(): ArgosTheme | null {
    // INTENTO PROTEGIDO POR SI LOCALSTORAGE ESTA BLOQUEADO POR PRIVACIDAD
    try {
      // OBTIENE EL VALOR EN BRUTO ASOCIADO A LA CLAVE DE TEMA DE ARGOS
      const raw = localStorage.getItem(ARGOS_THEME_STORAGE_KEY);
      // VALIDACION DE QUE EL VALOR PERTENECE AL CONJUNTO DE TEMAS PERMITIDOS
      if (raw === 'light' || raw === 'dark' || raw === 'auto') {
        return raw;
      }
      // CUALQUIER OTRO VALOR SE TRATA COMO INEXISTENTE
      return null;
    } catch {
      // EN CASO DE ERROR DE ACCESO DEVOLVEMOS NULL DE FORMA SEGURA
      return null;
    }
  }

  // PERSISTE LA PREFERENCIA DE TEMA EN LOCALSTORAGE DE FORMA RESILIENTE
  private persistTheme(theme: ArgosTheme): void {
    // INTENTO PROTEGIDO POR SI EL ENTORNO BLOQUEA LA ESCRITURA
    try {
      // ESCRITURA DEL VALOR DE TEMA EN LA CLAVE DEFINIDA POR ARGOS
      localStorage.setItem(ARGOS_THEME_STORAGE_KEY, theme);
    } catch {
      // SI FALLA NO ROMPEMOS LA UI — EL TEMA SE MANTIENE EN MEMORIA
    }
  }

  // HANDLER QUE REACCIONA A CAMBIOS DE PREFERENCIA DEL SISTEMA SOLO EN MODO AUTO
  private handleSystemThemeChange = (_event: MediaQueryListEvent): void => {
    // EN MODO AUTO REAPLICAMOS PARA RESPETAR LA NUEVA PREFERENCIA DEL SISTEMA
    if (this.currentTheme === 'auto') {
      this.applyTheme('auto');
    }
  };
}
