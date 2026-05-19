// PREFERENCES SERVICE
//
// RESUMEN: SERVICIO SINGLETON QUE GESTIONA LAS PREFERENCIAS DE
// PERSONALIZACION "VIVA" DEL PERFIL DE ARGOS — ACENTO DE MARCA,
// DENSIDAD, ESCALA DE FUENTE, NIVEL DE ANIMACION, PERSONALIDAD DE
// LA MASCOTA CUB, SONIDOS DEL SISTEMA E IDIOMA. CADA PREFERENCIA
// SE PERSISTE EN LOCALSTORAGE Y SE EXPONE COMO BehaviorSubject
// PARA QUE LAS PAGINAS REACCIONEN EN VIVO.
//
// LOGICA: AL CAMBIAR CUALQUIER PREFERENCIA, EL SERVICIO REESCRIBE
// CSS VARIABLES Y ATRIBUTOS data-* SOBRE document.documentElement
// PARA QUE EL EFECTO SEA INMEDIATO EN TODA LA APP. EL TEMA SE
// DELEGA EN EL ThemeService PARA NO DUPLICAR LOGICA.
//
// RELACIONES:
// - PROFILE PAGE (UI DE CONFIGURACION)
// - THEME SERVICE (RESET DE ACENTOS COMPATIBLE CON DUAL-THEME)

// IMPORTACION DEL DECORADOR INJECTABLE DE ANGULAR
import { Injectable } from '@angular/core';
// IMPORTACION DE BEHAVIORSUBJECT PARA EXPONER ESTADO REACTIVO CON VALOR INICIAL
import { BehaviorSubject, Observable } from 'rxjs';

// ─── TIPOS PUBLICOS QUE EXPORTA EL SERVICIO ───────────────────

// CLAVE DEL ACENTO DE MARCA QUE SOBRESCRIBE --argos-accent EN :root
export type ArgosAccent =
  | 'violet'
  | 'pink'
  | 'cyan'
  | 'green'
  | 'amber'
  | 'red';

// DENSIDAD DE INFORMACION QUE AJUSTA SPACING TOKENS GLOBALES
export type ArgosDensity = 'compact' | 'cozy' | 'spacious';

// ESCALA TIPOGRAFICA — APLICA UN FACTOR SOBRE LA FUENTE BASE
export type ArgosFontScale = 'sm' | 'md' | 'lg' | 'xl';

// NIVEL DE ANIMACION — DESDE ACCESIBLE A CINEMATOGRAFICO
export type ArgosMotion = 'minimal' | 'normal' | 'cinematic';

// PERSONALIDAD DEL CUB QUE CAMBIA TONO DE MENSAJES Y MICRO-LOOP
export type ArgosCubPersonality = 'vigilant' | 'kind' | 'sarcastic';

// IDIOMA DE LA INTERFAZ — DE MOMENTO ES UN STUB PERSISTIDO PARA EL FUTURO
export type ArgosLang = 'es' | 'en' | 'cat';

// ─── CONSTANTES INTERNAS — CLAVES DE LOCALSTORAGE ─────────────
const KEY_ACCENT     = 'argos-pref-accent';
const KEY_DENSITY    = 'argos-pref-density';
const KEY_FONT       = 'argos-pref-font';
const KEY_MOTION     = 'argos-pref-motion';
const KEY_PERSON     = 'argos-pref-cub';
const KEY_SOUNDS     = 'argos-pref-sounds';
const KEY_LANG       = 'argos-pref-lang';

// MAPA HEX DE LOS ACENTOS — USADO PARA SETEAR --argos-accent EN VIVO
const ACCENT_HEX: Record<ArgosAccent, string> = {
  violet: '#7C3AED',
  pink:   '#EC4899',
  cyan:   '#06B6D4',
  green:  '#10B981',
  amber:  '#F59E0B',
  red:    '#EF4444',
};

// FACTOR DE ESCALA DE LA FUENTE — PORCENTAJE QUE SE APLICA EN HTML
const FONT_FACTOR: Record<ArgosFontScale, number> = {
  sm: 0.92,
  md: 1.00,
  lg: 1.08,
  xl: 1.18,
};

// ESPACIADOS BASE QUE INYECTA CADA NIVEL DE DENSIDAD EN :root
const DENSITY_VARS: Record<ArgosDensity, { gap: string; row: string; pad: string }> = {
  compact:  { gap: '6px',  row: '10px', pad: '12px' },
  cozy:     { gap: '10px', row: '14px', pad: '16px' },
  spacious: { gap: '14px', row: '18px', pad: '22px' },
};

