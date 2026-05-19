// ═══════════════════════════════════════════════════════════════════
// PROFILE PAGE MODULE — REGISTRA EL CENTRO DE COMANDO PERSONAL
// IMPORTA EL COMPONENTE STANDALONE DE LA MASCOTA "ARGUS CUB" Y EL
// FormsModule PARA LOS INPUTS NGMODEL DE LA EDICION INLINE.
// ═══════════════════════════════════════════════════════════════════

// IMPORTACIONES DEL CORE DE ANGULAR — SCHEMA PARA CUSTOM ELEMENTS DE PHOSPHOR
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
// IMPORTACION DEL MODULO COMUN DE ANGULAR PARA *ngIf / *ngFor
import { CommonModule } from '@angular/common';
// IMPORTACION DE FORMSMODULE PARA EL [(ngModel)] DEL NOMBRE EDITABLE
import { FormsModule } from '@angular/forms';

// IMPORTACION DEL MODULO DE IONIC PARA HEADER, BUTTONS Y CONTENT
import { IonicModule } from '@ionic/angular';

// IMPORTACION DEL ROUTING ESPECIFICO DEL PROFILE
import { ProfilePageRoutingModule } from './profile-routing.module';

// IMPORTACION DEL COMPONENTE DE LA PAGINA QUE QUEDA DECLARADO EN EL MODULO
import { ProfilePage } from './profile.page';
// IMPORTACION DEL COMPONENTE STANDALONE "ARGUS CUB" — MASCOTA DURMIENTE
import { ArgusCubComponent } from '../shared/components/argus-cub/argus-cub.component';

@NgModule({
  imports: [
    // MODULOS BASICOS DE ANGULAR + FORM SUPPORT + IONIC
    CommonModule,
    FormsModule,
    IonicModule,
    // ROUTING DEDICADO DE LA PAGINA
    ProfilePageRoutingModule,
    // COMPONENTE STANDALONE — ENTRA EN imports, NO EN declarations
    ArgusCubComponent,
  ],
  declarations: [ProfilePage],
  // PERMITE USAR LOS CUSTOM ELEMENTS DE PHOSPHOR ICONS EN LA PLANTILLA
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfilePageModule {}
