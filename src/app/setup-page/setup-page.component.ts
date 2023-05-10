import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { setUpStats } from '../game/game.component';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-setup-page',
  templateUrl: './setup-page.component.html',
  styleUrls: ['./setup-page.component.scss'],
})
export class SetupPageComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<SetupPageComponent>,
    private fb: FormBuilder
  ) {}

  gameStats = this.fb.group({
    boardHeight: [8, [Validators.required, Validators.min(2)]],
    boardWidth: [8, [Validators.required, Validators.min(2)]],
    redCount: [3, [Validators.required, Validators.min(1)]],
    blueCount: [3, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {}

  startGame(): void {
    this.dialogRef.close(this.gameStats.value);
  }
}
