import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-setup-page',
  templateUrl: './setup-page.component.html',
  styleUrls: ['./setup-page.component.scss'],
})
export class SetupPageComponent {
  constructor(
    public dialogRef: MatDialogRef<SetupPageComponent>,
    private fb: FormBuilder
  ) {}

  gameStats = this.fb.group({
    boardHeight: [8, [Validators.required, Validators.min(2)]],
    boardWidth: [8, [Validators.required, Validators.min(2)]],
    redCount: [3, [Validators.required, Validators.min(1)]],
    blueCount: [3, [Validators.required, Validators.min(1)]],
    redCreature: ['Bandit', [Validators.required]],
    blueCreature: ['Skeleton', [Validators.required]],
  });

  startGame(): void {
    if (this.gameStats.valid) this.dialogRef.close(this.gameStats.value);
  }
}
