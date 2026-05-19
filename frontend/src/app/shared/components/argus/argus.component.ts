// MASCOTA OFICIAL DE ARGOS — TITAN GUARDIAN CHIBI MULTI-OJO
// REFERENCIA MITICA: ARGOS PANOPTES, EL TITAN DE LOS CIEN OJOS QUE NUNCA DUERME.
// SILUETA HOODED CON 6 OJOS DISTRIBUIDOS (2 PRINCIPALES + 1 FOREHEAD +
// 2 PAULDRONS + 1 SIGIL DE PECHO). DUAL-THEME VIA CSS VARIABLES.
// API RETROCOMPATIBLE: SIZE + MOOD ('idle' | 'happy' | 'alert' SIGUEN VIVOS).
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// MOODS SOPORTADOS — 8 ESTADOS + ALIAS 'alert' PARA RETROCOMPATIBILIDAD
export type ArgusMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'loading'
  | 'success'
  | 'error'
  | 'sleeping'
  | 'excited'
  | 'alert';

@Component({
  selector: 'app-argus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="argus-wrap"
         [class.theme-light]="theme === 'light'"
         [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 120 120"
           fill="none" xmlns="http://www.w3.org/2000/svg"
           class="argus-svg"
           [attr.data-mood]="effectiveMood"
           aria-hidden="true">

        <!-- DEFINICIONES — GRADIENTES Y FILTROS PARAMETRIZADOS POR CSS VARS.
             LOS id SON UNICOS POR INSTANCIA (uid) PORQUE url(#id) RESUELVE
             A NIVEL DE DOCUMENTO: VARIAS MASCOTAS A LA VEZ (IONIC MANTIENE
             PAGINAS EN EL DOM) COLISIONABAN Y EL RELLENO SE RESOLVIA A UN
             <defs> DE UNA PAGINA OCULTA/DESTRUIDA → MASCOTA INVISIBLE. -->
        <defs>
          <!-- CUERPO Y MANTO — DEGRADADO DE TONO PRINCIPAL -->
          <radialGradient [attr.id]="'bodyGrad-' + uid" cx="50%" cy="40%" r="80%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-body-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-body-2)'"/>
          </radialGradient>
          <!-- HOOD / CAPUCHA — TONO MAS PROFUNDO QUE EL CUERPO -->
          <linearGradient [attr.id]="'hoodGrad-' + uid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-hood-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-hood-2)'"/>
          </linearGradient>
          <!-- CARA / PIEL — TONO INTERMEDIO LUMINOSO -->
          <radialGradient [attr.id]="'faceGrad-' + uid" cx="50%" cy="40%" r="70%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-face-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-face-2)'"/>
          </radialGradient>
          <!-- IRIS — DEGRADADO INTERNO DEL OJO QUE EMITE LUZ -->
          <radialGradient [attr.id]="'irisGrad-' + uid" cx="50%" cy="40%" r="60%">
            <stop offset="0%"  [attr.stop-color]="'var(--mascot-iris-1)'"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-iris-2)'"/>
          </radialGradient>
          <!-- GLOW BIO-LUMINISCENTE DE LOS OJOS — FILTRO COMPARTIDO -->
          <filter [attr.id]="'eyeBloom-' + uid" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- HALO SUTIL ALREDEDOR DEL HOOD — MISTICA DE TITAN -->
          <radialGradient [attr.id]="'halo-' + uid" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stop-color="transparent"/>
            <stop offset="100%" [attr.stop-color]="'var(--mascot-glow)'"
                  stop-opacity="0.18"/>
          </radialGradient>
        </defs>

        <!-- HALO DETRAS DE LA CABEZA — DA SENSACION DE GUARDIAN -->
        <circle class="halo" cx="60" cy="48" r="44" [attr.fill]="halo"/>

        <!-- SOMBRA EN EL SUELO -->
        <ellipse class="floor-shadow" cx="60" cy="114" rx="34" ry="3.6"
                 [attr.fill]="'var(--mascot-floor)'"/>

        <!-- ═══════════ CUERPO / MANTO ═══════════ -->
        <g class="body">
          <!-- MANTO PRINCIPAL — FORMA REDONDEADA TIPO ORBE CON BORDES -->
          <path d="M 30 78
                   Q 60 72 90 78
                   L 96 104
                   Q 60 110 24 104 Z"
                [attr.fill]="bodyGrad"/>
          <!-- CINTURON / BANDA INFERIOR -->
          <path d="M 26 100 Q 60 106 94 100"
                [attr.stroke]="'var(--mascot-rim)'"
                stroke-width="1.2" fill="none" opacity="0.7"/>
          <!-- PAULDRON IZQUIERDO — HOMBRO REDONDEADO -->
          <ellipse cx="22" cy="80" rx="11" ry="10" [attr.fill]="bodyGrad"
                   [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                   opacity="0.95"/>
          <!-- PAULDRON DERECHO -->
          <ellipse cx="98" cy="80" rx="11" ry="10" [attr.fill]="bodyGrad"
                   [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                   opacity="0.95"/>
        </g>

        <!-- ═══════════ BRAZOS / MANITAS ═══════════ -->
        <g class="arms" [class.thinking]="effectiveMood === 'thinking'">
          <ellipse class="arm arm-left"  cx="16" cy="94" rx="6" ry="6"
                   [attr.fill]="bodyGrad"/>
          <ellipse class="arm arm-right" cx="104" cy="94" rx="6" ry="6"
                   [attr.fill]="bodyGrad"/>
        </g>

        <!-- ═══════════ HOOD / CAPUCHA QUE ENVUELVE LA CABEZA ═══════════ -->
        <path class="hood"
              d="M 26 50
                 Q 28 14 60 12
                 Q 92 14 94 50
                 L 90 60
                 Q 60 52 30 60 Z"
              [attr.fill]="hoodGrad"/>
        <!-- BORDE INFERIOR DEL HOOD -->
        <path d="M 30 58 Q 60 50 90 58"
              [attr.stroke]="'var(--mascot-rim)'"
              stroke-width="1" fill="none" opacity="0.65"/>

        <!-- ═══════════ CARA ═══════════ -->
        <ellipse class="face" cx="60" cy="52" rx="26" ry="26"
                 [attr.fill]="faceGrad"/>

        <!-- ═══════════ OJO FOREHEAD (TERCER OJO ORNAMENTAL EN HOOD) ═══════════ -->
        <g class="eye-secondary eye-forehead">
          <circle cx="60" cy="28" r="3.2"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle cx="60" cy="28" r="1.6"
                  [attr.fill]="'var(--mascot-pupil)'"/>
        </g>

        <!-- ═══════════ CEJAS (CAMBIAN POR MOOD) ═══════════ -->
        <path class="brow brow-left"  [attr.d]="browLeftPath"
              [attr.stroke]="'var(--mascot-line)'" stroke-width="2.4"
              stroke-linecap="round" fill="none"/>
        <path class="brow brow-right" [attr.d]="browRightPath"
              [attr.stroke]="'var(--mascot-line)'" stroke-width="2.4"
              stroke-linecap="round" fill="none"/>

        <!-- ═══════════ OJOS PRINCIPALES (ALMOND, GRANDES) ═══════════ -->
        <!-- OJO IZQUIERDO -->
        <g class="eye eye-main eye-left">
          <ellipse cx="46" cy="56" rx="7" ry="8.5"
                   [attr.fill]="'var(--mascot-eye-bg)'"/>
          <circle class="iris" [attr.cx]="46 + irisOffsetX"
                  [attr.cy]="56 + irisOffsetY" r="5"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle class="pupil" [attr.cx]="46 + irisOffsetX"
                  [attr.cy]="56 + irisOffsetY" r="2.6"
                  [attr.fill]="'var(--mascot-pupil)'"/>
          <circle class="shine" [attr.cx]="44 + irisOffsetX"
                  [attr.cy]="53 + irisOffsetY" r="1.6"
                  fill="#FFFFFF" opacity="0.95"/>
          <!-- PARPADO SUPERIOR — BAJA PARA PARPADEAR -->
          <rect class="lid" x="39" y="47" width="14" height="0"
                [attr.fill]="faceGrad"/>
        </g>
        <!-- OJO DERECHO (ESPEJO) -->
        <g class="eye eye-main eye-right">
          <ellipse cx="74" cy="56" rx="7" ry="8.5"
                   [attr.fill]="'var(--mascot-eye-bg)'"/>
          <circle class="iris" [attr.cx]="74 + irisOffsetX"
                  [attr.cy]="56 + irisOffsetY" r="5"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle class="pupil" [attr.cx]="74 + irisOffsetX"
                  [attr.cy]="56 + irisOffsetY" r="2.6"
                  [attr.fill]="'var(--mascot-pupil)'"/>
          <circle class="shine" [attr.cx]="72 + irisOffsetX"
                  [attr.cy]="53 + irisOffsetY" r="1.6"
                  fill="#FFFFFF" opacity="0.95"/>
          <rect class="lid" x="67" y="47" width="14" height="0"
                [attr.fill]="faceGrad"/>
        </g>

        <!-- ═══════════ BOCA EXPRESIVA ═══════════ -->
        <path class="mouth" [attr.d]="mouthPath"
              [attr.stroke]="'var(--mascot-line)'" stroke-width="1.7"
              stroke-linecap="round" fill="none"/>

        <!-- ═══════════ MEJILLAS ROSAS — APARECEN EN HAPPY/EXCITED ═══════════ -->
        <g class="cheeks">
          <circle cx="36" cy="66" r="2.2"
                  [attr.fill]="'var(--mascot-cheek)'" opacity="0"/>
          <circle cx="84" cy="66" r="2.2"
                  [attr.fill]="'var(--mascot-cheek)'" opacity="0"/>
        </g>

        <!-- ═══════════ OJOS PAULDRON (HOMBROS) ═══════════ -->
        <g class="eye-secondary eye-pauldron-left">
          <circle cx="22" cy="80" r="2.8"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle cx="22" cy="80" r="1.3"
                  [attr.fill]="'var(--mascot-pupil)'"/>
        </g>
        <g class="eye-secondary eye-pauldron-right">
          <circle cx="98" cy="80" r="2.8"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle cx="98" cy="80" r="1.3"
                  [attr.fill]="'var(--mascot-pupil)'"/>
        </g>

        <!-- ═══════════ SIGIL DE PECHO (OJO GUARDIAN GRANDE) ═══════════ -->
        <g class="eye-sigil">
          <!-- ANILLO EXTERIOR DEL SELLO -->
          <circle cx="60" cy="94" r="10.5" fill="none"
                  [attr.stroke]="'var(--mascot-rim)'" stroke-width="1.3"
                  opacity="0.75"/>
          <!-- ANILLO INTERIOR -->
          <circle cx="60" cy="94" r="7.5" fill="none"
                  [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.6"
                  opacity="0.5"/>
          <!-- ALMENDRA INTERIOR DEL OJO -->
          <ellipse cx="60" cy="94" rx="6.5" ry="4.5"
                   [attr.fill]="'var(--mascot-eye-bg)'"/>
          <circle class="sigil-iris" cx="60" cy="94" r="3.2"
                  [attr.fill]="irisGrad" [attr.filter]="eyeBloom"/>
          <circle class="sigil-pupil" cx="60" cy="94" r="1.6"
                  [attr.fill]="'var(--mascot-pupil)'"/>
          <!-- MARCAS RADIALES DE GRABADO (4 PUNTOS CARDINALES) -->
          <line x1="60" y1="80.5" x2="60" y2="82.5"
                [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                opacity="0.7"/>
          <line x1="60" y1="105.5" x2="60" y2="107.5"
                [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                opacity="0.7"/>
          <line x1="46.5" y1="94" x2="48.5" y2="94"
                [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                opacity="0.7"/>
          <line x1="71.5" y1="94" x2="73.5" y2="94"
                [attr.stroke]="'var(--mascot-rim)'" stroke-width="0.8"
                opacity="0.7"/>
        </g>

        <!-- ═══════════ Zzz DECORATIVO PARA SLEEPING ═══════════ -->
        <g class="zzz" *ngIf="effectiveMood === 'sleeping'">
          <text x="86" y="34" font-family="'Bricolage Grotesque', sans-serif"
                font-size="11" font-weight="700"
                [attr.fill]="'var(--mascot-line)'">Z</text>
          <text x="92" y="22" font-family="'Bricolage Grotesque', sans-serif"
                font-size="8" font-weight="700"
                [attr.fill]="'var(--mascot-line)'" opacity="0.7">z</text>
        </g>

        <!-- ═══════════ SPARKLES PARA SUCCESS / EXCITED ═══════════ -->
        <g class="sparkles"
           *ngIf="effectiveMood === 'success' || effectiveMood === 'excited'">
          <path d="M 18 22 l 1.5 -3 l 1.5 3 l 3 1.5 l -3 1.5 l -1.5 3 l -1.5 -3 l -3 -1.5 z"
                [attr.fill]="'var(--mascot-glow)'"/>
          <path d="M 100 36 l 1 -2 l 1 2 l 2 1 l -2 1 l -1 2 l -1 -2 l -2 -1 z"
                [attr.fill]="'var(--mascot-glow)'" opacity="0.85"/>
          <path d="M 14 70 l 1 -2 l 1 2 l 2 1 l -2 1 l -1 2 l -1 -2 l -2 -1 z"
                [attr.fill]="'var(--mascot-glow)'" opacity="0.7"/>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    /* ╔══════════════════════════════════════════════════════════╗
       ║ TOKENS DE LA MASCOTA — DUAL-THEME VIA CSS VARIABLES     ║
       ╚══════════════════════════════════════════════════════════╝ */

    /* HOST DEL COMPONENTE — FUERZA UN BLOQUE FLEX LIMPIO PARA EVITAR
       BASELINE GAPS DE INLINE Y QUE EL DROP-SHADOW QUEDE CLIPADO POR
       LA LINE-BOX DEL PADRE (CAUSA TIPICA DE "PARTE INVISIBLE PARTE NO"). */
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 0;
      /* AISLAMOS EL STACKING CONTEXT PARA QUE EL GLOW EXTERNO NO SE
         COMPONGA CON LOS FILTROS SVG INTERNOS (BUG DE COMPOSICION
         CSS-FILTER + SVG-FILTER QUE ROMPIA EL RENDER DEL HOOD/SIGIL). */
      isolation: isolate;
    }

    /* DARK MODE — COSMIC GUARDIAN (DEFECTO) */
    .argus-wrap {
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
      --mascot-cheek: #ec4899;
      --mascot-floor: rgba(0, 0, 0, 0.45);

      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /* NO MAS filter: drop-shadow AQUI — EL GLOW SE PINTA CON UN
         PSEUDO-ELEMENTO (::before) PARA NO PISAR LOS FILTROS SVG. */
    }

    /* GLOW EXTERNO COMO RADIAL-GRADIENT EN ::before — SIN CSS FILTER,
       SIN COMPOSICION CON FILTROS SVG, MISMO LOOK QUE EL ORIGINAL. */
    .argus-wrap::before {
      content: '';
      position: absolute;
      inset: -16% -16% -10% -16%;
      border-radius: 50%;
      background: radial-gradient(closest-side,
        color-mix(in srgb, var(--mascot-glow) 26%, transparent) 0%,
        color-mix(in srgb, var(--mascot-glow) 12%, transparent) 45%,
        transparent 75%);
      pointer-events: none;
      z-index: 0;
    }

    /* LIGHT MODE — FRIENDLY GUARDIAN */
    .argus-wrap.theme-light {
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
      --mascot-cheek: #ffb3a0;
      --mascot-floor: rgba(40, 80, 60, 0.22);
    }
    .argus-wrap.theme-light::before {
      background: radial-gradient(closest-side,
        color-mix(in srgb, var(--mascot-glow) 30%, transparent) 0%,
        color-mix(in srgb, var(--mascot-glow) 14%, transparent) 45%,
        transparent 75%);
    }

    /* SVG POR ENCIMA DEL GLOW (z-index: 1) Y SIN CLIP PARA QUE EL
       FLOOR-SHADOW Y EL HOP DEL HAPPY-MOOD NO SE CORTEN. */
    .argus-svg {
      position: relative;
      z-index: 1;
      display: block;
      transition: transform 0.3s ease;
      will-change: transform;
      overflow: visible;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ ANIMACIONES COMPARTIDAS — SOMBRA, HALO, RESPIRACION     ║
       ╚══════════════════════════════════════════════════════════╝ */

    .floor-shadow {
      transform-origin: 60px 114px;
      animation: floorBreath 3s ease-in-out infinite;
    }
    @keyframes floorBreath {
      0%, 100% { transform: scaleX(1);   opacity: 0.55; }
      50%      { transform: scaleX(0.82); opacity: 0.32; }
    }

    .halo {
      animation: haloPulse 4s ease-in-out infinite;
      transform-origin: 60px 48px;
    }
    @keyframes haloPulse {
      0%, 100% { opacity: 0.55; transform: scale(1); }
      50%      { opacity: 0.95; transform: scale(1.06); }
    }

    /* OJOS SECUNDARIOS — RESPIRACION DE GLOW EN ALTERNANCIA */
    .eye-forehead       { animation: eyePulse 3.2s ease-in-out infinite; }
    .eye-pauldron-left  { animation: eyePulse 3.2s ease-in-out infinite 0.5s; }
    .eye-pauldron-right { animation: eyePulse 3.2s ease-in-out infinite 1.1s; }
    @keyframes eyePulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.12); }
    }
    .eye-secondary {
      transform-origin: center;
      transform-box: fill-box;
    }
    /* FALLBACK PARA NAVEGADORES SIN transform-box: fill-box */
    .eye-forehead       { transform-origin: 60px 28px; }
    .eye-pauldron-left  { transform-origin: 22px 80px; }
    .eye-pauldron-right { transform-origin: 98px 80px; }

    /* SIGIL DE PECHO — PULSO PRINCIPAL DE LA MARCA */
    .eye-sigil {
      transform-origin: 60px 94px;
      animation: sigilBreathe 3.6s ease-in-out infinite;
    }
    @keyframes sigilBreathe {
      0%, 100% { opacity: 0.92; }
      50%      { opacity: 1; }
    }
    /* EL IRIS DEL SIGIL PULSA SOLO CON opacity — NO TOCAMOS LA PROPIEDAD
       filter PARA NO PISAR EL ATRIBUTO filter="url(#eyeBloom-uid)" DEL SVG
       (UNA REGLA filter EN CSS REEMPLAZARIA EL BLOOM, NO LO COMPONDRIA). */
    .sigil-iris {
      animation: sigilGlow 3.6s ease-in-out infinite;
    }
    @keyframes sigilGlow {
      0%, 100% { opacity: 0.88; }
      50%      { opacity: 1; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: IDLE — CABECEO + PARPADEO OCASIONAL              ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="idle"] {
      animation: argusBob 3.4s ease-in-out infinite;
      transform-origin: 60px 104px;
    }
    @keyframes argusBob {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-3px) rotate(-1deg); }
    }
    [data-mood="idle"] .lid {
      animation: blink 5s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 92%, 100% { height: 0;  y: 47; }
      94%           { height: 18; y: 47; }
      96%           { height: 0;  y: 47; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: HAPPY — REBOTE + OJOS ARCO + MEJILLAS            ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="happy"] {
      animation: argusHop 1.4s ease-in-out infinite;
      transform-origin: 60px 104px;
    }
    @keyframes argusHop {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-5px); }
    }
    [data-mood="happy"] .cheeks circle,
    [data-mood="excited"] .cheeks circle {
      opacity: 0.85;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: THINKING — LADEAR CABEZA + MIRADA ARRIBA-IZQ      ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="thinking"] {
      animation: argusTilt 4s ease-in-out infinite;
      transform-origin: 60px 60px;
    }
    @keyframes argusTilt {
      0%, 100% { transform: rotate(-3deg) translateY(0); }
      50%      { transform: rotate(-3deg) translateY(-2px); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: LOADING / SCANNING — SECUENCIA RADAR DE OJOS      ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="loading"] .eye-forehead,
    [data-mood="loading"] .eye-pauldron-left,
    [data-mood="loading"] .eye-pauldron-right,
    [data-mood="loading"] .eye-sigil {
      animation: radarSweep 1.6s ease-in-out infinite;
    }
    [data-mood="loading"] .eye-pauldron-left  { animation-delay: 0s; }
    [data-mood="loading"] .eye-forehead       { animation-delay: 0.4s; }
    [data-mood="loading"] .eye-pauldron-right { animation-delay: 0.8s; }
    [data-mood="loading"] .eye-sigil          { animation-delay: 1.2s; }
    @keyframes radarSweep {
      0%, 100% { opacity: 0.4; transform: scale(0.92); }
      30%      { opacity: 1;   transform: scale(1.18); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: SUCCESS — DESTELLO Y SPARKLES                     ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="success"] {
      animation: argusBurst 1.6s ease-out infinite;
      transform-origin: 60px 60px;
    }
    @keyframes argusBurst {
      0%, 100% { transform: scale(1); }
      30%      { transform: scale(1.06); }
    }
    .sparkles path {
      animation: sparkleTwinkle 1.4s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    .sparkles path:nth-child(2) { animation-delay: 0.3s; }
    .sparkles path:nth-child(3) { animation-delay: 0.7s; }
    @keyframes sparkleTwinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
      50%      { opacity: 1;   transform: scale(1.1) rotate(45deg); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: ERROR / ALERT — GLITCH SHAKE                      ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="error"],
    [data-mood="alert"] {
      animation: argusGlitch 0.32s steps(2, end) infinite;
      transform-origin: 60px 60px;
    }
    @keyframes argusGlitch {
      0%   { transform: translate(0, 0); }
      25%  { transform: translate(-2px, 1px); }
      50%  { transform: translate(2px, -1px); }
      75%  { transform: translate(-1px, 2px); }
      100% { transform: translate(0, 0); }
    }
    [data-mood="error"] .lid,
    [data-mood="alert"] .lid {
      animation: blinkFast 0.5s ease-in-out infinite;
    }
    @keyframes blinkFast {
      0%, 100% { height: 0;  y: 47; }
      50%      { height: 14; y: 47; }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: SLEEPING — CIERRA OJOS PRINCIPALES + Zzz          ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="sleeping"] {
      animation: argusSnore 4s ease-in-out infinite;
      transform-origin: 60px 104px;
    }
    @keyframes argusSnore {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-2px) rotate(1deg); }
    }
    [data-mood="sleeping"] .lid {
      height: 18 !important;
      y: 47 !important;
    }
    /* TODOS LOS OJOS SECUNDARIOS BAJAN OPACIDAD AL DORMIR */
    [data-mood="sleeping"] .eye-secondary,
    [data-mood="sleeping"] .eye-sigil {
      animation: none;
      opacity: 0.35;
    }
    .zzz text {
      animation: zzzFloat 2.2s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    .zzz text:nth-child(2) { animation-delay: 0.5s; }
    @keyframes zzzFloat {
      0%   { opacity: 0; transform: translate(0, 4px) scale(0.8); }
      40%  { opacity: 1; transform: translate(2px, -2px) scale(1); }
      100% { opacity: 0; transform: translate(6px, -8px) scale(1.05); }
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ MOOD: EXCITED — BOUNCE FUERTE + TODOS OJOS DESPIERTOS   ║
       ╚══════════════════════════════════════════════════════════╝ */
    [data-mood="excited"] {
      animation: argusJump 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
      transform-origin: 60px 104px;
    }
    @keyframes argusJump {
      0%, 100% { transform: translateY(0)   scale(1); }
      40%      { transform: translateY(-10px) scale(1.04); }
      70%      { transform: translateY(-2px) scale(0.96); }
    }
    [data-mood="excited"] .eye-secondary,
    [data-mood="excited"] .eye-sigil {
      animation-duration: 1.4s !important;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ THINKING — BRAZO IZQ A LA BARBILLA (SUTIL)              ║
       ╚══════════════════════════════════════════════════════════╝ */
    .arms.thinking .arm-left {
      transform: translate(20px, -22px);
      transition: transform 0.4s var(--ease-spring,
                  cubic-bezier(0.34, 1.56, 0.64, 1));
    }
    .arms .arm-left {
      transition: transform 0.4s ease;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║ ACCESIBILIDAD — RESPETO DE MOTION REDUCIDA              ║
       ╚══════════════════════════════════════════════════════════╝ */
    @media (prefers-reduced-motion: reduce) {
      .argus-svg, .floor-shadow, .halo,
      .eye-forehead, .eye-pauldron-left, .eye-pauldron-right,
      .eye-sigil, .sigil-iris, .lid, .arms, .arm-left,
      .sparkles path, .zzz text,
      [data-mood] {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class ArgusComponent {
  // CONTADOR GLOBAL PARA GENERAR IDs DE <defs> UNICOS POR INSTANCIA.
  // SIN ESTO, VARIAS MASCOTAS EN EL DOM (IONIC CACHEA PAGINAS) COMPARTEN
  // url(#bodyGrad) ETC Y EL RELLENO SE RESOLVIA A UN <defs> DE OTRA PAGINA
  // OCULTA O DESTRUIDA → LA MASCOTA APARECIA INVISIBLE INTERMITENTEMENTE.
  private static _seq = 0;
  readonly uid = `a${++ArgusComponent._seq}`;

  // REFERENCIAS url(#...) PARAMETRIZADAS CON EL uid DE ESTA INSTANCIA
  get bodyGrad(): string { return `url(#bodyGrad-${this.uid})`; }
  get hoodGrad(): string { return `url(#hoodGrad-${this.uid})`; }
  get faceGrad(): string { return `url(#faceGrad-${this.uid})`; }
  get irisGrad(): string { return `url(#irisGrad-${this.uid})`; }
  get halo(): string { return `url(#halo-${this.uid})`; }
  get eyeBloom(): string { return `url(#eyeBloom-${this.uid})`; }

  // TAMANO EN PIXELES DEL CUADRADO QUE OCUPA LA MASCOTA
  @Input() size = 80;
  // ESTADO DE ANIMO QUE CONTROLA ANIMACION Y EXPRESION
  @Input() mood: ArgusMood = 'idle';
  // VARIANTE DE TEMA — DARK COSMIC POR DEFECTO, LIGHT FRIENDLY OPCIONAL
  @Input() theme: 'dark' | 'light' = 'dark';

  // NORMALIZA EL MOOD (mantiene 'alert' como sinonimo visual de 'error')
  get effectiveMood(): ArgusMood {
    return this.mood;
  }

  // DESPLAZAMIENTO HORIZONTAL DEL IRIS — MIRADA SEGUN MOOD
  get irisOffsetX(): number {
    if (this.mood === 'thinking') return -1.4;
    if (this.mood === 'loading')  return 1.2;
    return 0;
  }
  // DESPLAZAMIENTO VERTICAL DEL IRIS
  get irisOffsetY(): number {
    if (this.mood === 'thinking') return -1.6;
    if (this.mood === 'happy')    return 0.6;
    if (this.mood === 'excited')  return -0.6;
    return 0;
  }

  // CEJA IZQUIERDA — ANGULO POR MOOD
  get browLeftPath(): string {
    switch (this.mood) {
      case 'error':
      case 'alert':    return 'M 34 44 L 52 50';   // CEÑO HACIA ABAJO
      case 'thinking': return 'M 34 46 L 52 42';   // SUBIDA INTERIOR (DUDA)
      case 'happy':    return 'M 34 46 Q 43 40 52 46';
      case 'excited':  return 'M 34 44 Q 43 38 52 44';
      case 'sleeping': return 'M 34 46 Q 43 47 52 46';
      case 'success':  return 'M 34 44 Q 43 38 52 44';
      default:         return 'M 34 46 Q 43 44 52 46';
    }
  }
  // CEJA DERECHA — ESPEJO
  get browRightPath(): string {
    switch (this.mood) {
      case 'error':
      case 'alert':    return 'M 86 44 L 68 50';
      case 'thinking': return 'M 86 46 L 68 42';
      case 'happy':    return 'M 86 46 Q 77 40 68 46';
      case 'excited':  return 'M 86 44 Q 77 38 68 44';
      case 'sleeping': return 'M 86 46 Q 77 47 68 46';
      case 'success':  return 'M 86 44 Q 77 38 68 44';
      default:         return 'M 86 46 Q 77 44 68 46';
    }
  }
  // BOCA — CURVATURA Y POSICION POR MOOD
  get mouthPath(): string {
    switch (this.mood) {
      case 'happy':    return 'M 52 72 Q 60 80 68 72';
      case 'excited':  return 'M 50 71 Q 60 82 70 71';
      case 'thinking': return 'M 55 75 Q 60 73 65 75';
      case 'loading':  return 'M 56 75 L 64 75';
      case 'success':  return 'M 52 72 Q 60 80 68 72';
      case 'error':
      case 'alert':    return 'M 52 78 Q 60 72 68 78';
      case 'sleeping': return 'M 55 75 Q 60 77 65 75';
      default:         return 'M 55 75 Q 60 76 65 75';
    }
  }
}
