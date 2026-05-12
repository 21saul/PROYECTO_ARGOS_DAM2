// PAGINA ROADMAP — RECORRIDO GAMIFICADO ESTILO DUOLINGO
//
// RESUMEN: PRESENTA 5 ITINERARIOS DE CIBERSEGURIDAD COMO MAPAS
// SERPENTEANTES CON NODOS-CHIP 3D, BARRA HUD DE PROGRESO, MASCOTA
// CUB DURMIENTE Y FEEDBACK FESTIVO (CONFETI, RING DE PROGRESO,
// MORPHS, MEDALLAS) PARA REFORZAR LA SENSACION DE AVANCE.
//
// LOGICA DE NEGOCIO:
//   - LOS NODOS SE COLOCAN EN COLUMNA SERPENTEANTE Y SE UNEN POR UN
//     PATH SVG BEZIER CALCULADO TRAS LAYOUT DESDE getBoundingClientRect
//   - LA STATS BAR HACE COUNT-UP DESDE 0 AL CARGAR EL COMPONENTE
//   - LOS NODOS ACTIVOS LLEVAN UN ANILLO SVG DE PROGRESO (0-100%)
//   - LOS NODOS LOCKED HACEN SHAKE + TOAST INLINE AL TOCARLOS
//   - LA MASCOTA CUB ADYACENTE A UN NODO ACTIVO HACE WINK CUANDO EL
//     USUARIO TOCA ESE NODO (RESPUESTA AL AVANCE)
//
// RELACIONES:
//   - ArgusCubComponent (MASCOTA DURMIENTE EN ESCENAS CADA 5 NODOS)
//   - gsap + ScrollTrigger (ANIMACIONES + REVEAL DEL PATH SVG)
//   - canvas-confetti (CELEBRACIONES AL ACTIVAR NODO O ABRIR COFRE)
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
// IMPORT NUCLEO GSAP PARA TODAS LAS ANIMACIONES DE LA PAGINA
import { gsap } from 'gsap';
// SCROLLTRIGGER PARA REVELAR PARTICULAS DE FONDO Y FILAS DE NODOS
// AL ENTRAR EN VIEWPORT (RESPETANDO prefers-reduced-motion)
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// LIBRERIA DE CONFETI PARA CELEBRACIONES
import confetti from 'canvas-confetti';

// REGISTRO DE PLUGINS GSAP — UNA SOLA VEZ AL CARGAR EL MODULO
gsap.registerPlugin(ScrollTrigger);

// ESTRUCTURA DE UN NODO DEL ROADMAP — CADA NODO REPRESENTA UNA LECCION,
// PRACTICA, REPASO, COFRE O JEFE DENTRO DE UN ITINERARIO
interface RoadmapNode {
  id: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'locked';
  xp: number;
  nodeType: 'lesson' | 'practice' | 'review' | 'chest' | 'boss';
  // PROGRESO INTRA-NODO (0-100) — SOLO RELEVANTE PARA NODOS ACTIVOS
  progress?: number;
}

// ESTRUCTURA DE UN ITINERARIO — UN RECORRIDO ENTERO DEL ROADMAP
interface Itinerary {
  id: string;
  emoji: string;
  label: string;
  // COLOR GUIA DEL ITINERARIO (USADO EN HALO DEL PILL ACTIVO Y BANNER)
  color: 'success' | 'secondary' | 'accent' | 'primary' | 'danger';
  progress: number;
  completed: number;
  total: number;
  nodes: RoadmapNode[];
}

// ESCENA DE MASCOTA DURMIENTE — APARECE CADA CIERTOS NODOS PARA
// AMENIZAR EL MAPA Y SERVIR DE RECOMPENSA EMOCIONAL AL AVANCE
interface MascotScene {
  // INDICE DEL NODO TRAS EL CUAL APARECE LA ESCENA
  afterIndex: number;
  // LADO DEL MAPA EN EL QUE SE COLOCA LA MASCOTA
  side: 'left' | 'right';
  // ESTADO DE LA MASCOTA — 'sleeping' POR DEFECTO, 'wink' UN UNICO PULSO
  mood: 'sleeping' | 'wink';
}

