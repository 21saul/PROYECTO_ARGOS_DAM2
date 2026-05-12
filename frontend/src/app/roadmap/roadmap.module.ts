import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RoadmapPageRoutingModule } from './roadmap-routing.module';

import { RoadmapPage } from './roadmap.page';
// MASCOTA "ARGUS CUB" — VARIANTE DURMIENTE DEL TITAN PARA EL ROADMAP
import { ArgusCubComponent } from '../shared/components/argus-cub/argus-cub.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RoadmapPageRoutingModule,
    // EL COMPONENTE STANDALONE SE ANADE EN imports, NO EN declarations
    ArgusCubComponent
  ],
  declarations: [RoadmapPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RoadmapPageModule {}
