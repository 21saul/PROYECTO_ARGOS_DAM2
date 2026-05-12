// NEWS PAGE
//
// RESUMEN: PANTALLA DEL CENTRO DE ALERTAS DE CIBERSEGURIDAD.
// PRESENTA UN BANNER DE ESTADISTICAS DEL DIA, UNA NOTICIA
// CRITICA DESTACADA Y UNA LISTA PAGINADA Y FILTRABLE DE
// NOTICIAS. CONSUME EL NEWSSERVICE QUE A SU VEZ HABLA CON
// /api/v1/news, /api/v1/news/stats Y /api/v1/news/breaking.
//
// LOGICA DE NEGOCIO: CARGA INICIAL EN PARALELO DE STATS,
// BREAKING Y LISTA. LOS CHIPS DE CATEGORIA RECARGAN EL LISTADO
// CON UN FILTRO. LAS IMAGENES POR DEFECTO USAN PICSUM CON EL ID
// COMO SEED Y EL USUARIO PUEDE PERSONALIZARLAS DESDE LOCALSTORAGE.

// IMPORTACION DEL CORE DE ANGULAR
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DE GSAP PARA LAS ANIMACIONES DE ENTRADA
import { gsap } from 'gsap';
// IMPORTACION DEL SERVICIO QUE HABLA CON EL BACKEND DE NOTICIAS
import {
  NewsService,
  NewsItem as BackendNewsItem,
  NewsStats,
  NewsCategory,
  NewsSeverity,
} from '../services/news.service';

// ESTRUCTURA DE UN CHIP DE FILTRO
interface FilterChip {
  // ETIQUETA VISIBLE EN EL CHIP
  label: string;
  // VALOR DE CATEGORIA QUE APLICA EL FILTRO O NULL PARA TODO
  value: NewsCategory | null;
  // ICONO PHOSPHOR ASOCIADO
  icon: string;
}

// METADATOS LOCALES DE UNA FUENTE (LOGO Y COLOR DE MARCA)
interface SourceMeta {
  // CARACTER QUE SE MUESTRA DENTRO DEL CIRCULO DEL LOGO
  logo: string;
  // COLOR HEX DE FONDO DEL LOGO Y DEL CHIP
  color: string;
}

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: false
})
export class NewsPage implements OnInit, OnDestroy {

  // REFERENCIA AL INPUT FILE OCULTO USADO PARA CAMBIAR IMAGENES
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  // ESTADISTICAS DEL BANNER SUPERIOR
  stats: NewsStats | null = null;
  // NOTICIA CRITICA DESTACADA (HERO CARD)
  breaking: BackendNewsItem | null = null;
  // LISTADO PAGINADO DE LA CATEGORIA ACTUAL
  items: BackendNewsItem[] = [];
  // BANDERA DE CARGA PARA MOSTRAR ION-SPINNER
  loading = true;
  // CATEGORIA ACTIVA O NULL CUANDO SE MUESTRAN TODAS
  currentCategory: NewsCategory | null = null;
  // PAGINA ACTUAL DEL LISTADO
  currentPage = 1;
  // TOTAL DE PAGINAS DEVUELTO POR EL BACKEND
  totalPages = 1;

  // DEFINICION DE CHIPS DE FILTRO ALINEADOS CON EL ENUM DEL BACKEND
  filters: FilterChip[] = [
    { label: 'Todo',     value: null,       icon: 'list-bullets' },
    { label: 'CVE',      value: 'cve',      icon: 'bug' },
    { label: 'Phishing', value: 'phishing', icon: 'fish-simple' },
    { label: 'Brechas',  value: 'breach',   icon: 'warning-octagon' },
    { label: 'Recursos', value: 'resource', icon: 'lightbulb' },
  ];

  // ITEM ACTUALMENTE EN EDICION DE IMAGEN (PARA EL FILE PICKER)
  currentEditingItem: BackendNewsItem | null = null;
  // CACHE LOCAL DE IMAGENES PERSONALIZADAS POR ID DE NOTICIA
  // (PUBLIC PORQUE LA PLANTILLA LO USA PARA CONDICIONAR EL BOTON DE RESET)
  customImages: Record<number, string> = {};

