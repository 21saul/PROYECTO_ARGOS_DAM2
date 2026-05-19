// NEWS PAGE
//
// RESUMEN: PANTALLA DEL CENTRO DE ALERTAS DE CIBERSEGURIDAD.
// REDISENO "COMMAND CENTER EDITORIAL" — BANNER LIVE CON GAUGE
// CVSS, CARRUSEL DE FUENTES TIPO BENTO, FILTROS CON CONTADORES Y
// HALO, HERO BREAKING CON MINI-TILES Y STREAM CON JERARQUIA POR
// SEVERIDAD. CONSUME EL NEWSSERVICE QUE A SU VEZ HABLA CON
// /api/v1/news, /api/v1/news/stats Y /api/v1/news/breaking.
//
// LOGICA DE NEGOCIO: CARGA INICIAL EN PARALELO DE STATS,
// BREAKING, LISTA PAGINADA Y CONJUNTO COMPLETO PARA CONTADORES.
// LOS CHIPS DE CATEGORIA Y FUENTE FILTRAN. LAS IMAGENES POR
// DEFECTO USAN LOS FALLBACKS DECORATIVOS Y EL USUARIO PUEDE
// PERSONALIZARLAS DESDE LOCALSTORAGE.

// IMPORTACION DEL CORE DE ANGULAR
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DE GSAP PARA LAS ANIMACIONES DE ENTRADA Y TIMELINES
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
  // CLAVE DE HALO QUE PINTA EL ANILLO COLOREADO CUANDO ESTA ACTIVO
  halo: 'primary' | 'danger' | 'warning' | 'secondary' | 'accent';
}

// METADATOS LOCALES DE UNA FUENTE (LOGO Y COLOR DE MARCA)
interface SourceMeta {
  // CARACTER QUE SE MUESTRA DENTRO DEL CIRCULO DEL LOGO
  logo: string;
  // COLOR HEX DE FONDO DEL LOGO Y DEL CHIP
  color: string;
}

// METRICAS DERIVADAS POR FUENTE PARA EL CARRUSEL EXPANDIDO
interface SourceMetric {
  // FECHA ISO DE LA ULTIMA PUBLICACION DE LA FUENTE
  latest: string | null;
  // TOTAL DE NOTICIAS DE LA FUENTE EN LOS ULTIMOS 7 DIAS
  count7d: number;
}

// VARIANTES DE LAYOUT DE LAS CARDS DE LA LISTA
type CardVariant = 'critical' | 'standard' | 'compact';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  standalone: false
})
export class NewsPage implements OnInit, OnDestroy {

  // REFERENCIA AL INPUT FILE OCULTO USADO PARA CAMBIAR IMAGENES
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  // REFERENCIA AL ELEMENTO HOST PARA ALCANCAR LAS TWEENS POR CONTEXT
  constructor(private news: NewsService, private host: ElementRef<HTMLElement>) {}

  // ESTADISTICAS DEL BANNER SUPERIOR
  stats: NewsStats | null = null;
  // NOTICIA CRITICA DESTACADA (HERO CARD)
  breaking: BackendNewsItem | null = null;
  // LISTADO PAGINADO DE LA CATEGORIA ACTUAL
  items: BackendNewsItem[] = [];
  // CONJUNTO AMPLIO USADO SOLO PARA DERIVAR CONTADORES Y METRICAS DE FUENTES
  private allItems: BackendNewsItem[] = [];
  // BANDERA DE CARGA QUE PINTA SKELETONS EN LUGAR DE LAS CARDS
  loading = true;
  // CATEGORIA ACTIVA O NULL CUANDO SE MUESTRAN TODAS
  currentCategory: NewsCategory | null = null;
  // FUENTE ACTIVA PARA FILTRADO CLIENT-SIDE O NULL PARA NO FILTRAR POR FUENTE
  currentSource: string | null = null;
  // PAGINA ACTUAL DEL LISTADO
  currentPage = 1;
  // TOTAL DE PAGINAS DEVUELTO POR EL BACKEND
  totalPages = 1;
  // TIMESTAMP DE LA ULTIMA ACTUALIZACION COMPLETA (PARA EL SUBTITULO)
  lastUpdatedAt: Date | null = null;
  // TICK QUE FUERZA LA RE-EVALUACION DE getTimeAgo CADA 60S
  timeAgoTick = 0;
  // VALOR ANIMADO DEL CONTADOR DE CVE HOY (USADO POR EL COUNT-UP)
  animatedCves = 0;
  // VALOR ANIMADO DEL CVSS MEDIO (USADO POR EL GAUGE Y EL TEXTO)
  animatedCvss = 0;
  // CIRCUNFERENCIA DEL GAUGE CVSS (2*PI*22 REDONDEADO)
  readonly gaugeCircumference = 138.23;
  // BANDERA QUE INDICA SI EL USUARIO PREFIERE MOVIMIENTO REDUCIDO
  prefersReducedMotion = false;

