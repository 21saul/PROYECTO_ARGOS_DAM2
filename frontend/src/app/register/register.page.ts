// IMPORTACION DEL DECORADOR COMPONENT DE ANGULAR
import { Component } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION PROGRAMATICA TRAS EL REGISTRO
import { Router } from '@angular/router';
// IMPORTACION DE GSAP PARA ANIMACIONES DE ENTRADA
import { gsap } from 'gsap';

// METADATOS DEL COMPONENTE DE REGISTRO DE ARGOS
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false
})
export class RegisterPage {

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
  // PASO ACTUAL DEL FORMULARIO MULTIPASO POR SI EN EL FUTURO SE DIVIDE EN PANTALLAS
  currentStep = 1;

  // INYECCION DEL ROUTER PARA NAVEGAR AL DASHBOARD O VOLVER AL LOGIN
  constructor(private router: Router) {}

  // HOOK DE IONIC ANTES DE ENTRAR — FUERZA TEMA OSCURO PARA REGISTRO
  ionViewWillEnter() {
    document.body.classList.remove('force-light');
    document.body.classList.add('force-dark');
  }

  // HOOK DE IONIC ANTES DE SALIR — RESTAURA EL TEMA AUTOMATICO
  ionViewWillLeave() {
    document.body.classList.remove('force-dark');
  }

  // HOOK DE IONIC TRAS RENDERIZAR — LANZA LA ANIMACION DE ENTRADA DE LA TARJETA
  ionViewDidEnter() {
    gsap.fromTo('.register-card',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.1 }
    );
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
    if (s <= 1) return 'Muy débil';
    if (s === 2) return 'Débil';
    if (s === 3) return 'Media';
    if (s === 4) return 'Fuerte';
    return 'Muy fuerte';
  }

  // GETTER QUE TRADUCE LA PUNTUACION A UN COLOR DE LA PALETA DE LA APP
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

  // HANDLER DE REGISTRO — VALIDA, SIMULA EL ALTA Y NAVEGA AL DASHBOARD
  async register() {
    if (!this.name || !this.email || !this.password || !this.acceptTerms) return;
    // ACTIVAMOS EL ESTADO DE CARGA PARA DESHABILITAR EL BOTON Y MOSTRAR SPINNER
    this.isLoading = true;
    // SIMULACION DE LATENCIA DE REGISTRO ANTES DE NAVEGAR AL DASHBOARD
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1500);
  }

  // NAVEGACION HACIA LA PAGINA DE LOGIN PARA USUARIOS QUE YA TIENEN CUENTA
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
