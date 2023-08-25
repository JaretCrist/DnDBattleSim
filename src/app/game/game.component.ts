import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SetupPageComponent } from '../setup-page/setup-page.component';
import { tap } from 'rxjs';
import { BoardTile } from './board-tile/board-tile.component';
import { HostListener } from '@angular/core';
import { Character, CharacterService, Unit } from '../character.service';

export interface setUpStats {
  boardWidth: number;
  boardHeight: number;
  // boardType: enum

  redCount: number;
  blueCount: number;
  // eventually replace with an array of units once not all just bandits
  redCreature: string;
  blueCreature: string;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  debug = false;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private charService: CharacterService
  ) {}

  redCount = 0;
  blueCount = 0;
  boardWidth = 0;
  boardHeight = 0;

  board: BoardTile[][] = [];

  // (0, 0) is top left, (boardHeight, boardWidth) is bottom right
  cursorX = 0;
  cursorY = 0;

  // rolling a nat 20 has decreased odds due to the calculation being floored
  // to fix: range 1-21 and reroll 21s
  // above applies to all dice sizes
  rollDie(size: number): number {
    let result = size + 1;
    while (result === size + 1) {
      result = Math.floor(Math.random() * size) + 1;
    }
    return result;
  }

  hoveredTile: BoardTile | null = null;
  gameLog: string[] = [];

  unitTracker: Unit[] = [];
  redUnit: Character = this.charService.Bandit;
  blueUnit: Character = this.charService.Skeleton;

  // Accept User Input
  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        this.moveCursor('up');
        break;

      case 'a':
      case 'ArrowLeft':
        this.moveCursor('left');
        break;

      case 's':
      case 'ArrowDown':
        this.moveCursor('down');
        break;

      case 'd':
      case 'ArrowRight':
        this.moveCursor('right');
        break;

      // e v o enter

      // r c p backspace

      default:
        break;
    }
  }

  ngOnInit(): void {
    const setupDialogRef = this.dialog.open(SetupPageComponent, {
      width: '100%',
      height: '100%',
      disableClose: true,
    });

    setupDialogRef
      .afterClosed()
      .pipe(
        tap((res: setUpStats) => {
          this.boardWidth = res.boardWidth;
          this.boardHeight = res.boardHeight;

          this.redCount = res.redCount;
          this.blueCount = res.blueCount;

          // replace with function when more options are added
          this.redUnit =
            res.redCreature === 'Bandit'
              ? this.charService.Bandit
              : this.charService.Skeleton;
          this.blueUnit =
            res.blueCreature === 'Bandit'
              ? this.charService.Bandit
              : this.charService.Skeleton;

          this.generateBoard(this.boardWidth, this.boardHeight);
          this.placeUnits();

          this.handleStartInitiative();
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

  generateBoard(width: number, height: number): void {
    for (let i = 0; i < height; i++) {
      const col: BoardTile[] = [];
      for (let j = 0; j < width; j++) {
        const temp: BoardTile = new BoardTile();
        col.push(temp);
      }
      this.board.push(col);
    }
  }

  // testBoards(): void {
  //   this.board[0][0].team = 'blue';
  //   this.board[1][1].team = 'red';
  //   this.board[2][2].hovered = true;
  //   this.board[3][3].terrain = 'difficult';
  //   this.board[4][4].terrain = 'water';
  //   this.board[5][5].terrain = 'impassable';
  //   this.board[6][6].terrain = 'water';
  // }

  // eventually get more complicated
  placeUnits(): void {
    let redPlaced = 0;
    for (let index = 0; index < this.boardWidth; index++) {
      this.board[0][index].occupant = this.redUnit;
      this.board[0][index].team = 'red';

      const redWithLocation: Unit = {
        unit: this.redUnit,
        x: index,
        y: 0,
        initiative: this.rollDie(20) + this.redUnit.stats.initiative,
        team: 'red',
      };
      this.unitTracker.push(redWithLocation);

      redPlaced++;
      if (redPlaced === this.redCount) {
        break;
      }
    }

    let bluePlaced = 0;
    for (let index = this.boardWidth - 1; index >= 0; index--) {
      this.board[this.boardHeight - 1][index].occupant = this.blueUnit;
      this.board[this.boardHeight - 1][index].team = 'blue';

      const blueWithLocation: Unit = {
        unit: this.blueUnit,
        x: index,
        y: this.boardHeight - 1,
        initiative: this.rollDie(20) + this.blueUnit.stats.initiative,
        team: 'blue',
      };
      this.unitTracker.push(blueWithLocation);

      bluePlaced++;
      if (bluePlaced === this.blueCount) {
        break;
      }
    }
  }

  // cursor movements
  moveCursor(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.board[this.cursorY][this.cursorX].hovered = false;
    if (direction === 'up') {
      this.cursorY--;
      if (this.cursorY < 0) this.cursorY = this.boardHeight - 1;
    } else if (direction === 'down') {
      this.cursorY++;
      if (this.cursorY > this.boardHeight - 1) this.cursorY = 0;
    } else if (direction === 'left') {
      this.cursorX--;
      if (this.cursorX < 0) this.cursorX = this.boardWidth - 1;
    } else {
      this.cursorX++;
      if (this.cursorX > this.boardWidth - 1) this.cursorX = 0;
    }
    this.board[this.cursorY][this.cursorX].hovered = true;
    this.hoveredTile = this.board[this.cursorY][this.cursorX];
  }

  handleStartInitiative(): void {
    this.unitTracker = this.unitTracker.sort(compareInitiative);
    if (this.unitTracker.length > 0) {
      this.cursorX = this.unitTracker[0].x;
      this.cursorY = this.unitTracker[0].y;
      this.board[this.cursorY][this.cursorX].hovered = true;
      this.board[this.cursorY][this.cursorX].currentInitiative = true;
      this.hoveredTile = this.board[this.cursorY][this.cursorX];
    }

    this.gameLog.push('Initiative:');
    for (const unit of this.unitTracker) {
      this.gameLog.push(
        `${unit.unit.name} (${unit.team}) - ${unit.initiative}`
      );
    }
    this.gameLog.push('');
  }
}

function compareInitiative(a: Unit, b: Unit): number {
  if (a.initiative > b.initiative) return -1;
  if (b.initiative > a.initiative) return 1;

  return 0;
}
