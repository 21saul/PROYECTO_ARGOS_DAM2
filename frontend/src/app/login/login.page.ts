// IMPORTACION DEL DECORADOR COMPONENT Y HOOKS DE CICLO DE VIDA
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION TRAS EL LOGIN
import { Router } from '@angular/router';
// IMPORTACION DEL CORE DE GSAP PARA TIMELINES Y TWEENS
import { gsap } from 'gsap';
// IMPORTACION DEL PLUGIN SPLITTEXT PARA REVELAR EL HEADLINE
import { SplitText } from 'gsap/SplitText';
// IMPORTACION DEL SERVICIO DE AUTENTICACION ZERO-KNOWLEDGE
import { AuthService } from '../services/auth.service';

// TIPO DE LOS MOODS DE LA MASCOTA ALINEADO CON SU COMPONENTE
type ArgusMood = 'idle' | 'happy' | 'thinking' | 'loading' | 'success' | 'error' | 'sleeping' | 'excited' | 'alert';

// METADATOS DEL COMPONENTE DE LOGIN DE ARGOS
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false
})
export class LoginPage implements OnDestroy {

  // REFERENCIA AL CONTENEDOR RAIZ PARA AISLAR EL CONTEXTO DE GSAP
  @ViewChild('rootEl', { static: false }) rootEl!: ElementRef<HTMLElement>;

  // EMAIL INTRODUCIDO POR EL USUARIO PARA INICIAR SESION
  email = '';
  // CONTRASEÑA MAESTRA INTRODUCIDA POR EL USUARIO
  password = '';
  // FLAG QUE CONTROLA SI LA CONTRASEÑA SE MUESTRA EN CLARO
  showPassword = false;
  // FLAG QUE INDICA QUE LA AUTENTICACION ESTA EN PROCESO
  isLoading = false;
  // FLAG QUE INDICA QUE EL LOGIN ACABA DE TENER EXITO Y ARGUS DEBE ESTAR EN SUCCESS
  loginSuccess = false;
  // MENSAJE DE ERROR DE LA ULTIMA LLAMADA AL BACKEND (VACIO SI NO HAY ERROR)
  errorMessage = '';

  // CAMPO ACTUALMENTE ENFOCADO PARA QUE LA MASCOTA REACCIONE
  focusedField: 'email' | 'password' | null = null;

  // INDICA SI EL USUARIO PREFIERE MOVIMIENTO REDUCIDO
  private reducedMotion = false;

  // ULTIMA TIMELINE EN VUELO — SE LIMPIA EN DESTROY
  private lastTl: gsap.core.Timeline | null = null;

  // SPLITTEXT ACTIVO QUE SE REVIERTE EN EL DESTROY
  private splitText: SplitText | null = null;

  // FLAG QUE INDICA SI YA REGISTRAMOS LOS PLUGINS DE GSAP EN ESTA INSTANCIA
  private pluginsRegistered = false;

  // INYECCION DEL ROUTER Y DEL AUTHSERVICE PARA AUTENTICAR Y NAVEGAR
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  // HOOK DE IONIC ANTES DE ENTRAR — FUERZA TEMA OSCURO PARA LOGIN
  ionViewWillEnter() {
    // QUITAMOS UN POSIBLE FORZADO DE MODO CLARO PREVIO
    document.body.classList.remove('force-light');
    // FORZAMOS EL TEMA OSCURO INMERSIVO EN ESTA PANTALLA
    document.body.classList.add('force-dark');
    // DETECTAMOS LA PREFERENCIA DE MOVIMIENTO REDUCIDO
    this.reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // HOOK DE IONIC TRAS LA ENTRADA — LANZA TIMELINE CUANDO EL DOM ESTA LISTO
  ionViewDidEnter() {
    // REGISTRO DE PLUGINS UNA SOLA VEZ POR INSTANCIA
    if (!this.pluginsRegistered) {
      gsap.registerPlugin(SplitText);
      this.pluginsRegistered = true;
    }
    this.runEnterTimeline();
  }

  // HOOK DE IONIC ANTES DE SALIR — RESTAURA EL TEMA AUTOMATICO
  ionViewWillLeave() {
    // RETIRAMOS LA CLASE DE OSCURIDAD FORZADA
    document.body.classList.remove('force-dark');
  }

  // CICLO DE VIDA AL DESTRUIR — REVIERTE ANIMACIONES Y SPLITTEXT
  ngOnDestroy(): void {
    this.splitText?.revert();
    this.lastTl?.kill();
    document.body.classList.remove('force-dark');
  }

  // LANZA LA TIMELINE DE ENTRADA DEL LOGIN
  private runEnterTimeline(): void {
    // ROOT DEL DOM PARA QUERIES
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    this.lastTl?.kill();
    // RESPETO DE MOTION REDUCIDA
    if (this.reducedMotion) return;
    // HERO + MASCOTA + HEADLINE + CARD + PILL
    const mascot = root.querySelector('.lg-mascot') as HTMLElement | null;
    const headline = root.querySelector('.lg-title') as HTMLElement | null;
    const card = root.querySelector('.lg-card') as HTMLElement | null;
    const pill = root.querySelector('.lg-zk-pill') as HTMLElement | null;
    // TIMELINE PRINCIPAL CON EASES DEL PRODUCTO
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    // MASCOTA DE ENTRADA — POP SUAVE
    if (mascot) {
      tl.fromTo(mascot,
        { scale: 0.82, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' });
    }
    // HEADLINE SPLIT CHARS
    if (headline) {
      this.splitText = new SplitText(headline, { type: 'chars,words' });
      tl.fromTo(this.splitText.chars,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.018 },
        '-=0.3');
    }
    // CARD SUBE DESDE ABAJO
    if (card) {
      tl.fromTo(card,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55 },
        '-=0.3');
    }
    // PILL DEL FOOTER APARECE AL FINAL
    if (pill) {
      tl.fromTo(pill,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4 },
        '-=0.25');
    }
    this.lastTl = tl;
  }