  // MAPA DE METADATOS DE FUENTES CONOCIDAS PARA LOGO Y COLOR
  private readonly sourceMeta: Record<string, SourceMeta> = {
    'NVD':              { logo: 'N', color: '#7C3AED' },
    'INCIBE':           { logo: 'I', color: '#003C71' },
    'Hispasec':         { logo: 'H', color: '#E63946' },
    'BleepingComputer': { logo: 'B', color: '#FF6B35' },
    'The Hacker News':  { logo: 'T', color: '#0F4C5C' },
    'TryHackMe':        { logo: 'T', color: '#88CC14' },
    'PortSwigger':      { logo: 'P', color: '#FF6633' },
  };

  // LISTENER DE CAMBIO DE VISIBILIDAD DEL TAB
  // (PROPIEDAD COMO ARROW PARA PRESERVAR EL THIS Y PERMITIR REMOVE)
  private onVisibilityChange = () => {
    // SI EL TAB VUELVE A ESTAR VISIBLE LIMPIAMOS ESTADOS INTERMEDIOS DE GSAP
    if (!document.hidden) {
      gsap.set(
        '.featured-card, .news-card, .stats-banner, .source-chip, .filter-pill',
        { clearProps: 'opacity,transform,x,y,scale' }
      );
    }
  };

  // CONSTRUCTOR QUE INYECTA EL SERVICIO DE NOTICIAS
  constructor(private news: NewsService) {}

  // CARGA INICIAL DE LA PANTALLA
  async ngOnInit(): Promise<void> {
    // RECUPERA IMAGENES PERSONALIZADAS DE LOCALSTORAGE ANTES DE PINTAR
    this.loadCustomImages();
    // ESCUCHA CAMBIOS DE VISIBILIDAD PARA REPARAR ESTADO TRAS VOLVER AL TAB
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    try {
      // CARGA EN PARALELO STATS, BREAKING Y LISTADO
      await this.loadAll();
    } catch (err) {
      // LOGUEA EL ERROR PARA QUE SEA VISIBLE EN DEV TOOLS
      console.error('Error cargando noticias:', err);
    } finally {
      // OCULTA EL SPINNER PARA QUE ANGULAR RENDERICE LAS CARDS
      this.loading = false;
      // ANIMA LA ENTRADA UNA VEZ QUE LOS ELEMENTOS YA EXISTEN EN EL DOM
      setTimeout(() => this.animateEntrance(), 50);
    }
  }

  // ANIMA LA ENTRADA DE LOS ELEMENTOS AL ABRIR LA PANTALLA
  ionViewDidEnter(): void {
    // SOLO ANIMA SI LOS DATOS YA LLEGARON Y LOS ELEMENTOS ESTAN EN DOM
    if (!this.loading) {
      this.animateEntrance();
    }
  }

  // ORQUESTA LAS TRES LLAMADAS DE LA PANTALLA EN PARALELO
  private async loadAll(): Promise<void> {
    // PETICIONES CONCURRENTES PARA REDUCIR LATENCIA PERCIBIDA
    const [stats, breaking, list] = await Promise.all([
      this.news.getStats(),
      this.news.getBreaking(),
      this.news.list({
        category: this.currentCategory ?? undefined,
        page: this.currentPage,
        limit: 20,
      }),
    ]);
    // GUARDA LAS ESTADISTICAS PARA EL BANNER
    this.stats = stats;
    // GUARDA LA NOTICIA CRITICA PARA LA HERO CARD
    this.breaking = breaking;
    // GUARDA LOS ITEMS DE LA PAGINA ACTUAL
    this.items = list.items;
    // GUARDA EL TOTAL DE PAGINAS PARA EL CONTROL DE PAGINACION
    this.totalPages = list.pagination.pages;
  }

