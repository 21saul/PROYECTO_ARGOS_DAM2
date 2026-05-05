// IMPORTACION DEL DECORADOR NGMODULE Y DEL SCHEMA PARA ELEMENTOS PERSONALIZADOS
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
// IMPORTACION DEL MODULO BASE DE DIRECTIVAS COMUNES DE ANGULAR
import { CommonModule } from '@angular/common';
// IMPORTACION DEL MODULO DE FORMULARIOS PARA SOPORTE DE NGMODEL EN ESTA PAGINA
import { FormsModule } from '@angular/forms';

// IMPORTACION DE LOS COMPONENTES Y DIRECTIVAS DE IONIC
import { IonicModule } from '@ionic/angular';

// IMPORTACION DEL MODULO DE RUTAS ESPECIFICO DE ESTA PAGINA
import { OnboardingPageRoutingModule } from './onboarding-routing.module';

// IMPORTACION DE LA CLASE DEL COMPONENTE DE LA PAGINA DE ONBOARDING
import { OnboardingPage } from './onboarding.page';
// COMPONENTE STANDALONE DE LA MASCOTA ARGUS
import { ArgusComponent } from '../shared/components/argus/argus.component';

// DEFINICION DEL MODULO ANGULAR DE LA PAGINA DE ONBOARDING
@NgModule({
  // MODULOS QUE SE IMPORTAN EN EL CONTEXTO DE ESTA PAGINA
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OnboardingPageRoutingModule,
    ArgusComponent
  ],
  // DECLARACION DEL COMPONENTE DE LA PAGINA DENTRO DEL MODULO
  declarations: [OnboardingPage],
  // SCHEMA QUE PERMITE USAR LOS WEB COMPONENTS DE SWIPER (SWIPER-CONTAINER, SWIPER-SLIDE)
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingPageModule {}
