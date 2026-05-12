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

// MODELO DE TARJETA DE MODULO MOSTRADA EN LA REJILLA INFERIOR
interface ModuleEntry {
  // ETIQUETA LARGA QUE SE MUESTRA EN LA TARJETA
  label: string;
  // DESCRIPCION DIDACTICA DE UNA LINEA
  desc: string;
  // RUTA DE NAVEGACION
  route: string;
  // CLAVE DEL ICONO DE PHOSPHOR USADO EN EL CIRCULO DE COLOR
  icon: 'vault' | 'chart-bar' | 'fish-simple' | 'bell-ringing' | 'map-trifold';
  // CLAVE DE COLOR PARA EL CIRCULO DEL ICONO Y EL HALO DE LA CARD
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
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

  // PRIVACY SCORE ACTUAL Y SU DELTA (DERIVADO DEL HISTORICO REAL)
  privacyScore = 0;
  scoreDelta = 0;
  scoreState: LoadState = 'loading';

  // METRICAS GAMIFICADAS — XP Y NIVEL DERIVADOS DEL SCORE REAL
  streak = 7;
  xp = 0;
  level = 1;
  achievements = 0;
  // PROGRESO PARA LA BARRA DEL NIVEL (0-100)
  levelProgress = 0;

  // METRICAS DE LA BOVEDA
  vaultItems = 0;
  vaultFolders = 0;
  vaultState: LoadState = 'loading';

  // METRICAS DEL FEED CVE
  newsStats: NewsStats | null = null;
  breakingNews: NewsItem | null = null;
  newsState: LoadState = 'loading';

  // PROXIMA MISION SUGERIDA — SE PERSONALIZA SEGUN EL ESTADO DEL USUARIO
  quickMission = {
    title: 'Activa 2FA en Gmail',
    desc: 'Protege la cuenta que abre todas las demás',
    reward: 25,
    minutes: 3,
    route: '/auditor',
  };

  // MATCH MEDIA DE GSAP PARA RESPONSIVE Y REDUCED-MOTION
  private mm: gsap.MatchMedia | null = null;