  // HANDLER DE LOS CHIPS DE CATEGORIA
  async onFilterChange(category: NewsCategory | null): Promise<void> {
    // ACTUALIZA LA CATEGORIA ACTIVA Y RESETEA LA PAGINA
    this.currentCategory = category;
    this.currentPage = 1;
    // ACTIVA EL SPINNER MIENTRAS SE RECARGA
    this.loading = true;
    try {
      await this.loadAll();
    } finally {
      // OCULTA EL SPINNER ANTES DE ANIMAR PARA QUE LAS CARDS ESTEN EN DOM
      this.loading = false;
      // RE-ANIMA LAS CARDS DESPUES DEL RENDERIZADO DE ANGULAR
      setTimeout(() => {
        // ANIMA EL HERO BREAKING SI ESTA VISIBLE (CATEGORIA NULL)
        gsap.fromTo('.featured-card',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
        // ANIMA LAS CARDS DE LA LISTA EN CASCADA Y LIMPIA ESTILOS AL TERMINAR
        gsap.fromTo('.news-card',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out', clearProps: 'all' });
      }, 30);
    }
  }

  // HANDLER DE CAMBIO DE PAGINA
  async onPageChange(page: number): Promise<void> {
    // ACTUALIZA LA PAGINA Y MUESTRA EL SPINNER
    this.currentPage = page;
    this.loading = true;
    try {
      await this.loadAll();
    } finally {
      this.loading = false;
    }
  }

  // ANIMACION GSAP DE ENTRADA DE LA PANTALLA (SE CONSERVA INTACTA)
  animateEntrance(): void {
    // MATA TWEENS ANTERIORES PARA EVITAR ACUMULAR ANIMACIONES
    gsap.killTweensOf('.stats-banner, .source-chip, .featured-card, .news-card, .filter-pill');

    // ENTRADA DEL BANNER DE ESTADISTICAS
    gsap.fromTo('.stats-banner',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });

    // ENTRADA EN CASCADA DE LOS CHIPS DE FUENTES
    gsap.fromTo('.source-chip',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, stagger: 0.05,
        ease: 'power2.out', delay: 0.2 });

    // ENTRADA EN CASCADA DE LOS CHIPS DE FILTRO
    gsap.fromTo('.filter-pill',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.04,
        ease: 'power2.out', delay: 0.4 });

