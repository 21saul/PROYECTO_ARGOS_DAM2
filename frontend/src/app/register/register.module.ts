// IMPORTACION DE NGMODULE Y CUSTOM_ELEMENTS_SCHEMA PARA WEB COMPONENTS DE PHOSPHOR
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
// IMPORTACION DEL COMMONMODULE PARA DIRECTIVAS BASICAS DE ANGULAR
import { CommonModule } from '@angular/common';
// IMPORTACION DE FORMSMODULE PARA NGMODEL EN LOS INPUTS
import { FormsModule } from '@angular/forms';

// IMPORTACION DE IONICMODULE PARA COMPONENTES DE IONIC
import { IonicModule } from '@ionic/angular';

// IMPORTACION DEL MODULO DE RUTAS DE REGISTRO
import { RegisterPageRoutingModule } from './register-routing.module';

// IMPORTACION DEL COMPONENTE DE LA PAGINA DE REGISTRO
import { RegisterPage } from './register.page';
// COMPONENTE STANDALONE DE LA MASCOTA ARGUS USADO EN EL HERO REACTIVO
import { ArgusComponent } from '../shared/components/argus/argus.component';
// COMPONENTE STANDALONE DE LA RED DE PARTICULAS USADO COMO FONDO ANIMADO
import { ParticleNetworkComponent } from '../shared/components/particle-network/particle-network.component';

// MODULO DE LA PAGINA DE REGISTRO — DECLARA EL COMPONENTE Y LAS DEPENDENCIAS
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterPageRoutingModule,
    ArgusComponent,
    ParticleNetworkComponent
  ],
  declarations: [RegisterPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RegisterPageModule {}
