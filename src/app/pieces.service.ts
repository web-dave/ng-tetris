import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PiecesService {
  pieces: IPieceList = {
    O: [
      [1, 1],
      [1, 1]
    ],
    I: [
      [0, 2, 0, 0],
      [0, 2, 0, 0],
      [0, 2, 0, 0],
      [0, 2, 0, 0]
    ],
    Z: [
      [3, 3, 0],
      [0, 3, 3],
      [0, 0, 0]
    ],
    S: [
      [0, 4, 4],
      [4, 4, 0],
      [0, 0, 0]
    ],
    L: [
      [0, 5, 0],
      [0, 5, 0],
      [0, 5, 5]
    ],
    J: [
      [0, 6, 0],
      [0, 6, 0],
      [6, 6, 0]
    ],
    T: [
      [0, 0, 0],
      [7, 7, 7],
      [0, 7, 0]
    ]
  };
  getPiece(n: string) {
    return this.pieces[n];
  }
  createArena(w, h): IArena {
    const arenaMatrix = [];
    while (h--) {
      arenaMatrix.push(new Array(w).fill(0));
    }
    return arenaMatrix;
  }
}
export type IRow = number[];
export type IArena = IRow[];
export type IPiece = number[][];
export interface IPieceList {
  [name: string]: IPiece;
}
export type IOffset = { x: number; y: number };
export interface IPlayer {
  pos: IOffset;
  matrix: IPiece;
}
