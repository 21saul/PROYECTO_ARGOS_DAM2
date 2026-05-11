// IMPORTACION DEL DECORADOR COMPONENT DE ANGULAR
import { Component } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION PROGRAMATICA TRAS EL LOGIN
import { Router } from '@angular/router';
// IMPORTACION DE GSAP PARA ANIMACIONES DE ENTRADA Y FEEDBACK DE BOTON
import { gsap } from 'gsap';
// IMPORTACION DEL SERVICIO DE AUTENTICACION ZERO-KNOWLEDGE
import { AuthService } from '../services/auth.service';

// METADATOS DEL COMPONENTE DE LOGIN DE ARGOS
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false
})
export class LoginPage {

  // EMAIL INTRODUCIDO POR EL USUARIO PARA INICIAR SESION
  email = '';
  // CONTRASEÑA MAESTRA INTRODUCIDA POR EL USUARIO
  password = '';
  // FLAG QUE CONTROLA SI LA CONTRASEÑA SE MUESTRA EN CLARO
  showPassword = false;
  // FLAG QUE INDICA QUE LA AUTENTICACION ESTA EN PROCESO
  isLoading = false;
  // MENSAJE DE ERROR DE LA ULTIMA LLAMADA AL BACKEND (VACIO SI NO HAY ERROR)
  errorMessage = '';

  // INYECCION DEL ROUTER Y DEL AUTHSERVICE PARA AUTENTICAR Y NAVEGAR
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  // HOOK DE IONIC ANTES DE ENTRAR — FUERZA TEMA OSCURO PARA LOGIN
  ionViewWillEnter() {
    document.body.classList.remove('force-light');
    document.body.classList.add('force-dark');
  }

  // HOOK DE IONIC ANTES DE SALIR — RESTAURA EL TEMA AUTOMATICO
  ionViewWillLeave() {
    document.body.classList.remove('force-dark');
  }

  // HOOK DE IONIC TRAS RENDERIZAR — LANZA ANIMACIONES DE ENTRADA
  ionViewDidEnter() {
    // ANIMACION DEL LOGO CON REBOTE Y ESCALA
    gsap.fromTo('.login-logo',
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
    // ANIMACION DEL FORMULARIO DESDE ABAJO HACIA ARRIBA
    gsap.fromTo('.login-form-wrap',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.2 }
    );
  }

  // HANDLER DE LOGIN — LLAMA AL BACKEND REAL CON AUTH ZERO-KNOWLEDGE
  async login() {
    if (!this.email || !this.password) return;
    // ACTIVAMOS EL ESTADO DE CARGA PARA DESHABILITAR EL BOTON Y MOSTRAR SPINNER
    this.isLoading = true;
    // LIMPIAMOS CUALQUIER ERROR PREVIO ANTES DE INTENTAR LA AUTENTICACION
    this.errorMessage = '';
    // FEEDBACK VISUAL DE PULSACION SOBRE EL BOTON DE LOGIN
    gsap.to('.login-btn', { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });
    try {
      // INVOCA AL AUTHSERVICE QUE DERIVA EL auth_hash EN LOCAL Y LLAMA AL BACKEND
      await this.authService.login(this.email, this.password);
      // SI LA AUTENTICACION FUE EXITOSA NAVEGAMOS AL DASHBOARD
      this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      // PROPAGAMOS EL MENSAJE DE ERROR AL USUARIO (CREDENCIALES O RED)
      this.errorMessage = err?.message || 'Credenciales incorrectas';
    } finally {
      // DESACTIVAMOS EL ESTADO DE CARGA INDEPENDIENTEMENTE DEL RESULTADO
      this.isLoading = false;
    }
  }

  // NAVEGACION HACIA LA PAGINA DE REGISTRO PARA NUEVOS USUARIOS
  goToRegister() {
    this.router.navigate(['/register']);
  }
}
