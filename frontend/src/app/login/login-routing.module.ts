// IMPORTACION DEL DECORADOR NGMODULE DE ANGULAR
import { NgModule } from '@angular/core';
// IMPORTACION DEL ROUTERMODULE Y TIPO ROUTES PARA DEFINIR RUTAS HIJAS
import { Routes, RouterModule } from '@angular/router';

// IMPORTACION DEL COMPONENTE DE LA PAGINA DE LOGIN
import { LoginPage } from './login.page';

// TABLA DE RUTAS HIJAS DEL MODULO DE LOGIN
const routes: Routes = [
  {
    path: '',
    component: LoginPage
  }
];

// MODULO DE RUTAS DE LOGIN — CARGA EL COMPONENTE EN LA RUTA RAIZ DEL LAZY
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
