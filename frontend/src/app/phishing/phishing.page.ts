import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { gsap } from 'gsap';
// LIBRERÍA DE CONFETI PARA CELEBRAR UN VEREDICTO SEGURO DE LA URL
import confetti from 'canvas-confetti';

type AnalysisStatus = 'idle' | 'loading' | 'safe' | 'suspicious' | 'danger';

interface CheckResult {
  label: string;
  status: 'ok' | 'warn' | 'bad' | 'checking' | 'pending';
  detail: string;
  icon: string;
  source: string;
}

interface RecentAnalysis {
  url: string;
  domain: string;
  verdict: 'safe' | 'suspicious' | 'danger';
  date: string;
  initial: string;
  color: string;
}

interface ThreatTarget {
  category: string;
  icon: string;
  color: string;
  percentage: number;
  count: number;
}

interface UrlExample {
  fake: string;
  real: string;
  trick: string;
  tipIcon: string;
}

@Component({
  selector: 'app-phishing',
  templateUrl: './phishing.page.html',
  styleUrls: ['./phishing.page.scss'],
  standalone: false
})
export class PhishingPage implements OnDestroy {

  @ViewChild('urlInputEl') urlInputEl!: ElementRef<HTMLInputElement>;

  urlInput = '';
  status: AnalysisStatus = 'idle';
  analysisProgress = 0;
  private progressTween: any = null;

  // STATS DEL HEADER
  todayAnalyses = 247;
  threatsDetected = 18;
  detectionRate = 99.2;
  avgResponseTime = 3.4;

  checks: CheckResult[] = [];

  recent: RecentAnalysis[] = [
    { url:'netflix-seguridad.com', domain:'netflix-seguridad.com', verdict:'danger',
      date:'Hace 2h', initial:'N', color:'#E50914' },
    { url:'google.com/gmail', domain:'google.com', verdict:'safe',
      date:'Hace 1d', initial:'G', color:'#4285F4' },
    { url:'bbva-clientes.net', domain:'bbva-clientes.net', verdict:'suspicious',
      date:'Hace 3d', initial:'B', color:'#004B87' },
    { url:'amazon.es/orders', domain:'amazon.es', verdict:'safe',
      date:'Hace 4d', initial:'A', color:'#FF9900' },
  ];

  threatTargets: ThreatTarget[] = [
    { category:'Bancos',         icon:'bank',          color:'#1CB0F6', percentage:34, count:84 },
    { category:'Paqueterías',    icon:'package',       color:'#FF9600', percentage:22, count:54 },
    { category:'Redes sociales', icon:'share-network', color:'#EC4899', percentage:18, count:44 },
    { category:'Streaming',      icon:'television',    color:'#E50914', percentage:14, count:35 },
    { category:'Email',          icon:'envelope',      color:'#7C3AED', percentage:12, count:30 },
  ];

  urlExamples: UrlExample[] = [
    { fake:'paypa1.com',        real:'paypal.com',  trick:'1 en lugar de l',         tipIcon:'magnifying-glass' },
    { fake:'amaz0n-shop.com',   real:'amazon.com',  trick:'0 en lugar de o',         tipIcon:'magnifying-glass' },
    { fake:'netflìx.com',       real:'netflix.com', trick:'í con tilde (Unicode)',   tipIcon:'translate' },
    { fake:'gооgle.com',        real:'google.com',  trick:'Cirílico о (homógrafo)',  tipIcon:'translate' },
  ];

  ionViewDidEnter() {
    this.animateEntrance();
  }

  animateEntrance() {
    gsap.killTweensOf('.phish-stats-banner, .stat-mini, .input-hero, .threat-bar, .recent-card, .example-card, .tip-card');

    gsap.fromTo('.phish-stats-banner',
      { y:-20, opacity:0 },
      { y:0, opacity:1, duration:0.5, ease:'power2.out' });

    gsap.fromTo('.stat-mini',
      { scale:0.85, opacity:0 },
      { scale:1, opacity:1, duration:0.4, stagger:0.07,
        ease:'back.out(1.4)', delay:0.15 });

    gsap.fromTo('.input-hero',
      { y:20, opacity:0 },
      { y:0, opacity:1, duration:0.5,
        ease:'power2.out', delay:0.4 });

    gsap.fromTo('.threat-bar-row',
      { x:-20, opacity:0 },
      { x:0, opacity:1, duration:0.4, stagger:0.08,
        ease:'power2.out', delay:0.6 });

    gsap.fromTo('.threat-bar-fill',
      { width:0 },
      { width:(_:any, t:any) => t.dataset.target + '%',
        duration:1.2, stagger:0.08, ease:'power2.out', delay:0.7 });

    gsap.fromTo('.recent-card, .example-card, .tip-card',
      { y:20, opacity:0 },
      { y:0, opacity:1, duration:0.4, stagger:0.08,
        ease:'power2.out', delay:0.9 });
  }

