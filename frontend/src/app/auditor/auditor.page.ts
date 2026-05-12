import { Component, AfterViewInit, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Chart, RadarController, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, LineController, CategoryScale, LinearScale } from 'chart.js';
import { AuditorService, HibpCheckResult, PrivacyScoreRecord } from '../services/auditor.service';

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

  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

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

  // CONSTRUCTOR QUE INYECTA EL ROUTER Y EL SERVICIO DEL AUDITOR
  constructor(private router: Router, private auditor: AuditorService) {}

  // CARGA INICIAL DE DATOS REALES DEL BACKEND
  async ngOnInit() {
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
    // RECUPERA EL ULTIMO REGISTRO DE PRIVACY SCORE
    this.latestScore = await this.auditor.getLatestScore();
    // RECUPERA EL HISTORICO DE LAS ULTIMAS 8 SEMANAS
    this.history = await this.auditor.getScoreHistory(8);

    // ACTUALIZA LOS VALORES NUMERICOS QUE USAN LAS ANIMACIONES
    if (this.latestScore) {
      this.privacyScore = this.latestScore.score;
      // ACTUALIZA EL SCORE DE LOS 3 PILARES CON LOS DATOS REALES
      this.pillars[0].score = this.latestScore.identity_score;
      this.pillars[1].score = this.latestScore.passwords_score;
      this.pillars[2].score = this.latestScore.device_score;
    }

    // USA EL PRIMER PUNTO DEL HISTORICO COMO REFERENCIA PARA EL DELTA
    if (this.history.length > 0) {
      this.scoreLastMonth = this.history[0].score;
    }

    // ALIMENTA EL GRAFICO DE TENDENCIA CON LOS PUNTOS REALES
    // LAS ETIQUETAS SE NUMERAN COMO S1..SN PARA QUE SEA LEGIBLE
    this.trendData = this.history.map(h => h.score);
    this.trendLabels = this.history.map((_, i) => `S${i + 1}`);
  }

  // HANDLER DEL BOTON VERIFICAR CONTRASENA
  async onCheckPassword(passwordInput: string) {
    // IGNORA SI EL INPUT ESTA VACIO
    if (!passwordInput) return;
    // ACTIVA EL ESTADO DE CARGA DEL CHECK
    this.checkingPassword = true;
    try {
      // CONSULTA HIBP A TRAVES DEL SERVICIO (K-ANONYMITY)
      this.passwordCheckResult = await this.auditor.checkPassword(passwordInput);
    } catch (err) {
      // REGISTRA EL ERROR SIN ROMPER LA UI
      console.error('Error verificando contrasena:', err);
    } finally {
      // FIN DEL ESTADO DE CARGA DEL CHECK
      this.checkingPassword = false;
    }
  }

  ionViewDidEnter() {
    this.animateEntrance();
    this.buildRadarChart();
    this.buildTrendChart();
  }

  animateEntrance() {
    gsap.killTweensOf('.score-arc, .pillar-card, .action-hero, .stat-mini, .threat-card, .radar-wrap, .trend-wrap');

    const obj = { val: 0 };
    gsap.to(obj, {
      val: this.privacyScore, duration: 1.6, ease: 'power3.out', delay: 0.2,
      onUpdate: () => {
        const el = document.querySelector('.score-big-num');
        if (el) el.textContent = Math.round(obj.val).toString();
      }
    });

    const arcLength = 502;
    const offset = arcLength - (arcLength * this.privacyScore / 100);
    gsap.fromTo('.score-arc',
      { strokeDashoffset: arcLength },
      { strokeDashoffset: offset, duration: 1.6, ease: 'power3.out', delay: 0.2 }
    );

    gsap.fromTo('.stat-mini',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08,
        ease: 'back.out(1.4)', delay: 0.5 }
    );

    gsap.fromTo('.action-hero',
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5,
        ease: 'back.out(1.6)', delay: 0.7 }
    );

    gsap.fromTo('.pillar-card',
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.1,
        ease: 'power2.out', delay: 0.9 }
    );

    gsap.fromTo('.radar-wrap, .trend-wrap',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.15,
        ease: 'power2.out', delay: 1.1 }
    );

    gsap.fromTo('.threat-card',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1,
        ease: 'power2.out', delay: 1.3 }
    );

    gsap.to('.action-hero-btn', {
      scale: 1.04, duration: 1.2, repeat: -1, yoyo: true,
      ease: 'power1.inOut', delay: 2
    });
  }

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
        responsive: true, maintainAspectRatio: true,
        animation: { duration: 1400, easing: 'easeOutQuart' },
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

  buildTrendChart() {
    if (this.trendChart) { this.trendChart.destroy(); this.trendChart = null; }
    if (!this.trendCanvas) return;
    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    const style = getComputedStyle(document.body);
    const primary = style.getPropertyValue('--color-primary').trim() || '#7C3AED';
    const surface2 = style.getPropertyValue('--color-surface-2').trim() || '#242938';
    const textMuted = style.getPropertyValue('--color-text-muted').trim() || '#94A3B8';

    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, primary + '55');
    grad.addColorStop(1, primary + '00');

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
        animation: { duration: 1600, easing: 'easeOutQuart' },
        scales: {
          y: { min: 0, max: 100,
            grid: { color: surface2 },
            ticks: { color: textMuted, font: { size: 10, family: 'Inter' }, stepSize: 25 } },
          x: { grid: { display: false },
            ticks: { color: textMuted, font: { size: 10, family: 'Inter' } } }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
      }
    });
  }

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

  getBarWidth(score: number, max: number): string {
    return (score / max * 100) + '%';
  }

  getThreatColor(s: string): string {
    if (s === 'critical') return 'var(--color-danger)';
    if (s === 'high') return 'var(--color-warning)';
    return 'var(--color-secondary)';
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.radarChart) this.radarChart.destroy();
    if (this.trendChart) this.trendChart.destroy();
    gsap.killTweensOf('.score-arc, .pillar-card, .action-hero, .stat-mini, .threat-card, .radar-wrap, .trend-wrap, .action-hero-btn');
  }
}
