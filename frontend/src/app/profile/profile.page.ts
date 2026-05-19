// ═══════════════════════════════════════════════════════════════════
// PROFILE PAGE — CENTRO DE COMANDO PERSONAL DE ARGOS
// RESUMEN: ORQUESTA EL HERO IDENTITARIO, EL PANEL DE PERSONALIZACION
// VIVA, EL HUD GAMIFICADO Y LAS SECCIONES DE AJUSTES SERIOS.
// LOGICA: SUSCRIBE A ThemeService, UserProfileService Y AL NUEVO
// PreferencesService PARA REFLEJAR Y MUTAR EL ESTADO EN VIVO.
// LA COREOGRAFIA GSAP USA gsap.context PARA SCOPE Y CLEANUP
// AUTOMATICO; ScrollTrigger REVELA LAS SECCIONES AL ENTRAR.
// ═══════════════════════════════════════════════════════════════════

// IMPORTACION DEL CORE DE ANGULAR — HOOKS DEL CICLO DE VIDA Y DESTROYREF
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  DestroyRef,
  ViewChild,
  ElementRef,
  HostBinding,
} from '@angular/core';
// IMPORTACION DEL HELPER PARA AUTOLIMPIAR SUSCRIPCIONES RXJS
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// IMPORTACION DE GSAP Y EL PLUGIN DE SCROLLTRIGGER
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// REGISTRO DEL PLUGIN UNA SOLA VEZ AL CARGAR EL MODULO DEL PERFIL
gsap.registerPlugin(ScrollTrigger);

// IMPORTACION DEL SERVICIO DE TEMA QUE GESTIONA CLARO/OSCURO/AUTO
import { ThemeService, ArgosTheme } from '../services/theme.service';
// IMPORTACION DEL SERVICIO DE PERFIL QUE GESTIONA AVATAR Y NOMBRE
import { UserProfileService } from '../services/user-profile.service';
// IMPORTACION DEL NUEVO SERVICIO DE PREFERENCIAS DE LA APP
import {
  PreferencesService,
  ArgosAccent,
  ArgosDensity,
  ArgosFontScale,
  ArgosMotion,
  ArgosCubPersonality,
  ArgosLang,
} from '../services/preferences.service';

// ─── TIPOS LOCALES DE LA PAGINA ────────────────────────────────────

// ESTRUCTURA DE UN ANILLO DEL HUD GAMIFICADO
interface HudRing {
  // CLAVE DEL ICONO PHOSPHOR QUE PINTA EL CENTRO
  icon: 'star' | 'fire' | 'trophy' | 'map-trifold';
  // VALOR NUMERICO DE PROGRESO (0..100) USADO PARA EL ANILLO
  value: number;
  // VALOR LEGIBLE PARA EL USUARIO (PUEDE LLEVAR % O UNIDADES)
  display: string;
  // ETIQUETA INFERIOR DEL ANILLO
  label: string;
  // TONO CROMATICO DEL ANILLO — USADO POR EL SCSS PARA EL HALO
  tone: 'xp' | 'streak' | 'trophy' | 'complete';
}

// ESTRUCTURA DE UN LOGRO DESBLOQUEADO QUE VIVE EN LA VITRINA
interface Achievement {
  // TITULO CORTO DEL LOGRO
  title: string;
  // DESCRIPCION QUE APARECE EN ARIA-LABEL Y EVENTUALMENTE EN TOOLTIP
  subtitle: string;
  // ICONO PHOSPHOR QUE LO REPRESENTA
  icon: 'shield' | 'fire' | 'key' | 'medal' | 'phish' | 'trophy';
  // TONO CROMATICO PARA EL HALO/CHIP
  tone: 'gold' | 'violet' | 'cyan' | 'pink' | 'green';
}

// ESTRUCTURA DEL PROXIMO LOGRO DESTACADO
interface NextAchievement {
  // TITULO DEL OBJETIVO
  title: string;
  // EXPLICACION CORTA DE COMO CONSEGUIRLO
  description: string;
  // PROGRESO ACTUAL EN PORCENTAJE 0..100
  progress: number;
}

// ESTRUCTURA DE UN ITEM DE AJUSTES SERIOS
interface SettingItem {
  // CLAVE INTERNA — UTIL EN HANDLERS PARA REACCIONAR SEGUN TIPO
  key: string;
  // ETIQUETA VISIBLE DEL AJUSTE
  label: string;
  // DESCRIPCION SECUNDARIA
  desc: string;
  // ICONO PHOSPHOR QUE LE ACOMPAÑA
  icon: string;
  // TONO OPCIONAL — DANGER PARA DESTRUCTIVOS, WARNING PARA SENSIBLES
  tone?: 'neutral' | 'danger' | 'warning' | 'success' | 'cyan' | 'pink';
  // BADGE OPCIONAL EN EL EXTREMO DERECHO (NUMERICO O ETIQUETA)
  badge?: string;
  // TONO DEL BADGE
  badgeTone?: 'neutral' | 'warning' | 'success' | 'danger';
}

// AGRUPACION DE AJUSTES POR INTENCION ("TU ESCUDO", "TUS DATOS"...)
interface SettingGroup {
  // CLAVE INTERNA DEL GRUPO
  key: string;
  // ETIQUETA SUPERIOR EN VERSALITAS
  eyebrow: string;
  // TITULO EDITORIAL DEL GRUPO
  title: string;
  // DESCRIPCION QUE EXPLICA LA INTENCION
  description: string;
  // LISTA DE AJUSTES DENTRO DEL GRUPO
  items: SettingItem[];
}

