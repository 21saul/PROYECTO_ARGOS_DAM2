import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhishingPageRoutingModule } from './phishing-routing.module';

import { PhishingPage } from './phishing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhishingPageRoutingModule
  ],
  declarations: [PhishingPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PhishingPageModule {}
