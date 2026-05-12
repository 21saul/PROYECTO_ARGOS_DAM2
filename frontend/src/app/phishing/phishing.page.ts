import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';
// LIBRERIA DE CONFETI PARA EL VEREDICTO SEGURO
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
  // VARIACION RESPECTO AL MES ANTERIOR (% CON SIGNO PARA INDICADOR DE TREND)
  trend: number;
}

interface UrlExample {
  fake: string;
  real: string;
  trick: string;
  tipIcon: string;
  // POSICIONES DE LOS CARACTERES TRAMPA DENTRO DE LA URL FAKE
  fakeIndices: number[];
  // EXPLICACION LARGA DEL ATAQUE (TOOLTIP AL PASAR POR ENCIMA DE LA URL FAKE)
  longExplanation: string;
}

interface EngineChip {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-phishing',
  templateUrl: './phishing.page.html',
  styleUrls: ['./phishing.page.scss'],
  standalone: false
})
export class PhishingPage implements OnDestroy, AfterViewInit {

  @ViewChild('urlInputEl') urlInputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('phishRoot', { static: false }) phishRoot!: ElementRef<HTMLElement>;

  urlInput = '';
  status: AnalysisStatus = 'idle';
  analysisProgress = 0;

  // STATS DEL HEADER
  todayAnalyses = 247;
  threatsDetected = 18;
  detectionRate = 99.2;
  avgResponseTime = 3.4;
  // VALOR MOSTRADO PARA EL COUNT-UP DEL PANEL RADAR
  detectionRateDisplay = '0.0';

  // ESTADO DEL MOTOR ACTIVO MOSTRADO EN EL HEADER DEL PIPELINE
  currentEngineTitle = 'Iniciando análisis';
  currentEngineDetail = 'Preparando motores de detección';

  checks: CheckResult[] = [];

