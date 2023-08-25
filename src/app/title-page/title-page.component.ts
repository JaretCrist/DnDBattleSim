import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-title-page',
  templateUrl: './title-page.component.html',
  styleUrls: ['./title-page.component.scss'],
})
export class TitlePageComponent {
  constructor(private router: Router) {}

  beginGame(): void {
    this.router.navigateByUrl('/Battle');
  }
}
