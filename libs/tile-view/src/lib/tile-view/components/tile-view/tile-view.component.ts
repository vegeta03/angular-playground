import {
  Component,
  HostListener,
  OnInit,
  ElementRef,
  Renderer2,
  AfterViewInit,
  QueryList,
  ViewChildren,
  ChangeDetectorRef,
} from '@angular/core';
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
    { width: '50%', focused: false },
  ];
  resizers: Resizer[] = [{ position: '50%' }];
  isResizing = false;
  activeResizer = 0;
  startX: number = 0;
  startWidths: string[] = [];
  containerWidth: number = 0;
  focusedTileIndex: number = 0;
  resizeStep: number = 5; // Percentage to resize on each key press

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.startWidths = this.tiles.map((tile) => tile.width);
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
    const activeResizerElement =
      this.el.nativeElement.querySelector('.resizer.active');
    if (activeResizerElement) {
      this.renderer.removeClass(activeResizerElement, 'active');
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      if (event.shiftKey) {
        // Resizing with Shift + Alt + Arrow keys
        switch (event.key) {
          case 'ArrowLeft':
            this.resizeWithKeyboard('left');
            event.preventDefault();
            break;
          case 'ArrowRight':
            this.resizeWithKeyboard('right');
            event.preventDefault();
            break;
        }
      } else {
        // Selecting windows with Alt + Arrow keys
        switch (event.key) {
          case 'ArrowLeft':
            this.moveFocus('left');
            event.preventDefault();
            break;
          case 'ArrowRight':
            this.moveFocus('right');
            event.preventDefault();
            break;
        }
      }
    }
  }

  private resizeWithKeyboard(direction: 'left' | 'right') {
    const currentTileIndex = this.focusedTileIndex;
    let leftTileIndex: number, rightTileIndex: number;

    if (direction === 'right') {
      leftTileIndex = currentTileIndex;
      rightTileIndex = currentTileIndex + 1;
    } else {
      leftTileIndex = currentTileIndex - 1;
      rightTileIndex = currentTileIndex;
    }

    if (leftTileIndex < 0 || rightTileIndex >= this.tiles.length) return;

    const leftTile = this.tiles[leftTileIndex];
    const rightTile = this.tiles[rightTileIndex];

    const leftWidth = parseFloat(leftTile.width);
    const rightWidth = parseFloat(rightTile.width);

    if (direction === 'right' && leftWidth + this.resizeStep <= 90) {
      leftTile.width = `${leftWidth + this.resizeStep}%`;
      rightTile.width = `${rightWidth - this.resizeStep}%`;
    } else if (direction === 'left' && rightWidth + this.resizeStep <= 90) {
      leftTile.width = `${leftWidth - this.resizeStep}%`;
      rightTile.width = `${rightWidth + this.resizeStep}%`;
    }

    this.updateResizerPositions();
    this.cdr.detectChanges();
  }

  private resize(event: MouseEvent) {
    const dx = event.clientX - this.startX;
    const percentageDelta = (dx / this.containerWidth) * 100;

    const newLeftWidth =
      parseFloat(this.startWidths[this.activeResizer]) + percentageDelta;
    const newRightWidth =
      parseFloat(this.startWidths[this.activeResizer + 1]) - percentageDelta;

    if (newLeftWidth > 10 && newRightWidth > 10) {
      this.tiles[this.activeResizer].width = `${newLeftWidth}%`;
      this.tiles[this.activeResizer + 1].width = `${newRightWidth}%`;
      this.updateResizerPositions();
      this.cdr.detectChanges();
    }
  }

  private moveFocus(direction: 'left' | 'right') {
    let newIndex = this.focusedTileIndex;

    if (direction === 'left') {
      newIndex = Math.max(0, this.focusedTileIndex - 1);
    } else {
      newIndex = Math.min(this.tiles.length - 1, this.focusedTileIndex + 1);
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
    this.cdr.detectChanges();
  }

  private updateResizerPositions() {
    let position = 0;
    this.resizers.forEach((resizer, index) => {
      position += parseFloat(this.tiles[index].width);
      resizer.position = `${position}%`;
    });
  }
}
