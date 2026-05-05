// IMPORTACION DE NGMODULE Y CUSTOM_ELEMENTS_SCHEMA PARA WEB COMPONENTS DE PHOSPHOR
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
// IMPORTACION DEL COMMONMODULE PARA DIRECTIVAS BASICAS DE ANGULAR
import { CommonModule } from '@angular/common';
// IMPORTACION DE FORMSMODULE PARA NGMODEL EN LOS INPUTS
import { FormsModule } from '@angular/forms';

// IMPORTACION DE IONICMODULE PARA COMPONENTES DE IONIC
import { IonicModule } from '@ionic/angular';

// IMPORTACION DEL MODULO DE RUTAS DE LOGIN
import { LoginPageRoutingModule } from './login-routing.module';

// IMPORTACION DEL COMPONENTE DE LA PAGINA DE LOGIN
import { LoginPage } from './login.page';

// MODULO DE LA PAGINA DE LOGIN — DECLARA EL COMPONENTE Y LAS DEPENDENCIAS
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginPageRoutingModule
  ],
  declarations: [LoginPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginPageModule {}