// METADATOS DE LOS CHIPS DE MODO TEMA
interface ThemeMode {
  // VALOR INTERNO QUE RECIBE THEMESERVICE
  value: ArgosTheme;
  // ETIQUETA VISIBLE
  label: string;
  // ICONO PHOSPHOR USADO EN EL CHIP
  icon: 'sun' | 'moon' | 'auto';
}

// METADATOS DE LOS SWATCHES DE ACENTO
interface AccentOption {
  value: ArgosAccent;
  label: string;
  hex: string;
}

// METADATOS DE OPCIONES SIMPLES (DENSIDAD, MOTION, PERSONALIDAD)
interface LabeledOption<T extends string> {
  value: T;
  label: string;
}

// METADATOS DE FUENTE — INCLUYEN VALOR Y ETIQUETA CORTA
interface FontOption {
  value: ArgosFontScale;
  label: string;
}

// METADATOS DE IDIOMA — INCLUYE CODIGO DE DOS LETRAS Y NOMBRE
interface LanguageOption {
  value: ArgosLang;
  code: string;
  label: string;
}

// PARTICULA DECORATIVA EN EL HERO
interface HeroParticle {
  x: number; y: number; o: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  // EL COMPONENTE NO ES STANDALONE — SE DECLARA EN ProfilePageModule
  standalone: false,
})
export class ProfilePage implements OnInit, AfterViewInit, OnDestroy {

  // ─── REFS AL DOM PARA SCOPE DE GSAP Y FOCO DE INPUTS ─────────────
  @ViewChild('pageRoot', { static: true }) pageRoot!: ElementRef<HTMLElement>;
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('hudSection') hudSection!: ElementRef<HTMLElement>;
  @ViewChild('customSection') customSection!: ElementRef<HTMLElement>;
  @ViewChild('xpCounter') xpCounter!: ElementRef<HTMLElement>;

  // ─── ESTADO DEL HEADER DE LA PAGINA ──────────────────────────────
  // FLAG DE TEMA EFECTIVO USADO PARA SINCRONIZAR ICONOS Y EL CUB
  isDark = false;
  // MODO ELEGIDO POR EL USUARIO (light|dark|auto) — UI DEL SEGMENTED
  currentMode: ArgosTheme = 'auto';

  // ─── DATOS DEL USUARIO ──────────────────────────────────────────
  // AVATAR EN DATAURL O NULL SI NO HAY UNO PERSONAL
  avatar: string | null = null;
  // NOMBRE MOSTRADO EN EL HERO
  displayName = 'Usuario ARGOS';
  // HANDLE/EMAIL VISIBLE BAJO EL NOMBRE — POR AHORA STUB CONSTANTE
  userHandle = '@guardian.argos';
  // FLAG QUE INDICA SI EL CAMPO DE NOMBRE ESTA EN MODO EDICION
  isEditingName = false;
  // BORRADOR DEL NOMBRE DURANTE LA EDICION INLINE
  nameDraft = '';

  // ─── PROGRESO DE NIVEL Y XP ──────────────────────────────────────
  // NIVEL ACTUAL DEL USUARIO
  level = 5;
  // XP ACUMULADA EN EL NIVEL ACTUAL
  xpCurrent = 1250;
  // XP NECESARIA PARA SUBIR DE NIVEL
  xpForNext = 2000;
  // RANGO TEXTUAL DERIVADO DEL NIVEL
  rankTitle = 'Guardián Digital · Nivel 5';
  // CIRCUNFERENCIA DEL ANILLO XP — 2π·54 PARA EL VIEWBOX 120x120
  readonly ringCircumference = 339.292;

  // ─── HUD DE PROGRESO ─────────────────────────────────────────────
  // ANILLOS DEL HUD — CADA UNO REPRESENTA UNA METRICA
  rings: HudRing[] = [
    { icon: 'star',        value: 62, display: '1 250', label: 'XP total',      tone: 'xp' },
    { icon: 'fire',        value: 70, display: '7',     label: 'Racha (días)',  tone: 'streak' },
    { icon: 'trophy',      value: 48, display: '12',    label: 'Logros',        tone: 'trophy' },
    { icon: 'map-trifold', value: 40, display: '40%',   label: 'Completado',    tone: 'complete' },
  ];
  // CIRCUNFERENCIA DEL ANILLO DEL HUD — 2π·26 PARA VIEWBOX 64x64
  readonly hudCircumference = 163.363;

  // VITRINA DE LOGROS DESBLOQUEADOS — EN UNA APP REAL VIENE DEL BACK
  unlockedAchievements: Achievement[] = [
    { title: 'Primer escudo',  subtitle: 'Activaste el 2FA',           icon: 'shield',  tone: 'cyan'   },
    { title: 'Racha de fuego', subtitle: '7 días seguidos',             icon: 'fire',    tone: 'gold'   },
    { title: 'Llave maestra',  subtitle: 'Generaste 25 contraseñas',    icon: 'key',     tone: 'violet' },
    { title: 'Detective',      subtitle: 'Detectaste 5 phishings',      icon: 'phish',   tone: 'pink'   },
    { title: 'Medalla bronce', subtitle: 'Nivel 5 alcanzado',           icon: 'medal',   tone: 'green'  },
    { title: 'Campeón mes',    subtitle: 'Top 10% de marzo',            icon: 'trophy',  tone: 'gold'   },
  ];
  // TOTAL DE LOGROS DISPONIBLES — DA EL DENOMINADOR DEL CONTADOR
  totalAchievements = 24;

