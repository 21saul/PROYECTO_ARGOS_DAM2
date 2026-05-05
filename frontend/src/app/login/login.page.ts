// IMPORTACION DEL DECORADOR COMPONENT DE ANGULAR
import { Component } from '@angular/core';
// IMPORTACION DEL ROUTER PARA NAVEGACION PROGRAMATICA TRAS EL LOGIN
import { Router } from '@angular/router';
// IMPORTACION DE GSAP PARA ANIMACIONES DE ENTRADA Y FEEDBACK DE BOTON
import { gsap } from 'gsap';

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

  // INYECCION DEL ROUTER PARA NAVEGAR AL DASHBOARD O AL REGISTRO
  constructor(private router: Router) {}

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

  // HANDLER DE LOGIN — VALIDA, SIMULA AUTENTICACION Y NAVEGA AL DASHBOARD
  async login() {
    if (!this.email || !this.password) return;
    // ACTIVAMOS EL ESTADO DE CARGA PARA DESHABILITAR EL BOTON Y MOSTRAR SPINNER
    this.isLoading = true;
    // FEEDBACK VISUAL DE PULSACION SOBRE EL BOTON DE LOGIN
    gsap.to('.login-btn', { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });
    // SIMULACION DE LATENCIA DE LOGIN ANTES DE NAVEGAR AL DASHBOARD
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1200);
  }

  // NAVEGACION HACIA LA PAGINA DE REGISTRO PARA NUEVOS USUARIOS
  goToRegister() {
    this.router.navigate(['/register']);
  }
}
