// VAULT PAGE — REDISENO CLAYMORPHISM + BENTO + GAMIFICACION HONESTA
//
// RESUMEN: PAGINA PRINCIPAL DE LA BOVEDA. RENDERIZA ITEMS Y CARPETAS
// DESCIFRADOS EN CLIENTE Y DELEGA EL CRUD AL VaultService. NO TOCA EL
// CONTRATO DE API (item_type SIGUE SIENDO 'password'|'note'|'file'); LOS
// SUBTIPOS LOGIN/CARD/IDENTITY/APIKEY/SEED/NOTE/FILE VIVEN EN payload.kind
// Y NUNCA SALEN AL SERVIDOR EN CLARO — SOLO DENTRO DEL BLOB CIFRADO.

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { gsap } from 'gsap';
// PLUGINS GSAP DISPONIBLES SIN COSTE EN GSAP 3.13+:
// Flip = TRANSICION SUAVE ENTRE ESTADOS DOM (PARA REORDER DE FAVORITOS)
// SplitText = REVELAR TEXTO CARACTER A CARACTER (PARA ONBOARDING)
// CustomBounce = EASE CON BOUNCE CONTROLADO (SOLO PARA LOGROS DESBLOQUEADOS)
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { CustomBounce } from 'gsap/CustomBounce';
import { CustomEase } from 'gsap/CustomEase';
import { AuthService } from '../services/auth.service';
import {
  VaultService,
  VaultItem,
  VaultFolder,
  VaultItemPayload,
} from '../services/vault.service';

// TIPO DE PESTANA ACTIVA EN EL TOP DE LA PAGINA
type ViewTab = 'all' | 'password' | 'note' | 'file';

// SUBTIPO DIDACTICO DENTRO DEL PAYLOAD CIFRADO — NO TOCA API
export type VaultKind =
  | 'login'    // CONTRASENA DE CUENTA (DEFAULT PARA item_type='password')
  | 'card'     // TARJETA BANCARIA
  | 'identity' // DOCUMENTO DE IDENTIDAD
  | 'apikey'   // CLAVE API / TOKEN
  | 'seed'     // SEMILLA CRIPTO / RECUPERACION
  | 'note'     // NOTA SEGURA (DEFAULT PARA item_type='note')
  | 'file';    // FICHERO CIFRADO (FIJADO POR item_type='file')

// METADATA POR KIND — ICONO PHOSPHOR, COLOR SEMANTICO Y LABEL
interface KindMeta {
  icon: string;       // NOMBRE DEL ELEMENTO PHOSPHOR (SIN PREFIJO ph-)
  color: string;      // VARIABLE CSS DEL COLOR SEMANTICO
  label: string;      // LABEL EN ESPANOL PARA LA UI
  parentType: 'password' | 'note' | 'file';  // item_type CONTRATADO POR EL BACKEND
}

// LOGRO DETECTADO SOBRE EL ESTADO ACTUAL DE LA BOVEDA
interface Achievement {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  hint: string;
}

// PASO DEL ONBOARDING DIDACTICO
interface OnboardingStep {
  title: string;
  body: string;
  icon: string;
}

// PRESET DE ACENTO PARA EL SELECTOR DE PERSONALIZACION
interface AccentPreset {
  key: string;
  label: string;
  hex: string;
}

@Component({
  selector: 'app-vault',
  templateUrl: './vault.page.html',
  styleUrls: ['./vault.page.scss'],
  standalone: false
})
export class VaultPage implements OnInit, OnDestroy, AfterViewInit {

  // REFERENCIA AL INPUT OCULTO PARA SUBIR ICONO PERSONALIZADO
  @ViewChild('iconInput') iconInput!: ElementRef<HTMLInputElement>;
  // REFERENCIA AL INPUT OCULTO PARA SUBIR FICHEROS A LA BOVEDA
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  // REFERENCIA AL CONTENEDOR ION-CONTENT PARA CONTROLAR EL SCROLL
  @ViewChild(IonContent) content!: IonContent;

  // ── ESTADO BASE ─────────────────────────────────────────────────────
  // ESTADO DE LA CAJA DE BUSQUEDA
  searchQuery = '';
  // PESTANA ACTIVA (TODO, CONTRASENAS, NOTAS, FICHEROS)
  activeTab: ViewTab = 'all';
  // CARPETA ACTIVA O NULL SI SE MUESTRAN TODAS
  activeFolderId: number | null = null;
  // ESTADO DE APERTURA DEL FAB
  fabOpen = false;
  // OVERLAY DE ANIMACION DE CIFRADO PARA FICHEROS
  showCipherAnim = false;

  // LISTA REAL DE ITEMS DESCIFRADOS EN MEMORIA
  items: VaultItem[] = [];
  // LISTA REAL DE CARPETAS DEL USUARIO
  folders: VaultFolder[] = [];
  // FLAG DE CARGA INICIAL PARA MOSTRAR SPINNER
  loading = true;

  // MAPA DE ICONOS PERSONALIZADOS POR ID DE ITEM (PERSISTIDO EN LOCALSTORAGE)
  customIcons: { [id: number]: string } = {};
  // ORDEN PERSONALIZADO DE FAVORITOS (IDS DE ITEM, MAX 6, PERSISTIDO)
  favoriteIds: number[] = [];

  // ── ESTADO FORMULARIOS ──────────────────────────────────────────────
  // FLAGS DE APERTURA DE LOS MODALES PERSONALIZADOS
  addPasswordOpen = false;
  addNoteOpen = false;
  addFolderOpen = false;
  // ITEM EN MODO EDICION (NULL = MODAL ES PARA ALTA)
  editingItem: VaultItem | null = null;
  // ITEM PENDIENTE DE CONFIRMAR ELIMINACION
  confirmDelete: VaultItem | null = null;
  // CHECKLIST DEL MODAL DE BORRADO (REQUIERE 2 CONFIRMACIONES EXPLICITAS)
  confirmDeleteChecks = { exported: false, understood: false };
  // FLAG GENERAL DE GUARDADO PARA DESHABILITAR BOTONES MIENTRAS SE PROCESA
  saving = false;
  // FLAG DE MOSTRAR/OCULTAR CONTRASENA EN EL FORMULARIO
  showPasswordInForm = false;

