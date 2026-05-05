import { Component, AfterViewInit, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
// IMPORTACION DEL SERVICIO QUE EXPONE AVATAR Y NOMBRE COMPARTIDOS
import { UserProfileService } from '../services/user-profile.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements AfterViewInit, OnDestroy {

  // DATAURL DEL AVATAR DEL USUARIO O NULL SI NO HAY UNO PERSONALIZADO
  avatar: string | null = null;
  // NOMBRE DEL USUARIO USADO PARA DERIVAR LA INICIAL DEL BOTON AVATAR
  displayName = 'Usuario ARGOS';

  // SCORE Y CONTADORES DE GAMIFICACION
  score = 78;
  streak = 7;
  level = 5;
  achievements = 12;
  xp = 1250;

  // ETIQUETA DERIVADA DEL SCORE PARA EL PILL DE ESTADO
  get scoreLabel(): string {
    if (this.score >= 85) return 'Excelente · Sigue así';
    if (this.score >= 70) return 'Bueno · Mejora tu dispositivo';
    if (this.score >= 50) return 'Regular · Refuerza tu seguridad';
    return 'Crítico · Acción urgente';
  }

  // COLOR DEL PUNTO DE ESTADO SEGUN SCORE
  get scoreStatusColor(): string {
    if (this.score >= 70) return '#4ADE80';
    if (this.score >= 50) return '#F59E0B';
    return '#EF4444';
  }

  // CATALOGO DE MODULOS DEL DASHBOARD
  modules = [
    { iconKey: 'vault',        label: 'Bóveda',   desc: 'Contraseñas seguras', route: '/vault',   color: 'var(--color-primary)'   },
    { iconKey: 'chart-bar',    label: 'Auditor',  desc: 'Tu nota de seguridad', route: '/auditor', color: 'var(--color-secondary)' },
    { iconKey: 'fish-simple',  label: 'Phishing', desc: 'Analiza URLs',          route: '/phishing',color: 'var(--color-accent)'    },
    { iconKey: 'map-trifold',  label: 'Roadmap',  desc: 'Aprende jugando',       route: '/roadmap', color: 'var(--color-success)'   },
    { iconKey: 'bell-ringing', label: 'Noticias', desc: 'Alertas CVE',           route: '/news',    color: 'var(--color-danger)'    },
  ];

  constructor(
    private router: Router,
    private userProfile: UserProfileService,
    private destroyRef: DestroyRef
  ) {
    // SUSCRIPCION REACTIVA AL AVATAR — REFLEJA CAMBIOS HECHOS EN PERFIL
    this.userProfile.avatar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.avatar = v);
    // SUSCRIPCION AL NOMBRE PARA DERIVAR LA INICIAL DEL FALLBACK
    this.userProfile.username$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.displayName = v);
  }

  // DEVUELVE LA INICIAL DEL NOMBRE PARA EL BOTON AVATAR SIN FOTO
  getInitial(): string {
    return (this.displayName || 'U').charAt(0).toUpperCase();
  }

  // ANIMACIONES DE ENTRADA — SE EJECUTAN EN CADA VISITA A LA PAGINA
  ionViewDidEnter() {
    this.animateDashboard();
  }

  // ANIMA TODOS LOS ELEMENTOS DEL DASHBOARD CON GSAP CADA VEZ QUE LA PAGINA ENTRA
  animateDashboard() {
    // CANCELA TWEENS PREVIOS Y LIMPIA INLINE STYLES DEJADOS POR ANIMACIONES ANTERIORES
    gsap.killTweensOf('.score-num, .score-card, .score-bar-fill, .stat-card, .module-card');
    gsap.set('.score-card, .stat-card, .module-card', { clearProps: 'all' });

    // SCORE CARD — ESCALADO DE ENTRADA
    gsap.fromTo('.score-card',
      { scale: 0.94, opacity: 0, y: 8 },
      { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
    );

    // STAT CARDS — ENTRADA EN CASCADA
    gsap.fromTo('.stat-card',
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
    );

    // MODULE CARDS — ENTRADA EN CASCADA CON LIGERO REBOTE
    gsap.fromTo('.module-card',
      { y: 20, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out', delay: 0.3 }
    );

    // CONTADOR DEL SCORE — CUENTA DESDE 0 HASTA EL VALOR FINAL
    const obj = { val: 0 };
    gsap.to(obj, {
      val: this.score,
      duration: 1.1,
      delay: 0.35,
      ease: 'power2.out',
      onUpdate: () => {
        const el = document.querySelector('.score-num');
        if (el) el.textContent = Math.round(obj.val).toString();
      }
    });

    // BARRA DE PROGRESO — RELLENO HASTA EL PORCENTAJE DEL SCORE
    gsap.fromTo('.score-bar-fill',
      { width: '0%' },
      { width: this.score + '%', duration: 1.2, ease: 'power3.out', delay: 0.45 }
    );
  }

  // NAVEGACION SIMPLE — IONIC YA HACE LA TRANSICION DE PAGINA NATIVAMENTE
  goTo(route: string) {
    this.router.navigate([route]);
  }

  ngAfterViewInit() {}

  // LIMPIEZA DE ANIMACIONES PENDIENTES AL DESTRUIR EL COMPONENTE
  ngOnDestroy() {
    gsap.killTweensOf('.score-num, .stat-card, .module-card, .score-card, .score-bar-fill');
  }
}
