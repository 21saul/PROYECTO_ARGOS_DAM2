// IMPORTACION DEL DECORADOR COMPONENT Y UTILIDADES DE CICLO DE VIDA DE ANGULAR
import { Component, OnInit, OnDestroy } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGAR HACIA LAS RUTAS DE LOGIN Y REGISTRO
import { Router } from '@angular/router';

// METADATOS DEL COMPONENTE DE LA PAGINA DE ONBOARDING DE ARGOS
@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  // MARCAMOS EL COMPONENTE COMO NO STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false,
})
export class OnboardingPage implements OnInit, OnDestroy {
  // INDICE DE SLIDE ACTIVO USADO PARA RESALTAR EL DOT DE PROGRESO CORRESPONDIENTE
  public activeIndex = 0;

  // NUMERO TOTAL DE SLIDES DEL ONBOARDING USADO PARA PINTAR LOS DOTS
  public readonly totalSlides = 3;

  // INYECCION DEL ROUTER DE ANGULAR PARA NAVEGACION PROGRAMATICA
  constructor(private readonly router: Router) {}

  // CICLO DE VIDA AL ENTRAR A LA PAGINA — FORZAMOS MODO OSCURO PARA EL ONBOARDING
  public ngOnInit(): void {
    // QUITAMOS UN POSIBLE FORZADO DE MODO CLARO PREVIO PARA EVITAR CONFLICTOS
    document.body.classList.remove('force-light');
    // ACTIVAMOS LA CLASE QUE FUERZA EL TEMA OSCURO INDEPENDIENTEMENTE DEL SISTEMA
    document.body.classList.add('force-dark');
  }

  // CICLO DE VIDA AL SALIR DE LA PAGINA — RESTAURAMOS EL TEMA AUTOMATICO DEL SISTEMA
  public ngOnDestroy(): void {
    // RETIRAMOS LA CLASE DE OSCURIDAD FORZADA PARA QUE EL RESTO DE LA APP SE COMPORTE NORMAL
    document.body.classList.remove('force-dark');
  }

  // HANDLER DEL EVENTO SLIDECHANGE QUE EMITE SWIPER AL CAMBIAR DE SLIDE
  public onSlideChange(event: CustomEvent): void {
    // SWIPER ENVIA EN DETAIL UN ARRAY CON LA INSTANCIA — DE AHI LEEMOS EL INDICE ACTIVO
    const swiperInstance = (event.detail as unknown[])[0] as { activeIndex: number };
    // ACTUALIZAMOS EL ESTADO DEL COMPONENTE PARA QUE EL TEMPLATE PINTE EL DOT CORRECTO
    this.activeIndex = swiperInstance?.activeIndex ?? 0;
  }

  // GENERA UN ARRAY ITERABLE DE INDICES PARA PINTAR LOS DOTS DE PROGRESO
  public get dotIndices(): number[] {
    // CREA UN ARRAY [0,1,2] CON LA LONGITUD IGUAL AL TOTAL DE SLIDES
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
