// IMPORTACION DE DECORADORES Y CICLO DE VIDA DE ANGULAR
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  DestroyRef,
} from '@angular/core';
// IMPORTACION DEL UTILITARIO PARA CANCELAR SUSCRIPCIONES AUTOMATICAMENTE
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// IMPORTACION DEL ROUTER DE ANGULAR PARA NAVEGAR ENTRE MODULOS
import { Router } from '@angular/router';
// IMPORTACION DE LA LIBRERIA DE ANIMACION GSAP
import { gsap } from 'gsap';
// IMPORTACION DEL SERVICIO QUE EXPONE NOMBRE Y AVATAR DEL PERFIL
import { UserProfileService } from '../services/user-profile.service';
// IMPORTACION DEL SERVICIO DEL AUDITOR PARA EL PRIVACY SCORE REAL
import {
  AuditorService,
  PrivacyScoreRecord,
} from '../services/auditor.service';
// IMPORTACION DEL SERVICIO DE LA BOVEDA PARA CONTAR ITEMS Y CARPETAS
import { VaultService } from '../services/vault.service';
// IMPORTACION DEL SERVICIO DE NOTICIAS PARA EL FEED CVE Y BREAKING
import {
  NewsService,
  NewsItem,
  NewsStats,
} from '../services/news.service';
// IMPORTACION DEL SERVICIO DE AUTENTICACION PARA SABER SI HAY SESION
import { AuthService } from '../services/auth.service';

// MODELO DE TARJETA DE MODULO MOSTRADA EN LA RAIL DERECHA DEL DASHBOARD
interface ModuleEntry {
  // ETIQUETA CORTA QUE SE MUESTRA EN LA TARJETA
  label: string;
  // CODIGO DEL MODULO PARA EL HEADER ESTILO TERMINAL
  code: string;
  // DESCRIPCION OPERACIONAL EN UNA LINEA
  summary: string;
  // RUTA DE NAVEGACION
  route: string;
  // ICONO DE PHOSPHOR USADO COMO MARCADOR FUNCIONAL
  icon: string;
  // RANGO FUNCIONAL — DEFENSA, DIAGNOSTICO, ANALISIS, INTELIGENCIA O ENTRENAMIENTO
  rank: 'DEF' | 'DIA' | 'ANA' | 'INT' | 'EDU';
}