  // CATALOGO DE MODULOS — ORDENADO POR JERARQUIA NARRATIVA
  modules: ModuleEntry[] = [
    {
      label: 'Bóveda',
      desc: 'Contraseñas a salvo',
      route: '/vault',
      icon: 'vault',
      color: 'primary',
    },
    {
      label: 'Auditor',
      desc: 'Tu nota de privacidad',
      route: '/auditor',
      icon: 'chart-bar',
      color: 'success',
    },
    {
      label: 'Phishing',
      desc: 'Analiza enlaces sospechosos',
      route: '/phishing',
      icon: 'fish-simple',
      color: 'accent',
    },
    {
      label: 'Noticias',
      desc: 'Alertas CVE de hoy',
      route: '/news',
      icon: 'bell-ringing',
      color: 'danger',
    },
    {
      label: 'Roadmap',
      desc: 'Aprende jugando',
      route: '/roadmap',
      icon: 'map-trifold',
      color: 'warning',
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
    // SIN SESION: DEJAMOS EL DASHBOARD EN ESTADO VACIO USABLE
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

  // CARGA EL PRIVACY SCORE Y DERIVA XP / NIVEL / LOGROS
  private async loadScore(): Promise<void> {
    this.scoreState = 'loading';
    try {
      // SEMILLA SOLO SI NO HAY HISTORICO PREVIO
      await this.auditor.seedDemoHistory();
      // RECUPERA EL ULTIMO SCORE Y EL HISTORICO PARA EL DELTA
      const [latest, history] = await Promise.all([
        this.auditor.getLatestScore(),
        this.auditor.getScoreHistory(8),
      ]);
      this.privacyScore = latest?.score ?? 0;
      // DELTA ENTRE EL PUNTO MAS RECIENTE Y EL MAS ANTIGUO DE LAS 8 SEMANAS
      const scores = history.map((h: PrivacyScoreRecord) => h.score);
      this.scoreDelta = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
      // GAMIFICACION DERIVADA — XP CRECE CON EL SCORE Y EL HISTORICO
      this.xp = this.privacyScore * 15 + scores.length * 25;
      this.level = Math.max(1, Math.floor(this.xp / 250));
      this.levelProgress = ((this.xp % 250) / 250) * 100;
      this.achievements = Math.max(0, history.length + (this.privacyScore >= 70 ? 3 : 1));
      // ELIGE LA MISION RECOMENDADA EN FUNCION DEL SCORE
      this.pickMission();
      // ESTADO FINAL
      this.scoreState = latest ? 'ready' : 'empty';
      this.cdr.detectChanges();
      this.animateScore();
    } catch (err) {
      console.error('[Dashboard] loadScore', err);
      this.scoreState = 'error';
    }
  }

  // CARGA CONTADORES DE LA BOVEDA REAL
  private async loadVault(): Promise<void> {
    this.vaultState = 'loading';
    try {
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

  // CARGA STATS Y BREAKING DEL FEED DE NOTICIAS
  private async loadNews(): Promise<void> {
    this.newsState = 'loading';
    try {
      const [stats, breaking] = await Promise.all([
        this.news.getStats(),
        this.news.getBreaking(),
      ]);
      this.newsStats = stats;
      this.breakingNews = breaking;
      this.newsState = stats.cves_today > 0 ? 'ready' : 'empty';
    } catch (err) {
      console.error('[Dashboard] loadNews', err);
      this.newsState = 'error';
    }
  }

  // PERSONALIZA LA MISION RAPIDA EN FUNCION DEL ESTADO DEL USUARIO
  private pickMission(): void {
    if (this.privacyScore < 50) {
      this.quickMission = {
        title: 'Activa 2FA en tu email principal',
        desc: 'Es la cuenta que abre todas las demás',
        reward: 30,
        minutes: 3,
        route: '/auditor',
      };
    } else if (this.vaultItems > 0 && this.vaultItems < 10) {
      this.quickMission = {
        title: 'Añade 5 contraseñas más a tu Bóveda',
        desc: 'Cuantas más guardes, menos tendrás que recordar',
        reward: 20,
        minutes: 5,
        route: '/vault',
      };
    } else if ((this.newsStats?.cves_today ?? 0) > 0) {
      this.quickMission = {
        title: 'Revisa los CVE críticos de hoy',
        desc: 'Hay vulnerabilidades nuevas que te afectan',
        reward: 15,
        minutes: 2,
        route: '/news',
      };
    } else {
      this.quickMission = {
        title: 'Continúa tu roadmap de seguridad',
        desc: 'Sigue subiendo de nivel con un mini-reto',
        reward: 25,
        minutes: 5,
        route: '/roadmap',
      };
    }
  }

  // DEVUELVE LA INICIAL DEL NOMBRE PARA EL AVATAR SIN FOTO
  getInitial(): string {
    return (this.displayName || 'U').charAt(0).toUpperCase();
  }

  // ETIQUETA SEMANTICA DEL SCORE — DIRIGE EL TONO DE TEXTO
  scoreLabel(): string {
    if (this.privacyScore >= 85) return 'Excelente · Sigue así';
    if (this.privacyScore >= 70) return 'Bueno · Casi a tope';
    if (this.privacyScore >= 50) return 'Refuerza tu seguridad';
    return 'Acción urgente';
  }

  // COLOR CSS VAR DEL ESTADO DEL SCORE
  scoreStatusColor(): string {
    if (this.privacyScore >= 70) return 'var(--color-success)';
    if (this.privacyScore >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  // ESTADO DE ANIMO DE LA MASCOTA — MAPEA SCORE A LOS MOODS QUE ACEPTA ARGUS
  scoreMood(): 'happy' | 'idle' | 'alert' {
    if (this.privacyScore >= 70) return 'happy';
    if (this.privacyScore >= 50) return 'idle';
    return 'alert';
  }

  // ANIMACION DE ENTRADA — USA gsap.matchMedia PARA RESPETAR reduced-motion
  private animateEntrance(): void {
    if (this.mm) this.mm.revert();
    this.mm = gsap.matchMedia();
    // ANIMACION ESTANDAR — STAGGER DUOLINGUERO CON LIGERO BOUNCE
    this.mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '.score-card',
        { scale: 0.92, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' },
      );
      gsap.fromTo(
        '.stat-card',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'back.out(1.4)',
          delay: 0.15,
        },
      );
      gsap.fromTo(
        '.mission-card',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)', delay: 0.35 },
      );
      gsap.fromTo(
        '.module-card',
        { y: 22, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'back.out(1.4)',
          delay: 0.45,
        },
      );
    });
    // FALLBACK CON MOTION REDUCIDA — SIMPLE FADE
    this.mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.fromTo(
        '.score-card, .stat-card, .mission-card, .module-card',
        { opacity: 0 },
        { opacity: 1, duration: 0.2, stagger: 0.02 },
      );
    });
  }

  // ANIMACION DEL CONTADOR DEL SCORE Y EL ANILLO DE PROGRESO
  private animateScore(): void {
    if (this.scoreState !== 'ready') return;
    const numEl = document.querySelector<HTMLElement>('.score-num');
    if (numEl) {
      // CONTADOR DESDE 0 HASTA EL SCORE FINAL
      const obj = { val: 0 };
      gsap.to(obj, {
        val: this.privacyScore,
        duration: 1.2,
        ease: 'power2.out',
        delay: 0.3,
        onUpdate: () => {
          numEl.textContent = String(Math.round(obj.val));
        },
      });
    }
    // ANIMA EL ANILLO RADIAL DEL SCORE
    const arc = document.querySelector<SVGCircleElement>('.score-ring-arc');
    if (arc) {
      const len = Number(arc.getAttribute('data-len') ?? 0);
      gsap.fromTo(
        arc,
        { strokeDashoffset: len },
        {
          strokeDashoffset: len - (len * this.privacyScore) / 100,
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.3,
        },
      );
    }
    // ANIMA LA BARRA DE PROGRESO DEL NIVEL
    gsap.fromTo(
      '.level-bar-fill',
      { width: '0%' },
      { width: this.levelProgress + '%', duration: 1, ease: 'power3.out', delay: 0.5 },
    );
  }

  // NAVEGACION CENTRAL — TODOS LOS BOTONES PASAN POR AQUI
  goTo(route: string): void {
    this.router.navigate([route]);
  }

  // LIMPIEZA — CANCELA ANIMACIONES PENDIENTES
  ngOnDestroy(): void {
    if (this.mm) this.mm.revert();
    gsap.killTweensOf(
      '.score-card, .score-num, .score-ring-arc, .level-bar-fill, .stat-card, .mission-card, .module-card',
    );
  }
}
