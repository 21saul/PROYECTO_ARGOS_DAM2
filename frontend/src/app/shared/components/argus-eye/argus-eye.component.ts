// OJO ESCOLTA FLOTANTE — UNO DE LOS CIEN OJOS DE ARGOS SUELTO EN PANTALLA.
// REDISENADO DE ANGEL-OJO-CON-ALAS A SIGILO COSMICO VERTICAL CON
// PARTICULAS ORBITALES Y ANILLO RUNICO. COHERENTE CON LA MASCOTA
// PRINCIPAL (CHEST SIGIL) — MISMA PALETA DARK COSMIC + LIGHT FRIENDLY.
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-argus-eye',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eye-float"
      *ngIf="visible"
      [class.theme-light]="theme === 'light'"
      [class.talking]="isTalking"
      [class.dragging]="isDragging"
      [style.left.px]="position.x"
      [style.top.px]="position.y"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)">

      <div class="eye-body">
        <svg width="68" height="80" viewBox="0 0 120 140"
             xmlns="http://www.w3.org/2000/svg"
             aria-hidden="true">
          <defs>
            <!-- IRIS DEL SIGILO — DEGRADADO RADIAL CYAN -->
            <radialGradient id="sigilIris" cx="50%" cy="40%" r="60%">
              <stop offset="0%"  [attr.stop-color]="'var(--eye-iris-1)'"/>
              <stop offset="100%" [attr.stop-color]="'var(--eye-iris-2)'"/>
            </radialGradient>
            <!-- HALO BACKGLOW DETRAS DEL SIGILO -->
            <radialGradient id="sigilHalo" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stop-color="transparent"/>
              <stop offset="100%" [attr.stop-color]="'var(--eye-glow)'"
                    stop-opacity="0.32"/>
            </radialGradient>
            <!-- FONDO DEL OJO ALMENDRA -->
            <radialGradient id="almondBg" cx="50%" cy="40%" r="70%">
              <stop offset="0%"  [attr.stop-color]="'var(--eye-bg-2)'"/>
              <stop offset="100%" [attr.stop-color]="'var(--eye-bg-1)'"/>
            </radialGradient>
            <!-- GLOW BLOOM PARA EL IRIS -->
            <filter id="irisBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- HALO COSMICO DE FONDO -->
          <circle class="halo" cx="60" cy="70" r="58"
                  fill="url(#sigilHalo)"/>

          <!-- ════════ PARTICULA ORBITAL SUPERIOR-DERECHA ════════ -->
          <g class="orbit orbit-tr">
            <circle cx="96" cy="24" r="4"
                    fill="url(#sigilIris)" filter="url(#irisBloom)"/>
            <circle cx="96" cy="24" r="1.8"
                    [attr.fill]="'var(--eye-pupil)'"/>
          </g>

          <!-- ════════ PARTICULA ORBITAL INFERIOR-IZQUIERDA ════════ -->
          <g class="orbit orbit-bl">
            <circle cx="24" cy="116" r="4"
                    fill="url(#sigilIris)" filter="url(#irisBloom)"/>
            <circle cx="24" cy="116" r="1.8"
                    [attr.fill]="'var(--eye-pupil)'"/>
          </g>

          <!-- ════════ ANILLO RUNICO EXTERIOR ════════ -->
          <circle cx="60" cy="70" r="40" fill="none"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="1.8" opacity="0.95"/>
          <!-- ANILLO RUNICO INTERIOR (DECORATIVO) -->
          <circle cx="60" cy="70" r="32" fill="none"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="0.8" opacity="0.55"/>

          <!-- ════════ MARCAS CARDINALES (N S E W) ════════ -->
          <g class="cardinals">
            <line x1="60" y1="24" x2="60" y2="30"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="1.4" stroke-linecap="round"/>
            <line x1="60" y1="116" x2="60" y2="110"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="1.4" stroke-linecap="round"/>
            <line x1="14" y1="70" x2="20" y2="70"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="1.4" stroke-linecap="round"/>
            <line x1="106" y1="70" x2="100" y2="70"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="1.4" stroke-linecap="round"/>
          </g>

          <!-- ════════ ALMENDRA VERTICAL DEL OJO ════════ -->
          <ellipse class="almond" cx="60" cy="70" rx="18" ry="28"
                   fill="url(#almondBg)"
                   [attr.stroke]="'var(--eye-frame)'"
                   stroke-width="0.6" opacity="0.95"/>

          <!-- ════════ IRIS ════════ -->
          <circle class="iris" cx="60" cy="70" r="12"
                  fill="url(#sigilIris)" filter="url(#irisBloom)"/>
          <!-- ANILLO INTERNO DEL IRIS -->
          <circle cx="60" cy="70" r="12" fill="none"
                  [attr.stroke]="'var(--eye-frame)'"
                  stroke-width="0.5" opacity="0.6"/>

          <!-- ════════ PUPILA ════════ -->
          <circle class="pupil" cx="60" cy="70" r="6.5"
                  [attr.fill]="'var(--eye-pupil)'"/>

          <!-- ════════ DESTELLO PRINCIPAL ════════ -->
          <ellipse class="shine" cx="55" cy="63" rx="3" ry="3.6"
                   fill="#FFFFFF" opacity="0.95"/>
          <!-- DESTELLO SECUNDARIO -->
          <circle cx="64" cy="76" r="1.4" fill="#FFFFFF" opacity="0.55"/>

          <!-- ════════ PARPADO (BAJA PARA PARPADEAR) ════════ -->
          <rect class="lid" x="42" y="42" width="36" height="0"
                fill="url(#almondBg)"/>

          <!-- ════════ SOMBRA DE SUELO COSMICA ════════ -->
          <ellipse class="ground-shadow" cx="60" cy="132" rx="28" ry="3.5"
                   [attr.fill]="'var(--eye-floor)'"/>
        </svg>
        <span class="ping" *ngIf="hasUnreadTip"></span>
      </div>

      <div class="bubble" *ngIf="isTalking">
        <div class="bubble-tip">{{currentTip}}</div>
        <div class="bubble-tail"></div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: relative; }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  TOKENS DE TEMA — DARK COSMIC POR DEFECTO               ║
       ╚══════════════════════════════════════════════════════════╝ */
    .eye-float {
      --eye-frame:  #7b5cd6;
      --eye-iris-1: #5dc8ff;
      --eye-iris-2: #00d4ff;
      --eye-bg-1:   #0a0817;
      --eye-bg-2:   #1a1640;
      --eye-pupil:  #061018;
      --eye-glow:   #00d4ff;
      --eye-floor:  rgba(0,0,0,0.45);
      --eye-bubble-bg: #14142a;
      --eye-bubble-border: color-mix(in srgb, var(--eye-frame) 50%, transparent);
      --eye-bubble-text: #f1f5f9;
    }
    .eye-float.theme-light {
      --eye-frame:  #ff8c5a;
      --eye-iris-1: #8dd6ff;
      --eye-iris-2: #5bb3ff;
      --eye-bg-1:   #1a3a2a;
      --eye-bg-2:   #2f5a48;
      --eye-pupil:  #0a2030;
      --eye-glow:   #5bb3ff;
      --eye-floor:  rgba(40,80,60,0.22);
      --eye-bubble-bg: #f5fff8;
      --eye-bubble-border: color-mix(in srgb, var(--eye-frame) 60%, transparent);
      --eye-bubble-text: #1a3a2a;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  CONTENEDOR FLOTANTE Y DRAG                             ║
       ╚══════════════════════════════════════════════════════════╝ */
    .eye-float {
      position: fixed;
      z-index: 9999;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      animation: hover 3.4s ease-in-out infinite;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      will-change: transform;
      filter: drop-shadow(0 12px 28px
              color-mix(in srgb, var(--eye-glow) 35%, transparent));
    }
    .eye-float.dragging {
      cursor: grabbing;
      animation: none;
      transition: none;
      transform: scale(1.08);
      filter: drop-shadow(0 14px 32px
              color-mix(in srgb, var(--eye-frame) 60%, transparent));
    }
    .eye-float:active { transform: scale(0.94); }
    .eye-float.talking { animation: hoverTalk 0.85s ease-in-out infinite; }
    .eye-float.dragging.talking { animation: none; }

    @keyframes hover {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes hoverTalk {
      0%, 100% { transform: translateY(0)   scale(1); }
      50%      { transform: translateY(-3px) scale(1.06); }
    }

    .eye-body {
      position: relative;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  HALO COSMICO — RESPIRACION                             ║
       ╚══════════════════════════════════════════════════════════╝ */
    .halo {
      transform-origin: 60px 70px;
      animation: haloPulse 3.6s ease-in-out infinite;
    }
    @keyframes haloPulse {
      0%, 100% { opacity: 0.65; transform: scale(1); }
      50%      { opacity: 1;    transform: scale(1.08); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  ANILLO RUNICO — ROTACION LENTA                         ║
       ╚══════════════════════════════════════════════════════════╝ */
    .cardinals {
      transform-origin: 60px 70px;
      animation: cardinalSpin 16s linear infinite;
    }
    @keyframes cardinalSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .eye-float.talking .cardinals {
      animation-duration: 4s;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  PARTICULAS ORBITALES — ORBITAN ALREDEDOR DEL SIGILO    ║
       ╚══════════════════════════════════════════════════════════╝ */
    .orbit {
      transform-origin: 60px 70px;
      transform-box: view-box;
    }
    .orbit-tr {
      animation: orbitCW 6.5s linear infinite,
                 orbitPulse 2.2s ease-in-out infinite;
    }
    .orbit-bl {
      animation: orbitCW 6.5s linear infinite,
                 orbitPulse 2.2s ease-in-out infinite 1.1s;
    }
    @keyframes orbitCW {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes orbitPulse {
      0%, 100% { opacity: 0.7; }
      50%      { opacity: 1; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  IRIS — RESPIRACION DE BRILLO                           ║
       ╚══════════════════════════════════════════════════════════╝ */
    .iris {
      transform-origin: 60px 70px;
      transform-box: view-box;
      animation: irisBreathe 3s ease-in-out infinite;
    }
    @keyframes irisBreathe {
      0%, 100% { transform: scale(1);    filter: url(#irisBloom) brightness(1); }
      50%      { transform: scale(1.08); filter: url(#irisBloom) brightness(1.25); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  PARPADEO — LID BAJA PARA CUBRIR LA ALMENDRA            ║
       ╚══════════════════════════════════════════════════════════╝ */
    .lid {
      animation: blink 6s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 92%, 100% { height: 0;  y: 42; }
      94%           { height: 56; y: 42; }
      96%           { height: 0;  y: 42; }
    }
    /* AL HABLAR — PARPADEO RAPIDO PARA DAR VIDA */
    .eye-float.talking .lid {
      animation: blinkTalk 1.4s ease-in-out infinite;
    }
    @keyframes blinkTalk {
      0%, 100% { height: 0;  y: 42; }
      50%      { height: 26; y: 42; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  SOMBRA DE SUELO COSMICA                                ║
       ╚══════════════════════════════════════════════════════════╝ */
    .ground-shadow {
      transform-origin: 60px 132px;
      animation: shadowPulse 3.4s ease-in-out infinite;
    }
    @keyframes shadowPulse {
      0%, 100% { transform: scaleX(1);   opacity: 0.6; }
      50%      { transform: scaleX(0.76); opacity: 0.3; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  PING DE TIP SIN LEER                                   ║
       ╚══════════════════════════════════════════════════════════╝ */
    .ping {
      position: absolute;
      top: 14px; right: 4px;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--eye-glow);
      border: 2px solid var(--color-bg, #0e1117);
      animation: pingPulse 1.6s ease-in-out infinite;
    }
    @keyframes pingPulse {
      0%, 100% { box-shadow: 0 0 0 0
                 color-mix(in srgb, var(--eye-glow) 60%, transparent); }
      50%      { box-shadow: 0 0 0 8px
                 color-mix(in srgb, var(--eye-glow) 0%, transparent); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  BUBBLE DE CONSEJO                                      ║
       ╚══════════════════════════════════════════════════════════╝ */
    .bubble {
      position: absolute;
      bottom: 84px; left: 8px;
      background: var(--eye-bubble-bg);
      border: 1px solid var(--eye-bubble-border);
      border-radius: 14px 14px 14px 4px;
      padding: 12px 14px;
      width: 220px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5);
      animation: bubblePop 0.32s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes bubblePop {
      from { transform: scale(0.6) translateY(8px); opacity: 0; }
      to   { transform: scale(1)   translateY(0);   opacity: 1; }
    }
    .bubble-tip {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem; font-weight: 600;
      color: var(--eye-bubble-text);
      line-height: 1.45;
    }
    .bubble-tail {
      position: absolute; bottom: -7px; left: 16px;
      width: 14px; height: 8px;
      background: var(--eye-bubble-bg);
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      border-right: 1px solid var(--eye-bubble-border);
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  ACCESIBILIDAD — MOTION REDUCIDA                        ║
       ╚══════════════════════════════════════════════════════════╝ */
    @media (prefers-reduced-motion: reduce) {
      .eye-float, .halo, .cardinals, .orbit-tr, .orbit-bl,
      .iris, .lid, .ground-shadow, .ping {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class ArgusEyeComponent implements OnInit, OnDestroy {
  // VISIBILIDAD EN LA RUTA ACTUAL
  visible = true;
  // ESTADO TALKING (BURBUJA ABIERTA)
  isTalking = false;
  // RESERVADO PARA MINIMIZAR FUTURO
  isMinimized = false;
  // INDICA SI HAY UN CONSEJO SIN LEER (DISPARA EL PING)
  hasUnreadTip = true;
  // CONSEJO ACTUAL MOSTRADO EN LA BURBUJA
  currentTip = '';
  // TEMA — DARK POR DEFECTO; SE PUEDE FORZAR LIGHT VIA SCRIPT
  theme: 'dark' | 'light' = 'dark';

  // POSICION EN PIXELES
  position = { x: 16, y: 100 };
  // ESTADO DE ARRASTRE
  isDragging = false;
  private dragStartPos = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private moved = false;
  private readonly DRAG_THRESHOLD = 6;

  // TIMER DE AUTOCERRADO DE LA BURBUJA
  private tipTimer: any;
  // SUSCRIPCION A NAVEGACION
  private routerSub?: Subscription;

  // RUTAS DONDE EL OJO PERMANECE OCULTO
  private readonly hiddenRoutes = ['/onboarding', '/login', '/register'];

  // TAMANO FISICO DEL ELEMENTO EN PANTALLA — USADO PARA CLAMP DE DRAG
  private readonly EYE_W = 76;
  private readonly EYE_H = 88;

  // CATALOGO DE CONSEJOS DE CIBERSEGURIDAD
  private tips = [
    'Una contraseña diferente para cada sitio',
    'El doble factor de autenticación es tu mejor amigo',
    'Nunca cliques links bancarios desde un SMS',
    'Una contraseña de 20 caracteres es virtualmente inviolable',
    'Las WiFis públicas pueden ver tu tráfico sin cifrar',
    'Actualizar apps cierra agujeros de seguridad',
    'El 60% de las brechas son por error humano',
    'Tu email es la llave maestra de todas tus cuentas',
    'Un CVE crítico significa actuar inmediatamente',
    'AES-256 tarda siglos en romperse por fuerza bruta',
    'Pon PIN en tu móvil: mínimo 6 dígitos no obvios',
    'Revisa siempre el dominio completo antes de hacer login',
    'Backup 3-2-1: tres copias, dos soportes, una en la nube',
    'Los hackers no atacan sistemas, atacan personas',
    'Un gestor de contraseñas resuelve el 90% del riesgo',
    'Comprueba tu email en haveibeenpwned.com',
    'Solo el 28% sabe detectar phishing real',
    'Typosquatting: paypa1.com no es paypal.com',
    'La ingeniería social explota la confianza',
    'Zero-Knowledge: nadie ve tus datos, ni nosotros',
  ];

  constructor(private router: Router) {}

  // CIERRA LA BURBUJA SI EL CLICK ES FUERA DEL OJO
  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isTalking && !target.closest('.eye-float')) {
      this.isTalking = false;
    }
  }

  ngOnInit() {
    // CARGAR POSICION GUARDADA
    const saved = localStorage.getItem('argos-eye-position');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        this.position.x = Math.max(8,
          Math.min(window.innerWidth - this.EYE_W, p.x));
        this.position.y = Math.max(60,
          Math.min(window.innerHeight - this.EYE_H, p.y));
      } catch (e) { /* IGNORAR */ }
    } else {
      // POSICION INICIAL — ABAJO IZQUIERDA
      this.position.x = 16;
      this.position.y = window.innerHeight - 180;
    }

    // SUSCRIPCION A NAVIGATION END PARA OCULTAR EN AUTH
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        const hidden = this.hiddenRoutes.some(r => url.startsWith(r));
        this.visible = !hidden;
      });
  }

  // POINTER DOWN — INICIO ARRASTRE
  onPointerDown(event: PointerEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.moved = false;
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.dragOffset = {
      x: event.clientX - this.position.x,
      y: event.clientY - this.position.y
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  // POINTER MOVE — MUEVE EL OJO Y DETECTA SI HUBO DRAG REAL
  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    const dx = event.clientX - this.dragStartPos.x;
    const dy = event.clientY - this.dragStartPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > this.DRAG_THRESHOLD) {
      this.moved = true;
    }
    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;
    this.position.x = Math.max(8,
      Math.min(window.innerWidth - this.EYE_W, newX));
    this.position.y = Math.max(60,
      Math.min(window.innerHeight - this.EYE_H, newY));
  }

  // POINTER UP — FIN ARRASTRE. SI NO HUBO DRAG, TAP NORMAL → TIP.
  onPointerUp(event: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    if (!this.moved) {
      this.onTap();
    } else {
      localStorage.setItem('argos-eye-position',
        JSON.stringify(this.position));
    }
  }

  // RESIZE — MANTIENE EL OJO DENTRO DEL VIEWPORT
  @HostListener('window:resize')
  onResize() {
    this.position.x = Math.max(8,
      Math.min(window.innerWidth - this.EYE_W, this.position.x));
    this.position.y = Math.max(60,
      Math.min(window.innerHeight - this.EYE_H, this.position.y));
  }

  // ALTERNA LA BURBUJA AL TAP
  onTap() {
    if (this.isTalking) {
      this.isTalking = false;
      clearTimeout(this.tipTimer);
      return;
    }
    this.currentTip = this.tips[Math.floor(Math.random() * this.tips.length)];
    this.isTalking = true;
    this.hasUnreadTip = false;
    this.tipTimer = setTimeout(() => {
      this.isTalking = false;
      this.hasUnreadTip = true;
    }, 4000);
  }

  ngOnDestroy() {
    clearTimeout(this.tipTimer);
    this.routerSub?.unsubscribe();
  }
}