  // DEFINICION DE CHIPS DE FILTRO ALINEADOS CON EL ENUM DEL BACKEND
  filters: FilterChip[] = [
    { label: 'Todo',     value: null,       icon: 'list-bullets',    halo: 'primary'   },
    { label: 'CVE',      value: 'cve',      icon: 'bug',             halo: 'warning'   },
    { label: 'Phishing', value: 'phishing', icon: 'fish-simple',     halo: 'secondary' },
    { label: 'Brechas',  value: 'breach',   icon: 'warning-octagon', halo: 'danger'    },
    { label: 'Recursos', value: 'resource', icon: 'lightbulb',       halo: 'accent'    },
  ];

  // ITEM ACTUALMENTE EN EDICION DE IMAGEN (PARA EL FILE PICKER)
  currentEditingItem: BackendNewsItem | null = null;
  // CACHE LOCAL DE IMAGENES PERSONALIZADAS POR ID DE NOTICIA
  customImages: Record<number, string> = {};
  // METRICAS DERIVADAS POR FUENTE (LATEST + COUNT 7D)
  sourceMetrics: Record<string, SourceMetric> = {};

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

  // TWEEN INFINITA DE GIRO DEL ICONO REFRESH (NULL CUANDO ESTA PARADA)
  private refreshTween: gsap.core.Tween | null = null;
  // INTERVAL QUE INCREMENTA timeAgoTick PARA REFRESCAR LAS ETIQUETAS HACE-X
  private timeAgoTimer: any = null;

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