@Component({
  selector: 'app-roadmap',
  templateUrl: './roadmap.page.html',
  styleUrls: ['./roadmap.page.scss'],
  standalone: false,
})
export class RoadmapPage implements OnInit, OnDestroy, AfterViewInit {
  // REFERENCIA AL CONTENEDOR DEL MAPA — USADO COMO HOST PARA gsap.context
  // Y COMO ANCLA PARA CALCULAR EL PATH SVG ENTRE NODOS
  @ViewChild('mapHost', { static: false })
  mapHost!: ElementRef<HTMLElement>;
  // REFERENCIA AL SVG QUE PINTA LOS CONECTORES ENTRE NODOS
  @ViewChild('connectorSvg', { static: false })
  connectorSvg!: ElementRef<SVGElement>;
  // REFERENCIA AL CONTENEDOR DE LA PAGINA — SCOPE DE gsap.context
  @ViewChild('pageRoot', { static: true })
  pageRoot!: ElementRef<HTMLElement>;

  // ESTADISTICAS REALES DEL JUGADOR
  stats = { xp: 1250, level: 5, streak: 7 };
  // ESTADISTICAS MOSTRADAS — ANIMADAS DESDE 0 HACIA LOS VALORES REALES
  displayStats = { xp: 0, level: 0, streak: 0 };

  // LISTA DE ITINERARIOS DISPONIBLES — SOLO PRINCIPIANTE TIENE NODOS
  itineraries: Itinerary[] = [
    {
      id: 'beginner',
      emoji: '🌱',
      label: 'Principiante',
      // COLOR GUIA VERDE PORQUE ES EL ITINERARIO DE INICIO
      color: 'success',
      progress: 40,
      completed: 12,
      total: 30,
      nodes: [
        { id: 1, title: '¿Qué es internet?', subtitle: 'Completado', status: 'completed', xp: 50, nodeType: 'lesson' },
        { id: 2, title: 'Contraseñas seguras', subtitle: 'Completado', status: 'completed', xp: 75, nodeType: 'lesson' },
        { id: 3, title: 'Práctica', subtitle: 'Completado', status: 'completed', xp: 30, nodeType: 'practice' },
        { id: 4, title: 'Phishing básico', subtitle: 'Completado', status: 'completed', xp: 75, nodeType: 'lesson' },
        { id: 5, title: 'Cofre de XP', subtitle: 'Recompensa', status: 'completed', xp: 100, nodeType: 'chest' },
        // NODO ACTIVO CON PROGRESO INTRA-NODO DEL 35% (MOCK)
        { id: 6, title: 'Redes WiFi', subtitle: '¡Empezar!', status: 'active', xp: 100, nodeType: 'lesson', progress: 35 },
        { id: 7, title: 'Repaso', subtitle: 'Bloqueado', status: 'locked', xp: 50, nodeType: 'review' },
        { id: 8, title: 'Dispositivos seguros', subtitle: 'Bloqueado', status: 'locked', xp: 100, nodeType: 'lesson' },
        { id: 9, title: 'Cofre de XP', subtitle: 'Recompensa', status: 'locked', xp: 150, nodeType: 'chest' },
        { id: 10, title: 'Compras online', subtitle: 'Bloqueado', status: 'locked', xp: 125, nodeType: 'lesson' },
        { id: 11, title: 'Test final', subtitle: 'Reto', status: 'locked', xp: 200, nodeType: 'boss' },
        { id: 12, title: 'Certificado', subtitle: 'Recompensa', status: 'locked', xp: 300, nodeType: 'chest' },
      ],
    },
    { id: 'pentest', emoji: '🌐', label: 'Pentest Web', color: 'secondary', progress: 0, completed: 0, total: 28, nodes: [] },
    { id: 'linux', emoji: '🐧', label: 'Linux', color: 'accent', progress: 0, completed: 0, total: 25, nodes: [] },
    { id: 'soc', emoji: '🛡️', label: 'SOC', color: 'primary', progress: 0, completed: 0, total: 22, nodes: [] },
    { id: 'redteam', emoji: '🔴', label: 'Red Team', color: 'danger', progress: 0, completed: 0, total: 35, nodes: [] },
  ];

