// COMPONENTE STANDALONE QUE RENDERIZA LA MASCOTA ARGUS EN SVG
// REDISENO ESTILO DUOLINGO: CRIATURA REDONDA AMIGABLE CON OJOS GRANDES,
// CRESTAS PUNTIAGUDAS Y SELLO DE OJO-ESCUDO EN EL PECHO (GUINO ARGUS).
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
          <!-- CUERPO PRINCIPAL — VIOLETA DEL PROYECTO -->
          <radialGradient id="argusBody" cx="35%" cy="30%" r="80%">
            <stop offset="0%"  stop-color="#A78BFA"/>
            <stop offset="55%" stop-color="#7C3AED"/>
            <stop offset="100%" stop-color="#5B21B6"/>
          </radialGradient>
          <!-- BARRIGA — CYAN MAS CLARO PARA CONTRASTE AMIGABLE -->
          <radialGradient id="argusBelly" cx="50%" cy="30%" r="80%">
            <stop offset="0%"  stop-color="#E0F7FF"/>
            <stop offset="100%" stop-color="#67E8F9"/>
          </radialGradient>
          <!-- IRIS — CYAN ACCENT DEL PROYECTO -->
          <radialGradient id="argusIris" cx="50%" cy="50%" r="60%">
            <stop offset="0%"  stop-color="#22D3EE"/>
            <stop offset="100%" stop-color="#0891B2"/>
          </radialGradient>
          <!-- ESCUDO PECTORAL — SELLO DE ARGUS -->
          <linearGradient id="argusShield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#4C1D95"/>
            <stop offset="100%" stop-color="#2E1065"/>
          </linearGradient>
          <!-- GLOW DEL OJO DEL PECHO -->
          <filter id="shieldEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- SOMBRA EN EL SUELO -->
        <ellipse class="floor-shadow" cx="60" cy="114" rx="28" ry="3.5"
                 fill="rgba(0,0,0,0.28)"/>

        <!-- ════════ PIES — AMBARINOS TIPO DUO ════════ -->
        <g class="feet">
          <ellipse cx="47" cy="108" rx="9" ry="5" fill="#FBBF24"/>
          <ellipse cx="73" cy="108" rx="9" ry="5" fill="#FBBF24"/>
          <!-- LINEAS DE DEDOS -->
          <path d="M 42 108 L 42 110 M 47 109 L 47 111 M 52 108 L 52 110"
                stroke="#D97706" stroke-width="0.9" stroke-linecap="round"/>
          <path d="M 68 108 L 68 110 M 73 109 L 73 111 M 78 108 L 78 110"
                stroke="#D97706" stroke-width="0.9" stroke-linecap="round"/>
        </g>

        <!-- ════════ ALAS / BRAZOS LATERALES ════════ -->
        <!-- ALA IZQUIERDA — SE AGITA EN HAPPY -->
        <g class="wing wing-left">
          <path d="M 24 60
                   Q 14 70 18 86
                   Q 26 84 30 76
                   Q 32 68 30 60 Z"
                fill="url(#argusBody)"/>
          <!-- PLUMAS / VENAS INTERIORES -->
          <path d="M 22 68 L 26 76 M 22 74 L 27 80"
                stroke="#5B21B6" stroke-width="0.9"
                stroke-linecap="round" opacity="0.5"/>
        </g>
        <!-- ALA DERECHA -->
        <g class="wing wing-right">
          <path d="M 96 60
                   Q 106 70 102 86
                   Q 94 84 90 76
                   Q 88 68 90 60 Z"
                fill="url(#argusBody)"/>
          <path d="M 98 68 L 94 76 M 98 74 L 93 80"
                stroke="#5B21B6" stroke-width="0.9"
                stroke-linecap="round" opacity="0.5"/>
        </g>

        <!-- ════════ CUERPO PRINCIPAL — OVALADO REDONDO ════════ -->
        <ellipse cx="60" cy="64" rx="36" ry="38" fill="url(#argusBody)"/>

        <!-- BARRIGA — PARCHE CYAN -->
        <ellipse cx="60" cy="74" rx="22" ry="22" fill="url(#argusBelly)"/>

        <!-- ════════ CRESTAS / OREJAS PUNTIAGUDAS ════════ -->
        <path class="tuft tuft-left"
              d="M 36 24 L 32 6 L 50 18 Z" fill="url(#argusBody)"/>
        <path class="tuft tuft-right"
              d="M 84 24 L 88 6 L 70 18 Z" fill="url(#argusBody)"/>
        <!-- TONO MAS OSCURO INTERIOR -->
        <path d="M 40 18 L 36 8 L 46 16 Z"
              fill="#5B21B6" opacity="0.4"/>
        <path d="M 80 18 L 84 8 L 74 16 Z"
              fill="#5B21B6" opacity="0.4"/>

        <!-- ════════ OJOS GRANDES TIPO DUO ════════ -->
        <!-- OJO IZQUIERDO -->
        <g class="eye eye-left">
          <ellipse cx="46" cy="44" rx="15" ry="16" fill="white"/>
          <ellipse cx="46" cy="44" rx="15" ry="16" fill="none"
                   stroke="#4C1D95" stroke-width="1" opacity="0.4"/>
          <!-- IRIS CYAN -->
          <circle class="iris iris-left" cx="46" cy="46" r="9.5"
                  fill="url(#argusIris)"/>
          <!-- PUPILA OSCURA -->
          <circle class="pupil" cx="46" cy="46" r="5.2" fill="#0E1117"/>
          <!-- DESTELLOS — DA VIDA AL OJO -->
          <ellipse cx="43" cy="42" rx="2.8" ry="3.2" fill="white"/>
          <circle cx="50" cy="50" r="1.2" fill="white" opacity="0.85"/>
          <!-- PARPADO PARA PARPADEO -->
          <ellipse class="lid lid-left" cx="46" cy="44" rx="15.5" ry="0"
                   fill="url(#argusBody)"/>
        </g>

        <!-- OJO DERECHO -->
        <g class="eye eye-right">
          <ellipse cx="74" cy="44" rx="15" ry="16" fill="white"/>
          <ellipse cx="74" cy="44" rx="15" ry="16" fill="none"
                   stroke="#4C1D95" stroke-width="1" opacity="0.4"/>
          <circle class="iris iris-right" cx="74" cy="46" r="9.5"
                  fill="url(#argusIris)"/>
          <circle class="pupil" cx="74" cy="46" r="5.2" fill="#0E1117"/>
          <ellipse cx="71" cy="42" rx="2.8" ry="3.2" fill="white"/>
          <circle cx="78" cy="50" r="1.2" fill="white" opacity="0.85"/>
          <ellipse class="lid lid-right" cx="74" cy="44" rx="15.5" ry="0"
                   fill="url(#argusBody)"/>
        </g>

        <!-- CEJAS DINAMICAS — SUBEN EN HAPPY, BAJAN AL CENTRO EN ALERT -->
        <path class="brow" [attr.d]="browLeftPath"
              stroke="#4C1D95" stroke-width="3.5"
              stroke-linecap="round" fill="none"/>
        <path class="brow" [attr.d]="browRightPath"
              stroke="#4C1D95" stroke-width="3.5"
              stroke-linecap="round" fill="none"/>

        <!-- MEJILLAS RUBORIZADAS — SUTIL ROSADO -->
        <ellipse cx="34" cy="56" rx="4.5" ry="2.8"
                 fill="#F472B6" opacity="0.35"/>
        <ellipse cx="86" cy="56" rx="4.5" ry="2.8"
                 fill="#F472B6" opacity="0.35"/>

        <!-- ════════ PICO TRIANGULAR AMBAR ════════ -->
        <path d="M 54 60 L 66 60 L 60 70 Z" fill="#FBBF24"/>
        <!-- LINEA DE SOMBRA EN EL PICO -->
        <path d="M 56 60 Q 60 64 64 60" stroke="#D97706"
              stroke-width="0.8" fill="none" opacity="0.7"/>
        <!-- BOCA INFERIOR — SUTIL SONRISA QUE CAMBIA CON MOOD -->
        <path class="mouth" [attr.d]="mouthPath" stroke="#4C1D95"
              stroke-width="1.6" stroke-linecap="round" fill="none"/>

        <!-- ════════ SELLO DE PECHO — ESCUDO + OJO ARGUS ════════ -->
        <g class="chest-seal">
          <!-- ESCUDO -->
          <path d="M 60 78
                   L 68 81 L 68 86
                   Q 68 92 60 95
                   Q 52 92 52 86
                   L 52 81 Z"
                fill="url(#argusShield)"
                stroke="#7C3AED" stroke-width="1" opacity="0.9"/>
          <!-- OJO INTERIOR DEL ESCUDO — SIGNATURE ARGUS -->
          <ellipse cx="60" cy="86" rx="4.5" ry="3" fill="#E0F7FF"
                   filter="url(#shieldEyeGlow)"/>
          <circle cx="60" cy="86" r="2" fill="#0E1117"/>
          <!-- BRILLO CYAN DEL OJO DEL ESCUDO -->
          <circle class="seal-glow" cx="60" cy="86" r="2"
                  fill="none" stroke="#22D3EE" stroke-width="0.6"
                  opacity="0.9"/>
        </g>

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
      transform-origin: 60px 114px;
      animation: floorShadow 3s ease-in-out infinite;
    }
    @keyframes floorShadow {
      0%, 100% { transform: scaleX(1); opacity: 0.28; }
      50%      { transform: scaleX(0.78); opacity: 0.18; }
    }

    /* ════════ MOOD: IDLE — RESPIRACION + PARPADEO + ALAS MOVIENDOSE ════════ */
    .argus-idle {
      animation: argusFloat 3s ease-in-out infinite;
      transform-origin: 60px 100px;
    }
    @keyframes argusFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-6px) scale(1.015); }
    }
    .argus-idle .wing-left  {
      transform-origin: 30px 70px;
      animation: wingIdleLeft 3s ease-in-out infinite;
    }
    .argus-idle .wing-right {
      transform-origin: 90px 70px;
      animation: wingIdleRight 3s ease-in-out infinite;
    }
    @keyframes wingIdleLeft {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(-6deg); }
    }
    @keyframes wingIdleRight {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(6deg); }
    }
    /* PARPADEO — LOS PARPADOS CIERRAN BRUSCAMENTE Y ABREN */
    .argus-idle .lid {
      animation: blink 4.5s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 92%, 100% { ry: 0; }
      94%           { ry: 16; }
      96%           { ry: 0; }
    }
    /* CRESTAS — MICRO WIGGLE */
    .argus-idle .tuft-left  {
      transform-origin: 40px 24px;
      animation: tuftWiggle 4s ease-in-out infinite;
    }
    .argus-idle .tuft-right {
      transform-origin: 80px 24px;
      animation: tuftWiggleR 4s ease-in-out infinite;
    }
    @keyframes tuftWiggle {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(-4deg); }
    }
    @keyframes tuftWiggleR {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(4deg); }
    }
    /* IRIS — LIGERA MIRADA QUE PASEA -- DA SENSACION DE ESTAR VIVO */
    .argus-idle .iris-left,
    .argus-idle .pupil {
      animation: lookAround 6s ease-in-out infinite;
    }
    @keyframes lookAround {
      0%, 30%, 100% { transform: translateX(0); }
      45%, 60%      { transform: translateX(1.5px); }
      75%, 85%      { transform: translateX(-1.5px); }
    }

    /* ════════ MOOD: HAPPY — SALTO + ALETEO + OJOS ENTORNADOS ════════ */
    .argus-happy {
      animation: argusJump 0.9s ease-in-out infinite;
      transform-origin: 60px 100px;
    }
    @keyframes argusJump {
      0%, 100% { transform: translateY(0) scale(1, 1); }
      30%      { transform: translateY(-2px) scale(1.06, 0.94); }
      60%      { transform: translateY(-12px) scale(0.97, 1.05); }
      80%      { transform: translateY(-3px) scale(1.03, 0.97); }
    }
    .argus-happy .wing-left  {
      transform-origin: 30px 70px;
      animation: wingFlap 0.45s ease-in-out infinite;
    }
    .argus-happy .wing-right {
      transform-origin: 90px 70px;
      animation: wingFlapR 0.45s ease-in-out infinite;
    }
    @keyframes wingFlap {
      0%, 100% { transform: rotate(-6deg); }
      50%      { transform: rotate(-26deg); }
    }
    @keyframes wingFlapR {
      0%, 100% { transform: rotate(6deg); }
      50%      { transform: rotate(26deg); }
    }
    .argus-happy .seal-glow {
      animation: sealPulse 1.2s ease-in-out infinite;
      transform-origin: 60px 86px;
    }
    @keyframes sealPulse {
      0%, 100% { transform: scale(1);   opacity: 0.9; }
      50%      { transform: scale(1.8); opacity: 0; }
    }

    /* ════════ MOOD: ALERT — VIBRACION + OJOS ABIERTOS + IRIS ENCOGIDO ════════ */
    .argus-alert {
      animation: argusShake 0.32s ease-in-out infinite;
      transform-origin: 60px 60px;
    }
    @keyframes argusShake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25%      { transform: translateX(-2px) rotate(-3deg); }
      75%      { transform: translateX(2px)  rotate(3deg); }
    }
    .argus-alert .iris-left,
    .argus-alert .iris-right {
      transform-origin: center;
      transform: scale(0.7);
      transform-box: fill-box;
    }
    .argus-alert .pupil {
      transform-origin: center;
      transform: scale(0.6);
      transform-box: fill-box;
    }
    .argus-alert .seal-glow {
      stroke: #EF4444;
      animation: sealAlert 0.5s ease-in-out infinite;
      transform-origin: 60px 86px;
    }
    @keyframes sealAlert {
      0%, 100% { transform: scale(1);   opacity: 1; }
      50%      { transform: scale(1.6); opacity: 0; }
    }

    /* RESPETO DE PREFERENCIA DE MOTION REDUCIDA */
    @media (prefers-reduced-motion: reduce) {
      .argus-idle, .argus-happy, .argus-alert,
      .wing-left, .wing-right, .lid, .tuft-left, .tuft-right,
      .iris-left, .pupil, .seal-glow, .floor-shadow {
        animation: none;
      }
    }
  `]
})
export class ArgusComponent {
  // TAMANO EN PIXELES DEL CUADRADO QUE OCUPA LA MASCOTA
  @Input() size = 80;
  // ESTADO DE ANIMO QUE CONTROLA ANIMACION Y EXPRESION DE LA CARA
  @Input() mood: 'idle' | 'happy' | 'alert' = 'idle';

  // CEJA IZQUIERDA — CURVA SEGUN MOOD
  // ALERT: ANGULO HACIA EL CENTRO (PREOCUPACION). HAPPY: ARCO ALEGRE.
  get browLeftPath(): string {
    if (this.mood === 'alert') return 'M 36 32 Q 46 36 56 30';
    if (this.mood === 'happy') return 'M 36 30 Q 46 22 56 30';
    return 'M 36 28 Q 46 26 56 28';
  }
  // CEJA DERECHA — ESPEJO DE LA IZQUIERDA
  get browRightPath(): string {
    if (this.mood === 'alert') return 'M 84 32 Q 74 36 64 30';
    if (this.mood === 'happy') return 'M 84 30 Q 74 22 64 30';
    return 'M 84 28 Q 74 26 64 28';
  }
  // BOCA — LINEA INFERIOR DEL PICO QUE CAMBIA SEGUN ANIMO
  get mouthPath(): string {
    if (this.mood === 'alert') return 'M 55 73 Q 60 71 65 73';
    if (this.mood === 'happy') return 'M 53 72 Q 60 78 67 72';
    return 'M 55 73 Q 60 74 65 73';
  }
}
