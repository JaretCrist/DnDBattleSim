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
  // boardType: enum; // This is for the stretch goal of prebuilt terrain maps

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
  redUnit: Character = this.charService.characterList[0];
  blueUnit: Character = this.charService.characterList[1];

  currentInitiative = -1;
  actionsLeft = 0;
  movementLeft = 0;
  // needed for unmarking movable tiles if cursor has moved
  currentInitX = 0;
  currentInitY = 0;

  selectedAction = '';

  // cursor modes
  movementMode = false;
  actionMenuMode = false;
  actionMode = false;

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
        this.enterFunction();
        break;

      case 'Backspace':
        if (this.movementMode) {
          this.movementMode = false;
          this.board[this.cursorY][this.cursorX].movementMode = false;
        }
        if (this.actionMode) {
          this.actionMode = false;
          this.board[this.cursorY][this.cursorX].actionMode = false;
        }
        break;

      default:
        break;
    }
  }

  handleClick(position: { x: number; y: number }): void {
    // set cursor to clicked location
    this.moveCursor('click', position);
    this.enterFunction();
  }

  enterFunction(): void {
    if (!this.actionMenuMode && !this.movementMode && !this.actionMode)
      this.openActions();
    else if (!this.actionMenuMode && this.movementMode) this.moveUnit();
    else if (this.actionMode) this.action();
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
            const tempRedUnit = this.charService.characterList.find(
              (character) => character.name === res.redCreature
            );
            if (tempRedUnit) this.redUnit = tempRedUnit;

            const tempBlueUnit = this.charService.characterList.find(
              (character) => character.name === res.blueCreature
            );
            if (tempBlueUnit) this.blueUnit = tempBlueUnit;

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
        const temp: BoardTile = new BoardTile(j, i);
        col.push(temp);
      }
      this.board.push(col);
    }

    // copy board onto terrainOnlyBoard so
    //   tiles don't reset after being moved from
  }

  // eventually get more complicated
  // Currently: red starts top left corner, blue starts bottom right
  placeUnits(): void {
    let redPlaced = 0;
    let yCoord = 0;
    while (redPlaced < this.redCount) {
      for (let index = yCoord; index < this.boardWidth; index++) {
        const newRed = new Character(this.redUnit);
        this.board[yCoord][index].occupant = newRed;
        this.board[yCoord][index].team = 'red';

        const redWithLocation: Unit = {
          unit: newRed,
          x: index,
          y: yCoord,
          initiative: this.rollDie(20) + newRed.stats.initiative,
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
        const newBlue = new Character(this.blueUnit);
        this.board[yCoord][index].occupant = newBlue;
        this.board[yCoord][index].team = 'blue';

        const blueWithLocation: Unit = {
          unit: newBlue,
          x: index,
          y: yCoord,
          initiative: this.rollDie(20) + newBlue.stats.initiative,
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
  moveCursor(
    direction: 'up' | 'down' | 'left' | 'right' | 'click',
    position?: { x: number; y: number }
  ): void {
    if (!this.actionMenuMode) {
      this.board[this.cursorY][this.cursorX].hovered = false;
      this.board[this.cursorY][this.cursorX].movementMode = false;
      this.board[this.cursorY][this.cursorX].actionMode = false;

      if (direction === 'up') {
        this.cursorY--;
        if (this.cursorY < 0) this.cursorY = this.boardHeight - 1;
      } else if (direction === 'down') {
        this.cursorY++;
        if (this.cursorY > this.boardHeight - 1) this.cursorY = 0;
      } else if (direction === 'left') {
        this.cursorX--;
        if (this.cursorX < 0) this.cursorX = this.boardWidth - 1;
      } else if (direction === 'right') {
        this.cursorX++;
        if (this.cursorX > this.boardWidth - 1) this.cursorX = 0;
      } else if (position) {
        this.cursorX = position.x;
        this.cursorY = position.y;
      }

      this.board[this.cursorY][this.cursorX].hovered = true;
      this.board[this.cursorY][this.cursorX].movementMode = this.movementMode;
      this.board[this.cursorY][this.cursorX].actionMode = this.actionMode;
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

    this.gameLog.push('--------------------------');
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
    this.board[this.currentInitY][this.currentInitX].currentInitiative = false;

    this.cursorX = this.unitTracker[this.currentInitiative].x;
    this.cursorY = this.unitTracker[this.currentInitiative].y;
    this.currentInitX = this.cursorX;
    this.currentInitY = this.cursorY;

    this.board[this.cursorY][this.cursorX].currentInitiative = true;

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
              this.selectedAction = res.atk;
              this.actionMode = true;
              this.board[this.cursorY][this.cursorX].actionMode = true;
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
      // for the purpose of click controls, we can't swap the tiles' positions
      this.board[this.cursorY][this.cursorX].xPos = this.cursorX;
      this.board[this.cursorY][this.cursorX].yPos = this.cursorY;

      this.unitTracker[this.currentInitiative].x = this.cursorX;
      this.unitTracker[this.currentInitiative].y = this.cursorY;

      // replace following line with this.terrainOnly[Y][X]
      this.board[this.currentInitY][this.currentInitX] = new BoardTile(
        this.currentInitX,
        this.currentInitY
      );

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

  action(): void {
    let nextTurn = false;
    // verify selected tile occupant
    // This does allow team-killing
    if (this.board[this.cursorY][this.cursorX].occupant) {
      // pull correct action from unit (by name)
      const attackerName = `${
        this.unitTracker[this.currentInitiative].unit.name
      } (${this.unitTracker[this.currentInitiative].team})`;
      const attack = this.unitTracker[this.currentInitiative].unit.attacks.find(
        (attack) => attack.name === this.selectedAction
      );
      let attacked = this.board[this.cursorY][this.cursorX].occupant;

      // check hit range
      const distance = Math.max(
        Math.abs(this.cursorY - this.currentInitY),
        Math.abs(this.cursorX - this.currentInitX)
      );
      const canHit = attack ? attack.range >= distance && distance > 0 : false;

      if (attack && attacked && canHit) {
        // ROLL DICE
        const accuracy = this.rollDie(20) + attack.hit;
        this.gameLog.push(`${attackerName} rolls: ${accuracy}`);
        if (accuracy >= attacked.stats.ac) {
          let dmg = 0;
          for (let index = 0; index < attack.rollCount; index++) {
            let nextHit = this.rollDie(attack.rollDie) + attack.modifier;
            if (nextHit === 20 + attack.modifier) {
              nextHit *= 2;
              this.gameLog.push('Critical Hit!');
            }
            dmg += nextHit;
          }
          this.gameLog.push(`Hit: ${dmg} dmg (${attack.type})`);

          attacked.stats.hp -= dmg;
          if (attacked.stats.hp <= 0) {
            if (this.board[this.cursorY][this.cursorX].team === 'red') {
              this.redCount--;
              this.gameLog.push(`${attacked.name} died`);
            } else if (this.board[this.cursorY][this.cursorX].team === 'blue') {
              this.blueCount--;
              this.gameLog.push(`${attacked.name} died`);
            } else {
              this.gameLog.push(
                `How did you kill something that doesn't exists`
              );
            }

            attacked = null;
            this.board[this.cursorY][this.cursorX].team = null;
          }
          this.board[this.cursorY][this.cursorX].occupant = attacked;
        } else {
          this.gameLog.push('Miss!');
        }

        // check for nextTurn conditions
        this.actionsLeft--;
        if (
          (this.movementLeft <= 0 && this.actionsLeft <= 0) ||
          this.redCount === 0 ||
          this.blueCount === 0
        ) {
          nextTurn = true;
        }
      }
    }

    // change cursor mode
    this.actionMode = false;
    this.board[this.cursorY][this.cursorX].actionMode = false;
    if (nextTurn) {
      this.nextTurn();
    }
  }
}

function compareInitiative(a: Unit, b: Unit): number {
  if (a.initiative > b.initiative) return -1;
  if (b.initiative > a.initiative) return 1;

  return 0;
}
