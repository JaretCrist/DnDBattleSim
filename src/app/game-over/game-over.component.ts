import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, mergeMap, tap } from 'rxjs';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss'],
})
export class GameOverComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  team: 'red' | 'blue' | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        filter((params) => (params.get('team') ? true : false)),
        tap((params) => {
          const tempTeam = params.get('team');
          if (tempTeam && (tempTeam === 'red' || tempTeam === 'blue')) {
            this.team = tempTeam;
          }
        })
      )
      .subscribe();
  }

  playAgain(): void {
    this.router.navigateByUrl('/Battle');
  }
}
