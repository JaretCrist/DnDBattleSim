import { Injectable } from '@angular/core';

export class Character {
  name: string;
  stats: {
    hp: number;
    maxHP: number;
    ac: number;
    spd: number;
    initiative: number;
  };
  attacks: Attack[];
  attackCount: number;

  constructor(copiedChar?: Character) {
    this.name = copiedChar ? copiedChar.name : '';
    this.stats = copiedChar
      ? copiedChar.stats
      : {
          hp: 0,
          maxHP: 0,
          ac: 0,
          spd: 0,
          initiative: 0,
        };
    this.attacks = copiedChar ? copiedChar.attacks : [];
    this.attackCount = copiedChar ? copiedChar.attackCount : 0;
  }
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
  range: number;
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
        rollCount: 1,
        rollDie: 6,
        modifier: 1,
        type: 'slash',
        range: 1,
      },
      {
        name: 'Light Crossbow',
        hit: 3,
        rollCount: 1,
        rollDie: 8,
        modifier: 1,
        type: 'pierce',
        range: 16,
      },
    ],
    attackCount: 1,
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
        range: 1,
      },
    ],
    attackCount: 1,
  };

  GlassCannon: Character = {
    name: 'Glass Cannon',
    stats: {
      hp: 1,
      maxHP: 1,
      ac: 1,
      spd: 50,
      initiative: 5,
    },
    attacks: [
      {
        name: 'Rapier',
        hit: 7,
        rollCount: 1,
        rollDie: 8,
        modifier: 7,
        type: 'pierce',
        range: 1,
      },
    ],
    attackCount: 3,
  };
}
