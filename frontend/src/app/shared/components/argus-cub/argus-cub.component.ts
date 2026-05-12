// MASCOTA SECUNDARIA — "ARGUS CUB" — VARIANTE HERMANA DE ARGUS QUE
// APARECE EN LA PAGINA ROADMAP COMO UN GUARDIAN PEQUENO QUE DUERME
// ACURRUCADO ESPERANDO A QUE EL USUARIO AVANCE. COMPARTE EL SISTEMA
// DE TOKENS --mascot-* CON ARGUS Y EL OJO FLOTANTE PARA MANTENER UN
// UNIVERSO VISUAL COHERENTE (HOODED COSMIC GUARDIAN, IRIS CYAN, GLOW).
//
// MOOD SOPORTADOS:
//   - 'sleeping' (DEFAULT): OJO CERRADO + Zzz FLOTANTE + RESPIRACION
//   - 'wink'              : DESPERTAR PUNTUAL DE 1.4s CON UN OJO QUE
//                           SE ABRE Y VUELVE A CERRARSE (ONE-SHOT)
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// MOODS LIMITADOS — SOLO LOS QUE NECESITA EL ROADMAP, SIN HEREDAR
// LOS 8 DE ARGUS PORQUE EL CUB ES UN PERSONAJE DE SOPORTE.
export type ArgusCubMood = 'sleeping' | 'wink';