  // ITINERARIO ACTIVO POR DEFECTO — PRINCIPIANTE
  activeItinerary = this.itineraries[0];

  // ESCENAS DE MASCOTA — UNA TRAS EL NODO 5 (IZQ) Y OTRA TRAS EL 10 (DCHA)
  mascotScenes: MascotScene[] = [
    { afterIndex: 4, side: 'left', mood: 'sleeping' },
    { afterIndex: 9, side: 'right', mood: 'sleeping' },
  ];

  // ID DEL NODO QUE ESTA MOSTRANDO TOAST DE BLOQUEO (null SI NINGUNO)
  lockedToastId: number | null = null;

  // CONTEXTO GSAP — ENCAPSULA TODAS LAS ANIMACIONES DEL COMPONENTE PARA
  // PODER LIMPIARLAS DE UN SOLO REVERT EN ngOnDestroy
  private ctx?: gsap.Context;
  // TIMER DEL TOAST DE BLOQUEADO PARA PODER CANCELARLO AL DESTRUIR
  private lockedToastTimer?: ReturnType<typeof setTimeout>;
  // TIMER POR ESCENA PARA RESETEAR EL MOOD DESPUES DEL WINK
  private mascotTimers = new Map<number, ReturnType<typeof setTimeout>>();
  // FLAG QUE INDICA SI EL USUARIO PREFIERE MENOS ANIMACIONES
  private reducedMotion = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // DETECTA LA PREFERENCIA DE MOTION REDUCIDA UNA SOLA VEZ AL INICIAR
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngAfterViewInit() {
    // SCOPE TODAS LAS TWEENS DENTRO DEL CONTEXTO PARA CLEANUP AUTOMATICO
    this.ctx = gsap.context(() => {
      // ESPERAR AL SIGUIENTE FRAME PARA QUE EL LAYOUT ESTE ESTABLE
      requestAnimationFrame(() => {
        this.computeConnector();
        this.animateEnter();
      });
    }, this.pageRoot.nativeElement);
  }

  ngOnDestroy() {
    // LIMPIA TODAS LAS TWEENS Y SCROLLTRIGGERS REGISTRADOS EN EL SCOPE
    this.ctx?.revert();
    // LIMPIA EL TIMER DEL TOAST DE BLOQUEADO SI ESTABA ACTIVO
    if (this.lockedToastTimer) clearTimeout(this.lockedToastTimer);
    // LIMPIA TIMERS DE MASCOTAS PENDIENTES
    this.mascotTimers.forEach((t) => clearTimeout(t));
    this.mascotTimers.clear();
  }

  // RECALCULA EL CONECTOR SVG ANTE CAMBIOS DE TAMANO DE VENTANA
  @HostListener('window:resize')
  onResize() {
    // requestAnimationFrame EVITA RECALCULOS EN MEDIO DE UN REFLOW EN CURSO
    requestAnimationFrame(() => this.computeConnector());
  }

  // CAMBIO DE ITINERARIO ACTIVO — DISPARADO POR EL CLICK EN UN PILL
  selectItinerary(it: Itinerary) {
    this.activeItinerary = it;
    // ESPERA AL SIGUIENTE FRAME PARA QUE EL DOM REFLEJE EL CAMBIO ANTES
    // DE RECALCULAR EL CONECTOR Y RE-ANIMAR LA ENTRADA DE NODOS
    requestAnimationFrame(() => {
      this.computeConnector();
      this.animateEnter();
    });
  }

