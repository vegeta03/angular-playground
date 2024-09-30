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
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tile {
  width: string;
  height: string;
  focused: boolean;
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

  tiles = signal<[Tile, Tile]>([
    { width: '100%', height: '50%', focused: true },
    { width: '100%', height: '50%', focused: false },
  ]);
  isVerticalSplit = signal<boolean>(false);
  isResizing = false;
  startX: number = 0;
  startY: number = 0;
  startWidths: string[] = [];
  startHeights: string[] = [];
  containerWidth: number = 0;
  containerHeight: number = 0;
  focusedTileIndex = signal<number>(0);

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.containerWidth = this.el.nativeElement.offsetWidth;
    this.containerHeight = this.el.nativeElement.offsetHeight;
  }

  ngAfterViewInit() {
    this.focusTile(0);
  }

  startResize(event: MouseEvent) {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidths = this.tiles().map((tile) => tile.width);
    this.startHeights = this.tiles().map((tile) => tile.height);
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
        // Window selection shortcuts
        switch (event.key.toLowerCase()) {
          case 'i':
            if (!this.isVerticalSplit()) this.selectWindow('up');
            event.preventDefault();
            break;
          case 'k':
            if (!this.isVerticalSplit()) this.selectWindow('down');
            event.preventDefault();
            break;
          case 'j':
            if (this.isVerticalSplit()) this.selectWindow('left');
            event.preventDefault();
            break;
          case 'l':
            if (this.isVerticalSplit()) this.selectWindow('right');
            event.preventDefault();
            break;
        }
      } else {
        // Existing shortcuts for splitting and resizing
        switch (event.key.toLowerCase()) {
          case 'h':
            this.splitHorizontally();
            event.preventDefault();
            break;
          case 'v':
            this.splitVertically();
            event.preventDefault();
            break;
          case 'i':
            this.resizeWithKeyboard('up');
            event.preventDefault();
            break;
          case 'k':
            this.resizeWithKeyboard('down');
            event.preventDefault();
            break;
          case 'j':
            this.resizeWithKeyboard('left');
            event.preventDefault();
            break;
          case 'l':
            this.resizeWithKeyboard('right');
            event.preventDefault();
            break;
        }
      }
    }
  }

  private selectWindow(direction: 'up' | 'down' | 'left' | 'right') {
    const currentIndex = this.focusedTileIndex();
    let newIndex: number;

    switch (direction) {
      case 'up':
      case 'left':
        newIndex = 0;
        break;
      case 'down':
      case 'right':
        newIndex = 1;
        break;
    }

    if (newIndex !== currentIndex) {
      this.focusTile(newIndex);
    }
  }

  private resizeWithKeyboard(direction: 'up' | 'down' | 'left' | 'right') {
    const isVertical = this.isVerticalSplit();
    const resizeStep = 5; // Percentage to resize on each key press
    let newFirstSize: number;

    if (isVertical) {
      newFirstSize = parseFloat(this.tiles()[0].width);
      if (direction === 'left') newFirstSize -= resizeStep;
      if (direction === 'right') newFirstSize += resizeStep;
    } else {
      newFirstSize = parseFloat(this.tiles()[0].height);
      if (direction === 'up') newFirstSize -= resizeStep;
      if (direction === 'down') newFirstSize += resizeStep;
    }

    newFirstSize = Math.max(10, Math.min(90, newFirstSize));
    const newSecondSize = 100 - newFirstSize;

    this.tiles.update(([first, second]) => [
      {
        ...first,
        width: isVertical ? `${newFirstSize}%` : '100%',
        height: isVertical ? '100%' : `${newFirstSize}%`,
      },
      {
        ...second,
        width: isVertical ? `${newSecondSize}%` : '100%',
        height: isVertical ? '100%' : `${newSecondSize}%`,
      },
    ]);
    this.cdr.detectChanges();
  }

  private resize(event: MouseEvent) {
    const isVertical = this.isVerticalSplit();
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const percentageDelta = isVertical
      ? (dx / this.containerWidth) * 100
      : (dy / this.containerHeight) * 100;

    let newFirstSize = isVertical
      ? parseFloat(this.startWidths[0]) + percentageDelta
      : parseFloat(this.startHeights[0]) + percentageDelta;
    let newSecondSize = 100 - newFirstSize;

    if (newFirstSize > 10 && newSecondSize > 10) {
      this.tiles.update(([first, second]) => [
        {
          ...first,
          width: isVertical ? `${newFirstSize}%` : '100%',
          height: isVertical ? '100%' : `${newFirstSize}%`,
        },
        {
          ...second,
          width: isVertical ? `${newSecondSize}%` : '100%',
          height: isVertical ? '100%' : `${newSecondSize}%`,
        },
      ]);
      this.cdr.detectChanges();
    }
  }

  public focusTile(index: number) {
    this.tiles.update(tiles => 
      tiles.map((tile, i) => ({ ...tile, focused: i === index })) as [Tile, Tile]
    );
    this.focusedTileIndex.set(index);
    this.tileContents.toArray()[index].nativeElement.focus();
    this.cdr.detectChanges();
  }

  private splitHorizontally() {
    this.isVerticalSplit.set(false);
    this.tiles.set([
      { width: '100%', height: '50%', focused: true },
      { width: '100%', height: '50%', focused: false },
    ]);
    this.cdr.detectChanges();
  }

  private splitVertically() {
    this.isVerticalSplit.set(true);
    this.tiles.set([
      { width: '50%', height: '100%', focused: true },
      { width: '50%', height: '100%', focused: false },
    ]);
    this.cdr.detectChanges();
  }
}