import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TitlePageComponent } from './title-page/title-page.component';

import { GameComponent } from './game/game.component';
import { GameOverComponent } from './game-over/game-over.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'Title',
    pathMatch: 'full',
  },
  {
    path: 'Title',
    component: TitlePageComponent,
  },
  {
    path: 'Results/:team',
    component: GameOverComponent,
  },
  {
    path: 'Battle',
    component: GameComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
