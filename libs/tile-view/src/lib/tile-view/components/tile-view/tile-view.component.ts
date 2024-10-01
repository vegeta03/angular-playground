import {
  Component,
  HostListener,
  ElementRef,
  Renderer2,
  QueryList,
  ViewChildren,
  signal,
  computed,
  effect,
  inject,
  Directive,
  Input,
  HostBinding,
  Pipe,
  PipeTransform,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type Tile = {
  width: string;
  height: string;
  focused: boolean;
};

@Directive({
  selector: '[libResizer]',
  standalone: true,
})
export class ResizerDirective {
  @Input() isVertical!: boolean;
  @HostBinding('class.vertical') get vertical() { return this.isVertical; }
  @HostBinding('style.left') @Input() left = '0';
  @HostBinding('style.top') @Input() top = '0';
}

@Pipe({
  name: 'percentage',
  standalone: true,
})
export class PercentagePipe implements PipeTransform {
  transform(value: number): string {
    return `${value}%`;
  }
}

@Component({
  selector: 'lib-tile-view',
  standalone: true,
  imports: [CommonModule, ResizerDirective, PercentagePipe],
  templateUrl: './tile-view.component.html',
  styleUrls: ['./tile-view.component.scss'],
})
export class TileViewComponent {
  @ViewChildren('tileContent') tileContents!: QueryList<ElementRef>;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  tiles = signal<[Tile, Tile]>([
    { width: '50%', height: '100%', focused: true },
    { width: '50%', height: '100%', focused: false },
  ]);
  isVerticalSplit = signal(true);
  focusedTileIndex = signal(0);

  isResizing = signal(false);
  startX = signal(0);
  startY = signal(0);
  startWidths = signal<string[]>([]);
  startHeights = signal<string[]>([]);
  containerWidth = signal(0);
  containerHeight = signal(0);

  resizerPosition = computed(() => {
    const [firstTile] = this.tiles();
    return this.isVerticalSplit() ? firstTile.width : firstTile.height;
  });

  constructor() {
    effect(() => {
      this.updateContainerSize();
    });
  }

  private updateContainerSize() {
    this.containerWidth.set(this.el.nativeElement.offsetWidth);
    this.containerHeight.set(this.el.nativeElement.offsetHeight);
    console.log('Container size updated:', this.containerWidth(), this.containerHeight());
  }

  startResize(event: MouseEvent) {
    console.log('Resize started');
    this.isResizing.set(true);
    this.startX.set(event.clientX);
    this.startY.set(event.clientY);
    this.startWidths.set(this.tiles().map((tile) => tile.width));
    this.startHeights.set(this.tiles().map((tile) => tile.height));
    this.renderer.addClass(event.target, 'active');
    event.preventDefault();
    console.log('isResizing:', this.isResizing());
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing()) return;
    console.log('Mouse moving');
    this.ngZone.run(() => {
      this.resize(event);
    });
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (!this.isResizing()) return;
    console.log('Resize ended');
    this.isResizing.set(false);
    const activeResizerElement =
      this.el.nativeElement.querySelector('.resizer.active');
    if (activeResizerElement) {
      this.renderer.removeClass(activeResizerElement, 'active');
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateContainerSize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      if (event.shiftKey) {
        this.handleShiftKeyNavigation(event);
      } else {
        this.handleKeyboardActions(event);
      }
    }
  }

  private handleShiftKeyNavigation(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const isVertical = this.isVerticalSplit();
    const directions: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      i: 'up',
      k: 'down',
      j: 'left',
      l: 'right'
    };

    if (key in directions) {
      const direction = directions[key];
      if ((isVertical && ['left', 'right'].includes(direction)) ||
          (!isVertical && ['up', 'down'].includes(direction))) {
        this.selectWindow(direction);
        event.preventDefault();
      }
    }
  }

  private handleKeyboardActions(event: KeyboardEvent) {
    const actions: Record<string, () => void> = {
      h: () => this.splitHorizontally(),
      v: () => this.splitVertically(),
      i: () => this.resizeWithKeyboard('up'),
      k: () => this.resizeWithKeyboard('down'),
      j: () => this.resizeWithKeyboard('left'),
      l: () => this.resizeWithKeyboard('right')
    };

    const action = actions[event.key.toLowerCase()];
    if (action) {
      action();
      event.preventDefault();
    }
  }

  private selectWindow(direction: 'up' | 'down' | 'left' | 'right') {
    const newIndex = ['up', 'left'].includes(direction) ? 0 : 1;
    if (newIndex !== this.focusedTileIndex()) {
      this.focusTile(newIndex);
    }
  }

  private resizeWithKeyboard(direction: 'up' | 'down' | 'left' | 'right') {
    const isVertical = this.isVerticalSplit();
    const resizeStep = 5;
    const [first] = this.tiles();
    let newFirstSize = parseFloat(isVertical ? first.width : first.height);

    if (['left', 'up'].includes(direction)) newFirstSize -= resizeStep;
    if (['right', 'down'].includes(direction)) newFirstSize += resizeStep;

    newFirstSize = Math.max(10, Math.min(90, newFirstSize));
    this.updateTileSizes(newFirstSize);
  }

  private resize(event: MouseEvent) {
    console.log('Resizing');
    const isVertical = this.isVerticalSplit();
    const delta = isVertical ? event.clientX - this.startX() : event.clientY - this.startY();
    const containerSize = isVertical ? this.containerWidth() : this.containerHeight();
    console.log('Container size:', containerSize);
    const percentageDelta = (delta / containerSize) * 100;

    const startSize = parseFloat(isVertical ? this.startWidths()[0] : this.startHeights()[0]);
    const newFirstSize = startSize + percentageDelta;

    console.log('New size:', newFirstSize);
    if (newFirstSize > 10 && newFirstSize < 90) {
      this.updateTileSizes(newFirstSize);
    }
  }

  private updateTileSizes(newFirstSize: number) {
    const isVertical = this.isVerticalSplit();
    const newSecondSize = 100 - newFirstSize;

    console.log('Updating tiles:', newFirstSize, newSecondSize);
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
  }

  public focusTile(index: number) {
    this.tiles.update(tiles =>
      tiles.map((tile, i) => ({ ...tile, focused: i === index })) as [Tile, Tile]
    );
    this.focusedTileIndex.set(index);
    this.tileContents.get(index)?.nativeElement.focus();
  }

  private splitHorizontally() {
    this.isVerticalSplit.set(false);
    this.tiles.set([
      { width: '100%', height: '50%', focused: true },
      { width: '100%', height: '50%', focused: false },
    ]);
  }

  private splitVertically() {
    this.isVerticalSplit.set(true);
    this.tiles.set([
      { width: '50%', height: '100%', focused: true },
      { width: '50%', height: '100%', focused: false },
    ]);
  }
}