  // PROXIMO LOGRO DESTACADO
  nextAchievement: NextAchievement = {
    title: 'Bóveda blindada',
    description: 'Activa biometría y completa 100 elementos cifrados.',
    progress: 68,
  };

  // ─── PARTICULAS DECORATIVAS DEL HERO ─────────────────────────────
  heroParticles: HeroParticle[] = Array.from({ length: 14 }, () => ({
    // POSICION X EN PORCENTAJE
    x: Math.random() * 100,
    // POSICION Y EN PORCENTAJE
    y: Math.random() * 100,
    // OPACIDAD BASE PARA QUE NO TODAS BRILLEN IGUAL
    o: 0.4 + Math.random() * 0.5,
  }));

  // ─── METADATOS DE LA UI DE PERSONALIZACION ───────────────────────
  themeModes: ThemeMode[] = [
    { value: 'light', label: 'Claro',  icon: 'sun'  },
    { value: 'dark',  label: 'Oscuro', icon: 'moon' },
    { value: 'auto',  label: 'Auto',   icon: 'auto' },
  ];
  accentOptions: AccentOption[] = [
    { value: 'violet', label: 'Violeta', hex: '#7C3AED' },
    { value: 'pink',   label: 'Rosa',    hex: '#EC4899' },
    { value: 'cyan',   label: 'Cian',    hex: '#06B6D4' },
    { value: 'green',  label: 'Verde',   hex: '#10B981' },
    { value: 'amber',  label: 'Ámbar',   hex: '#F59E0B' },
    { value: 'red',    label: 'Rojo',    hex: '#EF4444' },
  ];
  densityOptions: LabeledOption<ArgosDensity>[] = [
    { value: 'compact',  label: 'Compacto'  },
    { value: 'cozy',     label: 'Cómodo'    },
    { value: 'spacious', label: 'Espacioso' },
  ];
  fontOptions: FontOption[] = [
    { value: 'sm', label: 'S' },
    { value: 'md', label: 'M' },
    { value: 'lg', label: 'L' },
    { value: 'xl', label: 'XL' },
  ];
  motionOptions: LabeledOption<ArgosMotion>[] = [
    { value: 'minimal',   label: 'Mínimo'     },
    { value: 'normal',    label: 'Normal'     },
    { value: 'cinematic', label: 'Cinemático' },
  ];
  personalityOptions: LabeledOption<ArgosCubPersonality>[] = [
    { value: 'vigilant',  label: 'Vigilante'  },
    { value: 'kind',      label: 'Amable'     },
    { value: 'sarcastic', label: 'Sarcástico' },
  ];
  languageOptions: LanguageOption[] = [
    { value: 'es',  code: 'ES',  label: 'Español'  },
    { value: 'en',  code: 'EN',  label: 'English'  },
    { value: 'cat', code: 'CAT', label: 'Català'   },
  ];

  // ─── PREFERENCIAS ACTUALES (BINDINGS DE PLANTILLA) ───────────────
  currentAccent: ArgosAccent = 'violet';
  currentDensity: ArgosDensity = 'cozy';
  currentFont: ArgosFontScale = 'md';
  currentMotion: ArgosMotion = 'normal';
  cubPersonality: ArgosCubPersonality = 'kind';
  soundsEnabled = true;
  currentLang: ArgosLang = 'es';

  // ─── ESTADO DERIVADO DEL CUB ─────────────────────────────────────
  // MOOD ACTUAL DEL CUB EN EL HERO — POR DEFECTO 'sleeping'
  cubMood: 'sleeping' | 'wink' = 'sleeping';
  // MENSAJE DEL BUBBLE — CAMBIA SEGUN PERSONALIDAD
  cubMessage = '¿Listo para otro turno?';

