import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PhishingPage } from './phishing.page';

const routes: Routes = [
  {
    path: '',
    component: PhishingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PhishingPageRoutingModule {}
