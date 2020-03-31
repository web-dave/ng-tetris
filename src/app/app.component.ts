import {
  Component,
  ViewChild,
  AfterViewChecked,
  AfterViewInit
} from '@angular/core';
import { interval, fromEvent, Observable, Subject } from 'rxjs';
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
  @ViewChild('tetris') tetris;
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  update = interval(1000);
  commands: Observable<Event>;
  arena: IArena = [];
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
  constructor(private service: PiecesService) {}

  initCanvas() {
    this.canvas = this.tetris.nativeElement;
    this.commands = fromEvent(document, 'keydown').pipe();
    this.context = this.tetris.nativeElement.getContext('2d');
    this.context.scale(20, 20);
    this.arena = this.service.createArena(12, 20);

    this.draw();
    this.update.subscribe(() => {
      this.player.pos.y++;
      this.draw();
    });
    this.commands.subscribe((e: KeyboardEvent) => this.cmdAction(e.keyCode));
  }
  cmdAction(e: number) {
    const left = 37;
    const right = 39;
    const space = 32;
    const down = 40;
    // tslint:disable-next-line:no-string-literal
    switch (e) {
      case left:
        this.player.pos.x--;
        if (this.collide(this.arena, this.player)) {
          this.player.pos.x++;
        }
        break;
      case right:
        this.player.pos.x++;
        if (this.collide(this.arena, this.player)) {
          this.player.pos.x--;
        }
        break;
      case space:
        this.playerRotate(1);
        break;
      case down:
        this.player.pos.y++;
        break;
    }
    this.draw();
  }
  mergeArena(arena: IArena, player: IPlayer) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
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
    this.getPiece();
    this.initCanvas();
  }
}
