import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tile {
  width: string;
}

interface Resizer {
  position: string;
}

@Component({
  selector: 'lib-tile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile-view.component.html',
  styleUrls: ['./tile-view.component.scss'],
})
export class TileViewComponent implements OnInit {
  tiles: Tile[] = [
    { width: '50%' },
    { width: '50%' }
  ];
  resizers: Resizer[] = [
    { position: '50%' }
  ];
  isResizing = false;
  activeResizer = 0;
  startX: number = 0;
  startWidths: string[] = [];

  ngOnInit() {
    this.updateResizerPositions();
  }

  startResize(event: MouseEvent, index: number) {
    this.isResizing = true;
    this.activeResizer = index;
    this.startX = event.clientX;
    this.startWidths = this.tiles.map(tile => tile.width);
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;

    const dx = event.clientX - this.startX;
    const containerWidth = window.innerWidth; // Changed this line
    const percentageDelta = (dx / containerWidth) * 100;

    const newLeftWidth = parseFloat(this.startWidths[this.activeResizer]) + percentageDelta;
    const newRightWidth = parseFloat(this.startWidths[this.activeResizer + 1]) - percentageDelta;

    if (newLeftWidth > 10 && newRightWidth > 10) {
      this.tiles[this.activeResizer].width = `${newLeftWidth}%`;
      this.tiles[this.activeResizer + 1].width = `${newRightWidth}%`;
      this.updateResizerPositions();
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isResizing = false;
  }

  private updateResizerPositions() {
    let position = 0;
    this.resizers.forEach((resizer, index) => {
      position += parseFloat(this.tiles[index].width);
      resizer.position = `${position}%`;
    });
  }
}
