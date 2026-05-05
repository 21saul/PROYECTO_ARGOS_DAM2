// IMPORTACION DEL DECORADOR NGMODULE DE ANGULAR
import { NgModule } from '@angular/core';
// IMPORTACION DEL ROUTERMODULE Y TIPO ROUTES PARA DEFINIR RUTAS HIJAS
import { Routes, RouterModule } from '@angular/router';

// IMPORTACION DEL COMPONENTE DE LA PAGINA DE REGISTRO
import { RegisterPage } from './register.page';

// TABLA DE RUTAS HIJAS DEL MODULO DE REGISTRO
const routes: Routes = [
  {
    path: '',
    component: RegisterPage
  }
];

// MODULO DE RUTAS DE REGISTRO — CARGA EL COMPONENTE EN LA RUTA RAIZ DEL LAZY
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterPageRoutingModule {}