  // ─── METADATOS DE LOS GRUPOS DE AJUSTES SERIOS ───────────────────
  settingsGroups: SettingGroup[] = [
    {
      key: 'shield',
      eyebrow: 'Tu escudo',
      title: 'Defensa activa',
      description: 'Quién te avisa, cómo te identifica y qué ven los demás.',
      items: [
        { key: 'notif',   label: 'Notificaciones', desc: 'Push, email y alertas críticas', icon: 'bell',    tone: 'neutral', badge: '3',   badgeTone: 'warning' },
        { key: 'sec',     label: 'Seguridad',      desc: 'PIN, biometría y 2FA',           icon: 'shield',  tone: 'neutral', badge: '2FA', badgeTone: 'success' },
        { key: 'privacy', label: 'Privacidad',    desc: 'Compartido, telemetría, perfil', icon: 'privacy', tone: 'neutral' },
      ],
    },
    {
      key: 'data',
      eyebrow: 'Tus datos',
      title: 'La caja fuerte',
      description: 'Lo que has guardado, exportado o quieres borrar.',
      items: [
        { key: 'export', label: 'Exportar bóveda', desc: 'Copia cifrada en .argos',        icon: 'export', tone: 'neutral' },
        { key: 'import', label: 'Importar datos',  desc: 'Desde otra app o backup',         icon: 'import', tone: 'neutral' },
        { key: 'wipe',   label: 'Borrar histórico', desc: 'Limpia logs locales y caché',   icon: 'trash',  tone: 'warning' },
      ],
    },
    {
      key: 'account',
      eyebrow: 'Cuenta',
      title: 'Identidad y sesión',
      description: 'Tu acceso a ARGOS y los dispositivos donde está abierto.',
      items: [
        { key: 'email',    label: 'Cambiar email',       desc: 'Correo asociado a la cuenta',   icon: 'email',   tone: 'neutral' },
        { key: 'password', label: 'Cambiar contraseña',  desc: 'Maestra · Zero-Knowledge',       icon: 'key',     tone: 'neutral' },
        { key: 'sessions', label: 'Sesiones activas',    desc: '2 dispositivos conectados',     icon: 'monitor', tone: 'neutral', badge: '2', badgeTone: 'neutral' },
        { key: 'logout',   label: 'Cerrar sesión',       desc: 'Salir en este dispositivo',     icon: 'signout', tone: 'neutral' },
        { key: 'delete',   label: 'Borrar cuenta',       desc: 'Acción irreversible',           icon: 'xcircle', tone: 'danger' },
      ],
    },
    {
      key: 'support',
      eyebrow: 'Soporte',
      title: 'Te acompañamos',
      description: 'Recursos, comunidad y novedades del producto.',
      items: [
        { key: 'help',      label: 'Centro de ayuda',  desc: 'FAQ, guías y atajos',            icon: 'help', tone: 'neutral' },
        { key: 'bug',       label: 'Reportar un bug',  desc: 'Cuéntanos qué falla',            icon: 'bug',  tone: 'neutral' },
        { key: 'about',     label: 'Sobre ARGOS',      desc: 'Filosofía y equipo',             icon: 'info', tone: 'neutral' },
        { key: 'changelog', label: 'Changelog',        desc: 'Qué hay nuevo en v1.0',          icon: 'changelog', tone: 'neutral', badge: 'NEW', badgeTone: 'success' },
      ],
    },
  ];

  // BUILD TAG MOSTRADO EN EL FOOTER — DERIVADO DEL TIMESTAMP DE BUILD
  buildTag = '2026.05';

  // ─── INSTANCIAS INTERNAS DE GSAP ─────────────────────────────────
  // CONTEXTO DE GSAP — SCOPE DE TWEENS Y SCROLLTRIGGERS
  private ctx?: gsap.Context;
  // MATCHMEDIA INSTANCE — PARA RESPETAR REDUCED-MOTION Y BREAKPOINTS
  private mm?: gsap.MatchMedia;
  // BANDERA QUE INDICA SI EL USUARIO PREFIERE MENOS MOVIMIENTO
  private prefersReducedMotion = false;
  // TIMER PENDIENTE DEL WINK DE LA MASCOTA
  private cubWinkTimer?: number;
  // FLAG QUE EVITA RELANZAR LA ANIMACION DE ENTRADA EN HOT RELOAD
  private hasAnimatedEnter = false;

  // ─── BINDING DE CLASE A LA RAIZ — UTIL PARA SELECTORES ──────────
  @HostBinding('class.argos-profile') private hostClass = true;

