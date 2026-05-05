import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AuditorPageRoutingModule } from './auditor-routing.module';

import { AuditorPage } from './auditor.page';
// COMPONENTE STANDALONE DE RED DE PARTÍCULAS PARA FONDO DECORATIVO DEL HERO
import { ParticleNetworkComponent } from '../shared/components/particle-network/particle-network.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuditorPageRoutingModule,
    ParticleNetworkComponent
  ],
  declarations: [AuditorPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuditorPageModule {}