  // CARGA INICIAL DE LA PANTALLA
  async ngOnInit(): Promise<void> {
    // DETECTA LA PREFERENCIA DE MOVIMIENTO REDUCIDO UNA VEZ AL ARRANCAR
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // RECUPERA IMAGENES PERSONALIZADAS DE LOCALSTORAGE ANTES DE PINTAR
    this.loadCustomImages();
    // ESCUCHA CAMBIOS DE VISIBILIDAD PARA REPARAR ESTADO TRAS VOLVER AL TAB
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    // ARRANCA EL TICK DE TIEMPO RELATIVO QUE REPINTA LAS ETIQUETAS HACE-X
    this.timeAgoTimer = setInterval(() => { this.timeAgoTick++; }, 60000);

    try {
      // CARGA EN PARALELO STATS, BREAKING, LISTADO Y CONJUNTO PARA CONTADORES
      await this.loadAll(true);
      // GUARDA EL TIMESTAMP DE LA PRIMERA CARGA EXITOSA
      this.lastUpdatedAt = new Date();
    } catch (err) {
      // LOGUEA EL ERROR PARA QUE SEA VISIBLE EN DEV TOOLS
      console.error('Error cargando noticias:', err);
    } finally {
      // OCULTA LOS SKELETONS PARA QUE ANGULAR RENDERICE LAS CARDS
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

  // ORQUESTA LAS LLAMADAS DE LA PANTALLA EN PARALELO
  private async loadAll(includeAll = false): Promise<void> {
    // PARAMETROS DEL LISTADO PRINCIPAL (RESPETA CATEGORIA Y PAGINA ACTUAL)
    const listOpts = {
      category: this.currentCategory ?? undefined,
      page: this.currentPage,
      limit: 20,
    };
    // CONJUNTO AMPLIO QUE SOLO PEDIMOS CUANDO HACE FALTA REFRESCAR CONTADORES
    const tasks: any[] = [
      this.news.getStats(),
      this.news.getBreaking(),
      this.news.list(listOpts),
    ];
    if (includeAll) {
      // 100 ITEMS BASTAN PARA UNOS CONTADORES UTILES SIN INFLAR LA RED
      tasks.push(this.news.list({ limit: 100 }));
    }

    // PETICIONES CONCURRENTES PARA REDUCIR LATENCIA PERCIBIDA
    const results = await Promise.all(tasks);
    // GUARDA LAS ESTADISTICAS PARA EL BANNER
    this.stats = results[0];
    // GUARDA LA NOTICIA CRITICA PARA LA HERO CARD
    this.breaking = results[1];
    // GUARDA LOS ITEMS DE LA PAGINA ACTUAL
    this.items = results[2].items;
    // GUARDA EL TOTAL DE PAGINAS PARA EL CONTROL DE PAGINACION
    this.totalPages = results[2].pagination.pages;

    // SI VIENE EL CONJUNTO AMPLIO ACTUALIZA EL CACHE PARA CONTADORES Y METRICAS
    if (includeAll && results[3]) {
      this.allItems = results[3].items;
      this.recomputeSourceMetrics();
    }
  }

  // CONSTRUYE EL DICCIONARIO DE METRICAS POR FUENTE PARA EL CARRUSEL
  private recomputeSourceMetrics(): void {
    // VENTANA DE 7 DIAS EXPRESADA EN MILISEGUNDOS
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const metrics: Record<string, SourceMetric> = {};
    for (const item of this.allItems) {
      // INICIALIZA LA ENTRADA POR FUENTE SI ES LA PRIMERA VEZ
      if (!metrics[item.source]) {
        metrics[item.source] = { latest: null, count7d: 0 };
      }
      const pubMs = new Date(item.published_at).getTime();
      // ACTUALIZA EL TIMESTAMP MAS RECIENTE VISTO PARA LA FUENTE
      const prev = metrics[item.source].latest;
      if (!prev || pubMs > new Date(prev).getTime()) {
        metrics[item.source].latest = item.published_at;
      }
      // INCREMENTA EL CONTADOR SI LA NOTICIA CAE DENTRO DE LA VENTANA DE 7D
      if (pubMs >= cutoff) metrics[item.source].count7d++;
    }
    this.sourceMetrics = metrics;
  }

  // HANDLER DE LOS CHIPS DE CATEGORIA
  async onFilterChange(category: NewsCategory | null): Promise<void> {
    // SI YA ESTA ACTIVA LA MISMA CATEGORIA NO HACEMOS NADA
    if (this.currentCategory === category && this.currentSource === null) return;

    // CROSSFADE DE SALIDA DE LAS CARDS ACTUALES (RESPETA REDUCE-MOTION)
    await this.fadeOutCards();

    // ACTUALIZA EL ESTADO DE FILTRO Y RESETEA PAGINA Y FUENTE
    this.currentCategory = category;
    this.currentPage = 1;
    this.currentSource = null;
    this.loading = true;
    try {
      await this.loadAll(false);
    } finally {
      // OCULTA EL SPINNER ANTES DE ANIMAR PARA QUE LAS CARDS ESTEN EN DOM
      this.loading = false;
      // SLIDE-IN SUAVE DESDE ABAJO DE LAS CARDS NUEVAS
      setTimeout(() => this.fadeInCards(), 30);
    }
  }

  // HANDLER DE TOGGLE DE FILTRO POR FUENTE (CLIENT-SIDE SOBRE LA PAGINA ACTUAL)
  onSourceFilter(source: string): void {
    // SI LA FUENTE YA ESTA ACTIVA EL CLICK ACTUA COMO TOGGLE PARA QUITARLA
    this.currentSource = this.currentSource === source ? null : source;
    // CROSSFADE LOCAL SOBRE LAS CARDS DE LA LISTA
    if (!this.prefersReducedMotion) {
      gsap.fromTo('.news-card',
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.03,
          ease: 'power2.out', clearProps: 'all' });
    }
  }

  // HANDLER DE CAMBIO DE PAGINA
  async onPageChange(page: number): Promise<void> {
    // ACTUALIZA LA PAGINA Y MUESTRA EL SPINNER
    this.currentPage = page;
    this.loading = true;
    // LLEVA EL SCROLL AL INICIO DEL CONTENEDOR PARA NO PERDER CONTEXTO
    const scroller = this.host.nativeElement.querySelector('.news-scroll');
    scroller?.scrollTo?.({ top: 0, behavior: 'smooth' });
    try {
      await this.loadAll(false);
    } finally {
      this.loading = false;
      setTimeout(() => this.fadeInCards(), 30);
    }
  }

  // RESETEA TODOS LOS FILTROS (USADO POR EL EMPTY STATE)
  async resetFilters(): Promise<void> {
    this.currentSource = null;
    await this.onFilterChange(null);
  }

  // CROSSFADE DE SALIDA DE LAS CARDS ACTUALES
  private fadeOutCards(): Promise<void> {
    // EN REDUCE-MOTION SE OMITE LA ANIMACION Y SE RESUELVE INMEDIATO
    if (this.prefersReducedMotion) return Promise.resolve();
    return new Promise<void>(resolve => {
      const targets = this.host.nativeElement.querySelectorAll('.featured-card, .news-card');
      if (targets.length === 0) { resolve(); return; }
      gsap.to(targets, {
        opacity: 0, y: 8, duration: 0.22, stagger: 0.02,
        ease: 'power2.in', onComplete: () => resolve(),
      });
    });
  }

  // SLIDE-IN SUAVE DE LAS CARDS RECIEN RENDERIZADAS
  private fadeInCards(): void {
    if (this.prefersReducedMotion) {
      gsap.set('.featured-card, .news-card', { clearProps: 'all' });
      return;
    }
    gsap.fromTo('.featured-card',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
    gsap.fromTo('.news-card',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.04,
        ease: 'power2.out', clearProps: 'all' });
  }

  // ANIMACION GSAP DE ENTRADA INICIAL DE LA PANTALLA
  animateEntrance(): void {
    // RESPETA REDUCE-MOTION DEJANDO TODO VISIBLE SIN TRANSICION
    if (this.prefersReducedMotion) {
      this.animatedCves = this.stats?.cves_today ?? 0;
      this.animatedCvss = this.stats?.cvss_average ?? 0;
      return;
    }
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
      { scale: 0.94, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5,
        ease: 'back.out(1.3)', delay: 0.5, clearProps: 'all' });

    // ENTRADA EN CASCADA DE LAS CARDS REGULARES
    gsap.fromTo('.news-card',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.06,
        ease: 'power2.out', delay: 0.65, clearProps: 'all' });

