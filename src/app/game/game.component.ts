import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SetupPageComponent } from '../setup-page/setup-page.component';
import { tap } from 'rxjs';
import { BoardTile } from './board-tile/board-tile.component';
import { HostListener } from '@angular/core';
import { CharacterService } from '../character.service';

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

  // number = Math.floor(Math.random() * 20); // roll a d20
  rD20(): number {
    return Math.floor(Math.random() * 20);
  }

  hoveredTile: BoardTile | null = null;
  gameLog: string[] = [];

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
          this.redCount = res.redCount;
          this.blueCount = res.blueCount;
          this.boardWidth = res.boardWidth;
          this.boardHeight = res.boardHeight;
          this.generateBoard(this.boardWidth, this.boardHeight);
          this.placeUnits();
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
    this.board[1][1].hovered = true;
    this.hoveredTile = this.board[1][1];
    this.cursorX = 1;
    this.cursorY = 1;
  }

  testBoards(): void {
    this.board[0][0].team = 'blue';
    this.board[1][1].team = 'red';
    this.board[2][2].hovered = true;
    this.board[3][3].terrain = 'difficult';
    this.board[4][4].terrain = 'water';
    this.board[5][5].terrain = 'impassable';
    this.board[6][6].terrain = 'water';
  }

  placeUnits(): void {
    // eventually get more complicated

    const red = this.charService.Bandit;
    let redPlaced = 0;
    for (let index = 0; index < this.boardWidth; index++) {
      this.board[0][index].occupant = red;
      this.board[0][index].team = 'red';
      redPlaced++;
      if (redPlaced === this.redCount) {
        break;
      }
    }

    const blue = this.charService.Skeleton;
    let bluePlaced = 0;
    for (let index = this.boardWidth - 1; index >= 0; index--) {
      this.board[this.boardHeight - 1][index].occupant = blue;
      this.board[this.boardHeight - 1][index].team = 'blue';
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
}