  analyzeUrl() {
    if (!this.urlInput.trim()) return;
    this.status = 'loading';
    this.analysisProgress = 0;
    this.checks = [
      { label:'Google Safe Browsing', status:'checking', detail:'Consultando listas...', icon:'globe',     source:'Google' },
      { label:'PhishTank',            status:'pending',  detail:'En espera',              icon:'fish-simple',source:'Cisco Talos' },
      { label:'Análisis heurístico',  status:'pending',  detail:'En espera',              icon:'cpu',       source:'ARGOS' },
      { label:'VirusTotal',           status:'pending',  detail:'En espera',              icon:'shield',    source:'VirusTotal' },
    ];

    // ANIMACIÓN DEL ESCANEO RADIAL
    gsap.to('.scan-ring', {
      rotation: 360, duration: 2, repeat: 1, ease: 'none'
    });

    gsap.killTweensOf(this);
    const obj = { progress: 0 };
    this.progressTween = gsap.to(obj, {
      progress: 100, duration: 3.8, ease: 'power1.inOut',
      onUpdate: () => {
        this.analysisProgress = Math.round(obj.progress);
        if (obj.progress > 22) this.checks[0] = {
          label:'Google Safe Browsing', status:'ok',
          detail:'No encontrado en listas negras',
          icon:'globe', source:'Google' };
        if (obj.progress > 25 && this.checks[1].status === 'pending') {
          this.checks[1] = { ...this.checks[1], status:'checking', detail:'Consultando base colaborativa...' };
        }
        if (obj.progress > 48) this.checks[1] = {
          label:'PhishTank', status:'ok',
          detail:'URL no reportada como phishing',
          icon:'fish-simple', source:'Cisco Talos' };
        if (obj.progress > 52 && this.checks[2].status === 'pending') {
          this.checks[2] = { ...this.checks[2], status:'checking', detail:'Analizando dominio y SSL...' };
        }
        if (obj.progress > 70) this.checks[2] = this.getHeuristicResult();
        if (obj.progress > 75 && this.checks[3].status === 'pending') {
          this.checks[3] = { ...this.checks[3], status:'checking', detail:'Consultando 70+ motores AV...' };
        }
        if (obj.progress > 92) this.checks[3] = {
          label:'VirusTotal', status:'ok',
          detail:'0 / 70 motores detectaron amenaza',
          icon:'shield', source:'VirusTotal' };
      },
      onComplete: () => {
        this.status = this.getMockVerdict();
        this.animateVerdict();
      }
    });
  }

  private getHeuristicResult(): CheckResult {
    const url = this.urlInput.toLowerCase();
    const susWords = ['seguridad','cliente','verify','login','secure','update','urgente'];
    const hasSus = susWords.some(k => url.includes(k));
    if (hasSus) return {
      label:'Análisis heurístico', status:'warn',
      detail:'Palabras clave sospechosas en el dominio',
      icon:'cpu', source:'ARGOS' };
    return {
      label:'Análisis heurístico', status:'ok',
      detail:'Sin patrones sospechosos',
      icon:'cpu', source:'ARGOS' };
  }

  private getMockVerdict(): AnalysisStatus {
    const url = this.urlInput.toLowerCase();
    if (url.includes('phish') || url.includes('fake') || url.includes('hack')) return 'danger';
    if (url.includes('seguridad') || url.includes('cliente') || url.includes('verify')) return 'suspicious';
    return 'safe';
  }

  private animateVerdict() {
    gsap.fromTo('.verdict-card',
      { scale:0.85, opacity:0 },
      { scale:1, opacity:1, duration:0.5, ease:'back.out(1.6)' });
    gsap.fromTo('.check-row',
      { x:-20, opacity:0 },
      { x:0, opacity:1, duration:0.3, stagger:0.07,
        ease:'power2.out', delay:0.2 });

    // CONFETI CELEBRATORIO ÚNICAMENTE CUANDO EL VEREDICTO ES SEGURO
    if (this.status === 'safe') {
      // RETRASO LIGERO PARA QUE EL CONFETI APAREZCA TRAS LA TARJETA DE VEREDICTO
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.4 },
          colors: ['#10B981', '#22C55E', '#06B6D4', '#7C3AED'],
        });
      }, 300);
    }
  }

  resetAnalysis() {
    this.status = 'idle';
    this.urlInput = '';
    this.checks = [];
    this.analysisProgress = 0;
    if (this.progressTween) this.progressTween.kill();
  }

  getVerdictTitle(): string {
    if (this.status === 'safe')       return 'URL Segura';
    if (this.status === 'suspicious') return 'URL Sospechosa';
    if (this.status === 'danger')     return 'URL Peligrosa';
    return '';
  }

  getVerdictDesc(): string {
    if (this.status === 'safe')       return 'No detectamos amenazas. Aun así, mantén la precaución habitual.';
    if (this.status === 'suspicious') return 'Detectamos señales sospechosas. Evita introducir credenciales.';
    if (this.status === 'danger')     return 'URL identificada como maliciosa. NO la visites bajo ningún concepto.';
    return '';
  }

  getVerdictColor(): string {
    if (this.status === 'safe')       return 'var(--color-success)';
    if (this.status === 'suspicious') return 'var(--color-warning)';
    if (this.status === 'danger')     return 'var(--color-danger)';
    return 'var(--color-text-muted)';
  }

  getRecentColor(v: string): string {
    if (v === 'safe')       return 'var(--color-success)';
    if (v === 'suspicious') return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  getRecentLabel(v: string): string {
    if (v === 'safe')       return 'Segura';
    if (v === 'suspicious') return 'Sospechosa';
    return 'Peligrosa';
  }

  ngOnDestroy() {
    if (this.progressTween) this.progressTween.kill();
    gsap.killTweensOf('.phish-stats-banner, .stat-mini, .input-hero, .threat-bar, .threat-bar-fill, .recent-card, .example-card, .tip-card, .scan-ring, .verdict-card, .check-row');
  }
}