  // ANIMACION DE ENTRADA COMPLETA — STATS COUNT-UP, NODOS STAGGER,
  // BARRA DEL BANNER, CONECTOR REVEAL Y PARTICULAS DE FONDO
  private animateEnter() {
    // SI EL USUARIO PIDIO MENOS MOTION, SE SALTA TODO EL BLOQUE
    if (this.reducedMotion) {
      this.displayStats = { ...this.stats };
      this.cdr.markForCheck();
      return;
    }

    // ─── COUNT-UP DE LAS ESTADISTICAS ───────────────────────────
    // RESET A 0 ANTES DE LA TWEEN PARA QUE EL EFECTO SE NOTE EN
    // RECARGAS Y EN CAMBIOS DE ITINERARIO
    this.displayStats = { xp: 0, level: 0, streak: 0 };
    gsap.to(this.displayStats, {
      xp: this.stats.xp,
      level: this.stats.level,
      streak: this.stats.streak,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        // REDONDEA LOS VALORES MOSTRADOS PARA QUE NO PARPADEEN DECIMALES
        this.displayStats.xp = Math.round(this.displayStats.xp);
        this.displayStats.level = Math.round(this.displayStats.level);
        this.displayStats.streak = Math.round(this.displayStats.streak);
        // ANGULAR ZONE.JS YA PROPAGA EL CAMBIO; markForCheck POR SI ACASO
        this.cdr.markForCheck();
      },
    });

