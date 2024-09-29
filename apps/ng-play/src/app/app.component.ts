import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TileViewComponent } from '@angular-playground/tile-view';

@Component({
  standalone: true,
  imports: [RouterModule, TileViewComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
