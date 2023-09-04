import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SetupPageComponent } from '../setup-page/setup-page.component';
import { Subscription, finalize, tap } from 'rxjs';
import { BoardTile } from './board-tile/board-tile.component';
import { HostListener } from '@angular/core';
import { Character, CharacterService, Unit } from '../character.service';
import { ActionsDialogComponent } from './actions-dialog/actions-dialog.component';

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
export class GameComponent implements OnInit, OnDestroy {
  constructor(
    private dialog: MatDialog,
    private router: Router,
    private charService: CharacterService
  ) {}
  subscriptor = new Subscription();

  redCount = 0;
  blueCount = 0;
  boardWidth = 0;
  boardHeight = 0;

  // eventually will need a copy of "original board" once terrain is implemented
  board: BoardTile[][] = [];

  // (0, 0) is top left, (boardHeight, boardWidth) is bottom right
  cursorX = 0;
  cursorY = 0;

  hoveredTile: BoardTile | null = null;
  gameLog: string[] = [];

  unitTracker: Unit[] = [];
  redUnit: Character = this.charService.Bandit;
  blueUnit: Character = this.charService.Skeleton;

  currentInitiative = -1;
  actionsLeft = 0;
  movementLeft = 0;
  // needed for unmarking movable tiles if cursor has moved
  currentInitX = 0;
  currentInitY = 0;

  // cursor modes
  movementMode = false;
  actionMenuMode = false;

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

      case 'Enter':
        if (!this.actionMenuMode && !this.movementMode) this.openActions();
        else if (!this.actionMenuMode && this.movementMode) this.moveUnit();
        break;