    // LANZA EL COUNT-UP DE LAS METRICAS DEL BANNER
    this.animateStats();
  }

  // COUNT-UP DE LOS NUMEROS DEL BANNER (CVES_TODAY ENTERO Y CVSS DECIMAL)
  private animateStats(): void {
    const targetCves = this.stats?.cves_today ?? 0;
    const targetCvss = this.stats?.cvss_average ?? 0;
    if (this.prefersReducedMotion) {
      // EN REDUCE-MOTION SE MUESTRA EL VALOR FINAL DIRECTAMENTE
      this.animatedCves = targetCves;
      this.animatedCvss = targetCvss;
      return;
    }
    // RESETEA Y ANIMA AMBOS VALORES CON SNAP DIFERENCIADO
    gsap.killTweensOf(this);
    this.animatedCves = 0;
    this.animatedCvss = 0;
    gsap.to(this, {
      animatedCves: targetCves,
      animatedCvss: targetCvss,
      duration: 0.9,
      ease: 'power2.out',
      snap: { animatedCves: 1, animatedCvss: 0.1 },
    });
  }

  // ITEMS QUE SE PINTAN EN LA LISTA REGULAR (EXCLUYE EL HERO BREAKING)
  get listItems(): BackendNewsItem[] {
    let arr = this.items;
    // SOLO EXCLUIMOS EL BREAKING CUANDO MOSTRAMOS LA VISTA SIN FILTRO
    if (this.currentCategory === null && this.breaking) {
      arr = arr.filter(i => i.id !== this.breaking!.id);
    }
    // SI HAY FUENTE ACTIVA APLICAMOS FILTRO CLIENT-SIDE SOBRE LA PAGINA ACTUAL
    if (this.currentSource) {
      arr = arr.filter(i => i.source === this.currentSource);
    }
    return arr;
  }

  // NUMERO TOTAL DE NOTICIAS VISIBLES DERIVADO DEL LISTADO Y EL HERO
  get visibleCount(): number {
    // CUENTA EL HERO BREAKING SI APLICA Y NO ESTABA YA EN ITEMS
    if (this.currentCategory === null && !this.currentSource && this.breaking) {
      const inList = this.items.some(i => i.id === this.breaking!.id);
      return this.listItems.length + (inList ? 1 : 0);
    }
    return this.listItems.length;
  }

  // CONTADOR DE ITEMS POR CATEGORIA DERIVADO DEL CONJUNTO AMPLIO
  // (DEVUELVE NULL SI NO TENEMOS DATOS PARA NO MENTIR EN LA UI)
  getCategoryCount(category: NewsCategory | null): number | null {
    if (this.allItems.length === 0) return null;
    if (category === null) return this.allItems.length;
    return this.allItems.filter(i => i.category === category).length;
  }

  // ETIQUETA LEGIBLE DE LA SEVERIDAD PARA EL BADGE DE LA CARD
  getSeverityLabel(s: NewsSeverity): string {
    if (s === 'critical') return 'CRÍTICO';
    if (s === 'high')     return 'ALTO';
    if (s === 'medium')   return 'MEDIO';
    return 'BAJO';
  }

  // ICONO PHOSPHOR DISTINTIVO POR SEVERIDAD (NUNCA SOLO COLOR)
  getSeverityIcon(s: NewsSeverity): string {
    if (s === 'critical') return 'warning-octagon';
    if (s === 'high')     return 'warning';
    if (s === 'medium')   return 'info';
    return 'check-circle';
  }

  // COLOR DEL BADGE EN FUNCION DE LA SEVERIDAD
  getSeverityColor(s: NewsSeverity): string {
    if (s === 'critical') return 'var(--color-danger)';
    if (s === 'high')     return 'var(--color-warning)';
    if (s === 'medium')   return 'var(--color-accent)';
    return 'var(--color-success)';
  }

  // VARIANTE DE LAYOUT DE LA CARD SEGUN LA SEVERIDAD
  getCardVariant(s: NewsSeverity): CardVariant {
    if (s === 'critical') return 'critical';
    if (s === 'high')     return 'standard';
    return 'compact';
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

  // STROKE DASH OFFSET DEL GAUGE CVSS PARA UN VALOR DADO (0..10)
  getGaugeOffset(score: number): number {
    // CLAMPEO DEL VALOR ENTRE 0 Y 10 PARA EVITAR OFFSETS NEGATIVOS
    const clamped = Math.max(0, Math.min(10, score));
    return this.gaugeCircumference - (clamped / 10) * this.gaugeCircumference;
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
  // (DEPENDE DE timeAgoTick PARA QUE EL TICK CADA 60S DISPARE CD)
  getTimeAgo(iso: string): string {
    // REFERENCIA AL TICK PARA QUE ANGULAR NO MEMOICE LA VISTA
    void this.timeAgoTick;
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

  // VERSION COMPACTA "HACE Xm" PARA EL SUBTITULO DE LA TOOLBAR
  getLastUpdatedLabel(): string {
    if (!this.lastUpdatedAt) return 'Sincronizando…';
    return `Actualizado ${this.getTimeAgo(this.lastUpdatedAt.toISOString()).toLowerCase()}`;
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

  // PRIMERAS FUENTES (USADAS POR EL AVATAR-STACK DEL BANNER, MAX 5)
  get stackedSources(): { name: string; logo: string; color: string }[] {
    return this.activeSources.slice(0, 5);
  }

  // URL DE IMAGEN PERSONALIZADA DEL USUARIO O NULL SI NO HAY
  getCustomImage(item: BackendNewsItem): string | null {
    return this.customImages[item.id] ?? null;
  }

  // FONDO EDITORIAL DEL FALLBACK: TINTE SUTIL DE LA CATEGORIA SOBRE SURFACE
  // (NO ES UN GRADIENTE SATURADO — ES UNA SUPERFICIE EDITORIAL CON TONO LEVE)
  getCategoryGradient(category: NewsCategory): string {
    // CADA CATEGORIA APUNTA A UN TOKEN DE COLOR EXISTENTE PARA EL TINTE
    const tintMap: Record<NewsCategory, string> = {
      cve:      'var(--color-warning)',
      phishing: 'var(--color-secondary)',
      breach:   'var(--color-danger)',
      resource: 'var(--color-accent)',
    };
    const tint = tintMap[category];
    // GRADIENT MUY CONTROLADO: SURFACE A SURFACE+TINTE 14% EN DIAGONAL
    return `linear-gradient(135deg,
      var(--color-surface) 0%,
      color-mix(in srgb, ${tint} 14%, var(--color-surface)) 100%)`;
  }

  // LABEL EDITORIAL DEL FALLBACK: CVE-ID O TITULO DE CATEGORIA EN MAYUSCULAS
  // (LA TIPOGRAFIA MASIVA ACTUA COMO INFORMACION, NO COMO DECORACION)
  getFallbackHeadline(item: BackendNewsItem): string {
    // SI HAY CVE-ID ES EL DATO MAS IDENTIFICATIVO, LO USAMOS LITERAL
    if (item.cve_id) return item.cve_id;
    // EN CASO CONTRARIO ETIQUETA DE CATEGORIA EN MAYUSCULAS
    if (item.category === 'phishing') return 'PHISHING ALERT';
    if (item.category === 'breach')   return 'DATA BREACH';
    if (item.category === 'resource') return 'THREAT NOTE';
    return 'CVE ADVISORY';
  }

  // ETIQUETA SECUNDARIA QUE COMPLEMENTA EL HEADLINE (CATEGORIA SI HAY CVE)
  getFallbackKicker(item: BackendNewsItem): string {
    if (item.cve_id) {
      if (item.category === 'phishing') return 'Phishing campaign';
      if (item.category === 'breach')   return 'Data breach';
      if (item.category === 'resource') return 'Threat resource';
      return 'Vulnerability advisory';
    }
    return item.source;
  }

  // ICONO PHOSPHOR ASOCIADO A LA CATEGORIA PARA LA IMAGEN DE FALLBACK
  getCategoryIcon(category: NewsCategory): string {
    if (category === 'cve')      return 'bug';
    if (category === 'phishing') return 'fish-simple';
    if (category === 'breach')   return 'warning-octagon';
    return 'lightbulb';
  }

  // RESUMEN ACCESIBLE DE UN ITEM PARA EL ARIA-LABEL DE LA CARD
  getAriaLabel(item: BackendNewsItem): string {
    const sev = this.getSeverityLabel(item.severity).toLowerCase();
    const time = this.getTimeAgo(item.published_at).toLowerCase();
    return `${item.source}, ${item.title}, severidad ${sev}, ${time}`;
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
    // ID DEL ITEM EN EDICION PARA EL FLASH POSTERIOR
    const editingId = this.currentEditingItem.id;
    // LEE EL FICHERO COMO DATAURL PARA PODER PERSISTIRLO
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.currentEditingItem) {
        // GUARDA LA IMAGEN EN EL DICCIONARIO POR ID
        this.customImages[this.currentEditingItem.id] = e.target.result;
        // PERSISTE EL CAMBIO EN LOCALSTORAGE
        this.saveCustomImages();
        // FLASH DE EXITO DE 600MS SOBRE LA CARD AFECTADA
        this.flashCard(editingId);
      }
    };
    reader.readAsDataURL(file);
    // RESETEA EL VALOR PARA PERMITIR SUBIR LA MISMA IMAGEN OTRA VEZ
    input.value = '';
  }

  // FLASH DE BORDE DE EXITO SOBRE LA CARD CUANDO SE CAMBIA SU IMAGEN
  private flashCard(itemId: number): void {
    if (this.prefersReducedMotion) return;
    setTimeout(() => {
      // BUSCA LA CARD POR DATA-ID DENTRO DEL HOST DEL COMPONENTE
      const el = this.host.nativeElement.querySelector(`[data-card-id="${itemId}"]`);
      if (!el) return;
      gsap.fromTo(el,
        { boxShadow: '0 0 0 2px var(--color-success)' },
        { boxShadow: '0 0 0 0 rgba(16,185,129,0)', duration: 0.6, ease: 'power2.out', clearProps: 'boxShadow' });
    }, 40);
  }

  // ELIMINA LA IMAGEN PERSONALIZADA DE UNA NOTICIA
  resetImage(item: BackendNewsItem, event: Event): void {
    // EVITA QUE EL CLICK SE PROPAGUE A LA CARD Y ABRA LA URL
    event.stopPropagation();
    event.preventDefault();
    // BORRA LA ENTRADA DEL DICCIONARIO Y SINCRONIZA STORAGE
    delete this.customImages[item.id];
    this.saveCustomImages();
    // SHAKE HORIZONTAL DE 240MS PARA SENALAR EL RESET (3 IDA-VUELTAS SUAVES)
    if (!this.prefersReducedMotion) {
      const el = this.host.nativeElement.querySelector(`[data-card-id="${item.id}"] .news-image-wrap, [data-card-id="${item.id}"] .featured-image-wrap`);
      if (el) {
        gsap.fromTo(el,
          { x: -3 },
          { x: 3, duration: 0.06, ease: 'power1.inOut', yoyo: true, repeat: 3,
            onComplete: () => gsap.set(el, { clearProps: 'x' }) });
      }
    }
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

  // ARRANCA EL GIRO INFINITO DEL ICONO DE REFRESCO (USA UNA SOLA TWEEN)
  private startRefreshSpin(): void {
    if (this.prefersReducedMotion) return;
    // MATA UNA TWEEN PREVIA POR SI EL USUARIO HACE DOBLE CLICK
    if (this.refreshTween) this.refreshTween.kill();
    // LANZA UNA ROTACION CONTINUA SIN EASING PARA QUE NO HAYA SALTOS
    this.refreshTween = gsap.to('.refresh-icon', {
      rotation: '+=360', duration: 0.9, ease: 'none', repeat: -1,
    });
  }

  // DETIENE EL GIRO Y CIERRA CON UNA VUELTA LIMPIA O UN FLASH DE ERROR
  private stopRefreshSpin(error: boolean): void {
    if (this.refreshTween) {
      this.refreshTween.kill();
      this.refreshTween = null;
    }
    if (this.prefersReducedMotion) {
      gsap.set('.refresh-icon', { clearProps: 'rotation,color,scale' });
      return;
    }
    if (error) {
      // FLASH ROJO 300MS QUE COMUNICA EL FALLO SIN BLOQUEAR LA UI
      gsap.fromTo('.refresh-icon',
        { color: '#EF4444', scale: 1.1 },
        { color: 'inherit', scale: 1, duration: 0.3, ease: 'power2.out',
          clearProps: 'color,scale,rotation' });
    } else {
      // VUELTA FINAL CLEAN PARA COMUNICAR QUE EL CICLO HA TERMINADO
      gsap.to('.refresh-icon', {
        rotation: '+=360', duration: 0.45, ease: 'power3.out',
        onComplete: () => gsap.set('.refresh-icon', { clearProps: 'rotation' }),
      });
    }
  }

  // BOTON DE REFRESCO DE LA TOOLBAR — TIMELINE COREOGRAFIADA
  async refreshNews(): Promise<void> {
    // EVITA DISPARAR DOS REFRESCOS SIMULTANEOS
    if (this.loading) return;
    // ARRANCA EL GIRO INFINITO DEL ICONO
    this.startRefreshSpin();
    // CROSSFADE DE SALIDA DE LAS CARDS PARA OCULTAR EL SWAP DE DATOS
    await this.fadeOutCards();
    this.loading = true;
    let failed = false;
    try {
      // RECARGA TODO EL CONJUNTO INCLUYENDO METRICAS DE FUENTES
      await this.loadAll(true);
      this.lastUpdatedAt = new Date();
    } catch (err) {
      console.error('Error refrescando noticias:', err);
      failed = true;
    } finally {
      this.loading = false;
      // SLIDE-IN DE LAS NUEVAS CARDS Y COUNT-UP DEL BANNER
      setTimeout(() => {
        this.fadeInCards();
        this.animateStats();
      }, 30);
      // CIERRE DE LA ANIMACION DEL ICONO SEGUN EL RESULTADO
      this.stopRefreshSpin(failed);
    }
  }

  // LIMPIA LAS ANIMACIONES PENDIENTES AL DESTRUIR EL COMPONENTE
  ngOnDestroy(): void {
    // PARA EL TICK QUE REFRESCABA LAS ETIQUETAS HACE-X
    if (this.timeAgoTimer) clearInterval(this.timeAgoTimer);
    // MATA EL GIRO DEL ICONO SI SEGUIA ACTIVO
    if (this.refreshTween) { this.refreshTween.kill(); this.refreshTween = null; }
    // MATA TWEENS GLOBALES DE TODOS LOS SELECTORES USADOS EN ESTA PANTALLA
    gsap.killTweensOf('.stats-banner, .source-chip, .featured-card, .news-card, .filter-pill, .refresh-icon');
    gsap.killTweensOf(this);
    // ELIMINA EL LISTENER DE VISIBILIDAD PARA EVITAR LEAKS
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
