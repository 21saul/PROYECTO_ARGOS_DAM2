// IMPORTACION DEL DECORADOR COMPONENT, HOOKS, DESTROYREF Y HELPERS DOM DE ANGULAR
import { Component, OnDestroy, DestroyRef, ViewChild, ElementRef } from '@angular/core';
// IMPORTACION DEL HELPER PARA AUTOLIMPIAR SUSCRIPCIONES RXJS
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// IMPORTACION DEL SERVICIO DE TEMA QUE GESTIONA CLARO/OSCURO/AUTO
import { ThemeService } from '../services/theme.service';
// IMPORTACION DEL SERVICIO DE PERFIL QUE GESTIONA AVATAR Y NOMBRE
import { UserProfileService } from '../services/user-profile.service';
// IMPORTACION DE GSAP PARA ANIMACIONES DE ENTRADA
import { gsap } from 'gsap';

// METADATOS DEL COMPONENTE DE LA PAGINA DE PERFIL DE ARGOS
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  // EL COMPONENTE NO ES STANDALONE PORQUE SE DECLARA EN UN NGMODULE
  standalone: false
})
export class ProfilePage implements OnDestroy {

  // FLAG QUE REFLEJA EL TEMA EFECTIVO PARA EL TOGGLE DE LA UI
  isDark = false;

  // REFERENCIA AL INPUT FILE OCULTO PARA SELECCIONAR LA IMAGEN DE AVATAR
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  // DATAURL DEL AVATAR ACTUAL O NULL SI EL USUARIO NO HA SUBIDO UNO
  avatar: string | null = null;
  // NOMBRE DEL USUARIO MOSTRADO EN EL HERO DEL PERFIL
  displayName = 'Usuario ARGOS';

  // ESTADISTICAS DE GAMIFICACION MOSTRADAS EN GRID DE 4 COLUMNAS
  stats = [
    { iconKey: 'star',         value: '1250', label: 'XP Total'    },
    { iconKey: 'fire',         value: '7',    label: 'Racha'        },
    { iconKey: 'medal',        value: '12',   label: 'Logros'       },
    { iconKey: 'map-trifold',  value: '40%',  label: 'Completado'   },
  ];

  // OPCIONES DEL MENU PRINCIPAL DE LA PAGINA DE PERFIL
  menuItems = [
    { iconKey: 'bell',          label: 'Notificaciones', desc: 'Alertas y avisos',     danger: false },
    { iconKey: 'shield-check',  label: 'Seguridad',      desc: 'PIN, biometría, 2FA',  danger: false },
    { iconKey: 'palette',       label: 'Apariencia',     desc: 'Tema, idioma, fuente', danger: false },
    { iconKey: 'export',        label: 'Exportar datos', desc: 'Copia de seguridad',   danger: false },
    { iconKey: 'question',      label: 'Ayuda y soporte',desc: 'FAQ y contacto',       danger: false },
    { iconKey: 'sign-out',      label: 'Cerrar sesión',  desc: 'Salir de tu cuenta',   danger: true  },
  ];

  // CONSTRUCTOR QUE INYECTA TEMA, DESTROYREF Y SERVICIO DE PERFIL
  constructor(
    private themeService: ThemeService,
    private destroyRef: DestroyRef,
    private userProfile: UserProfileService
  ) {
    // SUSCRIPCION AL OBSERVABLE DEL TEMA PARA MANTENER EL TOGGLE SINCRONIZADO
    this.themeService.isDark$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.isDark = v);
    // SUSCRIPCION AL OBSERVABLE DEL AVATAR PARA REFLEJAR CAMBIOS EN VIVO
    this.userProfile.avatar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.avatar = v);
    // SUSCRIPCION AL OBSERVABLE DEL NOMBRE DE USUARIO
    this.userProfile.username$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.displayName = v);
  }

  // HANDLER QUE ALTERNA EL TEMA DELEGANDO EN EL SERVICIO COMPARTIDO
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  // ABRE EL SELECTOR DE FICHEROS NATIVO PARA ELEGIR UNA NUEVA IMAGEN DE AVATAR
  openAvatarPicker(): void {
    this.avatarInput.nativeElement.click();
  }

  // GESTIONA EL FICHERO ELEGIDO POR EL USUARIO Y LO CONVIERTE EN DATAURL
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // VALIDAR TAMAÑO MAXIMO 2MB PARA EVITAR LLENAR LOCALSTORAGE
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.userProfile.setAvatar(e.target.result);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  // ELIMINA EL AVATAR PERSONALIZADO Y VUELVE A LA INICIAL POR DEFECTO
  removeAvatar(): void {
    this.userProfile.setAvatar(null);
  }

  // DEVUELVE LA INICIAL DEL NOMBRE DEL USUARIO PARA EL FALLBACK SIN AVATAR
  getInitial(): string {
    return (this.displayName || 'U').charAt(0).toUpperCase();
  }

  // HOOK DE IONIC TRAS RENDERIZAR — LANZA LAS ANIMACIONES DE ENTRADA
  ionViewDidEnter() {
    // ANIMACION DE LAS ESTADISTICAS CON EFECTO DE ESCALA Y REBOTE
    gsap.fromTo('.profile-stat',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, stagger: 0.07, ease: 'back.out(1.6)', delay: 0.1 }
    );
    // ANIMACION DE LAS OPCIONES DEL MENU DESDE LA IZQUIERDA
    gsap.fromTo('.menu-item',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out', delay: 0.4 }
    );
  }

  // HOOK DE LIMPIEZA QUE MATA TWEENS ACTIVOS AL DESTRUIR EL COMPONENTE
  ngOnDestroy() {
    gsap.killTweensOf('.profile-stat, .menu-item');
  }
}
