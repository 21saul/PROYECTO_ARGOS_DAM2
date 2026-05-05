import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
// COMPONENTE STANDALONE DE LA MASCOTA ARGUS
import { ArgusComponent } from '../shared/components/argus/argus.component';
// COMPONENTE STANDALONE DE RED DE PARTÍCULAS PARA FONDO DECORATIVO
import { ParticleNetworkComponent } from '../shared/components/particle-network/particle-network.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    ArgusComponent,
    ParticleNetworkComponent
  ],
  declarations: [DashboardPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardPageModule {}
