import { Injectable } from '@angular/core';

export interface Character {
  name: string;
  stats: {
    hp: number;
    maxHP: number;
    ac: number;
    spd: number;
    initiative: number;
  };
  attacks: Attack[];
  // activation(): string;
}

export interface Unit {
  unit: Character;
  x: number;
  y: number;
  initiative: number;
  team: string;
}

export interface Attack {
  name: string;
  hit: number;
  rollCount: number;
  rollDie: number;
  modifier: number;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  Bandit: Character = {
    name: 'Bandit',
    stats: {
      hp: 11,
      maxHP: 11,
      ac: 12,
      spd: 30,
      initiative: 1,
    },
    attacks: [
      {
        name: 'Scimitar',
        hit: 3,
        rollDie: 6,
        rollCount: 1,
        modifier: 1,
        type: 'slash',
      },
    ],
  };

  Skeleton: Character = {
    name: 'Skeleton',
    stats: {
      hp: 13,
      maxHP: 13,
      ac: 13,
      spd: 30,
      initiative: 2,
    },
    attacks: [
      {
        name: 'Shortsword',
        hit: 4,
        rollCount: 1,
        rollDie: 6,
        modifier: 2,
        type: 'pierce',
      },
    ],
  };
}