// SERVICIO SINGLETON DE PREFERENCIAS — INSTANCIA UNICA EN TODA LA APP
@Injectable({ providedIn: 'root' })
export class PreferencesService {

  // ─── SUBJECTS PRIVADOS QUE MANTIENEN EL ESTADO REACTIVO ─────
  private accentSubject  = new BehaviorSubject<ArgosAccent>(this.readEnum<ArgosAccent>(KEY_ACCENT, ['violet','pink','cyan','green','amber','red'], 'violet'));
  private densitySubject = new BehaviorSubject<ArgosDensity>(this.readEnum<ArgosDensity>(KEY_DENSITY, ['compact','cozy','spacious'], 'cozy'));
  private fontSubject    = new BehaviorSubject<ArgosFontScale>(this.readEnum<ArgosFontScale>(KEY_FONT, ['sm','md','lg','xl'], 'md'));
  private motionSubject  = new BehaviorSubject<ArgosMotion>(this.readEnum<ArgosMotion>(KEY_MOTION, ['minimal','normal','cinematic'], 'normal'));
  private personSubject  = new BehaviorSubject<ArgosCubPersonality>(this.readEnum<ArgosCubPersonality>(KEY_PERSON, ['vigilant','kind','sarcastic'], 'kind'));
  private soundsSubject  = new BehaviorSubject<boolean>(this.readBool(KEY_SOUNDS, true));
  private langSubject    = new BehaviorSubject<ArgosLang>(this.readEnum<ArgosLang>(KEY_LANG, ['es','en','cat'], 'es'));

  // ─── OBSERVABLES PUBLICOS PARA QUE LOS COMPONENTES SE SUSCRIBAN ─
  readonly accent$:  Observable<ArgosAccent>          = this.accentSubject.asObservable();
  readonly density$: Observable<ArgosDensity>         = this.densitySubject.asObservable();
  readonly font$:    Observable<ArgosFontScale>       = this.fontSubject.asObservable();
  readonly motion$:  Observable<ArgosMotion>          = this.motionSubject.asObservable();
  readonly cub$:     Observable<ArgosCubPersonality>  = this.personSubject.asObservable();
  readonly sounds$:  Observable<boolean>              = this.soundsSubject.asObservable();
  readonly lang$:    Observable<ArgosLang>            = this.langSubject.asObservable();

  // CONSTRUCTOR — APLICA EL ESTADO PERSISTIDO AL DOCUMENTO AL ARRANCAR
  constructor() {
    // APLICA EL ACENTO A LA RAIZ
    this.applyAccent(this.accentSubject.value);
    // APLICA LA DENSIDAD A LA RAIZ
    this.applyDensity(this.densitySubject.value);
    // APLICA LA ESCALA DE FUENTE A HTML
    this.applyFont(this.fontSubject.value);
    // MARCA EL NIVEL DE MOTION EN LA RAIZ PARA QUE EL SCSS PUEDA REACCIONAR
    this.applyMotion(this.motionSubject.value);
    // MARCA LA PERSONALIDAD DEL CUB COMO ATRIBUTO EN LA RAIZ
    this.applyCubPersonality(this.personSubject.value);
  }

  // ─── SETTERS PUBLICOS — PERSISTEN, APLICAN AL DOM Y EMITEN ───

  // CAMBIA EL ACENTO DE MARCA DEL USUARIO
  setAccent(value: ArgosAccent): void {
    // GUARDA LA CLAVE EN LOCALSTORAGE PARA SOBREVIVIR A RECARGAS
    this.persist(KEY_ACCENT, value);
    // ESCRIBE LA VARIABLE CSS GLOBAL PARA QUE LA UI SE ACTUALICE EN VIVO
    this.applyAccent(value);
    // EMITE EL NUEVO VALOR A LOS SUSCRIPTORES
    this.accentSubject.next(value);
  }

  // CAMBIA LA DENSIDAD DE LA INTERFAZ
  setDensity(value: ArgosDensity): void {
    // PERSISTE LA NUEVA PREFERENCIA EN ALMACENAMIENTO LOCAL
    this.persist(KEY_DENSITY, value);
    // APLICA INSTANTANEAMENTE EL CAMBIO DE SPACING
    this.applyDensity(value);
    // EMITE EL NUEVO VALOR A LOS SUSCRIPTORES
    this.densitySubject.next(value);
  }

