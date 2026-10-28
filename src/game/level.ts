import { GRID_COLUMNS, GRID_ROWS } from "./constants";
import type { Cell, TileKind } from "./types";

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function createDefaultTiles(): Map<string, TileKind> {
  const tiles = new Map<string, TileKind>();
  for (let x = 0; x < GRID_COLUMNS; x++) tiles.set(cellKey(x, GRID_ROWS - 1), "solid");
  for (let x = 6; x <= 7; x++) tiles.set(cellKey(x, 13), "hazard");
  for (let x = 12; x <= 13; x++) tiles.set(cellKey(x, 13), "hazard");
  for (let y = 11; y <= 13; y++) tiles.set(cellKey(10, y), "solid");
  for (let x = 14; x <= 16; x++) tiles.set(cellKey(x, 11), "solid");
  return tiles;
}

export function cellCenter(cell: Cell, tileSize: number): Cell {
  return {
    x: cell.x * tileSize + tileSize / 2,
    y: cell.y * tileSize + tileSize / 2,
  };
}

export function distance(a: Cell, b: Cell): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
