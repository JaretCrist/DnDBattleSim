import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Character } from 'src/app/character.service';

export class BoardTile {
  occupant: Character | null;
  team: 'blue' | 'red' | null;
  terrain: 'normal' | 'difficult' | 'water' | 'impassable' | 'flyOnly';
  hovered: boolean;
  currentInitiative: boolean;
  canMoveTo: boolean;
  movementMode: boolean;
  actionMode: boolean;
  xPos: number;
  yPos: number;

  constructor(xPos: number, yPos: number) {
    this.occupant = null;
    this.team = null;
    this.terrain = 'normal';
    this.hovered = false;
    this.currentInitiative = false;
    this.canMoveTo = false;
    this.movementMode = false;
    this.actionMode = false;
    this.xPos = xPos;
    this.yPos = yPos;
  }
}

@Component({
  selector: 'app-board-tile',
  templateUrl: './board-tile.component.html',
  styleUrls: ['./board-tile.component.scss'],
})
export class BoardTileComponent implements OnChanges {
  test(): string {
    return 'test';
  }

  @Input() passedTile: BoardTile = new BoardTile(0, 0);
  @Output() position = new EventEmitter<{ x: number; y: number }>();

  displayTile: BoardTile;

  constructor() {
    this.displayTile = this.passedTile;
  }

  ngOnChanges(): void {
    this.displayTile = this.passedTile;
  }

  changeTile(newTile: BoardTile): void {
    this.displayTile = newTile;
  }

  emitPosition() {
    this.position.emit({
      x: this.displayTile.xPos,
      y: this.displayTile.yPos,
    });
  }
}
