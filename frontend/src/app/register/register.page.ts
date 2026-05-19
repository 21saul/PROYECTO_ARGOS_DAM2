// IMPORTACION DEL DECORADOR COMPONENT Y HOOKS DE CICLO DE VIDA
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION TRAS EL REGISTRO
import { Router } from '@angular/router';
// IMPORTACION DEL CORE DE GSAP PARA TIMELINES Y TWEENS
import { gsap } from 'gsap';
// IMPORTACION DEL PLUGIN SPLITTEXT PARA REVELAR EL HEADLINE
import { SplitText } from 'gsap/SplitText';
// IMPORTACION DE CUSTOMBOUNCE PARA EL DESTELLO AL ALCANZAR FORTALEZA MAXIMA
import { CustomBounce } from 'gsap/CustomBounce';
// IMPORTACION DE CUSTOMEASE PARA VALIDAR LA EXISTENCIA DE LA EASE DEL BURST
import { CustomEase } from 'gsap/CustomEase';
// IMPORTACION DEL SERVICIO DE AUTENTICACION ZERO-KNOWLEDGE
import { AuthService } from '../services/auth.service';

// TIPO DE LOS MOODS DE LA MASCOTA ALINEADO CON SU COMPONENTE
type ArgusMood = 'idle' | 'happy' | 'thinking' | 'loading' | 'success' | 'error' | 'sleeping' | 'excited' | 'alert';

// METADATOS DEL COMPONENTE DE REGISTRO DE ARGOS
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false
})
export class RegisterPage implements OnDestroy {

  // REFERENCIA AL CONTENEDOR RAIZ PARA AISLAR EL CONTEXTO DE GSAP
  @ViewChild('rootEl', { static: false }) rootEl!: ElementRef<HTMLElement>;

  // NOMBRE DEL USUARIO INTRODUCIDO EN EL FORMULARIO
  name = '';
  // EMAIL DEL USUARIO PARA CREAR LA CUENTA
  email = '';
  // CONTRASEÑA MAESTRA QUE SE USARA COMO BASE DEL CIFRADO ZERO-KNOWLEDGE
  password = '';
  // CONFIRMACION DE LA CONTRASEÑA PARA EVITAR ERRORES TIPOGRAFICOS
  confirmPassword = '';
  // FLAG QUE CONTROLA SI LA CONTRASEÑA SE MUESTRA EN CLARO
  showPassword = false;
  // FLAG QUE INDICA SI EL USUARIO HA ACEPTADO LOS TERMINOS DE USO
  acceptTerms = false;
  // FLAG QUE INDICA QUE EL REGISTRO ESTA EN PROCESO
  isLoading = false;
  // MENSAJE DE ERROR DE LA ULTIMA LLAMADA AL BACKEND (VACIO SI NO HAY ERROR)
  errorMessage = '';

  // CAMPO ACTUALMENTE ENFOCADO PARA REACCIONAR CON LA MASCOTA
  focusedField: 'name' | 'email' | 'password' | 'confirm' | null = null;

  // FLAG QUE EVITA QUE EL DESTELLO DE FORTALEZA MAXIMA SE LANCE MAS DE UNA VEZ
  private burstedOnce = false;

  // INDICA SI EL USUARIO PREFIERE MOVIMIENTO REDUCIDO
  private reducedMotion = false;

  // ULTIMA TIMELINE EN VUELO — SE LIMPIA EN DESTROY
  private lastTl: gsap.core.Timeline | null = null;

  // SPLITTEXT ACTIVO QUE SE REVIERTE EN EL DESTROY
  private splitText: SplitText | null = null;

  // FLAG QUE INDICA SI YA REGISTRAMOS LOS PLUGINS DE GSAP EN ESTA INSTANCIA
  private pluginsRegistered = false;

  // INDICES DE LAS 5 RUNAS DEL ANILLO DE FORTALEZA — USADO POR EL TEMPLATE
  public readonly runeIndices: number[] = [0, 1, 2, 3, 4];

