import { Component, AfterViewInit, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Chart, RadarController, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, LineController, CategoryScale, LinearScale, Plugin } from 'chart.js';
import { AuditorService, HibpCheckResult, PrivacyScoreRecord } from '../services/auditor.service';
import type { ArgusCubMood } from '../shared/components/argus-cub/argus-cub.component';

Chart.register(RadarController, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, LineController, CategoryScale, LinearScale);

interface ScorePillar {
  label: string; icon: string; score: number; max: number;
  color: string; desc: string; status: 'good' | 'medium' | 'bad';
  improvement: number;
}

interface Threat {
  id: number; service: string; date: string;
  severity: 'critical' | 'high' | 'medium';
  exposed: string[];
  recommendation: string;
}

@Component({
  selector: 'app-auditor',
  templateUrl: './auditor.page.html',
  styleUrls: ['./auditor.page.scss'],
  standalone: false
})
export class AuditorPage implements OnInit, AfterViewInit, OnDestroy {

  // CANVAS DEL RADAR DE HABILIDADES — SELECTOR INTOCABLE POR CONTRATO
  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
  // CANVAS DE LA TENDENCIA DE 8 SEMANAS — SELECTOR INTOCABLE POR CONTRATO
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  // RAIZ DEL SCROLL — HOST DE gsap.context PARA CLEANUP AUTOMATICO
  @ViewChild('pageRoot') pageRoot!: ElementRef<HTMLElement>;

  // PUNTUACION GLOBAL ACTUAL Y DE REFERENCIA HISTORICA
  privacyScore = 0;
  scoreLastMonth = 0;
  percentileRank = 73;
  protectionValue = 2840;
  hoursSaved = 12;
  scansThisMonth = 47;

  // ESTADO DE LA CARGA DE DATOS REALES DEL BACKEND
  loading = true;

  // ULTIMO SCORE RECUPERADO DEL BACKEND
  latestScore: PrivacyScoreRecord | null = null;
  // HISTORICO DE LAS ULTIMAS 8 SEMANAS
  history: PrivacyScoreRecord[] = [];

  // ESTADO DE LA VERIFICACION DE CONTRASENA EN HIBP
  passwordCheckResult: HibpCheckResult | null = null;
  checkingPassword = false;
  passwordInput = '';

  // STREAM VISUAL DE PREFIJOS SHA-1 EN EL TERMINAL (SOLO DECORATIVO)
  terminalStreamLines: string[] = [];

  radarChart: Chart | null = null;
  trendChart: Chart | null = null;

  pillars: ScorePillar[] = [
    { label: 'Identidad', icon: 'identification-card', score: 0, max: 100,
      color: 'var(--color-secondary)', desc: '2 filtraciones activas',
      status: 'medium', improvement: 18 },
    { label: 'Contraseñas', icon: 'key', score: 0, max: 100,
      color: 'var(--color-primary)', desc: '1 reutilizada en 3 sitios',
      status: 'good', improvement: 8 },
    { label: 'Dispositivo', icon: 'device-mobile', score: 0, max: 100,
      color: 'var(--color-success)', desc: 'Biometría y bloqueo activos',
      status: 'good', improvement: 4 },
  ];

  threats: Threat[] = [
    { id: 1, service: 'LinkedIn', date: 'Junio 2021', severity: 'critical',
      exposed: ['Email', 'Contraseña', 'Teléfono'],
      recommendation: 'Cambia la contraseña y activa 2FA' },
    { id: 2, service: 'Adobe', date: 'Octubre 2013', severity: 'medium',
      exposed: ['Email', 'Contraseña hasheada'],
      recommendation: 'Cambia la contraseña si la reutilizas' },
  ];

  radarLabels = ['Linux', 'Web', 'Redes', 'Cripto', 'OSINT'];
  radarData = [65, 45, 80, 55, 30];

  // LABELS Y DATOS DEL GRAFICO DE TENDENCIA (SE RELLENAN AL CARGAR EL HISTORICO)
  trendLabels: string[] = [];
  trendData: number[] = [];

  topAction = {
    title: 'Activa 2FA en tu Gmail',
    subtitle: 'Protege la cuenta más expuesta',
    points: 12,
    minutes: 3,
    icon: 'shield-check'
  };

