// COMPONENTE STANDALONE QUE RENDERIZA LA MASCOTA ARGUS EN SVG
// REDISENO INSPIRADO EN UN TITAN-CHIBI: PELO REVUELTO, OREJAS PUNTIAGUDAS,
// OJOS VERDES BRILLANTES Y DIENTES EXPUESTOS EN SONRISA GUARDIANA.
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

        <!-- DEFINICIONES — FILTROS Y GRADIENTES -->
        <defs>
          <!-- GLOW INTENSO PARA LOS OJOS BRILLANTES -->
          <filter id="argusEyeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- GRADIENTE DE PIEL — TONO MAS CLARO ARRIBA, SOMBRA ABAJO -->
          <linearGradient id="argusSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F2C9AC"/>
            <stop offset="100%" stop-color="#D49B7A"/>
          </linearGradient>
          <!-- GRADIENTE DE PELO — CASTANO OSCURO CON BRILLOS -->
          <linearGradient id="argusHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5C3A1F"/>
            <stop offset="60%" stop-color="#3D2412"/>
            <stop offset="100%" stop-color="#2A1810"/>
          </linearGradient>
        </defs>

        <!-- SOMBRA BASE EN EL SUELO BAJO LA MASCOTA -->
        <ellipse cx="60" cy="116" rx="22" ry="3" fill="rgba(0,0,0,0.25)"/>

        <!-- ════════ CUERPO ════════ -->
        <!-- PIERNAS — CHIBI RECHONCHAS Y FIRMES -->
        <ellipse cx="50" cy="106" rx="8" ry="9" fill="url(#argusSkin)"/>
        <ellipse cx="70" cy="106" rx="8" ry="9" fill="url(#argusSkin)"/>
        <!-- PIES -->
        <ellipse cx="49" cy="113" rx="7" ry="2.6" fill="#B8825F"/>
        <ellipse cx="71" cy="113" rx="7" ry="2.6" fill="#B8825F"/>

        <!-- TORSO MUSCULADO CHIBI -->
        <path d="M 43 78
                 Q 60 74 77 78
                 L 79 100
                 Q 60 104 41 100 Z"
              fill="url(#argusSkin)"/>
        <!-- SOMBREADO DE ABDOMINALES — LINEAS SUTILES -->
        <line x1="60" y1="80" x2="60" y2="100"
              stroke="#B8825F" stroke-width="0.8" opacity="0.55"/>
        <path d="M 52 84 Q 60 82 68 84" stroke="#B8825F"
              stroke-width="0.7" fill="none" opacity="0.45"/>
        <path d="M 51 91 Q 60 89 69 91" stroke="#B8825F"
              stroke-width="0.7" fill="none" opacity="0.45"/>
        <!-- CLAVICULAS -->
        <path d="M 46 79 Q 53 76 58 78" stroke="#B8825F"
              stroke-width="0.7" fill="none" opacity="0.55"/>
        <path d="M 74 79 Q 67 76 62 78" stroke="#B8825F"
              stroke-width="0.7" fill="none" opacity="0.55"/>

        <!-- BRAZO IZQUIERDO + PUNO -->
        <ellipse cx="34" cy="86" rx="6.5" ry="10"
                 fill="url(#argusSkin)" transform="rotate(-12 34 86)"/>
        <circle cx="30" cy="96" r="5.5" fill="url(#argusSkin)"/>
        <!-- NUDILLOS PUNO IZQUIERDO -->
        <path d="M 27 94 L 27 96 M 30 93 L 30 95 M 33 94 L 33 96"
              stroke="#B8825F" stroke-width="0.6" opacity="0.6"/>

        <!-- BRAZO DERECHO + PUNO -->
        <ellipse cx="86" cy="86" rx="6.5" ry="10"
                 fill="url(#argusSkin)" transform="rotate(12 86 86)"/>
        <circle cx="90" cy="96" r="5.5" fill="url(#argusSkin)"/>
        <!-- NUDILLOS PUNO DERECHO -->
        <path d="M 87 94 L 87 96 M 90 93 L 90 95 M 93 94 L 93 96"
              stroke="#B8825F" stroke-width="0.6" opacity="0.6"/>

        <!-- ════════ CABEZA Y CARA ════════ -->
        <!-- PELO TRASERO — SILUETA DETRAS DE LA CABEZA -->
        <path d="M 30 50
                 Q 24 18 60 16
                 Q 96 18 90 50
                 Q 92 64 84 68
                 L 36 68
                 Q 28 64 30 50 Z"
              fill="url(#argusHair)"/>

        <!-- CARA — OVALO DE PIEL VISIBLE -->
        <ellipse cx="60" cy="46" rx="22" ry="22" fill="url(#argusSkin)"/>

        <!-- OREJAS PUNTIAGUDAS A AMBOS LADOS -->
        <path d="M 38 46 L 30 50 L 36 56 Z" fill="url(#argusSkin)"/>
        <path d="M 82 46 L 90 50 L 84 56 Z" fill="url(#argusSkin)"/>
        <!-- SOMBRA INTERIOR OREJA -->
        <path d="M 36 50 L 33 52 L 36 55 Z" fill="#B8825F" opacity="0.6"/>
        <path d="M 84 50 L 87 52 L 84 55 Z" fill="#B8825F" opacity="0.6"/>

        <!-- MECHONES FRONTALES — FLECOS PUNTIAGUDOS SOBRE LA FRENTE -->
        <path d="M 32 30
                 L 36 46
                 L 40 32
                 L 45 48
                 L 50 34
                 L 55 46
                 L 60 30
                 L 65 46
                 L 70 34
                 L 75 48
                 L 80 32
                 L 84 46
                 L 88 30
                 Q 88 18 60 16
                 Q 32 18 32 30 Z"
              fill="url(#argusHair)"/>

        <!-- MECHONES LATERALES — CAEN POR LOS COSTADOS DE LA CARA -->
        <path d="M 32 38
                 Q 24 52 28 64
                 Q 33 70 38 64
                 L 40 50
                 Q 36 44 32 38 Z"
              fill="url(#argusHair)"/>
        <path d="M 88 38
                 Q 96 52 92 64
                 Q 87 70 82 64
                 L 80 50
                 Q 84 44 88 38 Z"
              fill="url(#argusHair)"/>

        <!-- MECHON SUPERIOR — ANTENA ICONICA -->
        <path d="M 56 18 L 58 8 L 62 14 L 64 8 L 66 18 Z"
              fill="url(#argusHair)"/>

        <!-- BRILLOS DE PELO — LINEAS CLARAS PARA TEXTURA -->
        <path d="M 40 26 L 44 38" stroke="#7A5230"
              stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
        <path d="M 54 24 L 56 36" stroke="#7A5230"
              stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
        <path d="M 66 24 L 64 36" stroke="#7A5230"
              stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
        <path d="M 78 26 L 76 38" stroke="#7A5230"
              stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>

        <!-- HUECOS DE OJOS — SOMBRA OSCURA DEBAJO DEL FLEQUILLO -->
        <ellipse class="eye-socket" cx="48" cy="44" rx="6" ry="3.5"
                 fill="#1A0E08"/>
        <ellipse class="eye-socket" cx="72" cy="44" rx="6" ry="3.5"
                 fill="#1A0E08"/>

        <!-- OJOS GLOWING VERDE — SLITS BRILLANTES SOBRE EL HUECO OSCURO -->
        <ellipse class="eye-glow" cx="48" cy="44" rx="4.2" ry="2.2"
                 fill="#10B981" filter="url(#argusEyeGlow)"/>
        <ellipse class="eye-glow" cx="72" cy="44" rx="4.2" ry="2.2"
                 fill="#10B981" filter="url(#argusEyeGlow)"/>
        <!-- PUNTO BLANCO BRILLANTE — DESTELLO INTERIOR -->
        <ellipse class="eye-hotspot" cx="48" cy="43.5" rx="1.8" ry="1.1"
                 fill="#E0FFE5"/>
        <ellipse class="eye-hotspot" cx="72" cy="43.5" rx="1.8" ry="1.1"
                 fill="#E0FFE5"/>

        <!-- CEJA / SOMBRA SUPERIOR DEL OJO — DA EXPRESION SEGUN MOOD -->
        <path class="brow" [attr.d]="browLeftPath" fill="#2A1810"/>
        <path class="brow" [attr.d]="browRightPath" fill="#2A1810"/>

        <!-- ════════ BOCA — DIENTES EXPUESTOS ════════ -->
        <!-- CAVIDAD ROJA OSCURA DE LA BOCA -->
        <path d="M 42 56
                 Q 60 54 78 56
                 L 76 68
                 Q 60 74 44 68 Z"
              fill="#3A0F0F"/>
        <!-- LENGUA INTERIOR -->
        <ellipse cx="60" cy="66" rx="7" ry="2.6" fill="#C8455F"/>
        <ellipse cx="60" cy="65" rx="5" ry="1.4" fill="#E36A82" opacity="0.7"/>
        <!-- DIENTES SUPERIORES — ZIGZAG DE COLMILLOS -->
        <path d="M 42 56
                 L 45 60 L 48 56 L 51 60 L 54 56 L 57 60 L 60 56
                 L 63 60 L 66 56 L 69 60 L 72 56 L 75 60 L 78 56
                 L 78 62 L 42 62 Z"
              fill="#F5EFE0" stroke="#C9B98A" stroke-width="0.4"/>
        <!-- DIENTES INFERIORES — ZIGZAG INVERSO -->
        <path d="M 44 68
                 L 47 64 L 50 68 L 53 64 L 56 68 L 59 64 L 62 68
                 L 65 64 L 68 68 L 71 64 L 74 68 L 76 64 L 76 68 Z"
              fill="#F5EFE0" stroke="#C9B98A" stroke-width="0.4"/>
        <!-- LABIO SUPERIOR — LINEA SUTIL ENCIMA -->
        <path d="M 41 56 Q 60 54 79 56" stroke="#B8825F"
              stroke-width="0.7" fill="none" opacity="0.6"/>

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
    }
    /* IDLE — FLOTACION SUAVE */
    .argus-idle {
      animation: argusFloat 3s ease-in-out infinite;
    }
    @keyframes argusFloat {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-6px); }
    }
    /* HAPPY — SALTO RITMICO */
    .argus-happy {
      animation: argusHappy 0.9s ease-in-out infinite;
    }
    @keyframes argusHappy {
      0%, 100% { transform: scale(1) translateY(0); }
      50%      { transform: scale(1.06) translateY(-8px); }
    }
    /* ALERT — VIBRACION INTENSA */
    .argus-alert {
      animation: argusAlert 0.35s ease-in-out infinite;
    }
    @keyframes argusAlert {
      0%, 100% { transform: rotate(0deg); }
      25%      { transform: rotate(-4deg); }
      75%      { transform: rotate(4deg); }
    }
    /* PULSO DEL GLOW DE LOS OJOS — MAS RAPIDO EN ALERT */
    .eye-glow {
      animation: eyePulse 2.4s ease-in-out infinite;
      transform-origin: center;
    }
    .argus-alert .eye-glow {
      animation: eyePulse 0.6s ease-in-out infinite;
    }
    @keyframes eyePulse {
      0%, 100% { opacity: 1;   transform: scale(1); }
      50%      { opacity: 0.7; transform: scale(0.85); }
    }
    /* RESPETO DE PREFERENCIA DE MOTION REDUCIDA */
    @media (prefers-reduced-motion: reduce) {
      .argus-idle, .argus-happy, .argus-alert, .eye-glow {
        animation: none;
      }
    }
  `]
})
export class ArgusComponent {
  // TAMANO EN PIXELES DEL CUADRADO QUE OCUPA LA MASCOTA
  @Input() size = 80;
  // ESTADO DE ANIMO QUE CONTROLA ANIMACION Y EXPRESION DE LAS CEJAS
  @Input() mood: 'idle' | 'happy' | 'alert' = 'idle';

  // SOMBRA / CEJA IZQUIERDA — ANGULO SEGUN EL ESTADO DE ANIMO
  // ALERT: BAJA HACIA EL CENTRO (RABIA). HAPPY: SUBE ARRIBA. IDLE: NEUTRA.
  get browLeftPath(): string {
    if (this.mood === 'alert') return 'M 40 38 L 56 44 L 54 42 L 40 40 Z';
    if (this.mood === 'happy') return 'M 40 40 Q 48 36 56 40 L 56 41 Q 48 38 40 41 Z';
    return 'M 40 40 L 56 40 L 56 42 L 40 42 Z';
  }
  // SOMBRA / CEJA DERECHA — ESPEJO DE LA IZQUIERDA
  get browRightPath(): string {
    if (this.mood === 'alert') return 'M 80 38 L 64 44 L 66 42 L 80 40 Z';
    if (this.mood === 'happy') return 'M 80 40 Q 72 36 64 40 L 64 41 Q 72 38 80 41 Z';
    return 'M 80 40 L 64 40 L 64 42 L 80 42 Z';
  }
}
