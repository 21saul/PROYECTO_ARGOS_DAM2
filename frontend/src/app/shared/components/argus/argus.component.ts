// COMPONENTE STANDALONE QUE RENDERIZA LA MASCOTA ARGUS EN SVG
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
        class="argus-svg" [class.argus-idle]="mood === 'idle'"
        [class.argus-happy]="mood === 'happy'"
        [class.argus-alert]="mood === 'alert'">

        <!-- FILTRO GLOW PARA GEMAS — DEFINIDO PRIMERO PARA QUE EXISTA AL REFERENCIARLO -->
        <defs>
          <filter id="gemGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- CUERPO PRINCIPAL — TITAN CHIBI RECHONCHO -->
        <ellipse cx="60" cy="75" rx="32" ry="28" fill="var(--color-primary)"/>

        <!-- CABEZA -->
        <circle cx="60" cy="44" r="26" fill="var(--color-primary)"/>

        <!-- SOMBRA INTERNA CABEZA -->
        <circle cx="60" cy="48" r="24"
          fill="color-mix(in srgb, var(--color-primary) 85%, black)"/>

        <!-- OJO GRANDE — CARACTERISTICA PRINCIPAL DE ARGUS -->
        <ellipse cx="60" cy="44" rx="16" ry="13" fill="white"/>
        <!-- IRIS -->
        <circle cx="60" cy="44" r="9"
          fill="color-mix(in srgb, var(--color-secondary) 90%, black)"/>
        <!-- PUPILA -->
        <circle cx="60" cy="44" r="5" fill="#0F0F1A"/>
        <!-- BRILLO DEL OJO -->
        <circle cx="55" cy="39" r="3" fill="white" opacity="0.9"/>
        <circle cx="64" cy="47" r="1.5" fill="white" opacity="0.6"/>

        <!-- PARPADO SUPERIOR -->
        <path class="eyelid-top"
          d="M44 37 Q60 28 76 37" stroke="var(--color-primary)"
          stroke-width="4" stroke-linecap="round" fill="none"/>

        <!-- CEJAS DINAMICAS SEGUN ESTADO -->
        <path class="eyebrow" [attr.d]="eyebrowPath"
          stroke="color-mix(in srgb, var(--color-primary) 60%, black)"
          stroke-width="3.5" stroke-linecap="round" fill="none"/>

        <!-- MEJILLAS RUBORIZADAS -->
        <ellipse cx="42" cy="52" rx="7" ry="4"
          fill="var(--color-secondary)" opacity="0.35"/>
        <ellipse cx="78" cy="52" rx="7" ry="4"
          fill="var(--color-secondary)" opacity="0.35"/>

        <!-- BOCA DINAMICA SEGUN ESTADO -->
        <path class="mouth" [attr.d]="mouthPath"
          stroke="color-mix(in srgb, var(--color-primary) 50%, black)"
          stroke-width="2.5" stroke-linecap="round" fill="none"/>

        <!-- ARMADURA — PETO CON GEMAS -->
        <rect x="34" y="80" width="52" height="28"
          rx="12" fill="color-mix(in srgb, var(--color-primary) 70%, black)"/>
        <!-- GEMA CENTRAL CON GLOW -->
        <ellipse cx="60" cy="90" rx="6" ry="5"
          fill="var(--color-accent)"
          filter="url(#gemGlow)"/>
        <!-- GEMAS LATERALES -->
        <circle cx="44" cy="87" r="3.5"
          fill="var(--color-secondary)" opacity="0.9"/>
        <circle cx="76" cy="87" r="3.5"
          fill="var(--color-secondary)" opacity="0.9"/>

        <!-- BRAZO IZQUIERDO -->
        <ellipse cx="26" cy="82" rx="9" ry="14"
          fill="color-mix(in srgb, var(--color-primary) 80%, black)"
          transform="rotate(-15 26 82)"/>
        <!-- BRAZO DERECHO -->
        <ellipse cx="94" cy="82" rx="9" ry="14"
          fill="color-mix(in srgb, var(--color-primary) 80%, black)"
          transform="rotate(15 94 82)"/>

        <!-- PIERNA IZQUIERDA -->
        <ellipse cx="47" cy="110" rx="10" ry="8"
          fill="color-mix(in srgb, var(--color-primary) 65%, black)"/>
        <!-- PIERNA DERECHA -->
        <ellipse cx="73" cy="110" rx="10" ry="8"
          fill="color-mix(in srgb, var(--color-primary) 65%, black)"/>

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
    }
    /* ANIMACION IDLE — FLOTACION SUAVE */
    .argus-idle {
      animation: argusFloat 3s ease-in-out infinite;
    }
    @keyframes argusFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    /* ANIMACION HAPPY — SALTO */
    .argus-happy {
      animation: argusHappy 0.6s ease infinite;
    }
    @keyframes argusHappy {
      0%, 100% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.08) translateY(-8px); }
    }
    /* ANIMACION ALERT — VIBRACION */
    .argus-alert {
      animation: argusAlert 0.3s ease infinite;
    }
    @keyframes argusAlert {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-4deg); }
      75% { transform: rotate(4deg); }
    }
  `]
})
export class ArgusComponent {
  // TAMAÑO EN PIXELES DEL CUADRADO QUE OCUPA LA MASCOTA
  @Input() size = 80;
  // ESTADO DE ANIMO QUE CONTROLA ANIMACION Y EXPRESION
  @Input() mood: 'idle' | 'happy' | 'alert' = 'idle';

  // PATH DE LAS CEJAS SEGUN EL ESTADO DE ANIMO
  get eyebrowPath(): string {
    if (this.mood === 'happy')  return 'M46 33 Q60 27 74 33';
    if (this.mood === 'alert')  return 'M46 30 Q60 34 74 30';
    return 'M46 32 Q60 28 74 32';
  }

  // PATH DE LA BOCA SEGUN EL ESTADO DE ANIMO
  get mouthPath(): string {
    if (this.mood === 'happy')  return 'M51 56 Q60 63 69 56';
    if (this.mood === 'alert')  return 'M51 60 Q60 55 69 60';
    return 'M53 57 Q60 61 67 57';
  }
}