  // CONSTRUCTOR — INYECCION DE LOS TRES SERVICIOS Y DESTROYREF
  constructor(
    private themeService: ThemeService,
    private userProfile: UserProfileService,
    private prefs: PreferencesService,
    private destroyRef: DestroyRef,
  ) {
    // SUSCRIPCION AL TEMA EFECTIVO — UTIL PARA EL CUB Y EL TOGGLE
    this.themeService.isDark$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.isDark = v);
    // SUSCRIPCION AL MODO ELEGIDO POR EL USUARIO PARA EL SEGMENTED
    this.themeService.mode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.currentMode = v);

    // SUSCRIPCION AL AVATAR PARA REFLEJAR CAMBIOS EN VIVO
    this.userProfile.avatar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.avatar = v);
    // SUSCRIPCION AL NOMBRE DE USUARIO PARA EL HERO
    this.userProfile.username$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        // ACTUALIZA EL NOMBRE Y EL BORRADOR SI NO SE ESTA EDITANDO
        this.displayName = v;
        if (!this.isEditingName) this.nameDraft = v;
      });

    // SUSCRIPCIONES A PREFERENCIAS DE PERSONALIZACION VIVA
    this.prefs.accent$  .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.currentAccent  = v);
    this.prefs.density$ .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.currentDensity = v);
    this.prefs.font$    .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.currentFont    = v);
    this.prefs.motion$  .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.currentMotion  = v);
    this.prefs.cub$     .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      // GUARDA LA PERSONALIDAD Y ACTUALIZA EL MENSAJE DEL BUBBLE
      this.cubPersonality = v;
      this.cubMessage = this.deriveCubMessage(v);
    });
    this.prefs.sounds$  .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.soundsEnabled = v);
    this.prefs.lang$    .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.currentLang   = v);
  }

  // HOOK DE INICIALIZACION — CALCULA PREFERS-REDUCED-MOTION UNA VEZ
  ngOnInit(): void {
    // DETECCION DE LA PREFERENCIA DEL SISTEMA
    this.prefersReducedMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // ASEGURAMOS QUE EL BORRADOR INICIAL DEL NOMBRE COINCIDE CON EL ACTUAL
    this.nameDraft = this.displayName;
  }

  // HOOK TRAS RENDERIZAR LA VISTA — INICIA LA COREOGRAFIA GSAP
  ngAfterViewInit(): void {
    // SCOPE DE TODAS LAS TWEENS DEL PROFILE AL HOST PARA CLEANUP AUTOMATICO
    this.ctx = gsap.context(() => {
      // ESPERAMOS UN FRAME PARA QUE EL LAYOUT ESTE ESTABILIZADO
      requestAnimationFrame(() => this.setupAnimations());
    }, this.pageRoot.nativeElement);
  }

  // HOOK DE LIMPIEZA — REVIERTE EL CONTEXTO GSAP Y MATCHMEDIA
  ngOnDestroy(): void {
    // REVIERTE TODO LO REGISTRADO EN EL CONTEXTO (TWEENS + SCROLLTRIGGERS)
    this.ctx?.revert();
    // REVIERTE LAS QUERIES DE MATCHMEDIA QUE HAYAN QUEDADO ACTIVAS
    this.mm?.revert();
    // CANCELA EL TIMER PENDIENTE DEL WINK DE LA MASCOTA
    if (this.cubWinkTimer) {
      clearTimeout(this.cubWinkTimer);
      this.cubWinkTimer = undefined;
    }
    // MATAMOS TWEENS GLOBALES POR SI ALGO ESCAPO DEL CONTEXTO
    gsap.killTweensOf([
      this.pageRoot?.nativeElement,
      '.hero', '.hud', '.custom', '.settings', '.profile-foot',
    ]);
  }

  // ─── GETTER PARA EL ANILLO XP DEL AVATAR (USADO EN PLANTILLA) ────
  // CALCULA EL OFFSET DEL DASH SEGUN EL PORCENTAJE DE XP ACTUAL
  get ringDashOffset(): number {
    // CIRCUNFERENCIA TOTAL DEL CIRCULO
    const circ = this.ringCircumference;
    // PROGRESO 0..1 — XP ACTUAL SOBRE LA NECESARIA PARA EL SIGUIENTE NIVEL
    const ratio = Math.min(1, Math.max(0, this.xpCurrent / this.xpForNext));
    // OFFSET INVERSO PARA QUE EL RELLENO CRESCA SEGUN PROGRESO
    return circ * (1 - ratio);
  }
  // PROGRESO EN PORCENTAJE PARA LA BARRA INFERIOR DEL HERO
  get xpProgress(): number {
    // CONVERSION DEL RATIO A 0..100 ACOTADO
    return Math.round(Math.min(100, (this.xpCurrent / this.xpForNext) * 100));
  }

  // ─── HELPER USADO POR EL HUD PARA EL DASHOFFSET DE CADA ANILLO ───
  hudDashOffset(percent: number): number {
    // CIRCUNFERENCIA TOTAL DEL CIRCULO DE 26 DE RADIO
    const circ = this.hudCircumference;
    // PROGRESO 0..1 ACOTADO
    const ratio = Math.min(1, Math.max(0, percent / 100));
    // OFFSET INVERSO
    return circ * (1 - ratio);
  }

  // ─── INICIAL DEL USUARIO PARA EL FALLBACK SIN AVATAR ────────────
  getInitial(): string {
    // PRIMER CARACTER DEL NOMBRE EN MAYUSCULAS — FALLBACK 'U'
    return (this.displayName || 'U').trim().charAt(0).toUpperCase();
  }

  // ═══════════════════════════════════════════════════════════════
  // EDICION INLINE DEL NOMBRE
  // ═══════════════════════════════════════════════════════════════

  // ARRANCA LA EDICION DEL NOMBRE INLINE
  startEditingName(): void {
    // COPIA EL VALOR ACTUAL AL BORRADOR
    this.nameDraft = this.displayName;
    // ACTIVA EL MODO EDICION PARA QUE EL INPUT APAREZCA
    this.isEditingName = true;
    // FOCO AL INPUT EN EL SIGUIENTE FRAME PARA ASEGURAR QUE ESTA EN EL DOM
    requestAnimationFrame(() => this.nameInput?.nativeElement.focus());
  }

  // GUARDA EL NOMBRE EDITADO Y SALE DEL MODO EDICION
  commitName(): void {
    // SI NO ESTAMOS EDITANDO NO HACEMOS NADA
    if (!this.isEditingName) return;
    // LIMPIEZA DEL BORRADOR — TRIM Y FALLBACK SI QUEDA VACIO
    const next = (this.nameDraft || '').trim() || this.displayName || 'Usuario ARGOS';
    // PERSISTENCIA EN EL SERVICIO COMPARTIDO
    this.userProfile.setUsername(next);
    // FIN DE LA EDICION
    this.isEditingName = false;
  }

  // CANCELA LA EDICION — RESTABLECE EL BORRADOR Y CIERRA
  cancelEditingName(): void {
    // RESTAURAMOS EL BORRADOR AL VALOR PERSISTIDO
    this.nameDraft = this.displayName;
    // FIN DE LA EDICION SIN GUARDAR
    this.isEditingName = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // AVATAR — SELECTOR DE FICHEROS Y CONVERSION A DATAURL
  // ═══════════════════════════════════════════════════════════════

  // ABRE EL SELECTOR NATIVO DE FICHEROS PARA EL AVATAR
  openAvatarPicker(): void {
    this.avatarInput.nativeElement.click();
  }

  // PROCESA EL FICHERO ELEGIDO Y LO CONVIERTE EN DATAURL
  onAvatarSelected(event: Event): void {
    // OBTENEMOS EL INPUT ORIGEN DEL EVENTO
    const input = event.target as HTMLInputElement;
    // SI NO HAY FICHEROS NO PROCESAMOS NADA
    if (!input.files || input.files.length === 0) return;
    // SOLO EL PRIMER FICHERO ES RELEVANTE
    const file = input.files[0];
    // LIMITE DE 2MB PARA NO REVENTAR EL LOCALSTORAGE
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.');
      return;
    }
    // LECTOR DE FICHEROS QUE CONVIERTE A DATAURL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // PERSISTIMOS EN EL SERVICIO COMPARTIDO QUE NOTIFICA A SUSCRIPTORES
      this.userProfile.setAvatar(e.target.result);
      // DESPIERTA LA MASCOTA UN MOMENTO PARA CELEBRAR EL CAMBIO
      this.flashCubWink();
    };
    // INICIO DE LECTURA EN MODO DATAURL
    reader.readAsDataURL(file);
    // LIMPIA EL VALOR DEL INPUT PARA PODER VOLVER A ELEGIR LA MISMA IMAGEN
    input.value = '';
  }

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS DE PERSONALIZACION VIVA
  // ═══════════════════════════════════════════════════════════════

  // CAMBIA EL MODO DE TEMA — TRANSICION CROSSFADE GENTIL Y RIPPLE
  onSelectTheme(mode: ArgosTheme, event: MouseEvent): void {
    // SI YA ESTAMOS EN ESE MODO NO HACEMOS NADA
    if (this.currentMode === mode) return;
    // DELEGAMOS EN EL THEMESERVICE — EL APPLY PROVOCA EL CAMBIO INMEDIATO
    this.themeService.setMode(mode);
    // EFECTO CROSSFADE SUAVE SOBRE EL DOCUMENTO PARA EVITAR FLASH BRUSCO
    this.crossfadeOnce();
    // ONDA SUTIL DESDE EL CHIP PULSADO REFORZANDO LA INTERACCION
    this.spawnRipple(event, 'currentColor');
  }

  // SELECCION DE ACENTO DE MARCA — ONDA EXPANSIVA + PERSISTENCIA
  onSelectAccent(accent: ArgosAccent, event: MouseEvent): void {
    // PERSISTENCIA Y APLICACION EN VIVO SOBRE :root
    this.prefs.setAccent(accent);
    // ONDA EXPANSIVA DESDE EL SWATCH CON SU HEX REAL
    this.spawnRipple(event, this.prefs.getAccentHex(accent));
    // UN PULSO MUY SUTIL DEL AVATAR PARA QUE EL USUARIO SIENTA EL CAMBIO
    this.pulseAvatarHalo();
  }

  // SELECCION DE DENSIDAD
  onSelectDensity(density: ArgosDensity): void {
    // PERSISTENCIA Y APLICACION INSTANTANEA EN :root
    this.prefs.setDensity(density);
  }

  // SELECCION DE TAMAÑO DE FUENTE
  onSelectFont(font: ArgosFontScale): void {
    // PERSISTENCIA Y APLICACION INMEDIATA
    this.prefs.setFont(font);
  }

  // SELECCION DEL NIVEL DE MOTION
  onSelectMotion(motion: ArgosMotion): void {
    // PERSISTENCIA Y APLICACION INMEDIATA
    this.prefs.setMotion(motion);
    // RECONFIGURAMOS PARALLAX/CINEMATIC SI HACE FALTA
    this.refreshCinematicParallax();
  }

  // CAMBIO DE PERSONALIDAD DEL CUB
  onSelectPersonality(person: ArgosCubPersonality): void {
    // PERSISTENCIA Y APLICACION
    this.prefs.setCubPersonality(person);
    // PEQUEÑO GUIÑO DEL CUB PARA CONFIRMAR EL CAMBIO
    this.flashCubWink();
  }

  // SWITCH DE SONIDOS DEL SISTEMA
  onToggleSounds(): void {
    // INVERSION DEL ESTADO ACTUAL
    const next = !this.soundsEnabled;
    // PERSISTENCIA Y APLICACION
    this.prefs.setSounds(next);
    // FEEDBACK ACUSTICO SI SE ENCIENDEN — NO BLOQUEANTE Y RESILIENTE
    if (next) this.playBlip();
  }

  // SELECCION DE IDIOMA
  onSelectLang(lang: ArgosLang): void {
    // PERSISTENCIA — LA APLICACION REAL DE i18n SE DELEGA EN FUTURO
    this.prefs.setLanguage(lang);
  }

  // ═══════════════════════════════════════════════════════════════
  // OTROS HANDLERS DE UI
  // ═══════════════════════════════════════════════════════════════

  // HACE SCROLL AL PANEL DE PERSONALIZACION DESDE EL BOTON DEL HEADER
  scrollToCustomization(): void {
    // SCROLL SUAVE AL ANCHOR DEL CUSTOM SECTION SI EXISTE
    const el = this.customSection?.nativeElement;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // HANDLER GENERICO DE TAP SOBRE UN AJUSTE — STUB QUE LOG-EA LA CLAVE
  onSettingTap(item: SettingItem): void {
    // NO HAY DESTINOS REALES TODAVIA, ASI QUE SOLO REGISTRAMOS EL EVENTO
    // EVITAMOS EFECTOS COLATERALES INESPERADOS PARA LA UI EN ESTE PASO
    if (typeof window !== 'undefined') {
      console.log('[ARGOS][profile] ajuste pulsado:', item.key);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COREOGRAFIA GSAP
  // ═══════════════════════════════════════════════════════════════

  // CONFIGURA TODAS LAS ANIMACIONES TRAS EL PRIMER LAYOUT
  private setupAnimations(): void {
    // INSTANCIA DE MATCHMEDIA PARA AGRUPAR QUERIES Y CLEANUP COHERENTE
    this.mm = gsap.matchMedia();

    // ─── QUERY GENERICA SIN REDUCED-MOTION ─────────────────────────
    this.mm.add('(prefers-reduced-motion: no-preference)', () => {
      // ANIMACION DE ENTRADA EN CASCADA
      this.animateEnter();
      // SCROLL REVEAL DE LAS SECCIONES POSTERIORES
      this.bindScrollReveals();
      // COUNT-UP DEL XP EN EL HERO
      this.tweenXpCounter();
      // PARALLAX CINEMATIC SI EL USUARIO LO TIENE ACTIVADO
      this.bindCinematicParallax();
      // LIMPIEZA OPCIONAL AL DESHACER LA QUERY
      return () => { /* el contexto ya limpia las tweens al revert */ };
    });

    // ─── QUERY ACCESIBLE — SIN MOVIMIENTO ─────────────────────────
    this.mm.add('(prefers-reduced-motion: reduce)', () => {
      // FORZAMOS LOS ELEMENTOS REVEAL A SU ESTADO FINAL VISIBLE
      const reveals = this.pageRoot.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]');
      reveals.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      // EL XP COUNTER NO HACE COUNT-UP — DIBUJA EL VALOR FINAL DIRECTAMENTE
      if (this.xpCounter?.nativeElement) {
        this.xpCounter.nativeElement.textContent = this.xpCurrent.toLocaleString('es-ES');
      }
      return () => undefined;
    });
  }

  // ANIMACION DE ENTRADA EN CASCADA (HERO → HUD → CUSTOM → SETTINGS → FOOT)
  private animateEnter(): void {
    // EVITA RELANZAR LA ANIMACION SI YA SE HIZO EN ESTA INSTANCIA
    if (this.hasAnimatedEnter) return;
    this.hasAnimatedEnter = true;

    // TIMELINE PRINCIPAL — UN UNICO RELOJ PARA SECUENCIAR TODO EL HERO
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1) HERO COMO BLOQUE — APARECE PRIMERO
    tl.fromTo('[data-reveal="hero"]',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55 },
    );
    // 2) HUD — STAGGER DE LOS ANILLOS
    tl.fromTo('[data-reveal="hud"]',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45 }, '-=0.25',
    );
    tl.fromTo('.hud-ring',
      { opacity: 0, scale: 0.9, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'back.out(1.6)' },
      '-=0.3',
    );
    // 3) LOGROS — DESLIZAN HORIZONTAL DESDE LA DERECHA
    tl.fromTo('.achievement-chip',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' },
      '-=0.2',
    );
    // 4) PROXIMO LOGRO
    tl.fromTo('.next-achievement',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4 },
      '-=0.1',
    );
    // 5) CUSTOM — ROWS APARECEN UNA TRAS OTRA
    tl.fromTo('[data-reveal="custom"]',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4 },
    );
    tl.fromTo('.custom-row',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 },
      '-=0.3',
    );
    // 6) SETTINGS — GRUPOS COMO BLOQUE Y LUEGO SUS ITEMS
    tl.fromTo('[data-reveal="settings"]',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
    );
    // 7) FOOT
    tl.fromTo('[data-reveal="foot"]',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35 },
      '-=0.1',
    );
  }

  // SCROLL REVEAL POR SECCION USANDO SCROLLTRIGGER COMO REFUERZO
  private bindScrollReveals(): void {
    // CADA SECCION POSTERIOR SE ASEGURA DE QUEDAR VISIBLE AL ENTRAR
    const sections = this.pageRoot.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]');
    sections.forEach(section => {
      // SI LA SECCION YA ESTA VISIBLE AL CARGAR (HERO/HUD), LA ANIMACION
      // PRINCIPAL YA SE ENCARGO. SCROLLTRIGGER SOLO PILLA SECCIONES BAJAS.
      ScrollTrigger.create({
        trigger: section,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(section, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        },
      });
    });
  }

  // PARALLAX SUTIL DEL HERO CUANDO MOTION ES CINEMATIC
  private bindCinematicParallax(): void {
    // SOLO TIENE SENTIDO SI EL USUARIO ESTA EN MOTION=CINEMATIC
    if (this.currentMotion !== 'cinematic') return;
    // PARALLAX DE LA AURORA Y DE LAS PARTICULAS SEGUN SCROLL
    const aurora = this.pageRoot.nativeElement.querySelector<HTMLElement>('.hero-aurora');
    const particles = this.pageRoot.nativeElement.querySelectorAll<HTMLElement>('.hero-particles span');
    if (aurora) {
      gsap.to(aurora, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-reveal="hero"]',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.4,
        },
      });
    }
    particles.forEach((p, i) => {
      gsap.to(p, {
        yPercent: -10 - (i % 4) * 4,
        xPercent:  ((i % 2) ? 6 : -6),
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-reveal="hero"]',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    });
  }

  // REGENERA EL PARALLAX TRAS UN CAMBIO DE MOTION EN VIVO
  private refreshCinematicParallax(): void {
    // MATAMOS LOS SCROLLTRIGGERS ANTERIORES PARA QUE NO SE DUPLIQUEN
    ScrollTrigger.getAll()
      .filter(st => st.vars.trigger === '[data-reveal="hero"]')
      .forEach(st => st.kill());
    // SI EL NUEVO MOTION REACTIVA EL CINEMATIC LO RE-VINCULAMOS
    this.bindCinematicParallax();
  }

  // COUNT-UP DEL XP DEL HERO USANDO gsap PARA SUAVIDAD
  private tweenXpCounter(): void {
    // SI NO HAY REFERENCIA AL NODO NO HACEMOS NADA
    const node = this.xpCounter?.nativeElement;
    if (!node) return;
    // ESTADO MUTABLE QUE TWEENEAMOS
    const state = { v: 0 };
    // TWEEN HASTA EL VALOR REAL CON FORMATO MILLAR ES
    gsap.to(state, {
      v: this.xpCurrent,
      duration: 1.1,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => {
        node.textContent = Math.round(state.v).toLocaleString('es-ES');
      },
    });
  }

  // EFECTO DE ONDA EXPANSIVA DESDE EL PUNTO DEL CLICK (ACENTO/TEMA)
  private spawnRipple(event: MouseEvent, color: string): void {
    // SI NO HAY EVENTO NATIVO NO PINTAMOS NADA
    if (!event) return;
    // ELEMENTO TEMPORAL QUE AÑADIMOS AL BODY Y BORRAMOS AL ACABAR
    const node = document.createElement('span');
    node.className = 'accent-ripple';
    node.style.left = `${event.clientX}px`;
    node.style.top = `${event.clientY}px`;
    node.style.setProperty('--ripple-color', color);
    document.body.appendChild(node);
    // ANIMACION ESCALADO + FADE USANDO GSAP
    gsap.fromTo(node,
      { scale: 0, opacity: 0.75 },
      {
        scale: 28,
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        onComplete: () => node.remove(),
      },
    );
  }

  // CROSSFADE SUAVE DEL DOCUMENTO AL CAMBIAR DE TEMA
  private crossfadeOnce(): void {
    // CAPA TEMPORAL QUE CUBRE EL VIEWPORT CON EL FONDO ACTUAL
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 9998;
      background: ${getComputedStyle(document.body).backgroundColor};
      opacity: 0;
    `;
    document.body.appendChild(overlay);
    // FADE-IN RAPIDO Y LUEGO FADE-OUT — DURACION TOTAL 400MS
    gsap.timeline({ onComplete: () => overlay.remove() })
      .to(overlay, { opacity: 0.85, duration: 0.16, ease: 'power2.out' })
      .to(overlay, { opacity: 0,    duration: 0.24, ease: 'power1.in'  });
  }

  // PULSO LIGERO DEL HALO DEL AVATAR PARA REFORZAR CAMBIO DE ACENTO
  private pulseAvatarHalo(): void {
    // SI NO TENEMOS LA REFERENCIA NO HACEMOS NADA
    const halo = this.pageRoot.nativeElement.querySelector<HTMLElement>('.avatar-halo');
    if (!halo) return;
    // TWEEN BREVE DE ESCALADO Y OPACIDAD QUE VUELVE AL ESTADO BASE
    gsap.fromTo(halo,
      { scale: 0.9, opacity: 0.7 },
      { scale: 1.18, opacity: 1, duration: 0.32, ease: 'power2.out', yoyo: true, repeat: 1 },
    );
  }

  // DISPARA UN WINK PUNTUAL DE LA MASCOTA Y VUELVE A SLEEPING
  private flashCubWink(): void {
    // CANCELAMOS TIMERS PREVIOS PARA NO ACUMULAR
    if (this.cubWinkTimer) {
      clearTimeout(this.cubWinkTimer);
    }
    // PASAMOS A WINK PARA DISPARAR LA ANIMACION INTERNA
    this.cubMood = 'wink';
    // VOLVEMOS A SLEEPING TRAS 1.4S — DURACION DEL ONE-SHOT
    this.cubWinkTimer = window.setTimeout(() => {
      this.cubMood = 'sleeping';
      this.cubWinkTimer = undefined;
    }, 1400);
  }

  // FEEDBACK ACUSTICO SUAVE — WEB AUDIO API SIN DEPENDENCIAS
  private playBlip(): void {
    // INTENTO PROTEGIDO POR SI EL ENTORNO NO PERMITE AUDIO CONTEXT
    try {
      // CREACION DEL CONTEXTO Y OSCILADOR
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      // CIERRE DEL CONTEXTO TRAS LA MUESTRA
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => ctx.close().catch(() => undefined);
    } catch {
      // SILENCIOSO — NO QUEREMOS ROMPER LA UI POR UN BIP
    }
  }

  // DERIVA EL MENSAJE QUE PRONUNCIA EL CUB SEGUN PERSONALIDAD
  private deriveCubMessage(personality: ArgosCubPersonality): string {
    // MENSAJES POR PERSONALIDAD — LISTA ESCUETA SIN PLACEHOLDERS
    switch (personality) {
      case 'vigilant':
        return 'Ojo abierto, perímetro limpio.';
      case 'sarcastic':
        return '¿Vas a poner contraseña hoy o…?';
      case 'kind':
      default:
        return '¿Listo para otro turno?';
    }
  }
}
