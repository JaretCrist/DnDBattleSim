import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Attack } from 'src/app/character.service';

export interface DialogData {
  atks: Attack[];
  canAtk: boolean;
  canMove: boolean;
}

@Component({
  selector: 'app-actions-dialog-page',
  templateUrl: './actions-dialog.component.html',
  styleUrls: ['./actions-dialog.component.scss'],
})
export class ActionsDialogComponent {
  attackMode = false;

  constructor(
    public dialogRef: MatDialogRef<ActionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  attackSelected(name: string): void {
    this.dialogRef.close({ atk: name });
  }

  skip(): void {
    this.dialogRef.close('skip');
  }

  move(): void {
    this.dialogRef.close('move');
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }
}