  // CHIPS DE LOS 4 MOTORES VISIBLES DESDE EL ESTADO IDLE
  engineChips: EngineChip[] = [
    { key: 'google',  label: 'Google',     icon: 'globe' },
    { key: 'phish',   label: 'PhishTank',  icon: 'fish-simple' },
    { key: 'argos',   label: 'ARGOS',      icon: 'cpu' },
    { key: 'virus',   label: 'VirusTotal', icon: 'shield' },
  ];

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
    { category:'Bancos',         icon:'bank',          color:'#06B6D4', percentage:34, count:84, trend:  12 },
    { category:'Paqueterías',    icon:'package',       color:'#F59E0B', percentage:22, count:54, trend:   8 },
    { category:'Redes sociales', icon:'share-network', color:'#EC4899', percentage:18, count:44, trend:  -3 },
    { category:'Streaming',      icon:'television',    color:'#EF4444', percentage:14, count:35, trend:   5 },
    { category:'Email',          icon:'envelope',      color:'#7C3AED', percentage:12, count:30, trend: -11 },
  ];

  // EJEMPLOS COMPARATIVOS — INCLUYEN INDICES DE LOS CHARS TRAMPA Y EXPLICACION LARGA
  urlExamples: UrlExample[] = [
    {
      fake:'paypa1.com', real:'paypal.com',
      trick:'1 en lugar de l', tipIcon:'magnifying-glass',
      fakeIndices:[5],
      longExplanation:'Sustitución de la letra "l" por el dígito "1". En fuentes sans-serif son casi idénticos a primera vista.'
    },
    {
      fake:'amaz0n-shop.com', real:'amazon.com',
      trick:'0 en lugar de o', tipIcon:'magnifying-glass',
      fakeIndices:[4],
      longExplanation:'Reemplazo de la letra "o" por el dígito "0", combinado con un sufijo "-shop" que aparenta legitimidad.'
    },
    {
      fake:'netflìx.com', real:'netflix.com',
      trick:'í con tilde (Unicode)', tipIcon:'translate',
      fakeIndices:[5],
      longExplanation:'Ataque homógrafo: el carácter "ì" es Unicode (U+00EC), no la "i" ASCII. Mismo aspecto, dominio distinto.'
    },
    {
      fake:'gооgle.com', real:'google.com',
      trick:'Cirílico о (homógrafo)', tipIcon:'translate',
      fakeIndices:[1,2],
      longExplanation:'Las dos "o" son cirílicas (U+043E), no latinas. Visualmente idénticas pero registran un dominio distinto.'
    },
  ];

  // CONTEXTO GSAP PARA AISLAR Y LIMPIAR TODAS LAS ANIMACIONES DE LA PAGINA
  private ctx: any = null;
  private pipelineTl: gsap.core.Timeline | null = null;
  private countUpTween: gsap.core.Tween | null = null;
  // INTERSECTION OBSERVERS PARA REVEAL EN VIEWPORT (HEATMAP / RECIENTES / EJEMPLOS)
  private observers: IntersectionObserver[] = [];

  ngAfterViewInit() {
    // CREAMOS EL CONTEXTO GSAP UNA SOLA VEZ, SCOPED A LA RAIZ DEL COMPONENTE
    this.ctx = gsap.context(() => {}, this.phishRoot?.nativeElement);
  }

  ionViewDidEnter() {
    this.animateEntrance();
    this.scheduleViewportReveals();
  }

  // DETECCION CENTRAL DE PREFERENCIA REDUCED-MOTION
  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private animateEntrance() {
    const reduce = this.prefersReducedMotion();
    if (!this.ctx) {
      this.ctx = gsap.context(() => {}, this.phishRoot?.nativeElement);
    }

    this.ctx.add(() => {
      // ENTRADA DEL PANEL RADAR
      gsap.fromTo('.radar-panel',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: reduce ? 0.01 : 0.5, ease: 'power2.out' });

      // ENTRADA DE LOS TILES MINI (HALOS POR TONO)
      gsap.fromTo('.stat-tile',
        { scale: 0.88, opacity: 0 },
        {
          scale: 1, opacity: 1,
          duration: reduce ? 0.01 : 0.4,
          stagger: reduce ? 0 : 0.07,
          ease: 'back.out(1.4)',
          delay: reduce ? 0 : 0.12
        });

      // ENTRADA DEL INPUT HERO
      gsap.fromTo('.input-hero',
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: reduce ? 0.01 : 0.5,
          ease: 'power2.out',
          delay: reduce ? 0 : 0.32
        });

      // COUNT-UP DEL PORCENTAJE DE DETECCION (SI HAY MOTION REDUCED, PINTAR EL VALOR FINAL)
      if (reduce) {
        this.detectionRateDisplay = this.detectionRate.toFixed(1);
      } else {
        const obj = { val: 0 };
        this.countUpTween = gsap.to(obj, {
          val: this.detectionRate,
          duration: 1.4,
          ease: 'power2.out',
          delay: 0.15,
          onUpdate: () => {
            this.detectionRateDisplay = obj.val.toFixed(1);
          },
          onComplete: () => {
            this.detectionRateDisplay = this.detectionRate.toFixed(1);
          }
        });
      }
    });
  }

  // REVEAL EN VIEWPORT PARA SECCIONES SCROLLEABLES (HEATMAP, RECIENTES, EJEMPLOS)
  // USAMOS INTERSECTIONOBSERVER PORQUE EL SCROLLER DE IONIC NO ES window/document
  // Y CONFIGURAR ScrollTrigger.scrollerProxy CONTRA ion-content ES EXCESIVO PARA ESTO.
  private scheduleViewportReveals() {
    const reduce = this.prefersReducedMotion();

    // BARRAS DEL HEATMAP — ANIMAMOS scaleX (TRANSFORM, PERFORMANTE) AL ENTRAR EN VIEWPORT
    this.observeAndAnimate('.threat-bar-fill', (el) => {
      const target = Number((el as HTMLElement).dataset['target'] ?? 0) / 100;
      if (reduce) {
        gsap.set(el, { scaleX: target });
        return;
      }
      gsap.fromTo(el,
        { scaleX: 0 },
        { scaleX: target, duration: 1.05, ease: 'power2.out' });
    });

    // CARDS DE RECIENTES Y EJEMPLOS — FADE-IN STAGGERED PROGRESIVO POR APARICION
    this.observeAndAnimate('.recent-card, .example-card, .threat-bar-row', (el) => {
      if (reduce) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(el,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
    });
  }

  private observeAndAnimate(selector: string, runner: (el: Element) => void) {
    const els = document.querySelectorAll(selector);
    if (els.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          runner(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    this.observers.push(obs);
  }

  analyzeUrl() {
    if (!this.urlInput.trim()) return;
    this.status = 'loading';
    this.analysisProgress = 0;
    this.currentEngineTitle = 'Iniciando análisis';
    this.currentEngineDetail = 'Conectando con motores externos';

    // ESTADO INICIAL: TODOS EN PENDING SALVO EL PRIMER MOTOR EN CHECKING
    this.checks = [
      { label:'Google Safe Browsing', status:'pending',  detail:'En espera', icon:'globe',      source:'Google' },
      { label:'PhishTank',            status:'pending',  detail:'En espera', icon:'fish-simple',source:'PhishTank' },
      { label:'Análisis heurístico',  status:'pending',  detail:'En espera', icon:'cpu',        source:'ARGOS' },
      { label:'VirusTotal',           status:'pending',  detail:'En espera', icon:'shield',     source:'VirusTotal' },
    ];

    // ESPERAR A QUE EL DOM PINTE LA CADENA ANTES DE ARRANCAR LA TIMELINE
    requestAnimationFrame(() => this.startPipelineTimeline());
  }

  private startPipelineTimeline() {
    const reduce = this.prefersReducedMotion();
    // DURACION DE CADA SEGMENTO (4 MOTORES EN CASCADA)
    const dur = reduce ? 0.25 : 0.9;

    if (this.pipelineTl) this.pipelineTl.kill();

    // ASEGURAR QUE LOS CONECTORES PARTEN VACIOS EN CADA ANALISIS
    gsap.set('.chain-conn', { '--fill': 0 });

    this.pipelineTl = gsap.timeline({
      onUpdate: () => {
        if (this.pipelineTl) {
          this.analysisProgress = Math.round(this.pipelineTl.progress() * 100);
        }
      },
      onComplete: () => {
        this.status = this.getMockVerdict();
        // ESPERAR UN FRAME PARA QUE EL TEMPLATE PINTE LA VERDICT-CARD ANTES DE ANIMARLA
        requestAnimationFrame(() => this.animateVerdict());
      }
    });

    // MOTOR 1: GOOGLE SAFE BROWSING
    this.pipelineTl
      .call(() => this.setEngine(0, 'checking', 'Consultando listas...'), [], 0)
      .to({}, { duration: dur }, 0)

      // FIN MOTOR 1 → INICIO MOTOR 2 (CONECTOR 0 SE LLENA)
      .call(() => {
        this.setEngine(0, 'ok', 'No encontrado en listas negras');
        this.setEngine(1, 'checking', 'Consultando base colaborativa...');
      }, [], dur)
      .to('.chain-conn-0', { '--fill': 100, duration: dur, ease: 'power1.inOut' }, dur)

      // FIN MOTOR 2 → INICIO MOTOR 3
      .call(() => {
        this.setEngine(1, 'ok', 'URL no reportada como phishing');
        this.setEngine(2, 'checking', 'Analizando dominio y SSL...');
      }, [], dur * 2)
      .to('.chain-conn-1', { '--fill': 100, duration: dur, ease: 'power1.inOut' }, dur * 2)

      // FIN MOTOR 3 (HEURISTICA REAL, PUEDE SER WARN) → INICIO MOTOR 4
      .call(() => {
        const r = this.getHeuristicResult();
        this.setEngine(2, r.status, r.detail);
        this.setEngine(3, 'checking', 'Consultando 70+ motores AV...');
      }, [], dur * 3)
      .to('.chain-conn-2', { '--fill': 100, duration: dur, ease: 'power1.inOut' }, dur * 3)

      // FIN MOTOR 4
      .call(() => this.setEngine(3, 'ok', '0 / 70 motores detectaron amenaza'), [], dur * 4);
  }

  private setEngine(i: number, status: CheckResult['status'], detail: string) {
    if (!this.checks[i]) return;
    this.checks[i] = { ...this.checks[i], status, detail };
    // EL TITULO GRANDE DEL PIPELINE REFLEJA SIEMPRE EL ULTIMO MOTOR EN MARCHA O EL ULTIMO CONCLUIDO
    this.currentEngineTitle = this.checks[i].label;
    this.currentEngineDetail = detail;
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
    const reduce = this.prefersReducedMotion();

    if (reduce) {
      gsap.set('.verdict-card', { opacity: 1, scale: 1, clearProps: 'x' });
    } else if (this.status === 'danger') {
      // ENTRADA + SHAKE UNICO HORIZONTAL DEL VEREDICTO PELIGROSO
      const tl = gsap.timeline();
      tl.fromTo('.verdict-card',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.5)' })
        .to('.verdict-card', { x: -6, duration: 0.06, ease: 'none' })
        .to('.verdict-card', { x:  6, duration: 0.06, ease: 'none' })
        .to('.verdict-card', { x: -4, duration: 0.06, ease: 'none' })
        .to('.verdict-card', { x:  4, duration: 0.06, ease: 'none' })
        .to('.verdict-card', { x:  0, duration: 0.06, ease: 'none' });
      // VIBRACION HAPTICA EN MOVIL SI ESTA SOPORTADA
      if ('vibrate' in navigator) {
        try { navigator.vibrate(120); } catch { /* IGNORADO */ }
      }
    } else {
      gsap.fromTo('.verdict-card',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' });
    }

    // STAGGERED IN DE LOS PILLS DEL RESUMEN DE MOTORES
    if (!reduce) {
      gsap.fromTo('.vchain-pill',
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.28, stagger: 0.06, ease: 'power2.out', delay: 0.18 });
    } else {
      gsap.set('.vchain-pill', { x: 0, opacity: 1 });
    }

    // CONFETI SOLO EN VEREDICTO SEGURO (LA REGLA DEL BRIEF)
    if (this.status === 'safe') {
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
    if (this.pipelineTl) {
      this.pipelineTl.kill();
      this.pipelineTl = null;
    }
    // RESET DE LAS CSS VARS DE LOS CONECTORES PARA EL PROXIMO ANALISIS
    gsap.set('.chain-conn', { '--fill': 0 });

    this.status = 'idle';
    this.urlInput = '';
    this.checks = [];
    this.analysisProgress = 0;
    this.currentEngineTitle = 'Iniciando análisis';
    this.currentEngineDetail = 'Preparando motores de detección';

    // REVEAL DEL INPUT HERO + SECCIONES IDLE TRAS VOLVER DESDE EL VEREDICTO
    requestAnimationFrame(() => {
      const reduce = this.prefersReducedMotion();
      if (reduce) {
        gsap.set('.input-hero', { opacity: 1, y: 0 });
      } else {
        gsap.fromTo('.input-hero',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
      }
      this.scheduleViewportReveals();
    });
  }

  // RE-ANALIZAR UNA URL DEL HISTORIAL RECIENTE
  analyzeRecent(r: RecentAnalysis) {
    this.urlInput = r.url;
    this.analyzeUrl();
  }

  // MOCK UI: HOOK FUTURO PARA COMPARTIR EL REPORTE GENERADO
  shareReport() {
    console.log('[ARGOS] Compartir reporte:', this.urlInput);
  }

  // MOCK UI: HOOK FUTURO PARA BLOQUEAR EL DOMINIO EN LISTA NEGRA LOCAL
  blockDomain() {
    console.log('[ARGOS] Bloquear dominio:', this.urlInput);
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

  // DESCOMPONE LA URL FAKE EN ARRAY DE CHARS MARCANDO CUALES SON TRAMPA
  getFakeChars(e: UrlExample): { char: string; suspect: boolean }[] {
    return Array.from(e.fake).map((char, i) => ({
      char,
      suspect: e.fakeIndices.includes(i)
    }));
  }

  ngOnDestroy() {
    if (this.pipelineTl) this.pipelineTl.kill();
    if (this.countUpTween) this.countUpTween.kill();
    // RED DE SEGURIDAD: MATAR TWEENS DE TODOS LOS SELECTORES NO CAPTURADOS POR EL CONTEXTO
    gsap.killTweensOf([
      '.radar-panel', '.stat-tile', '.input-hero',
      '.verdict-card', '.vchain-pill',
      '.threat-bar-fill', '.recent-card', '.example-card', '.threat-bar-row',
      '.chain-conn'
    ]);
    if (this.ctx) this.ctx.revert();
    this.observers.forEach(o => o.disconnect());
    this.observers = [];
  }
}