  // CAMBIA LA ESCALA DE FUENTE
  setFont(value: ArgosFontScale): void {
    // PERSISTENCIA EN LOCALSTORAGE
    this.persist(KEY_FONT, value);
    // ESCRITURA DE LA VARIABLE QUE MULTIPLICA EL TAMAÑO BASE
    this.applyFont(value);
    // EMISION DEL CAMBIO
    this.fontSubject.next(value);
  }

  // CAMBIA EL NIVEL DE ANIMACION
  setMotion(value: ArgosMotion): void {
    // PERSISTE LA PREFERENCIA EN LOCAL STORAGE
    this.persist(KEY_MOTION, value);
    // MARCA EL ATRIBUTO EN <html> PARA QUE EL SCSS Y LAS PAGINAS REACCIONEN
    this.applyMotion(value);
    // EMITE PARA QUE LAS PAGINAS RECONFIGUREN SUS TIMELINES SI HACE FALTA
    this.motionSubject.next(value);
  }

  // CAMBIA LA PERSONALIDAD DE LA MASCOTA CUB
  setCubPersonality(value: ArgosCubPersonality): void {
    // PERSISTE LA PERSONALIDAD EN LOCAL STORAGE
    this.persist(KEY_PERSON, value);
    // MARCA EL ATRIBUTO EN LA RAIZ PARA QUE OTROS COMPONENTES ESTILEN EN BASE A EL
    this.applyCubPersonality(value);
    // EMITE EL NUEVO VALOR REACTIVO
    this.personSubject.next(value);
  }

  // ENCIENDE O APAGA LOS SONIDOS DEL SISTEMA
  setSounds(enabled: boolean): void {
    // PERSISTE EL FLAG BOOLEANO COMO STRING EN LOCALSTORAGE
    this.persist(KEY_SOUNDS, enabled ? '1' : '0');
    // EMITE EL NUEVO ESTADO
    this.soundsSubject.next(enabled);
  }

  // CAMBIA EL IDIOMA DE LA INTERFAZ (STUB — APLICACION REAL EN FUTURO i18n)
  setLanguage(value: ArgosLang): void {
    // PERSISTE LA PREFERENCIA DE IDIOMA
    this.persist(KEY_LANG, value);
    // EMITE EL NUEVO VALOR PARA QUIEN ESTE ESCUCHANDO
    this.langSubject.next(value);
  }

  // ─── GETTERS SINCRONOS — UTILES EN BINDINGS [class]= ─────────
  get accent():  ArgosAccent          { return this.accentSubject.value; }
  get density(): ArgosDensity         { return this.densitySubject.value; }
  get font():    ArgosFontScale       { return this.fontSubject.value; }
  get motion():  ArgosMotion          { return this.motionSubject.value; }
  get cub():     ArgosCubPersonality  { return this.personSubject.value; }
  get sounds():  boolean              { return this.soundsSubject.value; }
  get lang():    ArgosLang            { return this.langSubject.value; }

  // DEVUELVE EL HEX REAL DEL ACENTO ACTUAL — UTIL PARA SVG/CANVAS
  getAccentHex(value?: ArgosAccent): string {
    // SI NO SE PASA CLAVE EXPLICITA SE USA LA PREFERENCIA ACTUAL
    return ACCENT_HEX[value ?? this.accent];
  }

  // ─── APLICACION REAL AL DOM — METODOS PRIVADOS ───────────────

  // ESCRIBE --argos-accent EN :root PARA QUE TODA LA APP LA USE
  private applyAccent(value: ArgosAccent): void {
    // ELEMENTO RAIZ DEL DOCUMENTO — DONDE VIVEN LAS CSS VARIABLES
    const root = document.documentElement;
    // RECOGE EL HEX CORRESPONDIENTE AL ACENTO ELEGIDO
    const hex = ACCENT_HEX[value];
    // ESCRIBE LA VARIABLE PRINCIPAL Y VARIANTES DERIVADAS (SOFT / RING)
    root.style.setProperty('--argos-accent', hex);
    root.style.setProperty('--argos-accent-soft', `color-mix(in srgb, ${hex} 18%, transparent)`);
    root.style.setProperty('--argos-accent-ring', `color-mix(in srgb, ${hex} 38%, transparent)`);
    // ATRIBUTO data-* PARA QUE SE PUEDAN ESCRIBIR REGLAS CONDICIONADAS POR ACENTO
    root.setAttribute('data-argos-accent', value);
  }

