// IMPORTACION DEL DECORADOR COMPONENT Y HOOKS DE CICLO DE VIDA DE ANGULAR
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION HACIA REGISTRO O LOGIN
import { Router } from '@angular/router';
// IMPORTACION DEL CORE DE GSAP PARA TIMELINES Y TWEENS
import { gsap } from 'gsap';
// IMPORTACION DEL PLUGIN SPLITTEXT PARA REVELAR HEADLINES CHAR A CHAR
import { SplitText } from 'gsap/SplitText';

// TIPO DE LOS MOODS QUE SOPORTA LA MASCOTA ARGUS — ALINEADO CON SU COMPONENTE
type ArgusMood = 'idle' | 'happy' | 'thinking' | 'loading' | 'success' | 'error' | 'sleeping' | 'excited' | 'alert';

// ESTRUCTURA DE UN LOGRO QUE SE MUESTRA EN EL SLIDE DE GAMIFICACION
interface OnboardingAchievement {
  // CLAVE PHOSPHOR DEL ICONO QUE REPRESENTA EL LOGRO
  icon: string;
  // ETIQUETA CORTA DEL LOGRO MOSTRADA BAJO EL ICONO
  label: string;
  // INDICA SI EL LOGRO SE PINTA A COLOR PARA CREAR DESEO (RESTO EN GRIS)
  hot: boolean;
}

// METADATOS DEL COMPONENTE DE LA PAGINA DE ONBOARDING DE ARGOS
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false,
})
export class OnboardingPage implements OnDestroy {

  // REFERENCIA AL CONTENEDOR RAIZ DEL ONBOARDING PARA AISLAR SELECTORES DE GSAP
  @ViewChild('rootEl', { static: false }) rootEl!: ElementRef<HTMLElement>;

  // INDICE DEL SLIDE ACTIVO USADO PARA RESALTAR EL OJO CORRESPONDIENTE EN EL INDICADOR
  public activeIndex = 0;

  // NUMERO TOTAL DE SLIDES DEL ONBOARDING — DESPERTAR, CAPACIDADES, GAMIFICACION, CTA
  public readonly totalSlides = 4;

  // MOOD ACTUAL DE LA MASCOTA ARGUS — CAMBIA POR SLIDE
  public argusMood: ArgusMood = 'happy';

  // TAMANO ACTUAL DE LA MASCOTA EN EL SLIDE ACTIVO — CRECE EN HEROS
  public argusSize = 168;

  // LISTA DE LOGROS QUE EL USUARIO PODRA DESBLOQUEAR — SOLO LOS HOT SE PINTAN A COLOR
  public achievements: OnboardingAchievement[] = [
    // PRIMER LOGRO A COLOR PARA GENERAR DESEO — PRIMER PASO EN LA BOVEDA
    { icon: 'ph-vault',          label: 'Primera bóveda',  hot: true  },
    // SEGUNDO LOGRO A COLOR — CADENA DE DIAS DE USO
    { icon: 'ph-flame',          label: 'Racha de 7 días', hot: true  },
    // LOGRO EN GRIS — ANALISIS PHISHING
    { icon: 'ph-fish-simple',    label: 'Cazador phishing', hot: false },
    // LOGRO EN GRIS — AUDITORIA COMPLETA
    { icon: 'ph-shield-check',   label: 'Auditor maestro',  hot: false },
    // LOGRO EN GRIS — APRENDIZAJE GAMIFICADO
    { icon: 'ph-graduation-cap', label: 'Diplomado',         hot: false },
    // LOGRO EN GRIS — META AVANZADA
    { icon: 'ph-trophy',         label: 'Titán de Argos',    hot: false },
  ];

  // SPLITTEXT ACTUAL EN USO — SE GUARDA PARA REVERTIR ANTES DE DESPLIT
  private currentSplit: SplitText | null = null;

  // ULTIMA TIMELINE EN VUELO — SE LIMPIA EN CAMBIOS DE SLIDE Y EN DESTROY
  private lastTl: gsap.core.Timeline | null = null;

  // FLAG QUE INDICA QUE EL USUARIO PREFIERE MOTION REDUCIDO
  private reducedMotion = false;

  // FLAG QUE EVITA RELANZAR LAS ANIMACIONES SI ENTRAS Y SALES RAPIDO DE LA VISTA
  private pluginsRegistered = false;

  // INYECCION DEL ROUTER DE ANGULAR PARA NAVEGACION PROGRAMATICA
  constructor(private readonly router: Router) {}

  // HOOK DE IONIC ANTES DE ENTRAR — FUERZA TEMA OSCURO Y DETECTA MOTION REDUCIDO
  ionViewWillEnter(): void {
    // QUITAMOS UN POSIBLE FORZADO DE MODO CLARO PREVIO PARA EVITAR CONFLICTOS
    document.body.classList.remove('force-light');
    // ACTIVAMOS LA CLASE QUE FUERZA EL TEMA OSCURO EN ESTA PANTALLA
    document.body.classList.add('force-dark');
    // DETECTAMOS LA PREFERENCIA DE MOVIMIENTO REDUCIDO PARA DEGRADAR LA MOTION
    this.reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // HOOK DE IONIC TRAS LA ENTRADA — REGISTRA PLUGINS Y LANZA ANIMACION DEL SLIDE 0
  ionViewDidEnter(): void {
    // REGISTRAMOS EL PLUGIN SOLO UNA VEZ POR INSTANCIA
    if (!this.pluginsRegistered) {
      gsap.registerPlugin(SplitText);
      this.pluginsRegistered = true;
    }
    // PEQUENO DELAY PARA QUE SWIPER COMPLETE SU LAYOUT INICIAL
    this.animateSlide(0);
  }

  // CICLO DE VIDA AL SALIR DE LA PAGINA — RESTAURA EL TEMA AUTOMATICO
  ionViewWillLeave(): void {
    // RETIRAMOS LA CLASE DE OSCURIDAD FORZADA PARA NO AFECTAR AL RESTO DE LA APP
    document.body.classList.remove('force-dark');
  }

  // CICLO DE VIDA AL DESTRUIR — REVIERTE SPLITTEXT Y CIERRA TIMELINES
  ngOnDestroy(): void {
    // REVERTIMOS EL SPLITTEXT ACTIVO SI EXISTE PARA RESTAURAR EL DOM ORIGINAL
    this.currentSplit?.revert();
    // MATAMOS LA TIMELINE EN VUELO PARA QUE NO QUEDE TWEEN HUERFANO
    this.lastTl?.kill();
    // POR SI VIENE NAVEGACION FORZADA SIN LEAVE, QUITAMOS LA CLASE DARK
    document.body.classList.remove('force-dark');
  }

  // HANDLER DEL EVENTO SLIDECHANGE QUE EMITE SWIPER AL CAMBIAR DE SLIDE
  public onSlideChange(event: CustomEvent): void {
    // SWIPER ENVIA EN DETAIL UN ARRAY CON LA INSTANCIA — DE AHI LEEMOS EL INDICE
    const swiperInstance = (event.detail as unknown[])[0] as { activeIndex: number };
    const idx = swiperInstance?.activeIndex ?? 0;
    // EVITA ANIMACIONES DUPLICADAS EN EL MISMO SLIDE
    if (idx === this.activeIndex) return;
    this.activeIndex = idx;
    this.animateSlide(idx);
  }

  // ANIMA LA ENTRADA DEL SLIDE INDICADO Y AJUSTA EL MOOD/SIZE DE LA MASCOTA
  private animateSlide(index: number): void {
    // AJUSTAMOS EL MOOD DE ARGUS POR SLIDE — CUENTA LA HISTORIA DEL DESPERTAR
    this.argusMood = this.moodForSlide(index);
    // AJUSTAMOS EL TAMANO DE LA MASCOTA POR SLIDE (HEROS GRANDES)
    this.argusSize = index === 0 || index === 3 ? 168 : 128;
    // ROOT REAL DEL DOM PARA BUSCAR EL SLIDE ACTIVO
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    // SELECCIONAMOS EL CONTENEDOR DEL SLIDE ACTIVO PARA LIMITAR EL SCOPE
    const slideRoot = root.querySelector(`[data-slide="${index}"]`) as HTMLElement | null;
    if (!slideRoot) return;
    // MATAMOS TIMELINE PREVIA PARA EVITAR TWEENS HUERFANOS
    this.lastTl?.kill();
    // REVIERTE EL SPLITTEXT ANTERIOR PARA QUE EL DOM VUELVA AL ORIGINAL
    this.currentSplit?.revert();
    this.currentSplit = null;
    // SI MOTION REDUCIDO, NO ANIMAMOS — DEJAMOS TODO VISIBLE EN SU ESTADO FINAL
    if (this.reducedMotion) return;
    // HEADLINE A DIVIDIR POR CHARS PARA EL STAGGER
    const headline = slideRoot.querySelector('.os-title') as HTMLElement | null;
    // SUBELEMENTOS QUE APARECEN CON STAGGER ORGANICO
    const reveals = slideRoot.querySelectorAll<HTMLElement>('.os-reveal');
    // TIMELINE PRINCIPAL DEL SLIDE
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    // ANIMA LOS REVEALS CON FROMTO PARA QUE TERMINEN EN ESTADO VISIBLE EXPLICITO
    if (reveals.length) {
      tl.fromTo(reveals,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 });
    }
    // ANIMA EL HEADLINE CON SPLITTEXT SI EXISTE
    if (headline) {
      // SPLIT POR CARACTERES Y PALABRAS PARA STAGGER FINO
      this.currentSplit = new SplitText(headline, { type: 'chars,words' });
      tl.fromTo(this.currentSplit.chars,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.018 },
        '-=0.35');
    }
    this.lastTl = tl;
  }

  // DEVUELVE EL MOOD QUE DEBE TENER ARGUS PARA UN INDICE DE SLIDE DADO
  private moodForSlide(index: number): ArgusMood {
    // SLIDE 0 — DESPIERTO Y SALUDANDO
    if (index === 0) return 'happy';
    // SLIDE 1 — MUESTRA LO QUE SABE HACER: PENSATIVO
    if (index === 1) return 'thinking';
    // SLIDE 2 — VE LOS LOGROS POSIBLES: ENTUSIASMADO
    if (index === 2) return 'excited';
    // SLIDE 3 — CTA FINAL: SIGUE ENTUSIASMADO PARA EMPUJAR A LA ACCION
    return 'excited';
  }

  // GENERA UN ARRAY ITERABLE DE INDICES PARA PINTAR LOS OJOS DEL INDICADOR
  public get dotIndices(): number[] {
    return Array.from({ length: this.totalSlides }, (_, i) => i);
  }

  // NAVEGACION HACIA LA PAGINA DE REGISTRO DE NUEVA CUENTA
  public goToSignUp(): void {
    // NAVEGAMOS AL FLUJO DE ALTA DE NUEVOS USUARIOS
    this.router.navigateByUrl('/register');
  }

  // NAVEGACION HACIA LA PAGINA DE LOGIN PARA USUARIOS YA REGISTRADOS
  public goToLogin(): void {
    // NAVEGAMOS A LA PANTALLA DE INICIO DE SESION
    this.router.navigateByUrl('/login');
  }
}
