import { Component, Input, OnChanges } from '@angular/core';
import { Character } from 'src/app/character.service';

export class BoardTile {
  occupant: Character | null;
  team: 'blue' | 'red' | null;
  terrain: 'normal' | 'difficult' | 'water' | 'impassable' | 'flyOnly';
  hovered: boolean;
  // activation(): string | null;

  constructor() {
    this.occupant = null;
    this.team = null;
    this.terrain = 'normal';
    this.hovered = false;
    // this.activation = (() => { return null;})
  }
}

// export const defaultBoardTile: BoardTile = {
//   occupant: null,
//   team: null,
//   terrain: 'normal',
//   hovered: false,
//   // activation() {
//   //   return null;
//   // },
// };

@Component({
  selector: 'app-board-tile',
  templateUrl: './board-tile.component.html',
  styleUrls: ['./board-tile.component.scss'],
})
export class BoardTileComponent implements OnChanges {
  test(): string {
    return 'test';
  }

  @Input() passedTile: BoardTile = new BoardTile();

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
}