  // CONTEXTO GSAP — SCOPED A LA RAIZ DE LA PAGINA. REVERT EN ngOnDestroy.
  private ctx: gsap.Context | null = null;
  // OBSERVERS PARA REVEALS EN VIEWPORT (PILARES, TIMELINE, RADAR)
  // SE USA IntersectionObserver POR LA MISMA RAZON QUE EN PHISHING:
  // EL SCROLLER REAL DE IONIC NO ES window/document Y EVITAMOS LA
  // FRICCION DE CONFIGURAR ScrollTrigger.scrollerProxy.
  private observers: IntersectionObserver[] = [];
  // FLAG DE PREFERENCIA DE MOTION REDUCIDA
  private reducedMotion = false;
  // INTERVAL DEL STREAM HACKER DEL TERMINAL DE HIBP
  private terminalStreamInterval: ReturnType<typeof setInterval> | null = null;
  // RAF QUE ANIMA EL HALO DEL PUNTO "TU ESTAS AQUI" SOBRE LA TENDENCIA
  private trendPulseRaf = 0;

  constructor(private router: Router, private auditor: AuditorService) {}

  // CARGA INICIAL DE DATOS REALES DEL BACKEND
  async ngOnInit() {
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      // SEMILLA DE 8 PUNTOS SI EL HISTORICO ESTA VACIO
      await this.auditor.seedDemoHistory();
      // REFRESCO DE PROPIEDADES CON LOS DATOS DEL BACKEND
      await this.refresh();
    } catch (err) {
      // SI ALGO FALLA SE REGISTRA Y LA UI MUESTRA FALLBACKS
      console.error('Error cargando auditor:', err);
    } finally {
      // FIN DEL ESTADO DE CARGA AUNQUE HAYA HABIDO ERRORES
      this.loading = false;
    }
  }

  // REFRESCA latestScore, history Y DERIVADOS PARA LA UI
  async refresh() {
    this.latestScore = await this.auditor.getLatestScore();
    this.history = await this.auditor.getScoreHistory(8);

    if (this.latestScore) {
      this.privacyScore = this.latestScore.score;
      this.pillars[0].score = this.latestScore.identity_score;
      this.pillars[1].score = this.latestScore.passwords_score;
      this.pillars[2].score = this.latestScore.device_score;
    }

    if (this.history.length > 0) {
      this.scoreLastMonth = this.history[0].score;
    }

    this.trendData = this.history.map(h => h.score);
    this.trendLabels = this.history.map((_, i) => `S${i + 1}`);
  }

  // HANDLER DEL BOTON VERIFICAR CONTRASENA
  async onCheckPassword(passwordInput: string) {
    if (!passwordInput) return;
    this.checkingPassword = true;
    this.passwordCheckResult = null;
    this.startTerminalStream();
    try {
      this.passwordCheckResult = await this.auditor.checkPassword(passwordInput);
    } catch (err) {
      console.error('Error verificando contrasena:', err);
    } finally {
      this.checkingPassword = false;
      this.stopTerminalStream();
      requestAnimationFrame(() => this.animateHibpResult());
    }
  }

  ngAfterViewInit() {
    // EL CONTEXTO SE INSTANCIA EN ionViewDidEnter PARA QUE pageRoot EXISTA
    // CUANDO LA PAGINA SEA REALMENTE VISIBLE (IONIC LIFECYCLE).
  }

  ionViewDidEnter() {
    if (!this.ctx) {
      this.ctx = gsap.context(() => {}, this.pageRoot?.nativeElement);
    }
    this.animateEntrance();
    this.scheduleViewportReveals();
    this.buildRadarChart();
    this.buildTrendChart();
  }

  ionViewWillLeave() {
    // EN IONIC LAS PAGINAS QUEDAN EN CACHE; LIMPIAMOS LAS ANIMACIONES
    // PARA QUE NO SIGAN CORRIENDO EN BACKGROUND CONSUMIENDO CICLOS.
    this.disposeAnimations();
  }

  // ENTRADA COREOGRAFIADA — REACTOR, ANILLOS, STATS, TERMINAL, ACTION, TREND
  private animateEntrance() {
    const reduce = this.reducedMotion;
    if (!this.ctx) {
      this.ctx = gsap.context(() => {}, this.pageRoot?.nativeElement);
    }

    this.ctx.add(() => {
      // COUNT-UP DEL SCORE + RELLENO DEL ARCO PRINCIPAL
      const arcLen = 502;
      const offset = arcLen - (arcLen * this.privacyScore / 100);
      if (reduce) {
        const el = this.pageRoot?.nativeElement.querySelector('.score-big-num');
        if (el) el.textContent = String(this.privacyScore);
        gsap.set('.score-arc', { strokeDashoffset: offset });
      } else {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: this.privacyScore, duration: 1.6, ease: 'power3.out', delay: 0.2,
          onUpdate: () => {
            const el = this.pageRoot?.nativeElement.querySelector('.score-big-num');
            if (el) el.textContent = Math.round(obj.val).toString();
          }
        });
        gsap.fromTo('.score-arc',
          { strokeDashoffset: arcLen },
          { strokeDashoffset: offset, duration: 1.6, ease: 'power3.out', delay: 0.2 });
      }

      // ANILLOS ORBITALES — ROTACION PERPETUA A VELOCIDADES DISTINTAS
      if (!reduce) {
        gsap.to('.orbit-ring-1', { rotation: 360,  duration: 18, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
        gsap.to('.orbit-ring-2', { rotation: -360, duration: 22, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
        gsap.to('.orbit-ring-3', { rotation: 360,  duration: 30, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
        gsap.to('.orbit-ring-4', { rotation: -360, duration: 40, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
      }

      // STATS-MINI ROW — STAGGER CON SPRING
      gsap.fromTo('.stat-mini',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1,
          duration: reduce ? 0.01 : 0.4,
          stagger: reduce ? 0 : 0.08,
          ease: 'back.out(1.4)',
          delay: reduce ? 0 : 0.5 });

      // HIBP TERMINAL — SLIDE-UP
      gsap.fromTo('.hibp-terminal',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1,
          duration: reduce ? 0.01 : 0.5,
          ease: 'power2.out',
          delay: reduce ? 0 : 0.7 });

      // ACTION HERO — SCALE + FADE
      gsap.fromTo('.action-hero',
        { scale: 0.88, opacity: 0 },
        { scale: 1, opacity: 1,
          duration: reduce ? 0.01 : 0.5,
          ease: 'back.out(1.6)',
          delay: reduce ? 0 : 0.9 });

      // RESPIRACION DEL CTA — SOLO SI HAY MOTION COMPLETA
      if (!reduce) {
        gsap.to('.action-hero-btn',
          { scale: 1.04, duration: 1.2, repeat: -1, yoyo: true,
            ease: 'power1.inOut', delay: 2 });
      }

      // TREND WRAP — REVEAL SIMPLE
      gsap.fromTo('.trend-wrap',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1,
          duration: reduce ? 0.01 : 0.5,
          ease: 'power2.out',
          delay: reduce ? 0 : 1.0 });

      // CHIPS DEL HERO — PEQUENO FADE TRAS EL COUNT-UP
      gsap.fromTo('.reactor-chip',
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1,
          duration: reduce ? 0.01 : 0.35,
          stagger: reduce ? 0 : 0.08,
          ease: 'power2.out',
          delay: reduce ? 0 : 1.8 });
    });
  }

  // REVEALS POR VIEWPORT — PILARES (CON SEGMENTOS), AMENAZAS Y RADAR
  private scheduleViewportReveals() {
    const reduce = this.reducedMotion;

    this.observeAndAnimate('.pillar-card', (el) => {
      const segs = el.querySelectorAll('.pillar-seg-fill.is-on');
      if (reduce) {
        gsap.set(el, { y: 0, opacity: 1 });
        gsap.set(segs, { scaleX: 1 });
        return;
      }
      gsap.fromTo(el,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(segs,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.42, stagger: 0.06,
          ease: 'power2.out', delay: 0.15, transformOrigin: 'left center' });
    });

    this.observeAndAnimate('.threat-node', (el) => {
      const dot = el.querySelector('.threat-dot');
      if (reduce) {
        gsap.set(el, { x: 0, opacity: 1 });
        if (dot) gsap.set(dot, { scale: 1 });
        return;
      }
      gsap.fromTo(el,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
      if (dot) {
        gsap.fromTo(dot,
          { scale: 0 },
          { scale: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.18 });
      }
    });

    this.observeAndAnimate('.radar-panel-card', (el) => {
      if (reduce) {
        gsap.set(el, { y: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(el,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' });
    });
  }

  // OBSERVER COMUN — UNICA INSTANCIA POR SELECTOR Y UN-OBSERVE TRAS REVELAR
  private observeAndAnimate(selector: string, runner: (el: Element) => void) {
    const root = this.pageRoot?.nativeElement || document;
    const els = root.querySelectorAll(selector);
    if (els.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          runner(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    this.observers.push(obs);
  }

  // STREAM DECORATIVO DE PREFIJOS SHA-1 EN EL TERMINAL DURANTE LA CONSULTA
  private startTerminalStream() {
    this.terminalStreamLines = [];
    if (this.reducedMotion) return;
    this.terminalStreamInterval = setInterval(() => {
      this.terminalStreamLines = [
        this.randomHashLine(),
        ...this.terminalStreamLines
      ].slice(0, 6);
    }, 95);
  }
  private stopTerminalStream() {
    if (this.terminalStreamInterval) {
      clearInterval(this.terminalStreamInterval);
      this.terminalStreamInterval = null;
    }
  }
  // GENERA UNA LINEA HEX TIPO "ABCDE:1F2A3B4C5D6E…" PARA SIMULAR EL CONTRASTE
  // VISUAL DE PREFIJO/SUFIJO QUE USA HIBP CON K-ANONYMITY
  private randomHashLine(): string {
    const chars = '0123456789ABCDEF';
    let p = '', s = '';
    for (let i = 0; i < 5;  i++) p += chars[Math.floor(Math.random() * 16)];
    for (let i = 0; i < 28; i++) s += chars[Math.floor(Math.random() * 16)];
    return `${p}:${s}`;
  }

  // ENTRADA DRAMATICA DEL RESULTADO DE HIBP — SHAKE SI FOUND, POP SI CLEAN
  private animateHibpResult() {
    const reduce = this.reducedMotion;
    if (reduce) return;

    if (this.passwordCheckResult?.found) {
      const tl = gsap.timeline();
      tl.fromTo('.hibp-found',
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.5)' })
        .to('.hibp-found', { x: -5, duration: 0.06, ease: 'none' })
        .to('.hibp-found', { x:  5, duration: 0.06, ease: 'none' })
        .to('.hibp-found', { x: -4, duration: 0.06, ease: 'none' })
        .to('.hibp-found', { x:  4, duration: 0.06, ease: 'none' })
        .to('.hibp-found', { x:  0, duration: 0.06, ease: 'none' });
    } else if (this.passwordCheckResult && !this.passwordCheckResult.found) {
      gsap.fromTo('.hibp-clean',
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(1.6)' });
    }
  }

  // RADAR DE HABILIDADES — IGUAL QUE ANTES, RESPETANDO maintainAspectRatio
  buildRadarChart() {
    if (this.radarChart) { this.radarChart.destroy(); this.radarChart = null; }
    if (!this.radarCanvas) return;
    const ctx = this.radarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    const style = getComputedStyle(document.body);
    const primary = style.getPropertyValue('--color-primary').trim() || '#7C3AED';
    const surface2 = style.getPropertyValue('--color-surface-2').trim() || '#242938';
    const textMuted = style.getPropertyValue('--color-text-muted').trim() || '#94A3B8';

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this.radarLabels,
        datasets: [{
          data: this.radarData,
          backgroundColor: primary + '33',
          borderColor: primary,
          borderWidth: 2.5,
          pointBackgroundColor: primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        }]
      },
      options: {
        // EL WRAP TIENE aspect-ratio: 1/1, ASI QUE EL CANVAS YA ES CUADRADO.
        // CON maintainAspectRatio: false EVITAMOS QUE CHART.JS PELEE CON EL
        // CSS DEL CONTENEDOR Y APAREZCA EL EFECTO "ESTIRADO" QUE ROMPIA EL RADAR.
        responsive: true, maintainAspectRatio: false,
        animation: { duration: this.reducedMotion ? 0 : 1400, easing: 'easeOutQuart' },
        layout: { padding: 4 },
        scales: {
          r: { min: 0, max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: surface2 },
            angleLines: { color: surface2 },
            pointLabels: { color: textMuted,
              font: { size: 11, weight: 'bold', family: 'Inter' } }
          }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
      }
    });
  }

  // GRAFICO DE TENDENCIA + PUNTO PULSANTE "TU ESTAS AQUI" SOBRE EL ULTIMO VALOR
  buildTrendChart() {
    if (this.trendChart) { this.trendChart.destroy(); this.trendChart = null; }
    if (!this.trendCanvas) return;
    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    const style = getComputedStyle(document.body);
    const primary = style.getPropertyValue('--color-primary').trim() || '#7C3AED';
    const surface2 = style.getPropertyValue('--color-surface-2').trim() || '#242938';
    const textMuted = style.getPropertyValue('--color-text-muted').trim() || '#94A3B8';

    const grad = ctx.createLinearGradient(0, 0, 0, 180);
    grad.addColorStop(0, primary + '8C');
    grad.addColorStop(1, primary + '00');

    // PLUGIN QUE PINTA UN HALO PULSANTE BAJO EL ULTIMO PUNTO — "TU ESTAS AQUI"
    const reduce = this.reducedMotion;
    const pulsePlugin: Plugin<'line'> = {
      id: 'lastPointHalo',
      afterDatasetsDraw: (chart) => {
        const meta = chart.getDatasetMeta(0);
        const pts = meta.data;
        if (!pts || pts.length === 0) return;
        const last: any = pts[pts.length - 1];
        if (!last || typeof last.x !== 'number' || typeof last.y !== 'number') return;
        const c = chart.ctx;
        // FASE 0..1 BASADA EN EL TIEMPO — SIN RAF EXPLICITO, CHART YA REPINTA
        // EN HOVER Y RESIZE; ANIMAMOS UN RAF PROPIO PARA QUE PULSE.
        const t = reduce ? 0 : (Date.now() % 1600) / 1600;
        const radius = 7 + t * 18;
        const alphaOuter = (1 - t) * 0.55;
        c.save();
        c.beginPath();
        c.arc(last.x, last.y, radius, 0, Math.PI * 2);
        c.strokeStyle = `rgba(124,58,237,${alphaOuter})`;
        c.lineWidth = 2;
        c.stroke();
        c.beginPath();
        c.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
        c.fillStyle = '#FFFFFF';
        c.fill();
        c.beginPath();
        c.arc(last.x, last.y, 2.6, 0, Math.PI * 2);
        c.fillStyle = primary;
        c.fill();
        c.restore();
      }
    };

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trendLabels,
        datasets: [{
          data: this.trendData,
          borderColor: primary,
          borderWidth: 3,
          backgroundColor: grad,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: reduce ? 0 : 1600, easing: 'easeOutQuart' },
        scales: {
          y: { display: false, min: 0, max: 100 },
          x: { grid: { display: false },
            ticks: { color: textMuted, font: { size: 10, family: 'Inter' } } }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
      },
      plugins: [pulsePlugin]
    });

    // RAF PROPIO PARA QUE EL HALO RESPIRE — UPDATE('none') NO REPINTA LA LINEA,
    // ASI QUE FORZAMOS draw() SOLO SOBRE LA CANVAS DEL CHART. SE CANCELA EN
    // disposeAnimations() Y NO CORRE BAJO prefers-reduced-motion.
    if (!reduce) {
      const tick = () => {
        if (!this.trendChart) return;
        (this.trendChart as any).draw();
        this.trendPulseRaf = requestAnimationFrame(tick);
      };
      this.trendPulseRaf = requestAnimationFrame(tick);
    }
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║ GETTERS DE UI — DERIVAN ESTADO PARA EL TEMPLATE          ║
  // ╚══════════════════════════════════════════════════════════╝

  getScoreLabel(): string {
    if (this.privacyScore >= 90) return 'Excelente';
    if (this.privacyScore >= 75) return 'Bueno';
    if (this.privacyScore >= 50) return 'Riesgo medio';
    return 'Crítico';
  }

  getScoreColor(): string {
    if (this.privacyScore >= 90) return 'var(--color-success)';
    if (this.privacyScore >= 75) return 'var(--color-primary)';
    if (this.privacyScore >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  getDelta(): number {
    return this.privacyScore - this.scoreLastMonth;
  }

  // MOOD DEL CUB — DERIVADO DE LA MEDIA DEL RADAR.
  // EL COMPONENTE SOLO SOPORTA 'sleeping' | 'wink'; ENCIMA DE LA MEDIA
  // EL CUB ESTA ALERTA (WINK), POR DEBAJO SIGUE DURMIENDO.
  radarMood(): ArgusCubMood {
    if (!this.radarData?.length) return 'sleeping';
    const sum = this.radarData.reduce((a, b) => a + b, 0);
    const avg = sum / this.radarData.length;
    return avg >= 60 ? 'wink' : 'sleeping';
  }

  // ETIQUETA HELPER PARA EL FOOTER DEL RADAR
  radarMoodLabel(): string {
    return this.radarMood() === 'wink'
      ? 'Tu Cub está alerta'
      : 'Tu Cub aún descansa';
  }

  // 5 SEGMENTOS POR PILAR — DEVUELVE BOOLEANS (ENCENDIDO/APAGADO).
  // CADA SEGMENTO REPRESENTA 20 PUNTOS. EL TEMPLATE ITERA SOBRE EL ARRAY.
  pillarSegments(score: number): boolean[] {
    const filled = Math.max(0, Math.min(5, Math.round(score / 20)));
    return [0, 1, 2, 3, 4].map(i => i < filled);
  }

  // ETIQUETA DE SEVERIDAD PARA EL BADGE DEL TIMELINE
  getThreatLabel(s: string): string {
    if (s === 'critical') return 'CRÍTICA';
    if (s === 'high')     return 'ALTA';
    return 'MEDIA';
  }

  getThreatColor(s: string): string {
    if (s === 'critical') return 'var(--color-danger)';
    if (s === 'high')     return 'var(--color-warning)';
    return 'var(--color-secondary)';
  }

  // CARET PARPADEANTE — SE MUESTRA SOLO CUANDO EL INPUT ESTA VACIO E IDLE.
  // ANGULAR HACE TRACK-BY-IDENTITY, ASI QUE EL TEMPLATE SOLO PINTA UN SPAN
  // CON ESTE VALOR DE PRESENCIA. EL PARPADEO REAL ES CSS.
  terminalCaret(): boolean {
    return !this.passwordInput && !this.checkingPassword;
  }

  // HOOK FUTURO PARA MODAL DE PILAR — DE MOMENTO SOLO LOG
  onPillarTap(p: ScorePillar) {
    console.log('[ARGOS] Pillar tap:', p.label);
  }

  // HOOK FUTURO PARA CTA RECOMENDADO
  onTopActionTap() {
    console.log('[ARGOS] Top action:', this.topAction.title);
  }

  // LIMPIA ANIMACIONES, OBSERVERS, INTERVALOS Y RAF.
  // SE LLAMA TANTO EN ionViewWillLeave (CACHE IONIC) COMO EN ngOnDestroy.
  private disposeAnimations() {
    if (this.trendPulseRaf) {
      cancelAnimationFrame(this.trendPulseRaf);
      this.trendPulseRaf = 0;
    }
    this.stopTerminalStream();
    this.observers.forEach(o => o.disconnect());
    this.observers = [];
    if (this.ctx) {
      this.ctx.revert();
      this.ctx = null;
    }
    gsap.killTweensOf([
      '.score-arc', '.pillar-card', '.action-hero', '.action-hero-btn',
      '.stat-mini', '.threat-node', '.threat-dot', '.radar-panel-card',
      '.trend-wrap', '.hibp-terminal', '.hibp-found', '.hibp-clean',
      '.orbit-ring-1', '.orbit-ring-2', '.orbit-ring-3', '.orbit-ring-4',
      '.reactor-chip', '.pillar-seg-fill'
    ]);
  }

  ngOnDestroy() {
    if (this.radarChart) this.radarChart.destroy();
    if (this.trendChart) this.trendChart.destroy();
    this.disposeAnimations();
  }
}
