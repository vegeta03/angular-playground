import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileViewComponent } from './tile-view.component';

describe('TileViewComponent', () => {
  let component: TileViewComponent;
  let fixture: ComponentFixture<TileViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TileViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