    // ENTRADA DE LA CARD DESTACADA CON UN LIGERO REBOTE
    gsap.fromTo('.featured-card',
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5,
        ease: 'back.out(1.4)', delay: 0.5, clearProps: 'all' });

    // ENTRADA EN CASCADA DE LAS CARDS REGULARES
    gsap.fromTo('.news-card',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08,
        ease: 'power2.out', delay: 0.7, clearProps: 'all' });
  }

  // ITEMS QUE SE PINTAN EN LA LISTA REGULAR (EXCLUYE EL HERO BREAKING)
  get listItems(): BackendNewsItem[] {
    // SOLO EXCLUIMOS EL BREAKING CUANDO MOSTRAMOS LA VISTA SIN FILTRO
    if (this.currentCategory === null && this.breaking) {
      return this.items.filter(i => i.id !== this.breaking!.id);
    }
    return this.items;
  }

  // NUMERO TOTAL DE NOTICIAS VISIBLES DERIVADO DEL LISTADO Y EL HERO
  get visibleCount(): number {
    // CUENTA EL HERO BREAKING SI APLICA Y NO ESTABA YA EN ITEMS
    if (this.currentCategory === null && this.breaking) {
      const inList = this.items.some(i => i.id === this.breaking!.id);
      return this.listItems.length + (inList ? 1 : 0);
    }
    return this.items.length;
  }

  // ETIQUETA LEGIBLE DE LA SEVERIDAD PARA EL BADGE DE LA CARD
  getSeverityLabel(s: NewsSeverity): string {
    if (s === 'critical') return 'CRÍTICO';
    if (s === 'high')     return 'ALTO';
    if (s === 'medium')   return 'MEDIO';
    return 'BAJO';
  }

  // COLOR DEL BADGE EN FUNCION DE LA SEVERIDAD
  getSeverityColor(s: NewsSeverity): string {
    if (s === 'critical') return 'var(--color-danger)';
    if (s === 'high')     return 'var(--color-warning)';
    if (s === 'medium')   return 'var(--color-accent)';
    return 'var(--color-success)';
  }

  // COLOR DEL CHIP DE CVSS EN ESCALA DE PUNTUACION
  getCvssColor(score: number): string {
    if (score >= 9) return 'var(--color-danger)';
    if (score >= 7) return 'var(--color-warning)';
    if (score >= 4) return 'var(--color-accent)';
    return 'var(--color-success)';
  }

  // ETIQUETA DEL CHIP DE CVSS SEGUN PUNTUACION
  getCvssLabel(score: number): string {
    if (score >= 9) return 'Crítico';
    if (score >= 7) return 'Alto';
    if (score >= 4) return 'Medio';
    return 'Bajo';
  }

  // CARACTER QUE SE MUESTRA EN EL CIRCULO LOGO DE LA FUENTE
  getSourceLogo(source: string): string {
    return this.sourceMeta[source]?.logo ?? source.charAt(0).toUpperCase();
  }

  // COLOR DE MARCA DE UNA FUENTE CONOCIDA O FALLBACK NEUTRO
  getSourceColor(source: string): string {
    return this.sourceMeta[source]?.color ?? '#6B7280';
  }

  // CONVIERTE UNA FECHA ISO EN UNA ETIQUETA RELATIVA LEGIBLE
  getTimeAgo(iso: string): string {
    // CALCULA LA DIFERENCIA EN MILISEGUNDOS RESPECTO A AHORA
    const diffMs = Date.now() - new Date(iso).getTime();
    // MINUTOS COMPLETOS
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin}m`;
    // HORAS COMPLETAS
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    // DIAS COMPLETOS
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ayer';
    return `Hace ${diffD}d`;
  }

  // DERIVA LISTA DE FUENTES ACTIVAS PARA EL CARRUSEL SUPERIOR
  get activeSources(): { name: string; logo: string; color: string }[] {
    // SI HAY STATS USAMOS LA LISTA DEL BACKEND, EN CASO CONTRARIO ARRAY VACIO
    const names = this.stats?.source_list ?? [];
    return names.map(name => ({
      name,
      logo: this.getSourceLogo(name),
      color: this.getSourceColor(name),
    }));
  }

  // URL DE IMAGEN PERSONALIZADA DEL USUARIO O NULL SI NO HAY
  getCustomImage(item: BackendNewsItem): string | null {
    return this.customImages[item.id] ?? null;
  }

  // GRADIENT DE FONDO TEMATICO SEGUN LA CATEGORIA DE LA NOTICIA
  getCategoryGradient(category: NewsCategory): string {
    if (category === 'cve')      return 'linear-gradient(135deg, #DC2626, #7F1D1D)';
    if (category === 'phishing') return 'linear-gradient(135deg, #EA580C, #9A3412)';
    if (category === 'breach')   return 'linear-gradient(135deg, #B91C1C, #450A0A)';
    return 'linear-gradient(135deg, #2563EB, #1E3A8A)';
  }

  // ICONO PHOSPHOR ASOCIADO A LA CATEGORIA PARA LA IMAGEN DE FALLBACK
  getCategoryIcon(category: NewsCategory): string {
    if (category === 'cve')      return 'bug';
    if (category === 'phishing') return 'fish-simple';
    if (category === 'breach')   return 'warning-octagon';
    return 'lightbulb';
  }

  // ABRE LA URL ORIGINAL DE LA NOTICIA EN UNA NUEVA PESTANA
  openNewsUrl(url: string | null): void {
    // SALIDA TEMPRANA SI LA NOTICIA NO TIENE URL ASOCIADA
    if (!url) return;
    // PATRON ROBUSTO: CREA UN <a> TEMPORAL Y DISPARA CLICK NATIVO
    // PARA EVITAR BLOQUEOS DE POPUP DEL NAVEGADOR EN EMBEDDED VIEWS
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ABRE EL DIALOGO DE FICHEROS NATIVO PARA UNA NOTICIA
  openImagePicker(item: BackendNewsItem, event: Event): void {
    // EVITA QUE EL CLICK SE PROPAGUE A LA CARD CONTENEDORA Y ABRA LA URL
    event.stopPropagation();
    event.preventDefault();
    // GUARDA LA NOTICIA EN EDICION PARA QUE EL HANDLER LA USE
    this.currentEditingItem = item;
    // DISPARA EL CLICK SOBRE EL INPUT FILE OCULTO
    this.imageInput.nativeElement.click();
  }

  // CALLBACK CUANDO EL USUARIO SELECCIONA UN FICHERO DE IMAGEN
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    // SALIDA TEMPRANA SI NO HAY FICHERO O ITEM EN EDICION
    if (!input.files || input.files.length === 0) return;
    if (!this.currentEditingItem) return;
    const file = input.files[0];
    // LIMITA EL TAMAN0 PARA EVITAR ABUSO DEL LOCALSTORAGE
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagen demasiado grande. Máx 2MB.');
      return;
    }
    // LEE EL FICHERO COMO DATAURL PARA PODER PERSISTIRLO
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentEditingItem) {
        // GUARDA LA IMAGEN EN EL DICCIONARIO POR ID
        this.customImages[this.currentEditingItem.id] = e.target.result;
        // PERSISTE EL CAMBIO EN LOCALSTORAGE
        this.saveCustomImages();
      }
    };
    reader.readAsDataURL(file);
    // RESETEA EL VALOR PARA PERMITIR SUBIR LA MISMA IMAGEN OTRA VEZ
    input.value = '';
  }

  // ELIMINA LA IMAGEN PERSONALIZADA DE UNA NOTICIA
  resetImage(item: BackendNewsItem, event: Event): void {
    // EVITA QUE EL CLICK SE PROPAGUE A LA CARD Y ABRA LA URL
    event.stopPropagation();
    event.preventDefault();
    // BORRA LA ENTRADA DEL DICCIONARIO Y SINCRONIZA STORAGE
    delete this.customImages[item.id];
    this.saveCustomImages();
  }

  // PERSISTE EL DICCIONARIO DE IMAGENES PERSONALIZADAS
  private saveCustomImages(): void {
    localStorage.setItem('argos-news-images', JSON.stringify(this.customImages));
  }

  // CARGA EL DICCIONARIO DE IMAGENES PERSONALIZADAS DESDE STORAGE
  private loadCustomImages(): void {
    const saved = localStorage.getItem('argos-news-images');
    if (!saved) return;
    try {
      // PARSEA EL JSON ALMACENADO TOLERANDO FORMATO CORRUPTO
      this.customImages = JSON.parse(saved) ?? {};
    } catch (e) {
      this.customImages = {};
    }
  }

  // BOTON DE REFRESCO DE LA TOOLBAR
  async refreshNews(): Promise<void> {
    // ANIMA EL ICONO DE REFRESCO PARA FEEDBACK INMEDIATO
    gsap.to('.refresh-icon', { rotation: 360, duration: 0.6, ease: 'power2.inOut' });
    // VUELVE A CARGAR TODO EL CONJUNTO Y REANIMA AL TERMINAR
    this.loading = true;
    try {
      await this.loadAll();
      setTimeout(() => this.animateEntrance(), 100);
    } catch (err) {
      console.error('Error refrescando noticias:', err);
    } finally {
      this.loading = false;
    }
  }

  // LIMPIA LAS ANIMACIONES PENDIENTES AL DESTRUIR EL COMPONENTE
  ngOnDestroy(): void {
    gsap.killTweensOf('.stats-banner, .source-chip, .featured-card, .news-card, .filter-pill, .refresh-icon');
    // ELIMINA EL LISTENER DE VISIBILIDAD PARA EVITAR LEAKS
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