  // INYECCION DEL ROUTER Y DEL AUTHSERVICE PARA REGISTRAR Y NAVEGAR
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  // HOOK DE IONIC ANTES DE ENTRAR — FUERZA TEMA OSCURO PARA REGISTRO
  ionViewWillEnter() {
    // QUITAMOS UN POSIBLE FORZADO DE MODO CLARO PREVIO
    document.body.classList.remove('force-light');
    // FORZAMOS EL TEMA OSCURO INMERSIVO EN ESTA PANTALLA
    document.body.classList.add('force-dark');
    // DETECTAMOS LA PREFERENCIA DE MOVIMIENTO REDUCIDO
    this.reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // HOOK DE IONIC TRAS LA ENTRADA — LANZA LA TIMELINE CUANDO EL DOM ESTA LISTO
  ionViewDidEnter() {
    // REGISTRAMOS LOS PLUGINS UNA SOLA VEZ POR INSTANCIA
    if (!this.pluginsRegistered) {
      gsap.registerPlugin(SplitText, CustomBounce, CustomEase);
      // CUSTOMBOUNCE REGISTRA INTERNAMENTE UNA CUSTOMEASE DEL MISMO NOMBRE
      if (!CustomEase.get('forgeBurst')) {
        CustomBounce.create('forgeBurst', { strength: 0.6, squash: 1.4 });
      }
      this.pluginsRegistered = true;
    }
    // LANZAMOS LA ANIMACION DE ENTRADA DE LA TARJETA
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

  // LANZA LA TIMELINE DE ENTRADA DE LA PANTALLA DE REGISTRO
  private runEnterTimeline(): void {
    // ROOT DEL DOM PARA QUERIES
    const root = this.rootEl?.nativeElement;
    if (!root) return;
    // MATAMOS LA TIMELINE ANTERIOR SI EXISTIA
    this.lastTl?.kill();
    // SI EL USUARIO PIDE MOTION REDUCIDA, NO ANIMAMOS NADA
    if (this.reducedMotion) return;
    // SELECCIONAMOS HERO Y CARD PRINCIPAL
    const hero = root.querySelector('.rg-hero') as HTMLElement | null;
    const card = root.querySelector('.rg-card') as HTMLElement | null;
    // HEADLINE A DIVIDIR POR CHARS
    const headline = root.querySelector('.rg-title') as HTMLElement | null;
    // TIMELINE BASE CON EASE POWER3 PARA ENTRADAS
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    // HERO BAJA SUAVE DESDE ARRIBA CON FROMTO PARA QUE EL ESTADO FINAL SEA EXPLICITO
    if (hero) {
      tl.fromTo(hero,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.5 });
    }
    // HEADLINE SPLIT CHARS
    if (headline) {
      this.splitText = new SplitText(headline, { type: 'chars,words' });
      tl.fromTo(this.splitText.chars,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.016 },
        '-=0.35');
    }
    // CARD SUBE DESDE ABAJO
    if (card) {
      tl.fromTo(card,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.55 },
        '-=0.3');
    }
    this.lastTl = tl;
  }

  // GETTER QUE CALCULA LA PUNTUACION DE FORTALEZA DE LA CONTRASEÑA (0-5)
  get passwordStrength(): number {
    if (!this.password) return 0;
    let score = 0;
    // LONGITUD MINIMA RECOMENDADA SEGUN OWASP
    if (this.password.length >= 8)  score++;
    // LONGITUD ALTA RECOMENDADA PARA CONTRASEÑAS MAESTRAS
    if (this.password.length >= 12) score++;
    // INCLUYE AL MENOS UNA MAYUSCULA
    if (/[A-Z]/.test(this.password)) score++;
    // INCLUYE AL MENOS UN DIGITO
    if (/[0-9]/.test(this.password)) score++;
    // INCLUYE AL MENOS UN CARACTER ESPECIAL
    if (/[^A-Za-z0-9]/.test(this.password)) score++;
    return score;
  }

  // GETTER QUE TRADUCE LA PUNTUACION A UNA ETIQUETA LEGIBLE
  get passwordStrengthLabel(): string {
    const s = this.passwordStrength;
    if (!this.password) return 'Sin forjar';
    if (s <= 1) return 'Muy débil';
    if (s === 2) return 'Débil';
    if (s === 3) return 'Media';
    if (s === 4) return 'Fuerte';
    return 'Muy fuerte';
  }

  // GETTER QUE TRADUCE LA PUNTUACION A UN COLOR DE LA PALETA
  get passwordStrengthColor(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'var(--color-danger)';
    if (s === 2) return 'var(--color-warning)';
    if (s === 3) return 'var(--color-accent)';
    return 'var(--color-success)';
  }

  // GETTER QUE INDICA SI LA CONFIRMACION COINCIDE CON LA CONTRASEÑA INICIAL
  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword && this.confirmPassword !== '';
  }

  // GETTER QUE DEVUELVE EL PASO ACTUAL DEL REGISTRO PARA EL STEPPER VISUAL
  // PASO 1 = NOMBRE COMPLETO, PASO 2 = EMAIL COMPLETO, PASO 3 = CONTRASEÑAS COINCIDIENDO
  get currentStep(): number {
    let step = 0;
    if (this.name.trim().length > 0) step = 1;
    if (step === 1 && this.email.trim().length > 0) step = 2;
    if (step === 2 && this.passwordsMatch && this.passwordStrength >= 3) step = 3;
    return step;
  }

  // GETTER QUE DEVUELVE EL MOOD DE ARGUS SEGUN EL ESTADO ACTUAL DEL FORMULARIO
  get argusMood(): ArgusMood {
    // SI HAY ERROR DE BACKEND, ARGUS REACCIONA EN ERROR
    if (this.errorMessage) return 'error';
    // SI ESTA EN PLENO LOADING DE REGISTRO, ARGUS PASA A LOADING
    if (this.isLoading) return 'loading';
    // SI EL USUARIO ESCRIBIO UNA CONTRASEÑA DEBIL, ARGUS SE PONE EN ALERTA
    if (this.password && this.passwordStrength <= 1) return 'alert';
    // SI LA CONTRASEÑA ES FUERTE Y CONFIRMA COINCIDE, ARGUS ESTA EXCITED
    if (this.passwordStrength >= 4 && this.passwordsMatch) return 'excited';
    // CON CONTRASEÑA FUERTE PERO SIN CONFIRMAR, ARGUS HAPPY
    if (this.passwordStrength >= 4) return 'happy';
    // SI ESTA ESCRIBIENDO EN CUALQUIER CAMPO, ARGUS PIENSA
    if (this.focusedField) return 'thinking';
    // DEFECTO — ARGUS IDLE OBSERVANDO
    return 'idle';
  }

  // INDICA QUE EL BOTON DE SUBMIT ESTA ENERGIZADO (TODAS LAS CONDICIONES OK)
  get canSubmit(): boolean {
    return !!this.name && !!this.email && !!this.password &&
      this.passwordsMatch && this.acceptTerms && !this.isLoading;
  }

  // HANDLER DE FOCUS — APUNTA QUE CAMPO ESTA ENFOCADO PARA CAMBIAR EL MOOD
  onFocus(field: 'name' | 'email' | 'password' | 'confirm'): void {
    this.focusedField = field;
  }

  // HANDLER DE BLUR — LIMPIA EL CAMPO ENFOCADO SI COINCIDE
  onBlur(field: 'name' | 'email' | 'password' | 'confirm'): void {
    if (this.focusedField === field) this.focusedField = null;
  }

  // HANDLER DE INPUT DE PASSWORD — DISPARA BURST CUANDO ALCANZA FORTALEZA MAXIMA UNA SOLA VEZ
  onPasswordInput(): void {
    // SI LA FORTALEZA NO ES MAXIMA, REINICIAMOS EL FLAG PARA PERMITIR FUTURO BURST
    if (this.passwordStrength < 5) {
      this.burstedOnce = false;
      return;
    }
    // SI YA SE LANZO EL BURST EN ESTA SESION DE TYPED, NO REPETIMOS
    if (this.burstedOnce) return;
    // SI EL USUARIO PIDE MOTION REDUCIDA, SOLO MARCAMOS FLAG SIN ANIMAR
    if (this.reducedMotion) {
      this.burstedOnce = true;
      return;
    }
    // MARCAMOS QUE YA SE LANZO PARA EVITAR REPETICIONES
    this.burstedOnce = true;
    // LANZAMOS EL DESTELLO DEL ANILLO DE FORTALEZA UNA SOLA VEZ
    const ring = this.rootEl?.nativeElement?.querySelector('.rg-forge-ring') as HTMLElement | null;
    if (!ring) return;
    // TIMELINE DEL DESTELLO: ESCALA + REGRESO CON EASE
    const tl = gsap.timeline();
    tl.fromTo(ring,
      { scale: 1 },
      { scale: 1.18, duration: 0.45, ease: 'forgeBurst' }
    ).to(ring,
      { scale: 1, duration: 0.4, ease: 'power2.out' },
      '+=0.05'
    );
  }

  // HANDLER DE REGISTRO — LLAMA AL BACKEND REAL CON AUTH ZERO-KNOWLEDGE
  async register() {
    // VALIDACION DEFENSIVA — AUNQUE EL BOTON ESTE DESHABILITADO, NO REGISTRAR SIN DATOS
    if (!this.canSubmit) return;
    // ACTIVAMOS EL ESTADO DE CARGA PARA DESHABILITAR EL BOTON Y MOSTRAR SPINNER
    this.isLoading = true;
    // LIMPIAMOS CUALQUIER ERROR PREVIO ANTES DE INTENTAR EL REGISTRO
    this.errorMessage = '';
    try {
      // INVOCA AL AUTHSERVICE QUE DERIVA EL auth_hash EN LOCAL Y LLAMA AL BACKEND
      await this.authService.register(this.email, this.password);
      // SI EL REGISTRO FUE EXITOSO, MOSTRAMOS BREVEMENTE A ARGUS EN SUCCESS Y NAVEGAMOS
      await this.successAndNavigate('/dashboard');
    } catch (err: any) {
      // PROPAGAMOS EL MENSAJE DE ERROR AL USUARIO
      this.errorMessage = err?.message || 'No se pudo completar el registro';
      // LANZAMOS UN SHAKE SOBRE LA TARJETA PRINCIPAL PARA SUBRAYAR EL ERROR
      this.shakeCard();
    } finally {
      // DESACTIVAMOS EL ESTADO DE CARGA INDEPENDIENTEMENTE DEL RESULTADO
      this.isLoading = false;
    }
  }

  // ANIMA SHAKE HORIZONTAL DEL CARD AL FALLAR EL REGISTRO
  private shakeCard(): void {
    // RESPETO DE MOTION REDUCIDA — SIN SHAKE
    if (this.reducedMotion) return;
    // SELECCIONAMOS EL CARD PRINCIPAL DEL FORMULARIO
    const card = this.rootEl?.nativeElement?.querySelector('.rg-card') as HTMLElement | null;
    if (!card) return;
    // SHAKE BREVE CON 3 OSCILACIONES DECRECIENTES
    gsap.fromTo(card,
      { x: 0 },
      { x: 0, duration: 0.4, ease: 'power3.out',
        keyframes: [
          { x: -8 }, { x: 8 }, { x: -6 }, { x: 6 }, { x: 0 }
        ] });
  }

  // MUESTRA UN FLASH DE SUCCESS Y NAVEGA TRAS UN BREVE DELAY
  private async successAndNavigate(url: string): Promise<void> {
    // SI EL USUARIO PIDE MOTION REDUCIDA, NAVEGAMOS DE INMEDIATO
    if (this.reducedMotion) {
      this.router.navigateByUrl(url);
      return;
    }
    // ESPERAMOS UN BREVE INSTANTE PARA QUE EL CAMBIO DE MOOD SEA PERCEPTIBLE
    await new Promise(resolve => setTimeout(resolve, 600));
    // NAVEGACION FINAL AL DASHBOARD
    this.router.navigateByUrl(url);
  }

  // NAVEGACION HACIA LA PAGINA DE LOGIN PARA USUARIOS QUE YA TIENEN CUENTA
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // NAVEGACION HACIA ATRAS — VUELVE AL ONBOARDING
  goBack() {
    this.router.navigateByUrl('/onboarding');
  }
}
