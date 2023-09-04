import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { ReactiveFormsModule } from '@angular/forms';

import { TitlePageComponent } from './title-page/title-page.component';
import { SetupPageComponent } from './setup-page/setup-page.component';
import { GameComponent } from './game/game.component';
import { GameOverComponent } from './game-over/game-over.component';
import { BoardTileComponent } from './game/board-tile/board-tile.component';
import { ActionsDialogComponent } from './game/actions-dialog/actions-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    TitlePageComponent,
    SetupPageComponent,
    GameComponent,
    GameOverComponent,
    BoardTileComponent,
    ActionsDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
