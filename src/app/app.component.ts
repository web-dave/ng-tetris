import {
  Component,
  ViewChild,
  AfterViewChecked,
  AfterViewInit
} from '@angular/core';
import { interval, fromEvent, Observable, Subject, merge, of } from 'rxjs';
import { takeUntil, tap, delay, filter } from 'rxjs/operators';
import {
  PiecesService,
  IArena,
  IPlayer,
  IPiece,
  IOffset
} from './pieces.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'ng-tetris';
  rowsCompleted = 0;
  pause = false;
  @ViewChild('tetris') tetris;
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  $update = interval(1000);
  $commands: Observable<Event>;
  $end = new Subject<number>();
  $btnAction = new Subject<{ keyCode: number }>();
  arena: IArena = [];
  itm: 'reset' | 'resume' = 'resume';
  player: IPlayer = {
    pos: { x: 5, y: 5 },
    matrix: null
  };
  colors: string[] = [
    '',
    '#FAFF00',
    '#00E4FF',
    '#F60000',
    '#69B625',
    '#FF8D00',
    '#FF51BC',
    '#9F0096'
  ];
  commands = {
    left: 37,
    right: 39,
    turn: 32,
    down: 40,
    up: 38,
    start: 88,
    select: 13,
    reset: 82
  };
  constructor(private service: PiecesService) {}

  initTetris() {
    this.getPiece();
    this.arena = this.service.createArena(12, 12);

    this.draw();
    this.$update
      .pipe(
        takeUntil(this.$end),
        filter(data => !this.pause)
      )
      .subscribe(() => {
        this.player.pos.y++;
        this.draw();
      });
    merge(this.$commands, this.$btnAction)
      .pipe(
        takeUntil(this.$end)
        // filter(() => !this.pause),
        // tap((data: KeyboardEvent) => console.log(data.keyCode))
      )
      .subscribe((e: KeyboardEvent) => this.cmdAction(e.keyCode));
  }
  btnAction(e: number) {
    console.log(e);
    if (e === this.commands.start) {
      this.pause = !this.pause;
    } else {
      this.$btnAction.next({ keyCode: e });
    }
  }
  cmdAction(e: number) {
    console.log(e);
    if (!this.pause) {
      switch (e) {
        case this.commands.right:
          this.player.pos.x--;
          if (this.collide(this.arena, this.player)) {
            this.player.pos.x++;
          }
          break;
        case this.commands.left:
          this.player.pos.x++;
          if (this.collide(this.arena, this.player)) {
            this.player.pos.x--;
          }
          break;
        case this.commands.turn:
          this.playerRotate(1);
          break;
        case this.commands.down:
          this.player.pos.y++;
          break;
      }
    } else {
      switch (e) {
        case this.commands.select:
          this.pause = false;
          if (this.itm === 'reset') {
            this.$end.next(0);
            of(true)
              .pipe(delay(1500))
              .subscribe(() => this.initTetris());
          }
          break;
        case this.commands.up:
        case this.commands.down:
          this.itm = this.itm === 'reset' ? 'resume' : 'reset';
          break;
      }
    }
    this.draw();
  }
  mergeArena(arena: IArena, player: IPlayer) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (player.pos.y === -1) {
            player.pos.y = 0;
          }
          arena[y + player.pos.y][x + player.pos.x] = value;
          if (player.pos.y === 0) {
            this.$end.next(0);
          }
        }
      });
    });
  }
  getPiece() {
    const pieces = 'OIZSLJT';
    this.player.matrix = this.service.getPiece(
      pieces[Math.floor(Math.random() * 6)]
    );
    this.player.pos.y = 0;
    this.player.pos.x = 5;
    // this.arena[0].length / 2 - this.player.matrix[0].length / 2;
  }
  playerRotate(dir: number) {
    const pos = this.player.pos.x;
    let offset = 1;
    this.rotate(this.player.matrix, dir);
    while (this.collide(this.arena, this.player)) {
      this.player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.player.matrix[0].length) {
        this.rotate(this.player.matrix, -dir);
        this.player.pos.x = pos;
      }
    }
  }
  rotate(matrix: IPiece, dir: number) {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < y; x++) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) {
      matrix.forEach(row => row.reverse());
    } else {
      matrix.reverse();
    }
  }
  collide(arena: IArena, player: IPlayer): boolean {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (
          m[y][x] !== 0 &&
          (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  }
  draw(): boolean {
    this.context.fillStyle = '#566425';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.player.matrix) {
      return false;
    }
    if (this.collide(this.arena, this.player)) {
      this.player.pos.y--;
      this.mergeArena(this.arena, this.player);
      this.checkCompleteRow(this.arena);
      this.getPiece();
    }
    this.drawMatrix(this.arena, { x: 0, y: 0 });
    this.drawMatrix(this.player.matrix, this.player.pos);
  }
  checkCompleteRow(arena: IArena) {
    for (let row = 0; row < arena.length; row++) {
      if (!arena[row].includes(0)) {
        arena.splice(row, 1);
        arena.unshift(new Array(12).fill(0));
        this.rowsCompleted++;
      }
    }
  }

  drawMatrix(matrix: IPiece, offset: IOffset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          this.context.fillStyle = this.colors[value];
          this.context.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }
  ngAfterViewInit(): void {
    this.canvas = this.tetris.nativeElement;
    this.$commands = fromEvent(document, 'keydown').pipe();
    this.context = this.tetris.nativeElement.getContext('2d');
    this.context.scale(20, 20);
    this.initTetris();
  }
}
