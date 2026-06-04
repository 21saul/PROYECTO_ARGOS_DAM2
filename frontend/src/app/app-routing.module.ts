// IMPORTACION DEL DECORADOR NGMODULE DE ANGULAR
import { NgModule } from '@angular/core';
// IMPORTACION DEL ROUTER Y DE LA ESTRATEGIA DE PRELOAD DE TODOS LOS MODULOS
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
// IMPORTACION DEL GUARD QUE PROTEGE LAS RUTAS QUE REQUIEREN SESION VIVA
import { authGuard } from './guards/auth.guard';

// TABLA DE RUTAS DE PRIMER NIVEL DE LA APLICACION ARGOS
const routes: Routes = [
  // RUTA RAIZ — REDIRIGE AL ONBOARDING POR DEFECTO EN ESTA FASE INICIAL
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  // RUTA DEL ONBOARDING — PRIMERA EXPERIENCIA AL INSTALAR LA APP
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./onboarding/onboarding.module').then((m) => m.OnboardingPageModule),
  },
  // RUTA DE LOGIN — PANTALLA DE INICIO DE SESION PARA USUARIOS REGISTRADOS
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  // RUTA DE REGISTRO — PANTALLA DE ALTA DE NUEVOS USUARIOS
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then((m) => m.RegisterPageModule),
  },
  // RUTA DEL DASHBOARD — PUNTO CENTRAL DE LA APP TRAS EL ONBOARDING
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardPageModule),
  },
  // RUTA DE LA BOVEDA CIFRADA ZERO-KNOWLEDGE
  {
    path: 'vault',
    canActivate: [authGuard],
    loadChildren: () => import('./vault/vault.module').then((m) => m.VaultPageModule),
  },
  // RUTA DEL ROADMAP GAMIFICADO DE APRENDIZAJE
  {
    path: 'roadmap',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./roadmap/roadmap.module').then((m) => m.RoadmapPageModule),
  },
  // RUTA DE LA PAGINA DE PERFIL Y AJUSTES DEL USUARIO
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./profile/profile.module').then((m) => m.ProfilePageModule),
  },
  // RUTA DEL PANEL DE NOTICIAS Y ALERTAS CVE
  {
    path: 'news',
    canActivate: [authGuard],
    loadChildren: () => import('./news/news.module').then((m) => m.NewsPageModule),
  },
  // RUTA DEL AUDITOR DE VIDA DIGITAL — PRIVACY SCORE EN 3 PILARES
  {
    path: 'auditor',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./auditor/auditor.module').then((m) => m.AuditorPageModule),
  },
  // RUTA DEL ANALIZADOR DE PHISHING — PIPELINE DE 4 MOTORES + HEURISTICA LOCAL
  {
    path: 'phishing',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./phishing/phishing.module').then((m) => m.PhishingPageModule),
  },
];

// DEFINICION DEL MODULO DE RUTAS PRINCIPAL DE LA APLICACION
@NgModule({
  // IMPORTAMOS EL ROUTERMODULE EN MODO RAIZ CON PRELOAD DE TODOS LOS MODULOS LAZY
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  // EXPORTAMOS EL ROUTERMODULE PARA QUE LAS DIRECTIVAS ESTEN DISPONIBLES EN APPMODULE
  exports: [RouterModule],
})
export class AppRoutingModule {}