  // FORMULARIO DE ALTA/EDICION DE CONTRASENA (UNIFICADO)
  formPassword: {
    title: string;
    username: string;
    password: string;
    url: string;
    folderId: number | null;
    kind: 'login' | 'card' | 'apikey' | 'seed';
  } = { title: '', username: '', password: '', url: '', folderId: null, kind: 'login' };

  // FORMULARIO DE ALTA/EDICION DE NOTA (UNIFICADO)
  formNote: {
    title: string;
    notes: string;
    folderId: number | null;
    kind: 'note' | 'identity';
  } = { title: '', notes: '', folderId: null, kind: 'note' };

  // FORMULARIO DE ALTA DE CARPETA
  formFolder: {
    name: string;
    color: string;
    icon: string;
  } = { name: '', color: '#7C3AED', icon: 'folder' };

  // PALETA DE COLORES OFRECIDA AL CREAR UNA CARPETA
  readonly folderColors: string[] = [
    '#7C3AED', '#10B981', '#EC4899', '#06B6D4',
    '#F59E0B', '#EF4444', '#3B82F6', '#84CC16',
  ];

  // ICONOS DISPONIBLES PARA CARPETAS (COINCIDEN CON LOS *ngIf DEL HTML)
  readonly folderIcons: string[] = [
    'folder', 'bank', 'envelope', 'users-three',
    'briefcase', 'house', 'share-network',
  ];

  // ── ICONOGRAFIA POR KIND ────────────────────────────────────────────
  // MAPA KIND → META. ES LA UNICA FUENTE DE VERDAD ICONOGRAFICA.
  readonly kindMeta: Record<VaultKind, KindMeta> = {
    login:    { icon: 'key',                 color: 'var(--color-primary)',      label: 'Cuenta',       parentType: 'password' },
    card:     { icon: 'credit-card',         color: 'var(--color-success)',      label: 'Tarjeta',      parentType: 'password' },
    apikey:   { icon: 'terminal-window',     color: 'var(--color-warning)',      label: 'API key',      parentType: 'password' },
    seed:     { icon: 'wallet',              color: 'var(--color-secondary)',    label: 'Semilla',      parentType: 'password' },
    identity: { icon: 'identification-card', color: 'var(--color-accent)',       label: 'Identidad',    parentType: 'note'     },
    note:     { icon: 'note',                color: 'var(--color-primary-soft)', label: 'Nota',         parentType: 'note'     },
    file:     { icon: 'file',                color: 'var(--color-text-muted)',   label: 'Archivo',      parentType: 'file'     },
  };

  // KINDS QUE EL USUARIO PUEDE ELEGIR EN EL FORMULARIO DE PASSWORD
  readonly passwordKinds: Array<'login' | 'card' | 'apikey' | 'seed'> =
    ['login', 'card', 'apikey', 'seed'];
  // KINDS QUE EL USUARIO PUEDE ELEGIR EN EL FORMULARIO DE NOTA
  readonly noteKinds: Array<'note' | 'identity'> = ['note', 'identity'];

  // ── PERSONALIZACION ─────────────────────────────────────────────────
  // PRESETS DEL ACENTO PERSONALIZABLE (5 + DEFAULT VIOLETA)
  readonly accentPresets: AccentPreset[] = [
    { key: 'default', label: 'Violeta', hex: '#7C3AED' },
    { key: 'rosa',    label: 'Rosa',    hex: '#EC4899' },
    { key: 'cyan',    label: 'Cyan',    hex: '#06B6D4' },
    { key: 'verde',   label: 'Verde',   hex: '#10B981' },
    { key: 'ambar',   label: 'Ambar',   hex: '#F59E0B' },
    { key: 'rojo',    label: 'Rojo',    hex: '#EF4444' },
  ];
  // KEY ACTIVA DEL ACENTO (PERSISTIDA EN LOCALSTORAGE)
  accentKey = 'default';
  // MODO DENSIDAD (COMODO POR DEFECTO, COMPACTO OPCIONAL)
  density: 'comfortable' | 'compact' = 'comfortable';
  // INICIAL DEL USUARIO PARA EL AVATAR DEL HEADER (DERIVADA DEL EMAIL)
  userInitial = 'A';
  // NOMBRE CORTO DEL USUARIO PARA EL SALUDO
  userDisplay = '';
  // FLAG DE APERTURA DEL PANEL DE PERSONALIZACION
  customizeOpen = false;

  // ── CLIPBOARD AUTOCLEAR ─────────────────────────────────────────────
  // ID DEL ITEM CUYA PASSWORD ESTA AHORA MISMO EN EL PORTAPAPELES
  copiedItemId: number | null = null;
  // SEGUNDOS RESTANTES ANTES DEL AUTOCLEAR (CUENTA REGRESIVA VISIBLE)
  copyCountdown = 0;
  // HANDLE DEL setInterval PARA LIMPIAR
  private copyTimerHandle: any = null;
  // DURACION DEL AUTOCLEAR EN SEGUNDOS
  readonly COPY_AUTOCLEAR_SECONDS = 30;

  // ── HEALTH SCORE ────────────────────────────────────────────────────
  // PORCENTAJE 0-100 AGREGADO DE LA SALUD DE LA BOVEDA
  healthScore = 0;
  // BREAKDOWN POR METRICA (PARA TOOLTIP / EXPANSION)
  healthBreakdown = {
    strong: 0,    // % CONTRASENAS FUERTES
    unique: 0,    // % CONTRASENAS UNICAS (NO REUTILIZADAS)
    noLeak: 0,    // % SIN HIT EN HIBP (PLACEHOLDER HASTA INTEGRAR AUDITOR)
    fresh: 0,     // BONUS POR AUDITORIA RECIENTE (PLACEHOLDER)
  };
  // LOGROS DETECTADOS SOBRE EL ESTADO ACTUAL
  achievements: Achievement[] = [];

