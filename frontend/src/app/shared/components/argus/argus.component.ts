// COMPONENTE STANDALONE QUE RENDERIZA LA MASCOTA ARGUS EN SVG
// REDISENO COMO MASCARA DE FSOCIETY: SOMBRERO DE COPA, CARA PALIDA,
// BIGOTE ESTILO MONOPOLY MAN Y OJOS COMO HUECOS VACIOS.
import { Component, Input } from '@angular/core';
// MODULO COMUN DE ANGULAR PARA DIRECTIVAS BASICAS
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-argus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="argus-wrap" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 120 120"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        class="argus-svg"
        [class.argus-idle]="mood === 'idle'"
        [class.argus-happy]="mood === 'happy'"
        [class.argus-alert]="mood === 'alert'"
        aria-hidden="true">

        <!-- DEFINICIONES — GRADIENTES Y FILTROS -->
        <defs>
          <!-- GRADIENTE DE LA CARA — CREMA PALIDO TIPO PORCELANA -->
          <radialGradient id="maskFace" cx="40%" cy="30%" r="80%">
            <stop offset="0%"  stop-color="#FBF7E8"/>
            <stop offset="60%" stop-color="#F0E8D4"/>
            <stop offset="100%" stop-color="#D9CCAE"/>
          </radialGradient>
          <!-- GRADIENTE DEL SOMBRERO DE COPA — NEGRO PROFUNDO -->
          <linearGradient id="maskHat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#1A1F2E"/>
            <stop offset="100%" stop-color="#0A0D14"/>
          </linearGradient>
          <!-- BORDE DEL OJO HUECO — DA SENSACION DE PROFUNDIDAD -->
          <radialGradient id="maskEyeHole" cx="50%" cy="50%" r="55%">
            <stop offset="0%"  stop-color="#0E1117"/>
            <stop offset="80%" stop-color="#0E1117"/>
            <stop offset="100%" stop-color="#2A2A3A"/>
          </radialGradient>
          <!-- GLOW VIOLETA SUTIL — ACENTO DE MARCA EN LA CINTA DEL SOMBRERO -->
          <filter id="maskBandGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- SOMBRA EN EL SUELO BAJO LA MASCARA -->
        <ellipse class="floor-shadow" cx="60" cy="112" rx="32" ry="3.5"
                 fill="rgba(0,0,0,0.32)"/>

        <!-- ════════ SOMBRERO DE COPA ════════ -->
        <g class="hat">
          <!-- ALA DEL SOMBRERO — ELIPSE ANCHA -->
          <ellipse cx="60" cy="32" rx="40" ry="5" fill="url(#maskHat)"/>
          <!-- SOMBRA BAJO EL ALA -->
          <ellipse cx="60" cy="34" rx="38" ry="2"
                   fill="#000" opacity="0.3"/>
          <!-- CUERPO CILINDRICO DEL SOMBRERO -->
          <path d="M 41 30
                   L 43 8
                   Q 60 4 77 8
                   L 79 30 Z"
                fill="url(#maskHat)"/>
          <!-- TOP CURVADO DEL SOMBRERO -->
          <ellipse cx="60" cy="8" rx="17" ry="3" fill="#0A0D14"/>
          <!-- BRILLO LATERAL DEL CILINDRO -->
          <path d="M 46 12 L 47 28" stroke="#3A3A4A"
                stroke-width="1" stroke-linecap="round" opacity="0.5"/>
          <!-- CINTA DEL SOMBRERO — ACENTO VIOLETA ARGOS -->
          <path d="M 42 24
                   Q 60 22 78 24
                   L 78 28
                   Q 60 26 42 28 Z"
                fill="#7C3AED" filter="url(#maskBandGlow)"/>
          <!-- HEBILLA DE LA CINTA -->
          <rect class="band-buckle" x="57" y="23" width="6" height="6"
                rx="0.5" fill="#FBBF24"
                stroke="#D97706" stroke-width="0.6"/>
        </g>

        <!-- ════════ CARA / MASCARA ════════ -->
        <!-- OVALADO PRINCIPAL — CARA PALIDA -->
        <ellipse cx="60" cy="68" rx="33" ry="36" fill="url(#maskFace)"/>
        <!-- BORDE SUTIL DE LA MASCARA -->
        <ellipse cx="60" cy="68" rx="33" ry="36" fill="none"
                 stroke="#A89875" stroke-width="1.4" opacity="0.55"/>
        <!-- LINEA DE UNION DE LA MASCARA — VERTICAL CENTRAL -->
        <line x1="60" y1="36" x2="60" y2="102"
              stroke="#A89875" stroke-width="0.6"
              opacity="0.25" stroke-dasharray="2 3"/>

        <!-- ════════ CEJAS DINAMICAS — ANGULO SEGUN MOOD ════════ -->
        <path class="brow" [attr.d]="browLeftPath"
              stroke="#1A1F2E" stroke-width="3.2"
              stroke-linecap="round" fill="none"/>
        <path class="brow" [attr.d]="browRightPath"
              stroke="#1A1F2E" stroke-width="3.2"
              stroke-linecap="round" fill="none"/>

        <!-- ════════ OJOS — HUECOS VACIOS PROFUNDOS ════════ -->
        <!-- OJO IZQUIERDO -->
        <g class="eye eye-left">
          <ellipse cx="48" cy="58" rx="5.5" ry="7"
                   fill="url(#maskEyeHole)"/>
          <!-- DESTELLO MUY SUTIL EN EL BORDE — DA PROFUNDIDAD -->
          <ellipse cx="46" cy="55" rx="1.5" ry="2"
                   fill="#FBF7E8" opacity="0.18"/>
          <!-- PARPADO PARA PARPADEO — CIERRA HACIA ABAJO -->
          <rect class="lid lid-left" x="42.5" y="58"
                width="11" height="0" fill="url(#maskFace)"/>
        </g>
        <!-- OJO DERECHO -->
        <g class="eye eye-right">
          <ellipse cx="72" cy="58" rx="5.5" ry="7"
                   fill="url(#maskEyeHole)"/>
          <ellipse cx="70" cy="55" rx="1.5" ry="2"
                   fill="#FBF7E8" opacity="0.18"/>
          <rect class="lid lid-right" x="66.5" y="58"
                width="11" height="0" fill="url(#maskFace)"/>
        </g>

        <!-- ════════ NARIZ — TRIANGULO DE SOMBRA SUTIL ════════ -->
        <path d="M 60 70
                 L 56 78
                 Q 60 80 64 78 Z"
              fill="#A89875" opacity="0.45"/>
        <!-- LINEA INFERIOR DE LA NARIZ -->
        <path d="M 57 78 Q 60 80 63 78"
              stroke="#8B7C5D" stroke-width="0.6"
              fill="none" opacity="0.7"/>

        <!-- ════════ BIGOTE ESTILO MONOPOLY MAN ════════ -->
        <g class="moustache">
          <!-- FORMA PRINCIPAL — DOS LOBULOS QUE SUBEN EN LAS PUNTAS -->
          <path d="M 60 84
                   Q 50 80 40 82
                   Q 30 84 26 80
                   Q 32 88 42 88
                   Q 52 90 60 86
                   Q 68 90 78 88
                   Q 88 88 94 80
                   Q 90 84 80 82
                   Q 70 80 60 84 Z"
                fill="#1A1F2E"/>
          <!-- BRILLO INTERIOR DEL BIGOTE -->
          <path d="M 36 83 Q 50 85 60 85"
                stroke="#3A3A4A" stroke-width="0.6"
                fill="none" opacity="0.6"/>
          <path d="M 60 85 Q 70 85 84 83"
                stroke="#3A3A4A" stroke-width="0.6"
                fill="none" opacity="0.6"/>
          <!-- PUNTOS NEGROS EN LAS PUNTAS — ENRULADO -->
          <circle cx="27" cy="80" r="1.2" fill="#0A0D14"/>
          <circle cx="93" cy="80" r="1.2" fill="#0A0D14"/>
        </g>

        <!-- ════════ BOCA — LINEA CURVADA QUE CAMBIA SEGUN MOOD ════════ -->
        <path class="mouth" [attr.d]="mouthPath"
              stroke="#1A1F2E" stroke-width="1.8"
              stroke-linecap="round" fill="none"/>

        <!-- ════════ BARBILLA — SOMBRA SUTIL INFERIOR ════════ -->
        <path d="M 50 98 Q 60 102 70 98"
              stroke="#A89875" stroke-width="0.7"
              fill="none" opacity="0.5"/>

      </svg>
    </div>
  `,
  styles: [`
    .argus-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .argus-svg {
      transition: transform 0.3s ease;
      will-change: transform;
      overflow: visible;
    }

    /* SOMBRA EN EL SUELO — OSCILACION SUTIL */
    .floor-shadow {
      transform-origin: 60px 112px;
      animation: floorBreath 3s ease-in-out infinite;
    }
    @keyframes floorBreath {
      0%, 100% { transform: scaleX(1);   opacity: 0.32; }
      50%      { transform: scaleX(0.8); opacity: 0.2; }
    }

    /* ════════ IDLE — CABECEO + PARPADEO OCASIONAL ════════ */
    .argus-idle {
      animation: argusBob 3.2s ease-in-out infinite;
      transform-origin: 60px 100px;
    }
    @keyframes argusBob {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-4px) rotate(-1.5deg); }
    }
    /* PARPADEO — LOS PARPADOS BAJAN CUBRIENDO LOS HUECOS DE OJO */
    .argus-idle .lid {
      animation: maskBlink 5s ease-in-out infinite;
    }
    @keyframes maskBlink {
      0%, 92%, 100% { height: 0;  y: 58; }
      94%           { height: 14; y: 51; }
      96%           { height: 0;  y: 58; }
    }
    /* SOMBRERO MICRO-MOVIMIENTO */
    .argus-idle .hat {
      transform-origin: 60px 32px;
      animation: hatIdle 3.2s ease-in-out infinite;
    }
    @keyframes hatIdle {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(-1deg) translateY(-1px); }
    }
    /* HEBILLA — BRILLO PERIODICO PARA DAR VIDA */
    .band-buckle {
      animation: buckleGlint 4s ease-in-out infinite;
    }
    @keyframes buckleGlint {
      0%, 90%, 100% { fill: #FBBF24; }
      94%           { fill: #FFF6BF; }
    }

    /* ════════ HAPPY — LEVANTAR EL SOMBRERO (TIP HAT) ════════ */
    .argus-happy {
      animation: argusHappyHop 1.4s ease-in-out infinite;
      transform-origin: 60px 100px;
    }
    @keyframes argusHappyHop {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-5px); }
    }
    .argus-happy .hat {
      transform-origin: 60px 34px;
      animation: tipHat 1.4s ease-in-out infinite;
    }
    @keyframes tipHat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      40%      { transform: translateY(-10px) rotate(-12deg); }
      80%      { transform: translateY(-2px) rotate(-4deg); }
    }
    .argus-happy .moustache {
      transform-origin: 60px 84px;
      animation: moustacheTwirl 1.4s ease-in-out infinite;
    }
    @keyframes moustacheTwirl {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(-2deg) scale(1.04); }
    }

    /* ════════ ALERT — VIBRACION + PARPADEO RAPIDO + SOMBRERO TEMBLOROSO ════════ */
    .argus-alert {
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
    .argus-alert .lid {
      animation: maskBlinkFast 0.5s ease-in-out infinite;
    }
    @keyframes maskBlinkFast {
      0%, 100% { height: 0;  y: 58; }
      50%      { height: 12; y: 52; }
    }
    .argus-alert .hat {
      transform-origin: 60px 32px;
      animation: hatShake 0.32s ease-in-out infinite;
    }
    @keyframes hatShake {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(2deg); }
    }

    /* RESPETO DE PREFERENCIA DE MOTION REDUCIDA */
    @media (prefers-reduced-motion: reduce) {
      .argus-idle, .argus-happy, .argus-alert,
      .hat, .moustache, .lid, .floor-shadow, .band-buckle {
        animation: none;
      }
    }
  `]
})
export class ArgusComponent {
  // TAMANO EN PIXELES DEL CUADRADO QUE OCUPA LA MASCARA
  @Input() size = 80;
  // ESTADO DE ANIMO QUE CONTROLA ANIMACION Y EXPRESION DE LA MASCARA
  @Input() mood: 'idle' | 'happy' | 'alert' = 'idle';

  // CEJA IZQUIERDA — ANGULO SEGUN MOOD
  // HAPPY: ARQUEADA ARRIBA. ALERT: DESCIENDE HACIA EL CENTRO. IDLE: NEUTRA.
  get browLeftPath(): string {
    if (this.mood === 'alert') return 'M 36 46 L 54 50';
    if (this.mood === 'happy') return 'M 36 46 Q 45 40 54 46';
    return 'M 36 46 Q 45 44 54 46';
  }
  // CEJA DERECHA — ESPEJO DE LA IZQUIERDA
  get browRightPath(): string {
    if (this.mood === 'alert') return 'M 84 46 L 66 50';
    if (this.mood === 'happy') return 'M 84 46 Q 75 40 66 46';
    return 'M 84 46 Q 75 44 66 46';
  }
  // BOCA INFERIOR DEBAJO DEL BIGOTE — CURVA SUTIL QUE CAMBIA SEGUN ANIMO
  get mouthPath(): string {
    if (this.mood === 'alert') return 'M 52 96 Q 60 92 68 96';
    if (this.mood === 'happy') return 'M 50 94 Q 60 102 70 94';
    return 'M 52 95 Q 60 97 68 95';
  }
}