  // ESCRIBE TOKENS DE SPACING SEGUN LA DENSIDAD ELEGIDA
  private applyDensity(value: ArgosDensity): void {
    // ELEMENTO RAIZ — TARGET DE LAS CSS VARIABLES DE DENSIDAD
    const root = document.documentElement;
    // EXTRAE LOS VALORES NUMERICOS PRECONFIGURADOS PARA LA DENSIDAD
    const vars = DENSITY_VARS[value];
    // INYECTA LAS TRES VARIABLES BASE QUE EL PROFILE CONSUME
    root.style.setProperty('--argos-density-gap', vars.gap);
    root.style.setProperty('--argos-density-row', vars.row);
    root.style.setProperty('--argos-density-pad', vars.pad);
    // ATRIBUTO data-* PARA SELECTORES CSS CONDICIONALES
    root.setAttribute('data-argos-density', value);
  }

  // APLICA EL FACTOR DE ESCALA TIPOGRAFICA SOBRE HTML
  private applyFont(value: ArgosFontScale): void {
    // FACTOR REAL EN PORCENTAJE QUE MULTIPLICARA EL FONT SIZE BASE
    const factor = FONT_FACTOR[value];
    // ESCRITURA DE LA VARIABLE QUE EL PROFILE USA PARA SUS TAMAÑOS
    document.documentElement.style.setProperty('--argos-font-scale', factor.toString());
    // ATRIBUTO data-* PARA SELECCIONAR VARIANTES SI HAY MICROAJUSTES POR ESCALA
    document.documentElement.setAttribute('data-argos-font', value);
  }

  // MARCA EL NIVEL DE MOTION EN LA RAIZ PARA QUE OTROS COMPONENTES SE ADAPTEN
  private applyMotion(value: ArgosMotion): void {
    // ATRIBUTO data-argos-motion=minimal|normal|cinematic
    document.documentElement.setAttribute('data-argos-motion', value);
  }

  // MARCA LA PERSONALIDAD DEL CUB EN EL DOM PARA QUE EL MENSAJE CAMBIE
  private applyCubPersonality(value: ArgosCubPersonality): void {
    // ATRIBUTO data-argos-cub-personality
    document.documentElement.setAttribute('data-argos-cub-personality', value);
  }

  // ─── HELPERS DE LECTURA SEGURA DE LOCALSTORAGE ───────────────

  // LEE UN VALOR DE LOCALSTORAGE Y LO VALIDA CONTRA UN CONJUNTO PERMITIDO
  private readEnum<T extends string>(key: string, allowed: T[], fallback: T): T {
    // INTENTO PROTEGIDO POR SI LOCALSTORAGE NO ESTA DISPONIBLE
    try {
      // LECTURA EN BRUTO
      const raw = localStorage.getItem(key);
      // SI EL VALOR ESTA EN EL CONJUNTO PERMITIDO LO DEVOLVEMOS DIRECTAMENTE
      if (raw && (allowed as string[]).includes(raw)) return raw as T;
      // EN CUALQUIER OTRO CASO DEVOLVEMOS EL FALLBACK
      return fallback;
    } catch {
      // SI EL ACCESO FALLA DEVOLVEMOS EL FALLBACK DE FORMA SEGURA
      return fallback;
    }
  }

  // LEE UN BOOLEANO DE LOCALSTORAGE CON FALLBACK
  private readBool(key: string, fallback: boolean): boolean {
    // INTENTO PROTEGIDO POR SI EL ENTORNO BLOQUEA EL ACCESO
    try {
      // LECTURA DEL VALOR EN BRUTO
      const raw = localStorage.getItem(key);
      // SI NO HAY VALOR DEVOLVEMOS EL FALLBACK
      if (raw === null) return fallback;
      // INTERPRETACION DE LOS UNICOS VALORES VALIDOS
      return raw === '1' || raw === 'true';
    } catch {
      // FALLBACK SEGURO
      return fallback;
    }
  }

  // PERSISTE UN VALOR EN LOCALSTORAGE DE FORMA RESILIENTE
  private persist(key: string, value: string): void {
    // INTENTO PROTEGIDO POR SI EL ENTORNO BLOQUEA LA ESCRITURA
    try {
      // ESCRITURA DEL VALOR EN LA CLAVE SOLICITADA
      localStorage.setItem(key, value);
    } catch {
      // SI FALLA NO ROMPEMOS LA UI — EL VALOR SE MANTIENE EN MEMORIA
    }
  }
}
