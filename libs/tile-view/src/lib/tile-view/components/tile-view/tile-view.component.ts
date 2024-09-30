import { Component, HostListener, OnInit, ElementRef, Renderer2, AfterViewInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tile {
  width: string;
  focused: boolean;
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
export class TileViewComponent implements OnInit, AfterViewInit {
  @ViewChildren('tileContent') tileContents!: QueryList<ElementRef>;

  tiles: Tile[] = [
    { width: '50%', focused: false },
    { width: '50%', focused: false }
  ];
  resizers: Resizer[] = [
    { position: '50%' }
  ];
  isResizing = false;
  activeResizer = 0;
  startX: number = 0;
  startWidths: string[] = [];
  containerWidth: number = 0;
  focusedTileIndex: number = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.updateResizerPositions();
    this.containerWidth = this.el.nativeElement.offsetWidth;
  }

  ngAfterViewInit() {
    this.focusTile(0);
  }

  startResize(event: MouseEvent, index: number) {
    this.isResizing = true;
    this.activeResizer = index;
    this.startX = event.clientX;
    this.startWidths = this.tiles.map(tile => tile.width);
    this.renderer.addClass(event.target, 'active');
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    requestAnimationFrame(() => this.resize(event));
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (!this.isResizing) return;
    this.isResizing = false;
    const activeResizerElement = this.el.nativeElement.querySelector('.resizer.active');
    if (activeResizerElement) {
      this.renderer.removeClass(activeResizerElement, 'active');
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      switch (event.key) {
        case 'j':
          this.moveFocus('left');
          event.preventDefault();
          break;
        case 'k':
          this.moveFocus('down');
          event.preventDefault();
          break;
        case 'l':
          this.moveFocus('up');
          event.preventDefault();
          break;
        case ';':
          this.moveFocus('right');
          event.preventDefault();
          break;
      }
    }
  }

  private resize(event: MouseEvent) {
    const dx = event.clientX - this.startX;
    const percentageDelta = (dx / this.containerWidth) * 100;

    const newLeftWidth = parseFloat(this.startWidths[this.activeResizer]) + percentageDelta;
    const newRightWidth = parseFloat(this.startWidths[this.activeResizer + 1]) - percentageDelta;

    if (newLeftWidth > 10 && newRightWidth > 10) {
      this.tiles[this.activeResizer].width = `${newLeftWidth}%`;
      this.tiles[this.activeResizer + 1].width = `${newRightWidth}%`;
      this.updateResizerPositions();
    }
  }

  private moveFocus(direction: 'left' | 'right' | 'up' | 'down') {
    let newIndex = this.focusedTileIndex;

    switch (direction) {
      case 'left':
        newIndex = Math.max(0, this.focusedTileIndex - 1);
        break;
      case 'right':
        newIndex = Math.min(this.tiles.length - 1, this.focusedTileIndex + 1);
        break;
      case 'up':
      case 'down':
        // For now, up and down do nothing as we only have a horizontal layout
        return;
    }

    if (newIndex !== this.focusedTileIndex) {
      this.focusTile(newIndex);
    }
  }

  public focusTile(index: number) {
    this.tiles.forEach((tile, i) => {
      tile.focused = i === index;
    });
    this.focusedTileIndex = index;
    this.tileContents.toArray()[index].nativeElement.focus();
  }

  private updateResizerPositions() {
    let position = 0;
    this.resizers.forEach((resizer, index) => {
      position += parseFloat(this.tiles[index].width);
      resizer.position = `${position}%`;
    });
  }
}