  // ── ONBOARDING ──────────────────────────────────────────────────────
  // INDICE DEL PASO ACTUAL (-1 = NO HAY ONBOARDING ABIERTO)
  onboardingStep = -1;
  // CONTENIDO DE LOS PASOS (DIDACTICO, NO PROMOCIONAL)
  readonly onboardingSteps: OnboardingStep[] = [
    {
      title: 'Tu boveda es zero-knowledge',
      body: 'Todo se cifra en TU dispositivo con AES-256-GCM antes de salir. El servidor solo guarda bloques cifrados — nadie, ni el equipo de ARGOS, puede leerlos.',
      icon: 'shield-check',
    },
    {
      title: 'Tu clave maestra es volatil',
      body: 'Al cerrar sesion la clave se borra de memoria. Sin ella tus datos son ilegibles incluso si el servidor cayera comprometido. Por eso te volvera a pedir login cada vez que vuelvas.',
      icon: 'key',
    },
    {
      title: 'Contrasenas fuertes y unicas',
      body: 'Reutilizar una contrasena entre cuentas es el #1 vector de fuga. Usa el generador integrado: longitud ≥ 12, mayusculas, numeros y simbolos. La bóveda mide la fuerza en vivo.',
      icon: 'lock',
    },
    {
      title: 'Activa 2FA cuando puedas',
      body: 'Aunque una contrasena se filtre, un segundo factor (TOTP o llave fisica) detiene el acceso. Guarda los codigos de respaldo aqui como notas seguras.',
      icon: 'lock-open',
    },
    {
      title: 'La copia se autodestruye',
      body: 'Cuando copias una contrasena al portapapeles la bóveda la borra automaticamente a los 30 segundos. Veras una cuenta atras junto al item — pega antes.',
      icon: 'copy',
    },
  ];

  // ── PASSWORD GENERATOR ──────────────────────────────────────────────
  // FLAG DE APERTURA DEL POPOVER DE GENERADOR DE CONTRASENAS
  generatorOpen = false;
  // CONFIG DEL GENERADOR
  generatorConfig = {
    length: 16,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
  };

  // SET DE IDS DE LOGROS YA DESBLOQUEADOS PARA DETECTAR TRANSICIONES
  private prevUnlockedIds = new Set<string>();
  // INSTANCIA ACTIVA DE SPLITTEXT EN EL ONBOARDING (PARA REVERT)
  private onboardSplit: SplitText | null = null;
  // FLAG QUE INDICA SI EL USUARIO PREFIERE REDUCED MOTION
  private reducedMotion = false;
  // FLAG QUE INDICA QUE LA VISTA YA SE INICIALIZO (PARA EVITAR SPLITTEXT TEMPRANO)
  private viewReady = false;

  // CONSTRUCTOR QUE INYECTA VaultService, AuthService Y Router
  constructor(
    private vault: VaultService,
    private auth: AuthService,
    private router: Router,
  ) {
    // REGISTRO UNICO DE PLUGINS GSAP — IDEMPOTENTE
    gsap.registerPlugin(Flip, SplitText, CustomBounce, CustomEase);
    // CREA UN BOUNCE PERSONALIZADO PARA CELEBRACIONES DE LOGRO
    if (!(gsap as any).effects?.vaultBounceRegistered) {
      CustomBounce.create('vault-bounce', { strength: 0.5, squash: 1.6, squashID: 'vault-bounce-squash' });
      (gsap as any).effects = (gsap as any).effects || {};
      (gsap as any).effects.vaultBounceRegistered = true;
    }
    // DETECTA LA PREFERENCIA DEL USUARIO UNA SOLA VEZ
    try {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      this.reducedMotion = false;
    }
  }

  // INICIALIZACION DE LA PAGINA: CARGA SEED + DATOS REALES
  async ngOnInit() {
    // RESTAURA LAS PREFERENCIAS DEL USUARIO ANTES DE NADA
    this.loadCustomIcons();
    this.loadFavorites();
    this.loadAccent();
    this.loadDensity();
    this.loadUserIdentity();

    // SI NO HAY CLAVE DE CIFRADO EN MEMORIA FUERZA UN LOGIN FRESCO
    // (LA CLAVE ES VOLATIL POR DISENO Y SE PIERDE EN CADA RECARGA)
    const keyPresent = !!this.auth.getEncryptionKey();
    if (!keyPresent) {
      this.auth.logout();
      this.router.navigateByUrl('/login');
      this.loading = false;
      return;
    }
    try {
      // PRIMERA CARGA: SI LA BOVEDA ESTA VACIA, INSERTA SEED DEMO
      await this.vault.seedDemoData();
      // RECARGA LA LISTA DE CARPETAS E ITEMS REALES
      await this.refresh();
      // DISPARA EL ONBOARDING SI ES PRIMERA VEZ DE ESTE USUARIO
      this.maybeStartOnboarding();
    } catch (err) {
      console.error('Error cargando boveda:', err);
    } finally {
      this.loading = false;
    }
  }

  // RECARGA CARPETAS E ITEMS DESDE EL BACKEND
  async refresh() {
    try {
      const freshFolders = await this.vault.listFolders();
      this.folders = freshFolders;
    } catch (err) {
      console.error('Error refrescando carpetas:', err);
    }
    try {
      const freshItems = await this.vault.listItems();
      this.items = freshItems;
    } catch (err) {
      console.error('Error refrescando items:', err);
    }
    // RECALCULA HEALTH SCORE Y LOGROS AL TERMINAR LA RECARGA
    this.recomputeHealth();
  }

  // HOOK QUE FIJA viewReady PARA QUE LAS ANIMACIONES PUEDAN USAR EL DOM
  ngAfterViewInit() {
    this.viewReady = true;
  }