      // backspace
      case 'Backspace':
        if (this.movementMode) this.movementMode = false;
        break;

      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.subscriptor.unsubscribe();
  }

  ngOnInit(): void {
    const setupDialogRef = this.dialog.open(SetupPageComponent, {
      width: '100%',
      height: '100%',
      disableClose: true,
    });

    this.subscriptor.add(
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
            if (this.unitTracker.length > 0) {
              this.nextTurn();
            }
          })
        )
        .subscribe()
    );
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

    // copy board onto terrainOnlyBoard so
    //   tiles don't reset after being moved from
  }

  // eventually get more complicated
  placeUnits(): void {
    let redPlaced = 0;
    let yCoord = 0;
    while (redPlaced < this.redCount) {
      for (let index = yCoord; index < this.boardWidth; index++) {
        this.board[yCoord][index].occupant = this.redUnit;
        this.board[yCoord][index].team = 'red';

        const redWithLocation: Unit = {
          unit: this.redUnit,
          x: index,
          y: yCoord,
          initiative: this.rollDie(20) + this.redUnit.stats.initiative,
          team: 'red',
        };
        this.unitTracker.push(redWithLocation);

        redPlaced++;
        if (redPlaced === this.redCount) {
          break;
        }
      }
      if (redPlaced === this.redCount) {
        break;
      }

      yCoord++;
    }

    let bluePlaced = 0;
    yCoord = this.boardHeight - 1;
    while (bluePlaced < this.blueCount) {
      for (let index = this.boardWidth - 1; index >= 0; index--) {
        this.board[yCoord][index].occupant = this.blueUnit;
        this.board[yCoord][index].team = 'blue';

        const blueWithLocation: Unit = {
          unit: this.blueUnit,
          x: index,
          y: yCoord,
          initiative: this.rollDie(20) + this.blueUnit.stats.initiative,
          team: 'blue',
        };
        this.unitTracker.push(blueWithLocation);

        bluePlaced++;
        if (bluePlaced === this.blueCount) {
          break;
        }
      }
      if (bluePlaced === this.blueCount) {
        break;
      }

      yCoord--;
    }
  }

  // cursor movements
  moveCursor(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.actionMenuMode) {
      this.board[this.cursorY][this.cursorX].hovered = false;
      this.board[this.cursorY][this.cursorX].movementMode = false;

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
      this.board[this.cursorY][this.cursorX].movementMode = this.movementMode;
      this.hoveredTile = this.board[this.cursorY][this.cursorX];
    }
  }

  handleStartInitiative(): void {
    this.unitTracker = this.unitTracker.sort(compareInitiative);
    this.gameLog.push('Initiative:');
    for (const unit of this.unitTracker) {
      this.gameLog.push(
        `${unit.unit.name} (${unit.team}) - ${unit.initiative}`
      );
    }
    this.gameLog.push('--------------------------');
  }

  // Check game over conditions, move to next initiative, reset variables
  nextTurn(): void {
    if (this.redCount <= 0) {
      this.blueWin();
    }
    if (this.blueCount <= 0) {
      this.redWin();
    }

    // at start of game there is no selected unit
    if (this.currentInitiative !== -1) {
      this.toggleActiveCharacter();
    }

    this.currentInitiative++;
    let nextInitiativeFound = false;
    while (!nextInitiativeFound) {
      if (this.currentInitiative > this.unitTracker.length - 1) {
        this.currentInitiative = 0;
      }
      if (this.unitTracker[this.currentInitiative].unit.stats.hp > 0) {
        nextInitiativeFound = true;
        break;
      }

      this.currentInitiative++;
    }

    this.toggleActiveCharacter();
    this.actionsLeft =
      this.unitTracker[this.currentInitiative].unit.attackCount;
    this.movementLeft =
      this.unitTracker[this.currentInitiative].unit.stats.spd / 5;

    this.markMovement();
  }

  toggleActiveCharacter(): void {
    this.board[this.cursorY][this.cursorX].hovered = false;

    this.cursorX = this.unitTracker[this.currentInitiative].x;
    this.cursorY = this.unitTracker[this.currentInitiative].y;
    this.currentInitX = this.cursorX;
    this.currentInitY = this.cursorY;

    this.board[this.cursorY][this.cursorX].currentInitiative =
      !this.board[this.cursorY][this.cursorX].currentInitiative;

    this.board[this.cursorY][this.cursorX].hovered = true;
    this.hoveredTile = this.board[this.cursorY][this.cursorX];
  }

  openActions(): void {
    this.actionMenuMode = true;

    const actionsDialog = this.dialog.open(ActionsDialogComponent, {
      width: '200px',
      position: { right: '25px', top: '25px' },
      disableClose: true,
      data: {
        atks: this.unitTracker[this.currentInitiative].unit.attacks,
        canAtk: this.actionsLeft > 0,
        canMove: this.movementLeft > 0,
      },
    });

    this.subscriptor.add(
      actionsDialog
        .afterClosed()
        .pipe(
          tap((res: string | { atk: string }) => {
            if (typeof res === 'string') {
              if (res === 'skip') {
                this.markMovement(false);
                this.nextTurn();
              } else if (res === 'move') {
                this.movementMode = true;
                this.board[this.cursorY][this.cursorX].movementMode =
                  this.movementMode;
              }
            } else {
              console.log(res.atk);
            }
          }),
          finalize(() => (this.actionMenuMode = false))
        )
        .subscribe()
    );
  }

  // mark available tiles to move to
  // changing set changes marking function to remove marks
  markMovement(set = true): void {
    for (
      let indexX = this.movementLeft * -1 + this.currentInitX;
      indexX <= this.movementLeft + this.currentInitX;
      indexX++
    ) {
      if (indexX >= 0 && indexX < this.boardWidth) {
        for (
          let indexY = this.movementLeft * -1 + this.currentInitY;
          indexY <= this.movementLeft + this.currentInitY;
          indexY++
        ) {
          if (
            indexY >= 0 &&
            indexY < this.boardHeight &&
            !this.board[indexY][indexX].occupant
          ) {
            this.board[indexY][indexX].canMoveTo = set;
          }
        }
      }
    }
  }

  moveUnit(): void {
    if (this.board[this.cursorY][this.cursorX].canMoveTo) {
      this.markMovement(false);

      // recalculate movement left
      this.movementLeft -= Math.max(
        Math.abs(this.cursorY - this.currentInitY),
        Math.abs(this.cursorX - this.currentInitX)
      );

      // swap current unit to location of cursor
      this.board[this.cursorY][this.cursorX] =
        this.board[this.currentInitY][this.currentInitX];
      // replace following line with this.terrainOnly[Y][X]
      this.board[this.currentInitY][this.currentInitX] = new BoardTile();

      this.currentInitX = this.cursorX;
      this.currentInitY = this.cursorY;
      this.board[this.cursorY][this.cursorX].hovered = true;
      this.hoveredTile = this.board[this.cursorY][this.cursorX];

      if (this.movementLeft <= 0 && this.actionsLeft <= 0) {
        this.nextTurn();
      } else {
        this.markMovement();
      }
    }

    this.movementMode = false;
    this.board[this.cursorY][this.cursorX].movementMode = this.movementMode;
  }
}

function compareInitiative(a: Unit, b: Unit): number {
  if (a.initiative > b.initiative) return -1;
  if (b.initiative > a.initiative) return 1;

  return 0;
}
