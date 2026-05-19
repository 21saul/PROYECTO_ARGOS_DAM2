// COMPONENTE STANDALONE DE RED DE PARTÍCULAS ANIMADA SOBRE CANVAS HTML5
import { Component, AfterViewInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
// MÓDULO COMÚN DE ANGULAR PARA DIRECTIVAS BÁSICAS EN PLANTILLAS
import { CommonModule } from '@angular/common';

// INTERFAZ INTERNA QUE DESCRIBE UNA PARTÍCULA EN MOVIMIENTO 2D
interface Particle {
  // POSICIÓN X EN PIXELES DENTRO DEL CANVAS
  x: number;
  // POSICIÓN Y EN PIXELES DENTRO DEL CANVAS
  y: number;
  // VELOCIDAD HORIZONTAL EN PIXELES POR FRAME
  vx: number;
  // VELOCIDAD VERTICAL EN PIXELES POR FRAME
  vy: number;
  // RADIO VISUAL DE LA PARTÍCULA
  radius: number;
}

@Component({
  // SELECTOR HTML PARA INSERTAR LA RED DE PARTÍCULAS
  selector: 'app-particle-network',
  // COMPONENTE STANDALONE — NO REQUIERE DECLARARSE EN UN MÓDULO
  standalone: true,
  // IMPORTACIÓN DE DIRECTIVAS BÁSICAS DE ANGULAR
  imports: [CommonModule],
  // PLANTILLA INLINE — UN ÚNICO CANVAS A PANTALLA COMPLETA DEL HOST
  template: `
    <canvas #particleCanvas class="particle-canvas"></canvas>
  `,
  // ESTILOS INLINE — POSICIONAMIENTO ABSOLUTO Y SIN CAPTURA DE EVENTOS DE PUNTERO
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .particle-canvas {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0.5;
    }
  `]
})
export class ParticleNetworkComponent implements AfterViewInit, OnDestroy {

  // REFERENCIA AL CANVAS NATIVO PARA OBTENER SU CONTEXTO 2D
  @ViewChild('particleCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // COLOR DE LAS PARTÍCULAS — PERSONALIZABLE DESDE EL PADRE
  @Input() particleColor = '#7C3AED';
  // COLOR DE LAS LÍNEAS QUE UNEN PARTÍCULAS CERCANAS
  @Input() lineColor = '#7C3AED';
  // NÚMERO TOTAL DE PARTÍCULAS — LIMITADO PARA NO COMPROMETER EL RENDIMIENTO
  @Input() particleCount = 40;
  // DISTANCIA MÁXIMA EN PIXELES PARA UNIR DOS PARTÍCULAS CON UNA LÍNEA
  @Input() maxDistance = 120;
  // VELOCIDAD BASE DEL MOVIMIENTO ALEATORIO
  @Input() speed = 0.4;

  // CONTEXTO 2D PARA DIBUJAR EN EL CANVAS
  private ctx!: CanvasRenderingContext2D;
  // ARRAY MUTABLE CON EL ESTADO DE TODAS LAS PARTÍCULAS EN VUELO
  private particles: Particle[] = [];
  // IDENTIFICADOR DEL FRAME ACTUAL PARA PODER CANCELARLO AL DESTRUIR
  private animationId = 0;
  // OBSERVER QUE REDIMENSIONA EL CANVAS CUANDO EL CONTENEDOR PADRE CAMBIA
  private resizeObserver?: ResizeObserver;
  // FLAG QUE INDICA SI YA SE LOGRO UN INIT CON TAMANO VALIDO (>0).
  // EVITA QUE PARTICLES QUEDEN ATRAPADAS EN (0,0) CUANDO EL PADRE AUN
  // NO HABIA TERMINADO EL LAYOUT EN EL PRIMER FRAME.
  private hasValidSizedInit = false;

  ngAfterViewInit() {
    // OBTENER REFERENCIA AL ELEMENTO CANVAS NATIVO
    const canvas = this.canvasRef.nativeElement;
    // OBTENER EL CONTEXTO 2D — ASUMIMOS DISPONIBILIDAD EN NAVEGADORES MODERNOS
    this.ctx = canvas.getContext('2d')!;

    // ESPERAR AL SIGUIENTE FRAME PARA QUE EL BROWSER HAYA HECHO LAYOUT
    // ANTES DE LEER clientWidth/clientHeight DEL PADRE. SIN ESTO LAS
    // PARTICULAS PUEDEN GENERARSE EN (0,0) Y APARECER "VACIO" AL INICIO.
    requestAnimationFrame(() => this.bootstrap());

    // AJUSTAR LA OPACIDAD DEL CANVAS SEGÚN EL TEMA ACTIVO PARA NO ROMPER LA LEGIBILIDAD
    this.adjustForTheme();
  }

  // ARRANCA EL CANVAS UNA VEZ EL LAYOUT ESTA ESTABLE
  private bootstrap() {
    const canvas = this.canvasRef.nativeElement;
    // AJUSTAR EL TAMAÑO DEL CANVAS A SU CONTENEDOR
    this.resize();
    // INICIALIZAR EL ARRAY DE PARTÍCULAS CON POSICIONES Y VELOCIDADES ALEATORIAS
    this.initParticles();
    // SI EL CANVAS YA TENIA TAMANO VALIDO, MARCAMOS EL INIT COMO DEFINITIVO
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      this.hasValidSizedInit = true;
    }
    // ARRANCAR EL BUCLE DE ANIMACIÓN
    this.animate();

    // OBSERVAR CAMBIOS DE TAMAÑO DEL CONTENEDOR PARA RECALCULAR EL CANVAS.
    // SI EL PRIMER INIT OCURRIO CON SIZE=0 (RARO PERO POSIBLE EN IONIC
    // CON PAGINAS QUE MONTAN OFFSCREEN), CUANDO RECUPERE TAMANO REAL
    // REINICIALIZAMOS LAS PARTICULAS PARA QUE NO QUEDEN ACUMULADAS EN (0,0).
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      if (!this.hasValidSizedInit
        && canvas.clientWidth > 0
        && canvas.clientHeight > 0) {
        this.initParticles();
        this.hasValidSizedInit = true;
      }
    });
    this.resizeObserver.observe(canvas.parentElement!);
  }

  // RECALCULA LAS DIMENSIONES INTERNAS DEL CANVAS RESPETANDO EL DEVICE PIXEL RATIO
  private resize() {
    // REFERENCIA AL CANVAS Y A SU PADRE PARA TOMAR MEDIDAS
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    // RATIO DE PIXELES DEL DISPOSITIVO PARA RENDER NÍTIDO EN PANTALLAS HIDPI
    const dpr = window.devicePixelRatio || 1;
    // FIJAR EL TAMAÑO INTERNO DEL CANVAS EN PIXELES REALES
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    // FIJAR EL TAMAÑO CSS DEL CANVAS EN PIXELES LÓGICOS
    canvas.style.width = parent.clientWidth + 'px';
    canvas.style.height = parent.clientHeight + 'px';
    // ESCALAR EL CONTEXTO PARA TRABAJAR EN COORDENADAS LÓGICAS
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  // GENERA EL CONJUNTO INICIAL DE PARTÍCULAS DENTRO DEL ÁREA VISIBLE
  private initParticles() {
    // DIMENSIONES LÓGICAS DEL CANVAS PARA POSICIONAR PARTÍCULAS
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // VACIAR EL ARRAY ANTES DE REPOBLAR
    this.particles = [];
    // CREAR TANTAS PARTÍCULAS COMO INDIQUE LA CONFIGURACIÓN
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        // POSICIÓN ALEATORIA DENTRO DEL CANVAS
        x: Math.random() * w,
        y: Math.random() * h,
        // VELOCIDAD ALEATORIA POSITIVA O NEGATIVA EN AMBOS EJES
        vx: (Math.random() - 0.5) * this.speed,
        vy: (Math.random() - 0.5) * this.speed,
        // RADIO ALEATORIO ENTRE 0.5 Y 2 PIXELES
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  }

  // BUCLE DE ANIMACIÓN — SE INVOCA UNA VEZ POR FRAME VÍA REQUESTANIMATIONFRAME
  private animate = () => {
    // DIMENSIONES LÓGICAS DEL CANVAS PARA REBOTES Y DIBUJO
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // LIMPIAR EL CANVAS ANTES DE REDIBUJAR EL FRAME
    this.ctx.clearRect(0, 0, w, h);

    // ACTUALIZAR Y DIBUJAR CADA PARTÍCULA INDIVIDUALMENTE
    for (const p of this.particles) {
      // AVANZAR LA POSICIÓN SEGÚN LA VELOCIDAD ACTUAL
      p.x += p.vx;
      p.y += p.vy;
      // INVERTIR LA VELOCIDAD AL CHOCAR CON UN BORDE PARA CONFINAR LA PARTÍCULA
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      // DIBUJAR LA PARTÍCULA COMO UN CÍRCULO RELLENO
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.particleColor;
      this.ctx.fill();
    }

    // DIBUJAR LÍNEAS ENTRE PARES DE PARTÍCULAS QUE ESTÉN A UNA DISTANCIA CORTA
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        // DIFERENCIAS POR EJE PARA CALCULAR LA DISTANCIA EUCLIDIANA
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // SOLO CONECTAR SI LA DISTANCIA ES MENOR AL UMBRAL CONFIGURADO
        if (dist < this.maxDistance) {
          // OPACIDAD INVERSA A LA DISTANCIA — CUANTO MÁS CERCA, MÁS OPACA LA LÍNEA
          const opacity = 1 - dist / this.maxDistance;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = this.hexToRgba(this.lineColor, opacity * 0.4);
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }

    // PROGRAMAR EL SIGUIENTE FRAME DE ANIMACIÓN
    this.animationId = requestAnimationFrame(this.animate);
  };

  // CONVIERTE UN COLOR HEXADECIMAL A NOTACIÓN RGBA APLICANDO LA OPACIDAD INDICADA
  private hexToRgba(hex: string, alpha: number): string {
    // ELIMINAR EL CARÁCTER # SI EXISTE PARA TRABAJAR CON LOS DÍGITOS PUROS
    const h = hex.replace('#', '');
    // CONVERTIR CADA CANAL DE HEX A DECIMAL
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    // DEVOLVER LA CADENA RGBA CONSUMIBLE POR EL CONTEXTO 2D
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // AJUSTA LA OPACIDAD DEL CANVAS EN MODO CLARO PARA NO AFECTAR A LA LEGIBILIDAD
  private adjustForTheme() {
    // DETECTAR FORZADO DE TEMA CLARO O PREFERENCIA DEL SISTEMA
    const isLight = document.body.classList.contains('force-light') ||
      (!document.body.classList.contains('force-dark') &&
       window.matchMedia('(prefers-color-scheme: light)').matches);
    // REDUCIR LA OPACIDAD DEL CANVAS EN MODO CLARO PARA ATENUAR EL EFECTO
    if (isLight) {
      const canvas = this.canvasRef.nativeElement;
      canvas.style.opacity = '0.25';
    }
  }

  ngOnDestroy() {
    // CANCELAR EL FRAME PENDIENTE PARA EVITAR FUGAS DE MEMORIA
    cancelAnimationFrame(this.animationId);
    // DESCONECTAR EL OBSERVER DE REDIMENSIONADO
    this.resizeObserver?.disconnect();
  }
}
