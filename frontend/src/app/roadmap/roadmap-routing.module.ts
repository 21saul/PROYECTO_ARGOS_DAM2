import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoadmapPage } from './roadmap.page';

const routes: Routes = [
  {
    path: '',
    component: RoadmapPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoadmapPageRoutingModule {}
