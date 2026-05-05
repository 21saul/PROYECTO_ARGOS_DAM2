// COMPONENTE STANDALONE DEL OJO FLOTANTE COMPAÑERO ARGUS-EYE
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// MODULO COMUN DE ANGULAR PARA DIRECTIVAS BASICAS
import { CommonModule } from '@angular/common';
// IMPORTACION DEL ROUTER PARA OCULTAR EL OJO EN RUTAS DE AUTH
import { Router, NavigationEnd } from '@angular/router';
// OPERADOR FILTER PARA DETECTAR SOLO EVENTOS DE NAVIGATION END
import { filter } from 'rxjs/operators';
// TIPO DE SUSCRIPCION PARA LIMPIAR EN ONDESTROY
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-argus-eye',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eye-float"
      *ngIf="visible"
      [class.talking]="isTalking"
      [class.dragging]="isDragging"
      [style.left.px]="position.x"
      [style.top.px]="position.y"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)">

      <div class="eye-body">
        <svg width="92" height="68" viewBox="0 0 200 140"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- GRADIENTE OJO BLANCO -->
            <radialGradient id="eyeWhite" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="70%" stop-color="#F2F2F4"/>
              <stop offset="100%" stop-color="#D5D7DC"/>
            </radialGradient>
            <!-- GRADIENTE IRIS -->
            <radialGradient id="eyeIris" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stop-color="#A3E635"/>
              <stop offset="60%" stop-color="#84CC16"/>
              <stop offset="100%" stop-color="#65A30D"/>
            </radialGradient>
            <!-- GRADIENTE ALAS -->
            <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="60%" stop-color="#F4F4F6"/>
              <stop offset="100%" stop-color="#D8DADF"/>
            </linearGradient>
            <!-- SOMBRA SUAVE -->
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge>
                <feMergeNode in="b"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- ALA IZQUIERDA -->
          <g class="wing wing-left">
            <!-- PLUMA EXTERIOR -->
            <path d="M 75 70
                     Q 50 55 25 60
                     Q 12 65 8 75
                     Q 18 72 30 73
                     Q 48 75 65 78
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
            <!-- PLUMA MEDIA -->
            <path d="M 78 75
                     Q 55 68 35 72
                     Q 22 76 18 84
                     Q 30 81 42 82
                     Q 58 83 72 82
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
            <!-- PLUMA INTERIOR -->
            <path d="M 80 82
                     Q 60 78 45 82
                     Q 32 86 28 92
                     Q 40 89 52 89
                     Q 66 89 78 87
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
          </g>

          <!-- ALA DERECHA (espejo) -->
          <g class="wing wing-right">
            <path d="M 125 70
                     Q 150 55 175 60
                     Q 188 65 192 75
                     Q 182 72 170 73
                     Q 152 75 135 78
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
            <path d="M 122 75
                     Q 145 68 165 72
                     Q 178 76 182 84
                     Q 170 81 158 82
                     Q 142 83 128 82
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
            <path d="M 120 82
                     Q 140 78 155 82
                     Q 168 86 172 92
                     Q 160 89 148 89
                     Q 134 89 122 87
                     Z"
                  fill="url(#wingGrad)"
                  stroke="#C8CAD0" stroke-width="1.5"
                  stroke-linejoin="round"/>
          </g>

          <!-- CUERPO DEL OJO -->
          <g class="eye-globe" filter="url(#softShadow)">
            <!-- ESFERA BLANCA PRINCIPAL -->
            <circle cx="100" cy="78" r="38"
              fill="url(#eyeWhite)"
              stroke="#C8CAD0" stroke-width="1.5"/>
            <!-- IRIS -->
            <circle class="iris" cx="100" cy="78" r="20"
              fill="url(#eyeIris)"/>
            <!-- ANILLO INTERIOR DEL IRIS -->
            <circle cx="100" cy="78" r="20"
              fill="none"
              stroke="#558B0E" stroke-width="0.8"
              opacity="0.5"/>
            <!-- PUPILA -->
            <circle class="pupil" cx="100" cy="78" r="11"
              fill="#0E1117"/>
            <!-- BRILLO PRINCIPAL -->
            <ellipse cx="93" cy="71" rx="4.5" ry="5.5"
              fill="white" opacity="0.95"/>
            <!-- BRILLO PEQUEÑO -->
            <circle cx="105" cy="82" r="2"
              fill="white" opacity="0.6"/>
            <!-- REFLEJO INFERIOR DEL OJO BLANCO -->
            <ellipse cx="100" cy="105" rx="20" ry="4"
              fill="rgba(0,0,0,0.06)"/>
          </g>

          <!-- SOMBRA EN EL SUELO -->
          <ellipse class="ground-shadow"
            cx="100" cy="128" rx="32" ry="4"
            fill="rgba(0,0,0,0.18)"/>
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
    .eye-float {
      position: fixed;
      z-index: 9999;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      animation: hover 3s ease-in-out infinite;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      will-change: transform;
    }
    .eye-float.dragging {
      cursor: grabbing;
      animation: none;
      transition: none;
      transform: scale(1.08);
      filter: drop-shadow(0 12px 24px rgba(124,58,237,0.6));
    }
    .eye-float:active { transform: scale(0.92); }
    .eye-float.talking { animation: hoverTalk 0.7s ease-in-out infinite; }
    .eye-float.dragging.talking { animation: none; }

    @keyframes hover {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes hoverTalk {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-4px) scale(1.04); }
    }

    /* ALAS — aleteo */
    .wing {
      transform-origin: 100px 80px;
      animation: flap 0.55s ease-in-out infinite;
    }
    .wing-left {
      transform-origin: 80px 78px;
    }
    .wing-right {
      transform-origin: 120px 78px;
      animation-delay: 0s;
    }
    @keyframes flap {
      0%, 100% { transform: scaleY(1) translateY(0); }
      50% { transform: scaleY(0.78) translateY(-2px); }
    }

    /* SOMBRA EN EL SUELO QUE OSCILA */
    .ground-shadow {
      transform-origin: 100px 128px;
      animation: shadowPulse 2.6s ease-in-out infinite;
    }
    @keyframes shadowPulse {
      0%, 100% { transform: scaleX(1); opacity: 0.18; }
      50% { transform: scaleX(0.78); opacity: 0.12; }
    }

    /* PARPADEO */
    .iris, .pupil {
      transform-origin: 100px 78px;
      animation: blink 6s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 92%, 100% { transform: scaleY(1); }
      94% { transform: scaleY(0.05); }
      96% { transform: scaleY(1); }
    }

    .eye-body {
      position: relative;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
    }

    /* PING */
    .ping {
      position: absolute;
      top: 28px; right: 8px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #06B6D4;
      border: 2px solid var(--color-bg, #0E1117);
      animation: ping 1.5s ease-in-out infinite;
    }
    @keyframes ping {
      0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.6); }
      50% { box-shadow: 0 0 0 7px rgba(6,182,212,0); }
    }

    /* BOCADILLO */
    .bubble {
      position: absolute;
      bottom: 56px; left: 8px;
      background: #1A1F2E;
      border: 1px solid rgba(132,204,22,0.45);
      border-radius: 14px 14px 14px 4px;
      padding: 12px 14px;
      width: 220px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5);
      animation: bubblePop 0.32s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes bubblePop {
      from { transform: scale(0.6) translateY(8px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .bubble-tip {
      font-family: 'Inter', sans-serif;
      font-size: 0.78rem; font-weight: 600;
      color: #F1F5F9; line-height: 1.45;
    }
    .bubble-tail {
      position: absolute; bottom: -7px; left: 16px;
      width: 14px; height: 8px;
      background: #1A1F2E;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      border-right: 1px solid rgba(132,204,22,0.45);
    }

    :host.hidden-route .eye-float { display: none; }
  `]
})
export class ArgusEyeComponent implements OnInit, OnDestroy {

  // INDICA SI EL OJO ES VISIBLE EN LA RUTA ACTUAL
  visible = true;
  // INDICA SI EL OJO ESTA MOSTRANDO UN BOCADILLO DE CONSEJO
  isTalking = false;
  // ESTADO MINIMIZADO (RESERVADO PARA FUTURO)
  isMinimized = false;
  // INDICA SI HAY CONSEJO SIN LEER (ENCIENDE EL PING CIAN)
  hasUnreadTip = true;
  // CONSEJO ACTUAL MOSTRADO EN EL BOCADILLO
  currentTip = '';

  // POSICIÓN ACTUAL DEL OJO EN PIXELES
  position = { x: 16, y: 100 };
  // ESTADO DE ARRASTRE
  isDragging = false;
  // CONTROL DE TAP VS DRAG (PARA NO DISPARAR BOCADILLO
  // AL SOLTAR TRAS UN ARRASTRE)
  private dragStartPos = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private moved = false;
  private readonly DRAG_THRESHOLD = 6; // PX MÍN PARA CONSIDERAR DRAG

  // TIMER PARA AUTOCERRAR EL BOCADILLO
  private tipTimer: any;
  // SUSCRIPCION A EVENTOS DE ROUTER PARA OCULTAR EN RUTAS DE AUTH
  private routerSub?: Subscription;

  // RUTAS EN LAS QUE EL OJO PERMANECE OCULTO
  private readonly hiddenRoutes = ['/onboarding', '/login', '/register'];

  // CATALOGO DE CONSEJOS DE CIBERSEGURIDAD QUE PUEDE OFRECER ARGUS
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

  // INYECCION DEL ROUTER PARA REACCIONAR A LOS CAMBIOS DE NAVEGACION
  constructor(private router: Router) {}

  // CIERRA EL BOCADILLO SI EL CLICK OCURRE FUERA DEL OJO
  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isTalking && !target.closest('.eye-float')) {
      this.isTalking = false;
    }
  }

  // SUSCRIPCION A NAVIGATION END PARA OCULTAR EL OJO EN RUTAS DE AUTH
  ngOnInit() {
    // CARGAR POSICIÓN GUARDADA EN localStorage
    const saved = localStorage.getItem('argos-eye-position');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        // VALIDAR QUE ESTÁ DENTRO DEL VIEWPORT ACTUAL
        this.position.x = Math.max(8, Math.min(window.innerWidth - 80, p.x));
        this.position.y = Math.max(60, Math.min(window.innerHeight - 100, p.y));
      } catch (e) { /* IGNORAR */ }
    } else {
      // POSICIÓN INICIAL POR DEFECTO ABAJO IZQUIERDA
      this.position.x = 16;
      this.position.y = window.innerHeight - 180;
    }

    // SUSCRIPCIÓN A NAVEGACIÓN
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        const hidden = this.hiddenRoutes.some(r => url.startsWith(r));
        this.visible = !hidden;
      });
  }

  // INICIO DEL ARRASTRE — POINTER DOWN
  onPointerDown(event: PointerEvent) {
    // PREVENIR SCROLL DURANTE ARRASTRE
    event.preventDefault();
    this.isDragging = true;
    this.moved = false;
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    // OFFSET DEL PUNTERO RESPECTO A LA ESQUINA SUPERIOR-IZQUIERDA DEL OJO
    this.dragOffset = {
      x: event.clientX - this.position.x,
      y: event.clientY - this.position.y
    };
    // CAPTURAR EL POINTER PARA QUE SIGA RECIBIENDO EVENTOS
    // INCLUSO SI EL CURSOR SALE DEL ELEMENTO
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  // MOVIMIENTO DURANTE EL ARRASTRE
  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    // CALCULAR DISTANCIA DESDE EL PUNTO INICIAL
    const dx = event.clientX - this.dragStartPos.x;
    const dy = event.clientY - this.dragStartPos.y;
    // SI SE HA MOVIDO MÁS DEL UMBRAL, MARCAR COMO ARRASTRE
    if (Math.sqrt(dx * dx + dy * dy) > this.DRAG_THRESHOLD) {
      this.moved = true;
    }
    // ACTUALIZAR POSICIÓN MANTENIENDO EL OJO DENTRO DEL VIEWPORT
    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;
    this.position.x = Math.max(8, Math.min(window.innerWidth - 80, newX));
    this.position.y = Math.max(60, Math.min(window.innerHeight - 100, newY));
  }

  // FIN DEL ARRASTRE — POINTER UP
  onPointerUp(event: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    // SI NO SE HA MOVIDO, ES UN TAP NORMAL → MOSTRAR TIP
    if (!this.moved) {
      this.onTap();
    } else {
      // GUARDAR LA NUEVA POSICIÓN EN localStorage
      localStorage.setItem('argos-eye-position',
        JSON.stringify(this.position));
    }
  }

  // FIX: SI EL USUARIO REDIMENSIONA LA VENTANA,
  // MANTENER EL OJO DENTRO DEL VIEWPORT
  @HostListener('window:resize')
  onResize() {
    this.position.x = Math.max(8, Math.min(window.innerWidth - 80, this.position.x));
    this.position.y = Math.max(60, Math.min(window.innerHeight - 100, this.position.y));
  }

  // ALTERNA EL BOCADILLO DE CONSEJO AL TOCAR EL OJO
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

  // LIMPIEZA DE TIMER Y SUSCRIPCION AL DESTRUIR EL COMPONENTE
  ngOnDestroy() {
    clearTimeout(this.tipTimer);
    this.routerSub?.unsubscribe();
  }
}
