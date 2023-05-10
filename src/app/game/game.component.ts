import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SetupPageComponent } from '../setup-page/setup-page.component';
import { tap } from 'rxjs';

export interface setUpStats {
  boardWidth: number;
  boardHeight: number;
  // boardType: enum

  // eventually replace with an array of units once not all just bandits
  redCount: number;
  blueCount: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  constructor(private dialog: MatDialog, private router: Router) {}

  redCount = 0;
  blueCount = 0;
  boardWidth = 0;
  boardHeight = 0;

  ngOnInit(): void {
    const dialogRef = this.dialog.open(SetupPageComponent, {
      width: '100%',
      height: '100%',
    });

    dialogRef
      .afterClosed()
      .pipe(
        tap((res: setUpStats) => {
          this.redCount = res.redCount;
          this.blueCount = res.blueCount;
          this.boardWidth = res.boardWidth;
          this.boardHeight = res.boardHeight;
        }),
        tap(() => {
          console.log(this.redCount);
          console.log(this.blueCount);
          console.log(this.boardWidth);
          console.log(this.boardHeight);
        })
      )
      .subscribe();
  }

  redWin(): void {
    this.router.navigateByUrl('/Results/red');
  }
  blueWin(): void {
    this.router.navigateByUrl('/Results/blue');
  }
}
