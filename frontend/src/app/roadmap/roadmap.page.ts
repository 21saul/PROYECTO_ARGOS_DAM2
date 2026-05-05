import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { gsap } from 'gsap';
// LIBRERÍA DE CONFETI PARA CELEBRAR LA INTERACCIÓN CON NODOS ACTIVOS DEL ROADMAP
import confetti from 'canvas-confetti';

interface RoadmapNode {
  id: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'locked';
  xp: number;
  nodeType: 'lesson' | 'practice' | 'review' | 'chest' | 'boss';
}

interface Itinerary {
  id: string;
  emoji: string;
  label: string;
  progress: number;
  completed: number;
  total: number;
  nodes: RoadmapNode[];
}

@Component({
  selector: 'app-roadmap',
  templateUrl: './roadmap.page.html',
  styleUrls: ['./roadmap.page.scss'],
  standalone: false
})
export class RoadmapPage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChildren('nodeRef') nodeRefs!: QueryList<ElementRef>;

  stats = { xp: 1250, level: 5, streak: 7 };

  itineraries: Itinerary[] = [
    {
      id: 'beginner', emoji: '🌱', label: 'Principiante',
      progress: 40, completed: 12, total: 30,
      nodes: [
        { id:1, title:'¿Qué es internet?',     subtitle:'Completado',   status:'completed', xp:50,  nodeType:'lesson'   },
        { id:2, title:'Contraseñas seguras',   subtitle:'Completado',   status:'completed', xp:75,  nodeType:'lesson'   },
        { id:3, title:'Práctica',              subtitle:'Completado',   status:'completed', xp:30,  nodeType:'practice' },
        { id:4, title:'Phishing básico',       subtitle:'Completado',   status:'completed', xp:75,  nodeType:'lesson'   },
        { id:5, title:'Cofre de XP',           subtitle:'Recompensa',   status:'completed', xp:100, nodeType:'chest'    },
        { id:6, title:'Redes WiFi',            subtitle:'¡Empezar!',    status:'active',    xp:100, nodeType:'lesson'   },
        { id:7, title:'Repaso',                subtitle:'Bloqueado',    status:'locked',    xp:50,  nodeType:'review'   },
        { id:8, title:'Dispositivos seguros',  subtitle:'Bloqueado',    status:'locked',    xp:100, nodeType:'lesson'   },
        { id:9, title:'Cofre de XP',           subtitle:'Recompensa',   status:'locked',    xp:150, nodeType:'chest'    },
        { id:10, title:'Compras online',       subtitle:'Bloqueado',    status:'locked',    xp:125, nodeType:'lesson'   },
        { id:11, title:'Test final',           subtitle:'Reto',         status:'locked',    xp:200, nodeType:'boss'     },
        { id:12, title:'Certificado',          subtitle:'Recompensa',   status:'locked',    xp:300, nodeType:'chest'    },
      ]
    },
    { id:'pentest', emoji:'🌐', label:'Pentest Web', progress:0, completed:0, total:28, nodes:[] },
    { id:'linux',   emoji:'🐧', label:'Linux',       progress:0, completed:0, total:25, nodes:[] },
    { id:'soc',     emoji:'🛡️', label:'SOC',         progress:0, completed:0, total:22, nodes:[] },
    { id:'redteam', emoji:'🔴', label:'Red Team',    progress:0, completed:0, total:35, nodes:[] },
  ];

  activeItinerary = this.itineraries[0];

  selectItinerary(it: Itinerary) {
    this.activeItinerary = it;
    setTimeout(() => this.animateNodes(), 100);
  }

  getNodeIcon(status: string): string {
    if (status === 'completed') return '✅';
    if (status === 'active') return '🔓';
    return '🔒';
  }

  getZigzag(index: number): string {
    return index % 2 === 0 ? 'zigzag-right' : 'zigzag-left';
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.animateNodes(), 300);
  }

  // MATAR TODAS LAS TWEENS GSAP DEL ROADMAP AL DESTRUIR EL COMPONENTE PARA EVITAR LEAKS
  ngOnDestroy() {
    gsap.killTweensOf('.node-row, .node-chip, .progress-fill, .chip-active');
  }

  animateNodes() {
    // MATAR TWEENS PREVIAS PARA EVITAR DUPLICADOS
    gsap.killTweensOf('.node-row, .node-chip, .progress-fill, .chip-active');

    // ENTRADA DE NODOS CON STAGGER
    const rows = document.querySelectorAll('.node-row');
    if (rows.length) {
      gsap.fromTo(rows,
        { opacity: 0, y: 24, scale: 0.85 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: 'back.out(1.6)',
          clearProps: 'all'
        }
      );
    }

    // BARRA DE PROGRESO
    const fill = document.querySelector('.progress-fill');
    if (fill) {
      gsap.fromTo(fill,
        { width: '0%' },
        {
          width: this.activeItinerary.progress + '%',
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.2
        }
      );
    }
  }

  // DISPARA CONFETI MULTIDIRECCIONAL DESDE LOS BORDES PARA CELEBRAR
  // LA COMPLETACIÓN O LA ACTIVACIÓN DE UN NODO DEL ROADMAP
  dispararConfeti() {
    // PALETA DE COLORES ALINEADA CON EL DESIGN SYSTEM DE ARGOS
    const colors = ['#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
    // DURACIÓN TOTAL DE LA LLUVIA DE CONFETI EN MILISEGUNDOS
    const duration = 1500;
    // INSTANTE DE FIN COMO TIMESTAMP ABSOLUTO
    const end = Date.now() + duration;

    // FUNCIÓN RECURSIVA QUE EMITE PEQUEÑAS RÁFAGAS CADA FRAME
    const frame = () => {
      // RÁFAGA DESDE EL BORDE IZQUIERDO HACIA EL CENTRO
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      // RÁFAGA DESDE EL BORDE DERECHO HACIA EL CENTRO
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });
      // CONTINUAR HASTA QUE SE AGOTE LA DURACIÓN
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    // ARRANCAR EL CICLO DE CONFETI
    frame();
  }

  // GESTIÓN DEL TAP SOBRE UN NODO DEL ROADMAP — CELEBRA SOLO LOS ACTIVOS
  onNodeTap(node: RoadmapNode) {
    // SOLO LOS NODOS DESBLOQUEADOS Y EN CURSO LANZAN LA CELEBRACIÓN
    if (node.status === 'active') {
      this.dispararConfeti();
    }
  }
}