  // GETTER QUE DEVUELVE EL MOOD DE ARGUS SEGUN ESTADO DEL FORMULARIO
  get argusMood(): ArgusMood {
    // LOGIN EXITOSO MUESTRA SUCCESS ANTES DE NAVEGAR
    if (this.loginSuccess) return 'success';
    // ERROR DE LOGIN
    if (this.errorMessage) return 'error';
    // LOADING DURANTE EL LOGIN
    if (this.isLoading) return 'loading';
    // SI ESTA ESCRIBIENDO EN PASSWORD, ARGUS BAJA LA MIRADA (PENSANDO)
    if (this.focusedField === 'password') return 'thinking';
    // SI ESTA EN EL CAMPO EMAIL, ARGUS TE MIRA (HAPPY)
    if (this.focusedField === 'email') return 'happy';
    // DEFECTO — IDLE OBSERVANDO
    return 'idle';
  }

  // HANDLER DE FOCUS — APUNTA QUE CAMPO ESTA ENFOCADO PARA CAMBIAR EL MOOD
  onFocus(field: 'email' | 'password'): void {
    this.focusedField = field;
  }

  // HANDLER DE BLUR — LIMPIA EL CAMPO ENFOCADO SI COINCIDE
  onBlur(field: 'email' | 'password'): void {
    if (this.focusedField === field) this.focusedField = null;
  }

  // HANDLER DE LOGIN — LLAMA AL BACKEND REAL CON AUTH ZERO-KNOWLEDGE
  async login() {
    // SI NO HAY CREDENCIALES O ESTAMOS YA EN LOADING, NO HACEMOS NADA
    if (!this.email || !this.password || this.isLoading) return;
    // ACTIVAMOS EL ESTADO DE CARGA PARA DESHABILITAR EL BOTON Y MOSTRAR SPINNER
    this.isLoading = true;
    // LIMPIAMOS CUALQUIER ERROR PREVIO ANTES DE INTENTAR LA AUTENTICACION
    this.errorMessage = '';
    try {
      // INVOCA AL AUTHSERVICE QUE DERIVA EL auth_hash EN LOCAL Y LLAMA AL BACKEND
      await this.authService.login(this.email, this.password);
      // MARCAMOS EL EXITO PARA QUE ARGUS PASE A SUCCESS Y NAVEGAMOS TRAS UN BREVE FLASH
      this.loginSuccess = true;
      await this.successAndNavigate('/dashboard');
    } catch (err: any) {
      // PROPAGAMOS EL MENSAJE DE ERROR AL USUARIO
      this.errorMessage = err?.message || 'Credenciales incorrectas';
      // LANZAMOS SHAKE HORIZONTAL DEL CARD PARA SUBRAYAR EL ERROR
      this.shakeCard();
    } finally {
      // DESACTIVAMOS EL ESTADO DE CARGA INDEPENDIENTEMENTE DEL RESULTADO
      this.isLoading = false;
    }
  }

  // SHAKE HORIZONTAL DEL CARD AL FALLAR LA AUTENTICACION
  private shakeCard(): void {
    // RESPETO DE MOTION REDUCIDA — SIN SHAKE
    if (this.reducedMotion) return;
    // SELECCIONAMOS EL CARD PRINCIPAL DEL LOGIN
    const card = this.rootEl?.nativeElement?.querySelector('.lg-card') as HTMLElement | null;
    if (!card) return;
    // SHAKE CON OSCILACIONES DECRECIENTES
    gsap.fromTo(card,
      { x: 0 },
      { x: 0, duration: 0.4, ease: 'power3.out',
        keyframes: [
          { x: -8 }, { x: 8 }, { x: -6 }, { x: 6 }, { x: 0 }
        ] });
  }

  // FLASH DE SUCCESS Y NAVEGACION TRAS BREVE DELAY
  private async successAndNavigate(url: string): Promise<void> {
    // SI MOTION REDUCIDA, NAVEGAMOS DE INMEDIATO
    if (this.reducedMotion) {
      this.router.navigateByUrl(url);
      return;
    }
    // ESPERAMOS UN INSTANTE PARA QUE EL CAMBIO DE MOOD SEA PERCEPTIBLE
    await new Promise(resolve => setTimeout(resolve, 600));
    // NAVEGACION FINAL AL DASHBOARD
    this.router.navigateByUrl(url);
  }

  // NAVEGACION HACIA LA PAGINA DE REGISTRO PARA NUEVOS USUARIOS
  goToRegister() {
    this.router.navigate(['/register']);
  }
}
