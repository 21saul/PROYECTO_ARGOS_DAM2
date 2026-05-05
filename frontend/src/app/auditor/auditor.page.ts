import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { Chart, RadarController, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, LineController, CategoryScale, LinearScale } from 'chart.js';

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
export class AuditorPage implements AfterViewInit, OnDestroy {

  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  privacyScore = 78;
  scoreLastMonth = 64;
  percentileRank = 73;
  protectionValue = 2840;
  hoursSaved = 12;
  scansThisMonth = 47;

  radarChart: Chart | null = null;
  trendChart: Chart | null = null;

  pillars: ScorePillar[] = [
    { label: 'Identidad', icon: 'identification-card', score: 60, max: 100,
      color: 'var(--color-secondary)', desc: '2 filtraciones activas',
      status: 'medium', improvement: 18 },
    { label: 'Contraseñas', icon: 'key', score: 85, max: 100,
      color: 'var(--color-primary)', desc: '1 reutilizada en 3 sitios',
      status: 'good', improvement: 8 },
    { label: 'Dispositivo', icon: 'device-mobile', score: 90, max: 100,
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

  trendLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'Hoy'];
  trendData = [52, 58, 61, 64, 67, 72, 75, 78];

  topAction = {
    title: 'Activa 2FA en tu Gmail',
    subtitle: 'Protege la cuenta más expuesta',
    points: 12,
    minutes: 3,
    icon: 'shield-check'
  };

  constructor(private router: Router) {}

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