// ESTADO DE CARGA DE CADA BLOQUE DEL DASHBOARD
type LoadState = 'idle' | 'loading' | 'ready' | 'error' | 'empty';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  // NOMBRE VISIBLE DEL USUARIO ACTUAL
  displayName = 'Usuario ARGOS';
  // AVATAR EN DATAURL O NULL
  avatar: string | null = null;

  // PRIVACY SCORE ACTUAL Y SU HISTORICO DE 8 SEMANAS
  privacyScore = 0;
  scoreDelta = 0;
  scoreHistory: number[] = [];
  scoreState: LoadState = 'loading';

  // METRICAS DE LA BOVEDA
  vaultItems = 0;
  vaultFolders = 0;
  vaultState: LoadState = 'loading';

  // METRICAS DEL FEED CVE
  newsStats: NewsStats | null = null;
  breakingNews: NewsItem | null = null;
  criticalFeed: NewsItem[] = [];
  newsState: LoadState = 'loading';

  // TIMESTAMP HUMANO DE LA ULTIMA AUDITORIA
  lastAuditAt = '';
  // HORA OPERACIONAL DEL HEADER (UTC)
  systemClock = '';
  // SUBSCRIPCION AL RELOJ — ID DE INTERVALO
  private clockTimer: any = null;

  // MATCH MEDIA DE GSAP PARA RESPONSIVE Y REDUCED-MOTION
  private mm: gsap.MatchMedia | null = null;

  // CATALOGO DE MODULOS — ORDENADO POR RANGO FUNCIONAL
  modules: ModuleEntry[] = [
    {
      label: 'Bóveda',
      code: 'VAULT/01',
      summary: 'Contraseñas y notas cifradas en cliente',
      route: '/vault',
      icon: 'vault',
      rank: 'DEF',
    },
    {
      label: 'Auditor',
      code: 'AUDIT/02',
      summary: 'Privacy score y filtraciones HIBP',
      route: '/auditor',
      icon: 'chart-bar',
      rank: 'DIA',
    },
    {
      label: 'Phishing',
      code: 'PHISH/03',
      summary: 'Pipeline GSB · PhishTank · VirusTotal',
      route: '/phishing',
      icon: 'fish-simple',
      rank: 'ANA',
    },
    {
      label: 'Noticias',
      code: 'INTEL/04',
      summary: 'CVEs críticos y feeds INCIBE',
      route: '/news',
      icon: 'bell-ringing',
      rank: 'INT',
    },
    {
      label: 'Roadmap',
      code: 'EDU/05',
      summary: 'Itinerarios gamificados',
      route: '/roadmap',
      icon: 'map-trifold',
      rank: 'EDU',
    },
  ];

  // INYECCION DE SERVICIOS
  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    private userProfile: UserProfileService,
    private auditor: AuditorService,
    private vault: VaultService,
    private news: NewsService,
    private auth: AuthService,
  ) {
    // SUSCRIPCION REACTIVA AL AVATAR — REFLEJA CAMBIOS HECHOS EN PERFIL
    this.userProfile.avatar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => (this.avatar = v));
    // SUSCRIPCION REACTIVA AL NOMBRE — REFLEJA CAMBIOS HECHOS EN PERFIL
    this.userProfile.username$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => (this.displayName = v));
  }

  // CICLO ONINIT — DISPARA CARGAS DEL BACKEND Y EL RELOJ
  ngOnInit(): void {
    // INICIA EL RELOJ OPERACIONAL DEL HEADER
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 30_000);
    // SI NO HAY SESION DEJAMOS EL DASHBOARD EN VACIO PERO USABLE
    if (!this.auth.isAuthenticated()) {
      this.scoreState = 'empty';
      this.vaultState = 'empty';
      this.newsState = 'empty';
      return;
    }
    // LANZA CARGAS REALES EN PARALELO — CADA UNA CON SU PROPIO ESTADO
    this.loadScore();
    this.loadVault();
    this.loadNews();
  }

  // CICLO IONIC — RE-ANIMA AL VOLVER A LA PAGINA
  ionViewDidEnter(): void {
    this.animateEntrance();
  }

  // CARGA EL PRIVACY SCORE Y EL HISTORICO PARA EL SPARKLINE
  private async loadScore(): Promise<void> {
    this.scoreState = 'loading';
    try {
      // SEMILLA SOLO SI NO HAY HISTORICO PREVIO
      await this.auditor.seedDemoHistory();
      // RECUPERA EL ULTIMO SCORE REGISTRADO Y EL HISTORICO
      const [latest, history] = await Promise.all([
        this.auditor.getLatestScore(),
        this.auditor.getScoreHistory(8),
      ]);
      // ACTUALIZA EL SCORE ACTUAL
      this.privacyScore = latest?.score ?? 0;
      // EL HISTORICO LLEGA EN ORDEN ASCENDENTE (S-8 PRIMERO, S-1 ULTIMO)
      this.scoreHistory = history.map((h: PrivacyScoreRecord) => h.score);
      // DELTA ENTRE EL PUNTO MAS RECIENTE Y EL MAS ANTIGUO
      this.scoreDelta =
        this.scoreHistory.length > 1
          ? this.scoreHistory[this.scoreHistory.length - 1] - this.scoreHistory[0]
          : 0;
      // FECHA HUMANA DE LA ULTIMA AUDITORIA
      this.lastAuditAt = this.formatRelative(latest?.recorded_at);
      // ESTADO FINAL — EMPTY SI NO HAY DATOS, READY EN OTRO CASO
      this.scoreState = latest ? 'ready' : 'empty';
      // FUERZA REPINTADO Y ANIMA EL ARCO + EL CONTADOR
      this.cdr.detectChanges();
      this.animateScore();
    } catch (err) {
      // ERROR CONTROLADO — LOGUEA Y MUESTRA ESTADO DE FALLO EN UI
      console.error('[Dashboard] loadScore', err);
      this.scoreState = 'error';
    }
  }

  // CARGA CONTADORES DE LA BOVEDA REAL
  private async loadVault(): Promise<void> {
    this.vaultState = 'loading';
    try {
      // LISTA ITEMS Y CARPETAS EN PARALELO
      const [items, folders] = await Promise.all([
        this.vault.listItems(),
        this.vault.listFolders(),
      ]);
      this.vaultItems = items.length;
      this.vaultFolders = folders.length;
      this.vaultState = items.length === 0 ? 'empty' : 'ready';
    } catch (err) {
      // EL FALLO MAS COMUN ES SESION SIN CLAVE TRAS RECARGAR LA APP
      console.warn('[Dashboard] loadVault', err);
      this.vaultState = 'error';
    }
  }

  // CARGA STATS, BREAKING Y FEED DE CVES CRITICOS
  private async loadNews(): Promise<void> {
    this.newsState = 'loading';
    try {
      // TRES LLAMADAS EN PARALELO — STATS, BREAKING Y LISTADO FILTRADO
      const [stats, breaking, list] = await Promise.all([
        this.news.getStats(),
        this.news.getBreaking(),
        this.news.list({ severity: 'critical', limit: 3 }),
      ]);
      this.newsStats = stats;
      this.breakingNews = breaking;
      this.criticalFeed = list.items;
      this.newsState = stats.cves_today > 0 || list.items.length > 0 ? 'ready' : 'empty';
    } catch (err) {
      console.error('[Dashboard] loadNews', err);
      this.newsState = 'error';
    }
  }

  // DEVUELVE LA INICIAL DEL NOMBRE PARA EL AVATAR SIN FOTO
  getInitial(): string {
    return (this.displayName || 'U').charAt(0).toUpperCase();
  }

  // ETIQUETA SEMANTICA DEL SCORE — DIRIGE EL TONO DE TEXTO
  scoreLabel(): string {
    if (this.privacyScore >= 85) return 'sistema estable';
    if (this.privacyScore >= 70) return 'vigilancia activa';
    if (this.privacyScore >= 50) return 'requiere atención';
    return 'estado crítico';
  }

  // ESTADO DE OPERACIONES PARA EL RAIL DEL HERO (OK / WARN / DANGER)
  scoreRank(): 'ok' | 'warn' | 'danger' {
    if (this.privacyScore >= 70) return 'ok';
    if (this.privacyScore >= 50) return 'warn';
    return 'danger';
  }

  // GENERA EL PATH SVG DEL SPARKLINE A PARTIR DEL HISTORICO
  sparklinePath(): string {
    // SI NO HAY DATOS DEVUELVE PATH VACIO
    if (this.scoreHistory.length === 0) return '';
    // DIMENSIONES LOGICAS DEL VIEWBOX DEL SVG
    const w = 200;
    const h = 56;
    // ESCALA HORIZONTAL ENTRE PUNTOS
    const stepX = w / Math.max(1, this.scoreHistory.length - 1);
    // CONVIERTE CADA PUNTO EN COORDENADA SVG
    const points = this.scoreHistory.map((v, i) => {
      const x = i * stepX;
      const y = h - (v / 100) * h;
      return `${x},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  }

  // GENERA EL PATH SVG PARA EL AREA BAJO LA LINEA DEL SPARKLINE
  sparklineArea(): string {
    if (this.scoreHistory.length === 0) return '';
    const path = this.sparklinePath();
    const w = 200;
    const h = 56;
    return `${path} L ${w},${h} L 0,${h} Z`;
  }

  // CHIP DE SEVERIDAD VISUAL PARA UN ITEM DE NOTICIA
  newsChipClass(item: NewsItem): string {
    if (item.severity === 'critical') return 'ops-chip ops-chip--danger';
    if (item.severity === 'high') return 'ops-chip ops-chip--warn';
    return 'ops-chip';
  }

  // FORMATEA UN ISO STRING A HORA OPERACIONAL HH:MM UTC
  private formatRelative(iso?: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    // CALCULA LA DIFERENCIA EN MINUTOS RESPECTO A AHORA
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (diffMin < 1) return 'hace unos segundos';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffMin < 60 * 24) return `hace ${Math.floor(diffMin / 60)} h`;
    return `hace ${Math.floor(diffMin / (60 * 24))} d`;
  }

  // ACTUALIZA EL RELOJ UTC EN FORMATO HH:MM
  private updateClock(): void {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    this.systemClock = `${hh}:${mm} UTC`;
  }

  // ANIMACION DE ENTRADA — USA gsap.matchMedia PARA RESPETAR reduced-motion
  private animateEntrance(): void {
    // LIMPIA ESTADOS ANTERIORES PARA PERMITIR REENTRADAS
    if (this.mm) this.mm.revert();
    this.mm = gsap.matchMedia();
    // ANIMACION ESTANDAR — SOLO SI EL USUARIO NO PIDE MENOS MOTION
    this.mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '.ops-grid > *',
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'all',
        },
      );
    });
    // FALLBACK CON MOTION REDUCIDA — SIMPLEMENTE FADE
    this.mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.fromTo(
        '.ops-grid > *',
        { opacity: 0 },
        { opacity: 1, duration: 0.2, stagger: 0.02, clearProps: 'all' },
      );
    });
  }

  // ANIMACION DEL CONTADOR DEL SCORE Y EL ARCO RADIAL
  private animateScore(): void {
    // SI NO HAY SCORE NO ANIMAMOS
    if (this.scoreState !== 'ready') return;
    const numEl = document.querySelector<HTMLElement>('.score-num');
    if (!numEl) return;
    // CONTADOR DESDE 0 HASTA EL SCORE FINAL
    const obj = { val: 0 };
    gsap.to(obj, {
      val: this.privacyScore,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        numEl.textContent = String(Math.round(obj.val));
      },
    });
    // ANIMA EL ARCO DEL DIAL — STROKE-DASHOFFSET PROPORCIONAL AL SCORE
    const arc = document.querySelector<SVGCircleElement>('.score-arc');
    if (arc) {
      const len = Number(arc.getAttribute('data-len') ?? 0);
      gsap.fromTo(
        arc,
        { strokeDashoffset: len },
        {
          strokeDashoffset: len - (len * this.privacyScore) / 100,
          duration: 1.2,
          ease: 'power3.out',
        },
      );
    }
    // ANIMA EL DIBUJO DEL SPARKLINE
    const spark = document.querySelector<SVGPathElement>('.spark-line');
    if (spark) {
      const len = spark.getTotalLength();
      gsap.fromTo(
        spark,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 1.4, ease: 'power3.out' },
      );
    }
  }

  // NAVEGACION CENTRAL — TODOS LOS BOTONES PASAN POR AQUI
  goTo(route: string): void {
    this.router.navigate([route]);
  }

  // BIND DEL ICONO PHOSPHOR DEL HEADER POR NOMBRE
  iconTag(name: string): string {
    return `ph-${name}`;
  }

  // LIMPIEZA — DETIENE EL RELOJ Y CANCELA ANIMACIONES PENDIENTES
  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.mm) this.mm.revert();
    gsap.killTweensOf('.ops-grid > *, .score-num, .score-arc, .spark-line');
  }
}