    // ─── ENTRADA DE NODOS CON STAGGER + SPRING ──────────────────
    // CADA FILA TIENE UN translateX DE CSS (row-left, row-mid-left, etc.)
    // QUE FORMA LA SERPENTINATA. CUANDO GSAP ANIMA `y`, ESCRIBE UN NUEVO
    // transform Y PODRIA PISAR EL translateX. POR SEGURIDAD ANCLAMOS EL
    // OFFSET HORIZONTAL EN EL ESTADO INTERNO DE GSAP CON gsap.set ANTES
    // DE LA TWEEN — ASI EL SERPENTEO SE PRESERVA DURANTE Y TRAS LA ENTRADA.
    const rows = this.pageRoot.nativeElement.querySelectorAll<HTMLElement>('.node-row');
    if (rows.length) {
      // MISMO OFFSET QUE LAS CLASES CSS .row-left / .row-mid-left / etc.
      const OFFSETS_X = [-56, -18, 18, 56];
      rows.forEach((row, i) => {
        gsap.set(row, { x: OFFSETS_X[i % 4] });
      });
      gsap.fromTo(
        rows,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: 'back.out(1.5)',
        },
      );
    }

    // ─── BANNER PROGRESS FILL — TRANSFORM scaleX (NO width) ─────
    const fill = this.pageRoot.nativeElement.querySelector('.season-progress-track');
    if (fill) {
      gsap.fromTo(
        fill,
        { '--season-progress': '0%' },
        {
          '--season-progress': `${this.activeItinerary.progress}%`,
          duration: 1.2,
          ease: 'power3.out',
          delay: 0.2,
        },
      );
    }

    // ─── CONECTOR REVEAL — stroke-dashoffset PROPIEDAD COMPOSITABLE ─
    // LOS PATHS LLEGAN AQUI YA PINTADOS POR computeConnector. SE OCULTAN
    // CONFIGURANDO dashoffset = pathLength, GSAP LOS ANIMA HASTA 0 PARA
    // QUE PAREZCA QUE SE DIBUJAN. ONCOMPLETE + ONINTERRUPT GARANTIZAN
    // QUE EL PATH ACABE SIENDO VISIBLE INCLUSO SI LA TWEEN SE MATA.
    const paths = this.connectorSvg?.nativeElement.querySelectorAll<SVGPathElement>('.connector-path');
    if (paths && paths.length) {
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      // FUNCION COMUN PARA RESETEAR EL DASH AL ESTADO ESTATICO FINAL —
      // LLAMADA TANTO EN onComplete (FIN NATURAL) COMO EN onInterrupt
      // (FIN POR KILL) PARA QUE LOS PATHS QUEDEN VISIBLES SIEMPRE.
      const finalizePathDash = () => {
        paths.forEach((p) => {
          const dashed = p.classList.contains('connector-locked');
          p.style.strokeDasharray = dashed ? '4 12' : '';
          p.style.strokeDashoffset = '0';
        });
      };
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: 'power2.inOut',
        stagger: 0.04,
        delay: 0.15,
        onComplete: finalizePathDash,
        onInterrupt: finalizePathDash,
      });
    }

    // ─── PARTICULAS DE FONDO — PARALLAX SUTIL SCROLL-LINKED ─────
    // EVITA CREAR DUPLICADOS SI SE LLAMA VARIAS VECES (CAMBIO DE PILL)
    ScrollTrigger.getAll().forEach((st) => st.kill());
    const particles = this.pageRoot.nativeElement.querySelectorAll('.bg-particle');
    particles.forEach((el, i) => {
      gsap.to(el, {
        // CADA PARTICULA SE DESPLAZA UN POCO DISTINTO PARA ROMPER PARALELISMO
        y: i % 2 === 0 ? -60 : -90,
        ease: 'none',
        scrollTrigger: {
          trigger: this.pageRoot.nativeElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    });
  }

  // CALCULA EL CONECTOR SVG ENTRE LOS CENTROS DE LOS CHIPS DE NODO
  // USANDO LAS COORDENADAS REALES TRAS LAYOUT. SOPORTA RESIZE Y CAMBIO
  // DE ITINERARIO LLAMANDOSE DESDE animateEnter Y onResize.
  private computeConnector() {
    const host = this.mapHost?.nativeElement;
    const svg = this.connectorSvg?.nativeElement;
    if (!host || !svg) return;

    // OBTIENE TODOS LOS CHIPS DE NODO PRESENTES EN ESTE MOMENTO
    const chips = host.querySelectorAll<HTMLElement>('.node-chip');
    if (chips.length < 2) {
      // SIN AL MENOS 2 NODOS NO HAY CONECTOR QUE PINTAR
      svg.innerHTML = '';
      return;
    }

    // DIMENSIONES DEL CONTENEDOR PARA AJUSTAR EL VIEWBOX DEL SVG
    const hostRect = host.getBoundingClientRect();
    svg.setAttribute('width', String(hostRect.width));
    svg.setAttribute('height', String(hostRect.height));
    svg.setAttribute('viewBox', `0 0 ${hostRect.width} ${hostRect.height}`);

    // CONSTRUIR UN PATH BEZIER POR CADA PAR DE NODOS CONSECUTIVOS;
    // CADA SEGMENTO LLEVA SU PROPIO COLOR/PATRON SEGUN EL ESTADO DEL
    // NODO SIGUIENTE (locked -> punteado, completed -> verde, etc.)
    const segments: string[] = [];
    for (let i = 0; i < chips.length - 1; i++) {
      const a = chips[i].getBoundingClientRect();
      const b = chips[i + 1].getBoundingClientRect();
      // COORDENADAS RELATIVAS AL CONTENEDOR
      const ax = a.left - hostRect.left + a.width / 2;
      const ay = a.top - hostRect.top + a.height / 2;
      const bx = b.left - hostRect.left + b.width / 2;
      const by = b.top - hostRect.top + b.height / 2;
      // PUNTOS DE CONTROL EN LA ALTURA MEDIA PARA UNA CURVA S SUAVE
      const midY = (ay + by) / 2;
      const cp1x = ax;
      const cp1y = midY;
      const cp2x = bx;
      const cp2y = midY;

      // DECIDE EL ESTADO DEL TRAMO MIRANDO EL NODO DESTINO; INCLUYE
      // OPACIDAD INLINE PORQUE LOS PATHS SE CREAN VIA innerHTML Y NO
      // RECIBEN LOS ATRIBUTOS DE SCOPE DEL VIEW ENCAPSULATION DE ANGULAR.
      const dst = this.activeItinerary.nodes[i + 1];
      const src = this.activeItinerary.nodes[i];
      let cls = 'connector-locked';
      let stroke = 'var(--color-surface-2)';
      let dash = '4 12';
      let op = '0.7';
      if (dst?.status === 'completed') {
        // TRAMO ENTRE DOS COMPLETADOS — VERDE SOLIDO Y BIEN MARCADO
        cls = 'connector-completed';
        stroke = 'var(--color-success)';
        dash = '';
        op = '1';
      } else if (dst?.status === 'active') {
        // TRAMO QUE LLEGA AL ACTIVO — VIOLETA SOLIDO, LLAMA LA ATENCION
        cls = 'connector-active';
        stroke = 'var(--color-primary)';
        dash = '';
        op = '0.95';
      } else if (src?.status === 'completed' && dst?.status === 'locked') {
        // PUNTEADO INDICANDO QUE EL SIGUIENTE NIVEL ESTA BLOQUEADO
        cls = 'connector-locked';
        stroke = 'var(--color-text-muted)';
        dash = '5 10';
        op = '0.7';
      } else {
        // ENTRE DOS LOCKED — PUNTEADO MAS TENUE
        dash = '4 12';
        op = '0.5';
      }

      const d = `M ${ax} ${ay} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${bx} ${by}`;
      const dashAttr = dash ? `stroke-dasharray="${dash}"` : '';
      // STROKE-WIDTH 7 PARA BUENA LECTURA SOBRE FONDOS OSCUROS; OPACIDAD
      // INLINE Y DROP-SHADOW LIGERO PARA QUE NO SE PIERDA SOBRE PARTICULAS
      segments.push(
        `<path class="connector-path ${cls}" d="${d}" ` +
          `stroke="${stroke}" stroke-width="7" fill="none" ` +
          `stroke-linecap="round" opacity="${op}" ` +
          `style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35))" ` +
          `${dashAttr} />`,
      );
    }

    // INYECCION DIRECTA DE LOS PATHS — EVITA TENER QUE USAR Renderer2
    // YA QUE LOS CONTENIDOS SON DETERMINISTAS Y SIN INPUT DEL USUARIO
    svg.innerHTML = segments.join('');
  }

  // GESTIONA EL TAP SOBRE UN CHIP DE NODO — ENRUTA A LA ACCION
  // CORRESPONDIENTE SEGUN ESTADO Y TIPO DEL NODO
  onNodeTap(node: RoadmapNode) {
    if (node.status === 'locked') {
      // FEEDBACK DE BLOQUEO — SHAKE + TOAST INFORMATIVO
      this.showLockedFeedback(node);
      return;
    }
    if (node.status === 'active') {
      // ACTIVAR NODO — DISPARA CONFETI Y DESPIERTA MASCOTA CERCANA
      this.dispararConfeti();
      this.tryWakeMascot(node);
      return;
    }
    // NODO COMPLETED: SI ES COFRE, RELANZA CELEBRACION DORADA
    if (node.status === 'completed' && node.nodeType === 'chest') {
      this.dispararConfetiCofre();
      this.tryWakeMascot(node);
    }
  }

  // MUESTRA EL TOAST INLINE Y APLICA SHAKE AL CHIP BLOQUEADO
  private showLockedFeedback(node: RoadmapNode) {
    this.lockedToastId = node.id;
    // BUSCA EL CHIP CONCRETO POR DATA-ATTRIBUTE PARA SACUDIRLO
    const chipEl = this.pageRoot.nativeElement.querySelector<HTMLElement>(
      `[data-node-id="${node.id}"] .node-chip`,
    );
    if (chipEl && !this.reducedMotion) {
      gsap.fromTo(
        chipEl,
        { x: 0 },
        {
          duration: 0.5,
          ease: 'power1.inOut',
          keyframes: { x: [-6, 6, -5, 5, -3, 3, 0] },
        },
      );
    }
    // CIERRA EL TOAST AUTOMATICAMENTE TRAS 2 SEGUNDOS
    if (this.lockedToastTimer) clearTimeout(this.lockedToastTimer);
    this.lockedToastTimer = setTimeout(() => {
      this.lockedToastId = null;
      this.cdr.markForCheck();
    }, 2000);
  }

  // SI EL NODO TOCADO ES VECINO DE UNA MASCOTA, DISPARA UN WINK PUNTUAL
  private tryWakeMascot(node: RoadmapNode) {
    const idx = this.activeItinerary.nodes.indexOf(node);
    // BUSCA UNA ESCENA CUYO afterIndex ESTE A DISTANCIA <=1 DEL NODO
    const scene = this.mascotScenes.find((s) => Math.abs(s.afterIndex - idx) <= 1);
    if (!scene) return;
    // CAMBIO TEMPORAL A 'wink' Y RESETEO A 'sleeping' TRAS 1.4s
    scene.mood = 'wink';
    // CANCELA UN TIMER PREVIO POR SI EL USUARIO INSISTE
    const prev = this.mascotTimers.get(scene.afterIndex);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      scene.mood = 'sleeping';
      this.cdr.markForCheck();
    }, 1400);
    this.mascotTimers.set(scene.afterIndex, t);
  }

  // DEVUELVE EL stroke-dashoffset DEL MINI-ANILLO DE UN PILL EN FUNCION
  // DEL % DE PROGRESO DEL ITINERARIO (USADO EN LOS PILLS INACTIVOS)
  pillRingDashoffset(progress: number): number {
    // RADIO 5 PARA UN ANILLO DE 14PX DE DIAMETRO
    const c = 2 * Math.PI * 5;
    return c * (1 - progress / 100);
  }

  // CALCULA SI UN SEGMENTO DEL TRACK DEL BANNER DEBE PINTARSE COMO
  // COMPLETADO, EN CURSO O LOCKED — SE USA EN EL TEMPLATE DEL BANNER
  segmentState(i: number): 'completed' | 'active' | 'locked' {
    const node = this.activeItinerary.nodes[i];
    if (!node) return 'locked';
    return node.status;
  }

  // PARTICULAS DE FONDO — POSICIONES PRECOMPUTADAS PARA EVITAR REPINTAR
  // DURANTE EL CICLO DE DETECCION DE CAMBIOS DE ANGULAR
  readonly bgParticles = [
    { x: 8, y: 14, size: 6, color: 'var(--color-accent)', opacity: 0.5 },
    { x: 88, y: 24, size: 5, color: 'var(--color-primary)', opacity: 0.45 },
    { x: 16, y: 56, size: 4, color: 'var(--color-secondary)', opacity: 0.4 },
    { x: 78, y: 72, size: 7, color: 'var(--color-accent)', opacity: 0.35 },
  ];

  // CONFETI MULTIDIRECCIONAL ESTANDAR PARA NODOS ACTIVOS
  dispararConfeti() {
    // PALETA DE COLORES ALINEADA CON EL DESIGN SYSTEM DE ARGOS
    const colors = ['#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
    const duration = 1500;
    const end = Date.now() + duration;
    const frame = () => {
      // RAFAGA DESDE EL BORDE IZQUIERDO HACIA EL CENTRO
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      // RAFAGA DESDE EL BORDE DERECHO HACIA EL CENTRO
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }

  // CONFETI DORADO ESPECIFICO PARA COFRES — PALETA WARNING + SUCCESS
  dispararConfetiCofre() {
    confetti({
      particleCount: 90,
      spread: 95,
      startVelocity: 38,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#FCD34D', '#F59E0B', '#10B981', '#FFFFFF'],
    });
  }

  // TRACKBY PARA EL *ngFor DE NODOS — EVITA RECREAR DOM EN CADA CICLO
  trackByNodeId(_idx: number, n: RoadmapNode) {
    return n.id;
  }
}