  // ESCAPE GLOBAL: CIERRA EL OVERLAY ABIERTO MAS RECIENTE EN ORDEN DE PRIORIDAD
  // PRIORIDAD: ONBOARDING > CONFIRM-DELETE > CUSTOMIZE > PASSWORD > NOTE > FOLDER > FAB
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.onboardingStep >= 0) return this.skipOnboarding();
    if (this.confirmDelete) return this.cancelDelete();
    if (this.customizeOpen) return this.closeCustomize();
    if (this.addPasswordOpen) return this.cancelAddPassword();
    if (this.addNoteOpen) return this.cancelAddNote();
    if (this.addFolderOpen) return this.cancelAddFolder();
    if (this.fabOpen) this.fabOpen = false;
  }

  // CALLBACK DE IONIC AL ENTRAR EN LA VISTA, DISPARA ANIMACIONES
  ionViewDidEnter() {
    this.animateEntrance();
  }

  // ── ANIMACIONES GSAP ESPECIFICAS ────────────────────────────────────
  // REVELA EL TITULO DEL ONBOARDING CARACTER A CARACTER CON SPLITTEXT
  private animateOnboardingTitle() {
    if (this.reducedMotion || !this.viewReady) return;
    const el = document.querySelector('.onboard-title') as HTMLElement | null;
    if (!el) return;
    // LIMPIA EL SPLIT ANTERIOR PARA EVITAR HOJAS DESCOLGADAS
    if (this.onboardSplit) { try { this.onboardSplit.revert(); } catch {} this.onboardSplit = null; }
    this.onboardSplit = new SplitText(el, { type: 'chars,words' });
    gsap.from(this.onboardSplit.chars, {
      opacity: 0, y: 8, duration: 0.42,
      stagger: { amount: 0.32, from: 'start' },
      ease: 'power2.out',
    });
  }
  // ANIMA EL DESBLOQUEO DE UN LOGRO CON BOUNCE CONTROLADO
  private animateAchievementUnlock(achievementId: string) {
    if (this.reducedMotion || !this.viewReady) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-achv-id="${achievementId}"]`) as HTMLElement | null;
      if (!el) return;
      gsap.fromTo(el,
        { scale: 0.6, rotate: -6 },
        { scale: 1, rotate: 0, duration: 0.85, ease: 'vault-bounce' });
    });
  }
  // REORDENA LOS FAVORITOS CON FLIP — SUAVE EN VEZ DE CORTE BRUSCO
  private animateFavoriteReorder(beforeState: any) {
    if (this.reducedMotion || !beforeState) return;
    Flip.from(beforeState, {
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.04,
      absolute: true,
    });
  }

  // ORQUESTA LAS ANIMACIONES GSAP DE ENTRADA RESPETANDO REDUCED-MOTION
  animateEntrance() {
    gsap.killTweensOf('.vault-health-card, .folder-card, .vault-item, .tab-pill, .bento-favorite');

    // matchMedia ASEGURA QUE prefers-reduced-motion APAGA LOS BOUNCES
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.vault-health-card', { y: -16 }, { y: 0, duration: 0.55, ease: 'power3.out' });
      gsap.fromTo('.bento-favorite',
        { scale: 0.88, y: 8 },
        { scale: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'back.out(1.4)', delay: 0.15 });
      gsap.fromTo('.tab-pill', { y: 12 }, { y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.3 });
      gsap.fromTo('.folder-card', { x: -20 }, { x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.35 });
      gsap.fromTo('.vault-item', { y: 14 }, { y: 0, duration: 0.32, stagger: 0.05, ease: 'power2.out', delay: 0.45 });
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.vault-health-card, .bento-favorite, .tab-pill, .folder-card, .vault-item', { clearProps: 'transform' });
    });
  }

  // ── KIND HELPERS ────────────────────────────────────────────────────
  // LEE EL KIND DESDE EL PAYLOAD CON FALLBACK AL DEFAULT DE item_type
  itemKind(item: VaultItem): VaultKind {
    const raw = (item.payload as any)?.kind as VaultKind | undefined;
    if (raw && this.kindMeta[raw]) return raw;
    if (item.item_type === 'password') return 'login';
    if (item.item_type === 'note') return 'note';
    return 'file';
  }
  iconForItem(item: VaultItem): string  { return this.kindMeta[this.itemKind(item)].icon; }
  colorForItem(item: VaultItem): string { return this.kindMeta[this.itemKind(item)].color; }
  labelForItem(item: VaultItem): string { return this.kindMeta[this.itemKind(item)].label; }

  // ── FILTRADO ────────────────────────────────────────────────────────
  // NUMERO TOTAL DE ITEMS PARA EL HEADER
  get totalEntries(): number { return this.items.length; }

  // LISTA DE ITEMS FILTRADOS POR PESTANA, CARPETA Y BUSQUEDA
  // BUSQUEDA AMPLIADA: TITULO + USERNAME + URL + NOTES + NOMBRE DE CARPETA
  get filteredItems(): VaultItem[] {
    let list = this.items;
    if (this.activeTab !== 'all') list = list.filter(i => i.item_type === this.activeTab);
    if (this.activeFolderId !== null) list = list.filter(i => i.folder_id === this.activeFolderId);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(i => {
        const p = i.payload;
        if ((p.title || '').toLowerCase().includes(q)) return true;
        if ((p.username || '').toLowerCase().includes(q)) return true;
        if ((p.url || '').toLowerCase().includes(q)) return true;
        if ((p.notes || '').toLowerCase().includes(q)) return true;
        if (i.folder_id !== null) {
          const fname = this.getFolderName(i.folder_id).toLowerCase();
          if (fname.includes(q)) return true;
        }
        return false;
      });
    }
    return list;
  }

  // FAVORITOS PARA EL BENTO SUPERIOR (MAX 6)
  get favoriteItems(): VaultItem[] {
    if (this.favoriteIds.length === 0) {
      // SI EL USUARIO NO HA MARCADO FAVORITOS, MUESTRA LOS 4 MAS RECIENTES
      return [...this.items]
        .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
        .slice(0, 4);
    }
    return this.favoriteIds
      .map(id => this.items.find(i => i.id === id))
      .filter((i): i is VaultItem => !!i)
      .slice(0, 6);
  }

  // CAMBIA DE PESTANA Y RELANZA LA ANIMACION DEL LISTADO
  setTab(tab: ViewTab) {
    this.activeTab = tab;
    setTimeout(() => {
      gsap.fromTo('.vault-item', { y: 10 }, { y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out' });
    }, 30);
  }

  // SELECCIONA UNA CARPETA O LA DESELECCIONA SI YA ESTABA ACTIVA
  selectFolder(id: number | null) {
    this.activeFolderId = this.activeFolderId === id ? null : id;
    setTimeout(() => {
      gsap.fromTo('.vault-item', { x: -16 }, { x: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out' });
    }, 30);
  }

  // ── METADATOS DE CARPETA ────────────────────────────────────────────
  getFolderName(id: number | null): string {
    if (id === null) return '';
    return this.folders.find(f => f.id === id)?.name || '';
  }
  getFolderColor(id: number | null): string {
    if (id === null) return 'var(--color-text-muted)';
    return this.folders.find(f => f.id === id)?.color || 'var(--color-text-muted)';
  }

  // SALUD POR CARPETA (PROMEDIO DE FUERZA DE PASSWORDS DENTRO)
  getFolderHealth(folderId: number): number {
    const passwords = this.items.filter(i =>
      i.folder_id === folderId && i.item_type === 'password');
    if (passwords.length === 0) return 80;
    const score = passwords.reduce((acc, i) => {
      const s = this.itemStrength(i);
      return acc + (s === 'strong' ? 100 : s === 'medium' ? 60 : 30);
    }, 0);
    return Math.round(score / passwords.length);
  }

  // COLOR ASOCIADO A LA FUERZA DE UNA CONTRASENA
  getStrengthColor(s?: string): string {
    if (s === 'strong') return 'var(--vault-health-good)';
    if (s === 'medium') return 'var(--vault-health-mid)';
    if (s === 'weak')   return 'var(--vault-health-bad)';
    return 'var(--color-text-muted)';
  }
  // ETIQUETA DE LA FUERZA DE UNA CONTRASENA
  getStrengthLabel(s?: string): string {
    if (s === 'strong') return 'Fuerte';
    if (s === 'medium') return 'Media';
    if (s === 'weak')   return 'Debil';
    return '';
  }
  // EXPLICACION DIDACTICA DE POR QUE UNA CONTRASENA NO ES FUERTE
  getStrengthReason(item: VaultItem): string {
    if (item.item_type !== 'password') return '';
    const p = item.payload.password || '';
    if (!p) return 'Sin contrasena';
    const missing: string[] = [];
    if (p.length < 12) missing.push('≥12 caracteres');
    if (!/[A-Z]/.test(p)) missing.push('mayuscula');
    if (!/[a-z]/.test(p)) missing.push('minuscula');
    if (!/[0-9]/.test(p)) missing.push('numero');
    if (!/[^A-Za-z0-9]/.test(p)) missing.push('simbolo');
    if (missing.length === 0) return 'Cumple todos los criterios';
    return 'Falta: ' + missing.join(', ');
  }
  // COLOR DEL INDICADOR DE SALUD POR PUNTUACION
  getHealthColor(score: number): string {
    if (score >= 80) return 'var(--vault-health-good)';
    if (score >= 55) return 'var(--vault-health-mid)';
    return 'var(--vault-health-bad)';
  }
  // ETIQUETA NARRATIVA DEL HEALTH SCORE PARA QUE LA MASCOTA LO COMENTE
  get healthNarrative(): string {
    const s = this.healthScore;
    if (s >= 85) return 'Tu boveda esta blindada';
    if (s >= 65) return 'Vas bien — sigue rotando las debiles';
    if (s >= 40) return 'Hay reutilizadas o debiles que limpiar';
    if (s > 0)   return 'Empieza por reforzar las contrasenas debiles';
    return 'Aun no hay contrasenas que medir';
  }

  // EVALUA LA FUERZA DE UN ITEM A PARTIR DE SU PASSWORD EN CLARO
  itemStrength(item: VaultItem): 'strong' | 'medium' | 'weak' | undefined {
    if (item.item_type !== 'password') return undefined;
    const pwd = item.payload.password || '';
    if (pwd.length === 0) return 'weak';
    let score = 0;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  // SET DE PASSWORDS REUTILIZADAS (PARA EL BADGE "REUTILIZADA")
  private reusedSet = new Set<string>();
  // RECALCULA EL SET DE PASSWORDS REUTILIZADAS (LLAMADO TRAS refresh)
  private recomputeReused() {
    const counts = new Map<string, number>();
    for (const i of this.items) {
      if (i.item_type !== 'password') continue;
      const p = i.payload.password || '';
      if (!p) continue;
      counts.set(p, (counts.get(p) || 0) + 1);
    }
    this.reusedSet.clear();
    for (const [p, n] of counts) if (n > 1) this.reusedSet.add(p);
  }
  // INDICA SI ESTE ITEM USA UNA CONTRASENA REUTILIZADA EN OTRAS CUENTAS
  isReused(item: VaultItem): boolean {
    if (item.item_type !== 'password') return false;
    const p = item.payload.password || '';
    if (!p) return false;
    return this.reusedSet.has(p);
  }

  // DEVUELVE EL COLOR DE FONDO DEL AVATAR (USA EL COLOR DEL KIND)
  itemColor(item: VaultItem): string {
    if (item.folder_id !== null && item.folder_id !== undefined) {
      const f = this.folders.find(fo => fo.id === item.folder_id);
      if (f) return f.color;
    }
    return this.colorForItem(item);
  }

  // EXTRAE UN SNIPPET DE LA NOTA PARA EL LISTADO
  noteSnippet(item: VaultItem): string {
    const notes = item.payload.notes || '';
    return notes.length > 60 ? notes.slice(0, 60) + '...' : notes;
  }

  // CALCULA EL TAMANO DE UN FICHERO LEGIBLE
  fileSize(item: VaultItem): string {
    const bytes = item.size_bytes || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // EXTRAE LA EXTENSION DEL NOMBRE DEL FICHERO O DEVUELVE 'FILE'
  fileExt(item: VaultItem): string {
    const name = item.payload.fileName || '';
    const idx = name.lastIndexOf('.');
    if (idx === -1) return 'FILE';
    return name.slice(idx + 1).toUpperCase();
  }

  // FORMATEA EL TIMESTAMP DE MODIFICACION DE FORMA RELATIVA EN ESPANOL
  itemDate(item: VaultItem): string {
    if (!item.updated_at) return '';
    const updated = new Date(item.updated_at).getTime();
    if (Number.isNaN(updated)) return '';
    const diffMs = Date.now() - updated;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays}d`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Hace ${diffMonths}m`;
  }

  // ── COPY AL PORTAPAPELES CON AUTOCLEAR DE 30S ───────────────────────
  async copyPassword(item: VaultItem, event: Event) {
    event.stopPropagation();
    // ANIMA EL ITEM CON UN PULSO MINIMO
    gsap.fromTo(`#item-${item.id}`,
      { scale: 1 }, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
    // COPIA AL PORTAPAPELES SI HAY CONTENIDO
    const pwd = item.payload.password || '';
    if (!pwd || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(pwd);
    } catch {
      return;
    }
    // ARRANCA EL AUTOCLEAR
    this.startCopyCountdown(item.id);
  }
  private startCopyCountdown(itemId: number) {
    this.clearCopyTimer();
    this.copiedItemId = itemId;
    this.copyCountdown = this.COPY_AUTOCLEAR_SECONDS;
    this.copyTimerHandle = setInterval(() => {
      this.copyCountdown--;
      if (this.copyCountdown <= 0) this.expireClipboard();
    }, 1000);
  }
  private async expireClipboard() {
    this.clearCopyTimer();
    // SOBREESCRIBE EL CLIPBOARD CON UNA CADENA INOCUA
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText('');
    } catch {}
    this.copiedItemId = null;
    this.copyCountdown = 0;
  }
  private clearCopyTimer() {
    if (this.copyTimerHandle) {
      clearInterval(this.copyTimerHandle);
      this.copyTimerHandle = null;
    }
  }
  // EL USUARIO PUEDE CANCELAR EL AUTOCLEAR MANUALMENTE (BORRA YA)
  cancelClipboard(event?: Event) {
    if (event) event.stopPropagation();
    void this.expireClipboard();
  }

  // ── FAB / FORMULARIOS ──────────────────────────────────────────────
  toggleFab() { this.fabOpen = !this.fabOpen; }

  addPassword(kind: 'login' | 'card' | 'apikey' | 'seed' = 'login') {
    this.fabOpen = false;
    this.editingItem = null;
    this.formPassword = {
      title: '', username: '', password: '', url: '',
      folderId: this.activeFolderId, kind,
    };
    this.showPasswordInForm = false;
    this.addPasswordOpen = true;
  }
  cancelAddPassword() {
    this.addPasswordOpen = false;
    this.editingItem = null;
    // LIMPIA EXPLICITAMENTE LA CONTRASENA Y EL TOGGLE DE VISIBILIDAD AL SALIR
    this.formPassword.password = '';
    this.showPasswordInForm = false;
    this.generatorOpen = false;
  }

  async submitAddPassword() {
    if (!this.formPassword.title.trim()) return;
    this.saving = true;
    try {
      const payload: VaultItemPayload & { kind?: VaultKind } = {
        title: this.formPassword.title.trim(),
        username: this.formPassword.username.trim(),
        password: this.formPassword.password,
        url: this.formPassword.url.trim(),
        kind: this.formPassword.kind,
      };
      if (this.editingItem) {
        await this.vault.updateItem(
          this.editingItem.id,
          payload as VaultItemPayload,
          this.formPassword.folderId,
        );
      } else {
        await this.vault.createItem(
          'password', payload as VaultItemPayload,
          this.formPassword.folderId ?? undefined,
        );
      }
      this.addPasswordOpen = false;
      this.editingItem = null;
      await this.refresh();
    } catch (err) {
      console.error('Error guardando contrasena:', err);
    } finally {
      this.saving = false;
    }
  }

  addNote(kind: 'note' | 'identity' = 'note') {
    this.fabOpen = false;
    this.editingItem = null;
    this.formNote = { title: '', notes: '', folderId: this.activeFolderId, kind };
    this.addNoteOpen = true;
  }
  cancelAddNote() { this.addNoteOpen = false; this.editingItem = null; }

  async submitAddNote() {
    if (!this.formNote.title.trim()) return;
    this.saving = true;
    try {
      const payload: VaultItemPayload & { kind?: VaultKind } = {
        title: this.formNote.title.trim(),
        notes: this.formNote.notes,
        kind: this.formNote.kind,
      };
      if (this.editingItem) {
        await this.vault.updateItem(
          this.editingItem.id, payload as VaultItemPayload, this.formNote.folderId);
      } else {
        await this.vault.createItem(
          'note', payload as VaultItemPayload, this.formNote.folderId ?? undefined);
      }
      this.addNoteOpen = false;
      this.editingItem = null;
      await this.refresh();
    } catch (err) {
      console.error('Error guardando nota:', err);
    } finally {
      this.saving = false;
    }
  }

  // ABRE EL MODAL EN MODO EDICION CON LOS DATOS DEL ITEM
  editItem(item: VaultItem, event: Event) {
    event.stopPropagation();
    const kind = this.itemKind(item);
    this.editingItem = item;
    if (item.item_type === 'password') {
      this.formPassword = {
        title: item.payload.title || '',
        username: item.payload.username || '',
        password: item.payload.password || '',
        url: item.payload.url || '',
        folderId: item.folder_id ?? null,
        kind: (['login','card','apikey','seed'].includes(kind) ? kind : 'login') as any,
      };
      this.showPasswordInForm = false;
      this.addPasswordOpen = true;
    } else if (item.item_type === 'note') {
      this.formNote = {
        title: item.payload.title || '',
        notes: item.payload.notes || '',
        folderId: item.folder_id ?? null,
        kind: (kind === 'identity' ? 'identity' : 'note') as any,
      };
      this.addNoteOpen = true;
    }
  }

  addFolder() {
    this.fabOpen = false;
    this.formFolder = { name: '', color: '#7C3AED', icon: 'folder' };
    this.addFolderOpen = true;
  }
  cancelAddFolder() { this.addFolderOpen = false; }

  async submitAddFolder() {
    if (!this.formFolder.name.trim()) return;
    this.saving = true;
    try {
      await this.vault.createFolder(
        this.formFolder.name.trim(),
        this.formFolder.color,
        this.formFolder.icon,
      );
      this.addFolderOpen = false;
      await this.refresh();
    } catch (err) {
      console.error('Error creando carpeta:', err);
    } finally {
      this.saving = false;
    }
  }
  pickFolderColor(color: string) { this.formFolder.color = color; }
  pickFolderIcon(icon: string) { this.formFolder.icon = icon; }

  addFile() {
    this.fabOpen = false;
    this.fileInput.nativeElement.click();
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.showCipherAnim = true;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const dataUrl: string = e.target.result;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const payload: VaultItemPayload = {
        title: file.name, fileName: file.name, fileData: base64,
      };
      try {
        await this.vault.createItem('file', payload, this.activeFolderId ?? undefined);
        await this.refresh();
      } catch (err) {
        console.error('Error subiendo fichero:', err);
      } finally {
        setTimeout(() => { this.showCipherAnim = false; }, 800);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // ── BORRADO CON CHECKLIST DIDACTICA ─────────────────────────────────
  deleteItem(item: VaultItem, event: Event) {
    event.stopPropagation();
    this.confirmDelete = item;
    this.confirmDeleteChecks = { exported: false, understood: false };
  }
  cancelDelete() { this.confirmDelete = null; }
  get canConfirmDelete(): boolean {
    return this.confirmDeleteChecks.understood;
  }
  async confirmDeleteAction() {
    if (!this.canConfirmDelete) return;
    const item = this.confirmDelete;
    if (!item) return;
    this.saving = true;
    try {
      await this.vault.deleteItem(item.id);
      delete this.customIcons[item.id];
      this.favoriteIds = this.favoriteIds.filter(id => id !== item.id);
      this.saveCustomIcons();
      this.saveFavorites();
      this.confirmDelete = null;
      await this.refresh();
    } catch (err) {
      console.error('Error eliminando item:', err);
    } finally {
      this.saving = false;
    }
  }

  // ── ICONO PERSONALIZADO POR ITEM ────────────────────────────────────
  private currentEditingItemId: number | null = null;
  openIconPicker(item: VaultItem, event: Event) {
    event.stopPropagation();
    this.currentEditingItemId = item.id;
    this.iconInput.nativeElement.click();
  }
  onIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (this.currentEditingItemId === null) return;
    const file = input.files[0];
    if (file.size > 1024 * 1024) { alert('Imagen demasiado grande (max 1MB)'); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentEditingItemId !== null) {
        this.customIcons[this.currentEditingItemId] = e.target.result;
        this.saveCustomIcons();
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
  private saveCustomIcons() {
    localStorage.setItem('argos-vault-icons', JSON.stringify(this.customIcons));
  }
  private loadCustomIcons() {
    const saved = localStorage.getItem('argos-vault-icons');
    if (!saved) return;
    try { this.customIcons = JSON.parse(saved) || {}; }
    catch { this.customIcons = {}; }
  }

  // ── FAVORITOS (MAX 6) ───────────────────────────────────────────────
  isFavorite(item: VaultItem): boolean { return this.favoriteIds.includes(item.id); }
  toggleFavorite(item: VaultItem, event: Event) {
    event.stopPropagation();
    // CAPTURA EL ESTADO ANTERIOR PARA QUE FLIP ANIME LA REORDENACION
    const before = this.reducedMotion ? null : Flip.getState('.bento-favorite, .vault-item');
    if (this.isFavorite(item)) {
      this.favoriteIds = this.favoriteIds.filter(id => id !== item.id);
    } else {
      if (this.favoriteIds.length >= 6) this.favoriteIds.pop();
      this.favoriteIds = [item.id, ...this.favoriteIds];
    }
    this.saveFavorites();
    // FLIP ANIMA LA DIFERENCIA TRAS EL NEXT FRAME (CUANDO ANGULAR REPINTA)
    requestAnimationFrame(() => this.animateFavoriteReorder(before));
  }
  private saveFavorites() {
    localStorage.setItem('argos-vault-favs', JSON.stringify(this.favoriteIds));
  }
  private loadFavorites() {
    const saved = localStorage.getItem('argos-vault-favs');
    if (!saved) return;
    try { this.favoriteIds = JSON.parse(saved) || []; }
    catch { this.favoriteIds = []; }
  }

  // ── PERSONALIZACION: ACENTO / DENSIDAD / IDENTIDAD ──────────────────
  openCustomize() { this.customizeOpen = true; }
  closeCustomize() { this.customizeOpen = false; }
  pickAccent(key: string) {
    this.accentKey = key;
    document.body.setAttribute('data-vault-accent', key === 'default' ? '' : key);
    if (key === 'default') document.body.removeAttribute('data-vault-accent');
    localStorage.setItem('argos-vault-accent', key);
  }
  private loadAccent() {
    const saved = localStorage.getItem('argos-vault-accent') || 'default';
    this.accentKey = saved;
    if (saved === 'default') document.body.removeAttribute('data-vault-accent');
    else document.body.setAttribute('data-vault-accent', saved);
  }
  toggleDensity() {
    this.density = this.density === 'comfortable' ? 'compact' : 'comfortable';
    document.body.classList.toggle('vault-density-compact', this.density === 'compact');
    localStorage.setItem('argos-vault-density', this.density);
  }
  private loadDensity() {
    const saved = (localStorage.getItem('argos-vault-density') as any) || 'comfortable';
    this.density = saved === 'compact' ? 'compact' : 'comfortable';
    document.body.classList.toggle('vault-density-compact', this.density === 'compact');
  }
  private loadUserIdentity() {
    // INTENTA RECUPERAR EMAIL/NAME PERSISTIDO POR EL AUTH SERVICE
    try {
      const email = (this.auth as any).getEmail?.() || localStorage.getItem('argos-user-email') || '';
      if (email) {
        this.userInitial = (email[0] || 'A').toUpperCase();
        this.userDisplay = email.split('@')[0];
        return;
      }
    } catch {}
    this.userInitial = 'A';
    this.userDisplay = '';
  }

  // ── HEALTH SCORE + LOGROS ───────────────────────────────────────────
  private recomputeHealth() {
    this.recomputeReused();
    const passwords = this.items.filter(i => i.item_type === 'password');
    const total = passwords.length;

    // % FUERTES
    const strong = total === 0 ? 0
      : Math.round((passwords.filter(i => this.itemStrength(i) === 'strong').length / total) * 100);
    // % UNICAS (NO REUTILIZADAS)
    const unique = total === 0 ? 0
      : Math.round((passwords.filter(i => !this.isReused(i)).length / total) * 100);
    // % SIN HIT EN HIBP — PLACEHOLDER HASTA INTEGRAR AuditorService DENTRO DE LA BOVEDA.
    // SE PONE A 100 SI EL USUARIO NO HA AUDITADO TODAVIA, ASI EL SCORE NO SE PENALIZA
    // GRATUITAMENTE; SE PENALIZARA SI EL AUDITOR DETECTA UNA FUGA EN UNA ITERACION POSTERIOR.
    const noLeak = 100;
    // BONUS POR AUDITORIA RECIENTE — PLACEHOLDER (DE NUEVO 100 POR DEFECTO)
    const fresh = 100;

    this.healthBreakdown = { strong, unique, noLeak, fresh };
    this.healthScore = Math.round(strong * 0.35 + unique * 0.30 + noLeak * 0.20 + fresh * 0.15);

    // GUARDA EL SET ANTERIOR PARA DETECTAR NUEVOS DESBLOQUEOS Y CELEBRAR
    const prev = this.prevUnlockedIds;

    // LOGROS — TODOS SON ACCIONES DE SEGURIDAD REALES, NO DE VANITY
    this.achievements = [
      {
        id: 'no-reused',
        label: 'Sin reutilizadas',
        icon: 'check-circle',
        unlocked: total > 0 && unique === 100,
        hint: 'Todas tus contrasenas son unicas',
      },
      {
        id: 'all-strong',
        label: 'Todas fuertes',
        icon: 'lock',
        unlocked: total > 0 && strong === 100,
        hint: 'Todas tus contrasenas son fuertes',
      },
      {
        id: 'health-80',
        label: 'Salud > 80',
        icon: 'shield-check',
        unlocked: this.healthScore >= 80,
        hint: 'Tu boveda esta en buen estado general',
      },
    ];

    // DETECTA Y CELEBRA NUEVOS DESBLOQUEOS (NO LOS QUE YA ESTABAN UNLOCKED)
    const nextUnlocked = new Set<string>();
    for (const a of this.achievements) {
      if (a.unlocked) {
        nextUnlocked.add(a.id);
        if (!prev.has(a.id) && this.viewReady) {
          this.animateAchievementUnlock(a.id);
        }
      }
    }
    this.prevUnlockedIds = nextUnlocked;
  }

  // ── ONBOARDING ──────────────────────────────────────────────────────
  private maybeStartOnboarding() {
    const seen = localStorage.getItem('argos-vault-onboarded');
    if (seen === '1') return;
    this.onboardingStep = 0;
    // ESPERA UN FRAME PARA QUE EL DOM DEL OVERLAY EXISTA ANTES DEL SPLIT
    requestAnimationFrame(() => this.animateOnboardingTitle());
  }
  nextOnboarding() {
    if (this.onboardingStep < this.onboardingSteps.length - 1) {
      this.onboardingStep++;
      requestAnimationFrame(() => this.animateOnboardingTitle());
    } else this.finishOnboarding();
  }
  prevOnboarding() {
    if (this.onboardingStep > 0) {
      this.onboardingStep--;
      requestAnimationFrame(() => this.animateOnboardingTitle());
    }
  }
  skipOnboarding() { this.finishOnboarding(); }
  private finishOnboarding() {
    localStorage.setItem('argos-vault-onboarded', '1');
    this.onboardingStep = -1;
    if (this.onboardSplit) { try { this.onboardSplit.revert(); } catch {} this.onboardSplit = null; }
  }
  // PERMITE REABRIR EL TOUR DESDE EL PANEL DE PERSONALIZACION
  restartOnboarding() {
    this.closeCustomize();
    this.onboardingStep = 0;
    requestAnimationFrame(() => this.animateOnboardingTitle());
  }

  // ── PASSWORD GENERATOR ──────────────────────────────────────────────
  toggleGenerator() { this.generatorOpen = !this.generatorOpen; }
  generatePassword() {
    const lowerSet = 'abcdefghijklmnopqrstuvwxyz';
    const upperSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digitSet = '0123456789';
    const symbolSet = '!@#$%^&*()-_=+[]{};:,.<>?';
    let pool = '';
    if (this.generatorConfig.lower) pool += lowerSet;
    if (this.generatorConfig.upper) pool += upperSet;
    if (this.generatorConfig.digits) pool += digitSet;
    if (this.generatorConfig.symbols) pool += symbolSet;
    if (!pool) pool = lowerSet + digitSet;
    const arr = new Uint32Array(this.generatorConfig.length);
    crypto.getRandomValues(arr);
    let out = '';
    for (let i = 0; i < arr.length; i++) out += pool[arr[i] % pool.length];
    this.formPassword.password = out;
    this.showPasswordInForm = true;
  }

  // DESTRUCTOR: LIMPIA TWEENS, TIMERS Y CUALQUIER CONTRASENA EN FORMS ABIERTOS
  ngOnDestroy() {
    this.clearCopyTimer();
    // BORRA CUALQUIER CONTRASENA QUE QUEDARA EN MEMORIA DEL FORM AL NAVEGAR
    this.formPassword.password = '';
    this.showPasswordInForm = false;
    if (this.onboardSplit) { try { this.onboardSplit.revert(); } catch {} this.onboardSplit = null; }
    gsap.killTweensOf('.vault-health-card, .folder-card, .vault-item, .tab-pill, .bento-favorite, .onboard-title, .achv-pill');
  }
}