@Component({
  // SELECTOR USADO EN LA PAGINA ROADMAP PARA INSTANCIAR LA MASCOTA
  selector: 'app-argus-cub',
  // STANDALONE PARA PODER IMPORTARSE DESDE EL ROADMAP MODULE SIN FRICCION
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- WRAPPER QUE DEFINE LAS VARIABLES DE PALETA Y EL TAMANO -->
    <div class="cub-wrap"
         [class.theme-light]="theme === 'light'"
         [style.width.px]="size"
         [style.height.px]="size * 0.78">
      <!-- SVG DEL CUB EN VIEWBOX 0 0 120 94 (ANCHO > ALTO PORQUE ESTA TUMBADO) -->
      <svg [attr.width]="size" [attr.height]="size * 0.78"
           viewBox="0 0 120 94"
           fill="none" xmlns="http://www.w3.org/2000/svg"
           class="cub-svg"
           [attr.data-mood]="mood"
           aria-hidden="true">

        <!-- ═══════ DEFINICIONES DE GRADIENTES Y FILTROS ═══════ -->
        <defs>
          <!-- GRADIENTE DEL CUERPO ACURRUCADO -->
          <radialGradient id="cubBody" cx="50%" cy="35%" r="80%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-body-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-body-2)'"/>
          </radialGradient>
          <!-- GRADIENTE DE LA CAPUCHA ENCIMA DE LA CABEZA -->
          <linearGradient id="cubHood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-hood-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-hood-2)'"/>
          </linearGradient>
          <!-- GRADIENTE DE LA CARA -->
          <radialGradient id="cubFace" cx="50%" cy="40%" r="70%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-face-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-face-2)'"/>
          </radialGradient>
          <!-- GRADIENTE DEL IRIS — SOLO VISIBLE EN WINK -->
          <radialGradient id="cubIris" cx="50%" cy="40%" r="60%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-iris-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-iris-2)'"/>
          </radialGradient>
          <!-- FILTRO BLOOM PARA EL OJO ABIERTO -->
          <filter id="cubBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- HALO COSMICO ATMOSFERICO DETRAS DEL CUB -->
          <radialGradient id="cubHalo" cx="50%" cy="50%" r="55%">
            <stop offset="55%" stop-color="transparent"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-glow)'"
                  stop-opacity="0.20"/>
          </radialGradient>
        </defs>

        <!-- HALO ATMOSFERICO QUE PULSA DETRAS DEL CUERPO -->
        <ellipse class="cub-halo" cx="60" cy="56" rx="52" ry="34"
                 fill="url(#cubHalo)"/>

        <!-- SOMBRA DE SUELO LIGERAMENTE OVALADA -->
        <ellipse class="cub-floor" cx="60" cy="88" rx="40" ry="3"
                 [attr.fill]="'var(--mascot-floor)'"/>

        <!-- ═══════ CUERPO ACURRUCADO — FORMA DE GUARDIAN TUMBADO ═══════
             SILUETA DERIVADA DE UN OVOIDE INCLINADO, CON LA CABEZA
             LIGERAMENTE LEVANTADA HACIA LA DERECHA. MAS COMPACTO QUE
             ARGUS PORQUE ESTE PERSONAJE ES UN "CUB" DURMIENTE. -->
        <g class="cub-body-group">
          <!-- CUERPO PRINCIPAL: FORMA DE LAGRIMA TUMBADA -->
          <path d="M 18 72
                   Q 14 50 40 42
                   Q 64 30 86 38
                   Q 106 44 104 64
                   Q 102 82 78 84
                   Q 50 86 28 82
                   Q 18 80 18 72 Z"
                fill="url(#cubBody)"/>

          <!-- LOMO — LINEA SUTIL DE GRABADO -->
          <path d="M 28 60 Q 60 50 96 56"
                [attr.stroke]="'var(--mascot-rim)'"
                stroke-width="1" fill="none" opacity="0.55"/>

          <!-- COLA RIZADA EN LA PARTE TRASERA IZQUIERDA -->
          <path d="M 18 72 Q 8 70 10 60 Q 12 54 22 56"
                [attr.stroke]="'var(--mascot-rim)'"
                stroke-width="2" fill="none"
                stroke-linecap="round" opacity="0.85"/>
        </g>

        <!-- ═══════ OREJAS — DOS TUFTOS PUNTIAGUDOS SOBRE LA CAPUCHA ═══════
             SUMAN SILUETA "ANIMAL DURMIENTE" SIN ROMPER EL UNIVERSO
             COSMICO DE ARGUS. SE PINTAN ANTES DE LA CAPUCHA PARA QUE
             ESTA LOS CUBRA EN LA BASE Y SOLO ASOMEN POR ARRIBA. -->
        <g class="cub-ears">
          <!-- OREJA TRASERA — MAS PEQUENA Y LIGERAMENTE INCLINADA -->
          <path d="M 62 32 L 66 14 L 74 30 Z"
                fill="url(#cubHood)"
                [attr.stroke]="'var(--mascot-rim)'"
                stroke-width="0.6" opacity="0.95"/>
          <!-- OREJA DELANTERA — MAS GRANDE, DOMINA LA SILUETA -->
          <path d="M 80 30 L 86 10 L 94 32 Z"
                fill="url(#cubHood)"
                [attr.stroke]="'var(--mascot-rim)'"
                stroke-width="0.6" opacity="0.95"/>
          <!-- INTERIOR DE LA OREJA DELANTERA — UN POCO MAS CLARO -->
          <path d="M 82.5 28 L 86 16 L 91 30 Z"
                fill="url(#cubFace)" opacity="0.55"/>
        </g>

        <!-- ═══════ CAPUCHA SOBRE LA CABEZA (DERECHA) ═══════
             ENVUELVE LA "CARA" QUE VA EN LA ZONA SUPERIOR DERECHA. -->
        <path class="cub-hood"
              d="M 60 30
                 Q 76 24 92 36
                 Q 102 44 96 56
                 Q 86 50 70 52
                 Q 56 52 54 44 Z"
              fill="url(#cubHood)"/>

        <!-- BORDE INFERIOR DE LA CAPUCHA -->
        <path d="M 54 46 Q 72 52 96 50"
              [attr.stroke]="'var(--mascot-rim)'"
              stroke-width="0.8" fill="none" opacity="0.55"/>

        <!-- ═══════ CARA DEL CUB ═══════ -->
        <ellipse class="cub-face" cx="78" cy="50" rx="16" ry="13"
                 fill="url(#cubFace)"/>

        <!-- ═══════ JOYA FRONTAL (HERENCIA DEL "TERCER OJO" DE ARGUS) ═══════ -->
        <g class="cub-jewel">
          <circle cx="78" cy="36" r="2.4"
                  fill="url(#cubIris)" filter="url(#cubBloom)"/>
          <circle cx="78" cy="36" r="1.1"
                  [attr.fill]="'var(--mascot-pupil)'"/>
        </g>

        <!-- ═══════ OJO PRINCIPAL — CERRADO EN SLEEPING, ABIERTO EN WINK ═══════
             EL OJO ES UN ARCO SUAVE EN ESTADO 'sleeping' (LINEA CURVA
             COMO UNA SONRISA AL REVES), Y SE CONVIERTE EN UN OJO
             ALMENDRADO ABIERTO CUANDO 'wink' SE ACTIVA. -->
        <g class="cub-eye">
          <!-- OJO CERRADO — ARCO MAS PRONUNCIADO Y LEGIBLE EN TAMANOS PEQUENOS -->
          <path class="cub-eye-closed"
                d="M 69 50 Q 76 57.5 83 50"
                [attr.stroke]="'var(--mascot-line)'"
                stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <!-- PESTANAS — DOS LINEAS CORTAS BAJO EL OJO PARA REFORZAR LECTURA -->
          <path d="M 71 52.5 L 70 54"
                [attr.stroke]="'var(--mascot-line)'"
                stroke-width="1.4" stroke-linecap="round"
                opacity="0.75"/>
          <path d="M 81 52.5 L 82 54"
                [attr.stroke]="'var(--mascot-line)'"
                stroke-width="1.4" stroke-linecap="round"
                opacity="0.75"/>
          <!-- OJO ABIERTO — APARECE SOLO EN WINK -->
          <g class="cub-eye-open">
            <ellipse cx="76" cy="50" rx="5" ry="5.5"
                     [attr.fill]="'var(--mascot-eye-bg)'"/>
            <circle cx="76" cy="50" r="3.4"
                    fill="url(#cubIris)" filter="url(#cubBloom)"/>
            <circle cx="76" cy="50" r="1.7"
                    [attr.fill]="'var(--mascot-pupil)'"/>
            <circle cx="75" cy="48.5" r="1"
                    fill="#FFFFFF" opacity="0.92"/>
          </g>
        </g>

        <!-- ═══════ NARIZ / HOCICO PEQUEÑO ═══════ -->
        <circle cx="92" cy="54" r="1.5"
                [attr.fill]="'var(--mascot-line)'" opacity="0.7"/>

        <!-- ═══════ PATAS DELANTERAS (SUTILES, CRUZADAS) ═══════ -->
        <g class="cub-paws">
          <ellipse cx="52" cy="80" rx="6" ry="4"
                   fill="url(#cubBody)" opacity="0.95"/>
          <ellipse cx="66" cy="82" rx="6" ry="4"
                   fill="url(#cubBody)" opacity="0.95"/>
          <!-- DEDITOS — TRES PUNTOS PEQUEÑOS POR PATA -->
          <circle cx="50" cy="82" r="0.7"
                  [attr.fill]="'var(--mascot-rim)'" opacity="0.6"/>
          <circle cx="52" cy="82.5" r="0.7"
                  [attr.fill]="'var(--mascot-rim)'" opacity="0.6"/>
          <circle cx="54" cy="82" r="0.7"
                  [attr.fill]="'var(--mascot-rim)'" opacity="0.6"/>
        </g>

        <!-- ═══════ Zzz FLOTANTE — VISIBLE SOLO EN SLEEPING ═══════ -->
        <g class="cub-zzz" *ngIf="mood === 'sleeping'">
          <text x="38" y="26"
                font-family="'Bricolage Grotesque', sans-serif"
                font-size="11" font-weight="700"
                [attr.fill]="'var(--mascot-line)'">Z</text>
          <text x="46" y="14"
                font-family="'Bricolage Grotesque', sans-serif"
                font-size="8" font-weight="700"
                [attr.fill]="'var(--mascot-line)'" opacity="0.7">z</text>
          <text x="52" y="6"
                font-family="'Bricolage Grotesque', sans-serif"
                font-size="6" font-weight="700"
                [attr.fill]="'var(--mascot-line)'" opacity="0.5">z</text>
        </g>

        <!-- ═══════ DESTELLO DE "DESPERTAR" — VISIBLE EN WINK ═══════ -->
        <g class="cub-sparkle" *ngIf="mood === 'wink'">
          <path d="M 100 28 l 1.2 -2.6 l 1.2 2.6 l 2.6 1.2 l -2.6 1.2 l -1.2 2.6 l -1.2 -2.6 l -2.6 -1.2 z"
                [attr.fill]="'var(--mascot-glow)'"/>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    /* ╔══════════════════════════════════════════════════════════╗
       ║ TOKENS DE LA MASCOTA — REUTILIZA EL SISTEMA DE ARGUS    ║
       ║ PARA HEREDAR DUAL-THEME Y MANTENER COHERENCIA VISUAL    ║
       ╚══════════════════════════════════════════════════════════╝ */
    .cub-wrap {
      --mascot-body-1: #2d2a5e;
      --mascot-body-2: #1a1b3a;
      --mascot-hood-1: #1f1b4a;
      --mascot-hood-2: #0f0d2a;
      --mascot-face-1: #3a3670;
      --mascot-face-2: #2a2658;
      --mascot-eye-bg: #0a0817;
      --mascot-iris-1: #5dc8ff;
      --mascot-iris-2: #00d4ff;
      --mascot-pupil: #061018;
      --mascot-glow:  #00d4ff;
      --mascot-rim:   #7b5cd6;
      --mascot-line:  #c4b8ff;
      --mascot-floor: rgba(0, 0, 0, 0.45);

      display: inline-flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 6px 16px
              color-mix(in srgb, var(--mascot-glow) 18%, transparent));
    }
    .cub-wrap.theme-light {
      --mascot-body-1: #7dd87d;
      --mascot-body-2: #4dd0c8;
      --mascot-hood-1: #5dd8a8;
      --mascot-hood-2: #38b88a;
      --mascot-face-1: #f3fff6;
      --mascot-face-2: #c8eed4;
      --mascot-eye-bg: #1a3a2a;
      --mascot-iris-1: #8dd6ff;
      --mascot-iris-2: #5bb3ff;
      --mascot-pupil: #0a2030;
      --mascot-glow:  #5bb3ff;
      --mascot-rim:   #ff8c5a;
      --mascot-line:  #1f4a3a;
      --mascot-floor: rgba(40, 80, 60, 0.22);
    }

    .cub-svg {
      overflow: visible;
      transition: transform 0.3s ease;
      will-change: transform;
    }

    /* ═══════ HALO COSMICO — PULSO LENTO ═══════ */
    .cub-halo {
      transform-origin: 60px 56px;
      animation: cubHaloPulse 4.4s ease-in-out infinite;
    }
    @keyframes cubHaloPulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50%      { opacity: 0.95; transform: scale(1.06); }
    }

    /* ═══════ FLOOR SHADOW — RESPIRACION ═══════ */
    .cub-floor {
      transform-origin: 60px 88px;
      animation: cubFloorBreath 3.2s ease-in-out infinite;
    }
    @keyframes cubFloorBreath {
      0%, 100% { transform: scaleX(1);   opacity: 0.55; }
      50%      { transform: scaleX(0.84); opacity: 0.32; }
    }

    /* ═══════ CUERPO — RESPIRA LENTAMENTE COMO SI DURMIESE ═══════ */
    [data-mood="sleeping"] .cub-body-group,
    [data-mood="sleeping"] .cub-hood,
    [data-mood="sleeping"] .cub-face,
    [data-mood="sleeping"] .cub-paws,
    [data-mood="sleeping"] .cub-ears {
      animation: cubBreath 3.6s ease-in-out infinite;
      transform-origin: 60px 70px;
    }
    @keyframes cubBreath {
      0%, 100% { transform: translateY(0)     scale(1); }
      50%      { transform: translateY(-1.5px) scale(1.012); }
    }

    /* ═══════ JOYA FRONTAL — GLOW SUTIL ═══════ */
    .cub-jewel {
      transform-origin: 78px 36px;
      animation: cubJewelPulse 3s ease-in-out infinite;
    }
    @keyframes cubJewelPulse {
      0%, 100% { opacity: 0.75; transform: scale(1); }
      50%      { opacity: 1;    transform: scale(1.12); }
    }

    /* ═══════ OJO CERRADO POR DEFECTO ═══════ */
    .cub-eye-closed { opacity: 1; }
    .cub-eye-open   { opacity: 0; }

    /* ═══════ MOOD WINK — CAMBIO PUNTUAL DE CERRADO A ABIERTO ═══════
       LA ANIMACION DURA 1.4s Y SE DISPARA UNA SOLA VEZ; EL PADRE
       VUELVE A 'sleeping' DESPUES PARA RESETEAR EL ESTADO. */
    [data-mood="wink"] .cub-eye-closed {
      animation: cubLidOff 1.4s ease-in-out forwards;
    }
    [data-mood="wink"] .cub-eye-open {
      animation: cubLidOn 1.4s ease-in-out forwards;
    }
    @keyframes cubLidOff {
      0%, 100% { opacity: 1; }
      20%, 70% { opacity: 0; }
    }
    @keyframes cubLidOn {
      0%, 100% { opacity: 0; transform: scaleY(0.1); }
      20%, 70% { opacity: 1; transform: scaleY(1); }
    }
    .cub-eye-open {
      transform-origin: 76px 50px;
    }

    /* ═══════ WINK — BODY HOP SUTIL AL DESPERTAR ═══════ */
    [data-mood="wink"] .cub-body-group,
    [data-mood="wink"] .cub-hood,
    [data-mood="wink"] .cub-face,
    [data-mood="wink"] .cub-paws,
    [data-mood="wink"] .cub-ears {
      animation: cubWakeHop 1.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
      transform-origin: 60px 70px;
    }
    @keyframes cubWakeHop {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      30%      { transform: translateY(-4px) rotate(-2deg); }
      60%      { transform: translateY(-2px) rotate(1deg); }
    }

    /* ═══════ Zzz FLOTANTE — APARECE EN CASCADA ═══════ */
    .cub-zzz text {
      animation: cubZzzFloat 2.4s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    .cub-zzz text:nth-child(2) { animation-delay: 0.5s; }
    .cub-zzz text:nth-child(3) { animation-delay: 1s; }
    @keyframes cubZzzFloat {
      0%   { opacity: 0; transform: translate(0, 4px) scale(0.85); }
      40%  { opacity: 1; transform: translate(-2px, -2px) scale(1); }
      100% { opacity: 0; transform: translate(-6px, -8px) scale(1.05); }
    }

    /* ═══════ SPARKLE DE WINK ═══════ */
    .cub-sparkle path {
      transform-origin: center;
      transform-box: fill-box;
      animation: cubSparkle 1.4s ease-out forwards;
    }
    @keyframes cubSparkle {
      0%   { opacity: 0; transform: scale(0.4) rotate(0deg); }
      40%  { opacity: 1; transform: scale(1.2) rotate(45deg); }
      100% { opacity: 0; transform: scale(0.9) rotate(90deg); }
    }

    /* ═══════ ACCESIBILIDAD — RESPETO DE prefers-reduced-motion ═══════ */
    @media (prefers-reduced-motion: reduce) {
      .cub-svg, .cub-halo, .cub-floor, .cub-jewel,
      .cub-body-group, .cub-hood, .cub-face, .cub-paws, .cub-ears,
      .cub-zzz text, .cub-sparkle path,
      .cub-eye-closed, .cub-eye-open,
      [data-mood] {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class ArgusCubComponent {
  // TAMANO EN PIXELES DE ANCHO; LA ALTURA SE CALCULA EN 0.78 PARA
  // RESPETAR EL VIEWBOX 120x94 (RATIO TUMBADO) Y NO DEFORMAR EL DIBUJO.
  @Input() size = 64;
  // MOOD ACTUAL — POR DEFECTO 'sleeping'; EL PADRE LO CAMBIA A 'wink'
  // DE FORMA TRANSITORIA PARA DISPARAR EL ONE-SHOT DE DESPERTAR.
  @Input() mood: ArgusCubMood = 'sleeping';
  // VARIANTE DE TEMA — POR DEFECTO 'dark' COSMIC; 'light' EN MODO CLARO.
  @Input() theme: 'dark' | 'light' = 'dark';
}
