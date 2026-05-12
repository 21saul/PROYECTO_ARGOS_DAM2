// VAULT PAGE
//
// RESUMEN: PAGINA PRINCIPAL DE LA BOVEDA. RENDERIZA ITEMS Y
// CARPETAS DESCIFRADOS EN CLIENTE Y DELEGA EL CRUD AL
// VaultService. MANTIENE TODAS LAS ANIMACIONES GSAP DEL DISENO.

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { gsap } from 'gsap';
import { AuthService } from '../services/auth.service';
import {
  VaultService,
  VaultItem,
  VaultFolder,
  VaultItemPayload,
} from '../services/vault.service';

// TIPO DE PESTANA ACTIVA EN EL TOP DE LA PAGINA
type ViewTab = 'all' | 'password' | 'note' | 'file';

@Component({
  selector: 'app-vault',
  templateUrl: './vault.page.html',
  styleUrls: ['./vault.page.scss'],
  standalone: false
})
export class VaultPage implements OnInit, OnDestroy {

  // REFERENCIA AL INPUT OCULTO PARA SUBIR ICONO PERSONALIZADO
  @ViewChild('iconInput') iconInput!: ElementRef<HTMLInputElement>;
  // REFERENCIA AL INPUT OCULTO PARA SUBIR FICHEROS A LA BOVEDA
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  // REFERENCIA AL CONTENEDOR ION-CONTENT PARA CONTROLAR EL SCROLL
  @ViewChild(IonContent) content!: IonContent;

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

  // TAMANO TOTAL ASIGNADO A LA BOVEDA (CONSTANTE DE PRESENTACION)
  storageTotalMb = 50;

  // FLAGS DE APERTURA DE LOS MODALES PERSONALIZADOS
  addPasswordOpen = false;
  addNoteOpen = false;
  addFolderOpen = false;
  // ITEM PENDIENTE DE CONFIRMAR ELIMINACION (NULL SI NO HAY MODAL ACTIVO)
  confirmDelete: VaultItem | null = null;
  // FLAG GENERAL DE GUARDADO PARA DESHABILITAR BOTONES MIENTRAS SE PROCESA
  saving = false;
  // FLAG DE MOSTRAR/OCULTAR CONTRASENA EN EL FORMULARIO
  showPasswordInForm = false;

  // FORMULARIO DE ALTA DE CONTRASENA
  formPassword: {
    title: string;
    username: string;
    password: string;
    url: string;
    folderId: number | null;
  } = { title: '', username: '', password: '', url: '', folderId: null };

  // FORMULARIO DE ALTA DE NOTA
  formNote: {
    title: string;
    notes: string;
    folderId: number | null;
  } = { title: '', notes: '', folderId: null };

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

  // ICONOS DISPONIBLES PARA CARPETAS (DEBEN COINCIDIR CON LOS *ngIf DEL HTML)
  readonly folderIcons: string[] = [
    'folder', 'bank', 'envelope', 'users-three',
    'briefcase', 'house', 'share-network',
  ];

  // CONSTRUCTOR QUE INYECTA VaultService, AuthService Y Router
  constructor(
    private vault: VaultService,
    private auth: AuthService,
    private router: Router,
  ) {}

  // INICIALIZACION DE LA PAGINA: CARGA SEED + DATOS REALES
  async ngOnInit() {
    // RESTAURA LOS ICONOS PERSONALIZADOS GUARDADOS EN LOCALSTORAGE
    this.loadCustomIcons();
    // SI NO HAY CLAVE DE CIFRADO EN MEMORIA FUERZA UN LOGIN FRESCO
    // (LA CLAVE ES VOLATIL POR DISENO Y SE PIERDE EN CADA RECARGA)
    const keyPresent = !!this.auth.getEncryptionKey();
    const tokenPresent = this.auth.isAuthenticated();
    console.log('[VaultPage] ngOnInit — token:', tokenPresent, 'key:', keyPresent);
    if (!keyPresent) {
      console.warn('Boveda: sin clave de cifrado, redirigiendo a login');
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
    } catch (err) {
      // PROPAGA EL ERROR A CONSOLA PARA QUE EL DEV LO VEA
      console.error('Error cargando boveda:', err);
    } finally {
      // OCULTA EL SPINNER INDEPENDIENTEMENTE DEL RESULTADO
      this.loading = false;
    }
  }

