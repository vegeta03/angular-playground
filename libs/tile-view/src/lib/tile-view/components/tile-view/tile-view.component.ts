import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'lib-tile-view',
  standalone: true,
  imports: [CommonModule, MatGridListModule],
  templateUrl: './tile-view.component.html',
  styleUrls: ['./tile-view.component.scss'],
})
export class TileViewComponent {
  tiles = Array(2).fill(0);
}