  // RECARGA CARPETAS E ITEMS DESDE EL BACKEND
  // CADA LISTADO SE ENVUELVE EN SU PROPIO TRY/CATCH PARA QUE EL FALLO DE UNO
  // NO BORRE LO QUE YA TENIAMOS EN MEMORIA DEL OTRO
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
  }

  // CALLBACK DE IONIC AL ENTRAR EN LA VISTA, DISPARA ANIMACIONES
  ionViewDidEnter() {
    this.animateEntrance();
  }

  // ORQUESTA LAS ANIMACIONES GSAP DE ENTRADA
  // GSAP SOLO MUEVE TRANSFORMS (y/x/scale). EL OPACITY LO CONTROLA LA CSS
  // ANIMATION vaultFadeIn forwards PARA QUE NO QUEDE NUNCA A 0 SI GSAP NO
  // LLEGA A CORRER (CASO DE LOS ITEMS RECIEN AGREGADOS TRAS UN refresh()).
  animateEntrance() {
    // LIMPIA TWEENS PREVIOS PARA EVITAR ANIMACIONES SOLAPADAS
    gsap.killTweensOf('.vault-stats-banner, .stat-pill, .folder-card, .vault-item, .tab-pill');

    // ANIMA LA ENTRADA DEL BANNER SUPERIOR DESDE ARRIBA (SIN TOCAR OPACITY)
    gsap.fromTo('.vault-stats-banner',
      { y:-20 },
      { y:0, duration:0.5, ease:'power2.out' });

    // ANIMA LAS PILL DE ESTADISTICAS CON UN POP DE ESCALA
    gsap.fromTo('.stat-pill',
      { scale:0.85 },
      { scale:1, duration:0.35, stagger:0.06,
        ease:'back.out(1.4)', delay:0.15 });

    // ANIMA LAS PILL DE PESTANAS SUBIENDO
    gsap.fromTo('.tab-pill',
      { y:12 },
      { y:0, duration:0.3, stagger:0.05,
        ease:'power2.out', delay:0.3 });

    // ANIMA LAS CARPETAS DESLIZANDO DESDE LA IZQUIERDA
    gsap.fromTo('.folder-card',
      { x:-20 },
      { x:0, duration:0.4, stagger:0.06,
        ease:'power2.out', delay:0.4 });

    // ANIMA LOS ITEMS DEL LISTADO SUBIENDO
    gsap.fromTo('.vault-item',
      { y:16 },
      { y:0, duration:0.35, stagger:0.06,
        ease:'power2.out', delay:0.55 });
  }

  // NUMERO TOTAL DE ITEMS PARA EL BANNER
  get totalEntries(): number {
    return this.items.length;
  }

  // PORCENTAJE DE CONTRASENAS FUERTES SOBRE EL TOTAL DE CONTRASENAS
  get strongPercent(): number {
    // FILTRA SOLO ITEMS DE TIPO CONTRASENA
    const passwords = this.items.filter(i => i.item_type === 'password');
    if (passwords.length === 0) return 0;
    // CUENTA LAS QUE DERIVAN FUERZA 'strong'
    const strong = passwords.filter(i => this.itemStrength(i) === 'strong').length;
    return Math.round((strong / passwords.length) * 100);
  }

  // CONSUMO ACTUAL DE LA BOVEDA EN MEGABYTES
  get storageUsedMb(): number {
    // SUMA TAMANOS DE BLOBS CIFRADOS DE TODOS LOS ITEMS
    const totalBytes = this.items.reduce((acc, i) => acc + (i.size_bytes || 0), 0);
    // CONVIERTE A MB CON UN DECIMAL
    return Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
  }

  // LISTA DE ITEMS FILTRADOS POR PESTANA, CARPETA Y BUSQUEDA
  get filteredItems(): VaultItem[] {
    // PUNTO DE PARTIDA: TODOS LOS ITEMS DESCIFRADOS
    let list = this.items;
    // FILTRA POR TIPO SI LA PESTANA NO ES 'all'
    if (this.activeTab !== 'all') {
      list = list.filter(i => i.item_type === this.activeTab);
    }
    // FILTRA POR CARPETA ACTIVA SI HAY UNA SELECCIONADA
    if (this.activeFolderId !== null) {
      list = list.filter(i => i.folder_id === this.activeFolderId);
    }
    // FILTRA POR TEXTO SOBRE TITULO Y USUARIO DEL PAYLOAD
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(i =>
        (i.payload.title || '').toLowerCase().includes(q) ||
        (i.payload.username || '').toLowerCase().includes(q));
    }
    return list;
  }

  // CAMBIA DE PESTANA Y RELANZA LA ANIMACION DEL LISTADO (SOLO TRANSFORM)
  setTab(tab: ViewTab) {
    this.activeTab = tab;
    setTimeout(() => {
      gsap.fromTo('.vault-item',
        { y:12 },
        { y:0, duration:0.3, stagger:0.05, ease:'power2.out' });
    }, 30);
  }

  // SELECCIONA UNA CARPETA O LA DESELECCIONA SI YA ESTABA ACTIVA (SOLO TRANSFORM)
  selectFolder(id: number | null) {
    this.activeFolderId = this.activeFolderId === id ? null : id;
    setTimeout(() => {
      gsap.fromTo('.vault-item',
        { x:-20 },
        { x:0, duration:0.3, stagger:0.05, ease:'power2.out' });
    }, 30);
  }

  // DEVUELVE EL NOMBRE DE LA CARPETA DADA SU ID
  getFolderName(id: number | null): string {
    if (id === null) return '';
    return this.folders.find(f => f.id === id)?.name || '';
  }

  // DEVUELVE EL COLOR DE LA CARPETA DADA SU ID
  getFolderColor(id: number | null): string {
    if (id === null) return 'var(--color-text-muted)';
    return this.folders.find(f => f.id === id)?.color || 'var(--color-text-muted)';
  }

  // CALCULA UNA SALUD APROXIMADA POR CARPETA SOBRE LA BASE DE FUERZA DE PASSWORDS
  getFolderHealth(folderId: number): number {
    // FILTRA CONTRASENAS DE LA CARPETA INDICADA
    const passwords = this.items.filter(i =>
      i.folder_id === folderId && i.item_type === 'password');
    if (passwords.length === 0) return 80;
    // PUNTUA CADA UNA Y PROMEDIA
    const score = passwords.reduce((acc, i) => {
      const s = this.itemStrength(i);
      return acc + (s === 'strong' ? 100 : s === 'medium' ? 60 : 30);
    }, 0);
    return Math.round(score / passwords.length);
  }

  // COLOR ASOCIADO A LA FUERZA DE UNA CONTRASENA
  getStrengthColor(s?: string): string {
    if (s === 'strong') return 'var(--color-success)';
    if (s === 'medium') return 'var(--color-warning)';
    if (s === 'weak')   return 'var(--color-danger)';
    return 'var(--color-text-muted)';
  }

  // ETIQUETA DE LA FUERZA DE UNA CONTRASENA
  getStrengthLabel(s?: string): string {
    if (s === 'strong') return 'Fuerte';
    if (s === 'medium') return 'Media';
    if (s === 'weak')   return 'Débil';
    return '';
  }

  // COLOR DEL INDICADOR DE SALUD POR PUNTUACION
  getHealthColor(score: number): string {
    if (score >= 85) return 'var(--color-success)';
    if (score >= 65) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  // PORCENTAJE DE USO DE ALMACENAMIENTO PARA LA BARRA
  getStorageProgress(): number {
    return (this.storageUsedMb / this.storageTotalMb) * 100;
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

  // DEVUELVE EL COLOR DE FONDO DEL AVATAR (USA EL DE LA CARPETA)
  itemColor(item: VaultItem): string {
    if (item.folder_id !== null && item.folder_id !== undefined) {
      const f = this.folders.find(fo => fo.id === item.folder_id);
      if (f) return f.color;
    }
    if (item.item_type === 'password') return '#7C3AED';
    if (item.item_type === 'note') return '#06B6D4';
    return '#EF4444';
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

  // COPIA AL PORTAPAPELES LA CONTRASENA Y DA UN FEEDBACK VISUAL
  async copyPassword(item: VaultItem, event: Event) {
    event.stopPropagation();
    // ANIMA EL ITEM CON UN PULSO MINIMO
    gsap.fromTo(`#item-${item.id}`,
      { scale:1 },
      { scale:0.96, duration:0.1, yoyo:true, repeat:1 });
    // COPIA AL PORTAPAPELES SI HAY CONTENIDO
    const pwd = item.payload.password || '';
    if (pwd && navigator.clipboard) {
      try { await navigator.clipboard.writeText(pwd); } catch {}
    }
  }

  // ABRE O CIERRA EL MENU DEL FAB
  toggleFab() {
    this.fabOpen = !this.fabOpen;
  }

  // ABRE EL MODAL DE NUEVA CONTRASENA Y RESETEA EL FORMULARIO
  addPassword() {
    this.fabOpen = false;
    this.formPassword = {
      title: '', username: '', password: '', url: '',
      folderId: this.activeFolderId,
    };
    this.showPasswordInForm = false;
    this.addPasswordOpen = true;
  }

  // CIERRA EL MODAL DE NUEVA CONTRASENA SIN GUARDAR
  cancelAddPassword() {
    this.addPasswordOpen = false;
  }

  // ENVIA EL FORMULARIO DE CONTRASENA AL BACKEND CIFRADO
  async submitAddPassword() {
    // VALIDA QUE EL TITULO ESTE PRESENTE
    if (!this.formPassword.title.trim()) return;
    this.saving = true;
    try {
      // CONSTRUYE EL PAYLOAD Y LO CIFRA EN VaultService.createItem
      const payload: VaultItemPayload = {
        title: this.formPassword.title.trim(),
        username: this.formPassword.username.trim(),
        password: this.formPassword.password,
        url: this.formPassword.url.trim(),
      };
      await this.vault.createItem(
        'password',
        payload,
        this.formPassword.folderId ?? undefined,
      );
      // CIERRA EL MODAL ANTES DEL REFRESH PARA QUE LA UI REACCIONE INMEDIATA
      this.addPasswordOpen = false;
      await this.refresh();
    } catch (err) {
      console.error('Error creando contrasena:', err);
    } finally {
      this.saving = false;
    }
  }

  // ABRE EL MODAL DE NUEVA NOTA Y RESETEA EL FORMULARIO
  addNote() {
    this.fabOpen = false;
    this.formNote = {
      title: '', notes: '',
      folderId: this.activeFolderId,
    };
    this.addNoteOpen = true;
  }

  // CIERRA EL MODAL DE NUEVA NOTA SIN GUARDAR
  cancelAddNote() {
    this.addNoteOpen = false;
  }

  // ENVIA EL FORMULARIO DE NOTA AL BACKEND CIFRADO
  async submitAddNote() {
    if (!this.formNote.title.trim()) return;
    this.saving = true;
    try {
      const payload: VaultItemPayload = {
        title: this.formNote.title.trim(),
        notes: this.formNote.notes,
      };
      await this.vault.createItem(
        'note',
        payload,
        this.formNote.folderId ?? undefined,
      );
      this.addNoteOpen = false;
      await this.refresh();
    } catch (err) {
      console.error('Error creando nota:', err);
    } finally {
      this.saving = false;
    }
  }

  // ABRE EL MODAL DE NUEVA CARPETA Y RESETEA EL FORMULARIO
  addFolder() {
    this.fabOpen = false;
    this.formFolder = { name: '', color: '#7C3AED', icon: 'folder' };
    this.addFolderOpen = true;
  }

  // CIERRA EL MODAL DE NUEVA CARPETA SIN GUARDAR
  cancelAddFolder() {
    this.addFolderOpen = false;
  }

  // ENVIA EL FORMULARIO DE CARPETA AL BACKEND
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

  // SELECCIONA UN COLOR EN EL FORMULARIO DE CARPETA
  pickFolderColor(color: string) {
    this.formFolder.color = color;
  }

  // SELECCIONA UN ICONO EN EL FORMULARIO DE CARPETA
  pickFolderIcon(icon: string) {
    this.formFolder.icon = icon;
  }

  // ABRE EL DIALOGO DE SELECCION DE FICHERO PARA SUBIR A LA BOVEDA
  addFile() {
    this.fabOpen = false;
    this.fileInput.nativeElement.click();
  }

  // HANDLER DEL INPUT DE FICHERO: LEE, CIFRA Y SUBE COMO ITEM file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // MUESTRA EL OVERLAY DE CIFRADO MIENTRAS PROCESA
    this.showCipherAnim = true;

    // LEE EL FICHERO COMO BASE64 PARA INCRUSTARLO EN EL PAYLOAD
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const dataUrl: string = e.target.result;
      // SEPARA EL PREFIJO data:...;base64, DEL CONTENIDO REAL
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const payload: VaultItemPayload = {
        title: file.name,
        fileName: file.name,
        fileData: base64,
      };
      try {
        await this.vault.createItem('file', payload, this.activeFolderId ?? undefined);
        await this.refresh();
      } catch (err) {
        console.error('Error subiendo fichero:', err);
      } finally {
        // OCULTA EL OVERLAY TRAS UN BREVE RETARDO PARA QUE SE VEA LA ANIMACION
        setTimeout(() => { this.showCipherAnim = false; }, 800);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // ABRE EL MODAL DE CONFIRMACION DE BORRADO PARA UN ITEM
  deleteItem(item: VaultItem, event: Event) {
    event.stopPropagation();
    this.confirmDelete = item;
  }

  // CIERRA EL MODAL DE CONFIRMACION DE BORRADO SIN ACCION
  cancelDelete() {
    this.confirmDelete = null;
  }

  // EJECUTA EL BORRADO REAL DEL ITEM TRAS LA CONFIRMACION
  async confirmDeleteAction() {
    const item = this.confirmDelete;
    if (!item) return;
    this.saving = true;
    try {
      await this.vault.deleteItem(item.id);
      // LIMPIA EL ICONO CUSTOM SI EXISTIA PARA ESE ITEM
      delete this.customIcons[item.id];
      this.saveCustomIcons();
      this.confirmDelete = null;
      await this.refresh();
    } catch (err) {
      console.error('Error eliminando item:', err);
    } finally {
      this.saving = false;
    }
  }

  // ITEM ACTUALMENTE EN EDICION DE ICONO PERSONALIZADO
  private currentEditingItemId: number | null = null;

  // ABRE EL SELECTOR DE FICHERO PARA ICONO CUSTOM DE UN ITEM
  openIconPicker(item: VaultItem, event: Event) {
    event.stopPropagation();
    this.currentEditingItemId = item.id;
    this.iconInput.nativeElement.click();
  }

  // LEE EL ICONO SELECCIONADO Y LO PERSISTE COMO DATAURL
  onIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (this.currentEditingItemId === null) return;
    const file = input.files[0];
    if (file.size > 1024 * 1024) {
      alert('Imagen demasiado grande (máx 1MB)');
      return;
    }
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

  // PERSISTE EL MAPA DE ICONOS PERSONALIZADOS EN LOCALSTORAGE
  private saveCustomIcons() {
    localStorage.setItem('argos-vault-icons', JSON.stringify(this.customIcons));
  }

  // RECUPERA EL MAPA DE ICONOS PERSONALIZADOS GUARDADO
  private loadCustomIcons() {
    const saved = localStorage.getItem('argos-vault-icons');
    if (!saved) return;
    try {
      this.customIcons = JSON.parse(saved) || {};
    } catch (e) {
      this.customIcons = {};
    }
  }

  // DESTRUCTOR: LIMPIA TWEENS PARA EVITAR FUGAS DE ANIMACION
  ngOnDestroy() {
    gsap.killTweensOf('.vault-stats-banner, .stat-pill, .folder-card, .vault-item, .tab-pill');
  }
}
