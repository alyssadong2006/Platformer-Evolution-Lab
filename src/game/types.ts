import type Matter from "matter-js";

export type TileKind = "solid" | "hazard";
export type EditorTool = TileKind | "goal" | "spawn" | "erase";

export interface Cell {
  x: number;
  y: number;
}

export interface Agent {
  body: Matter.Body;
  genome: number[];
  startDistance: number;
  fitness: number;
  done: boolean;
  won: boolean;
  grounded: boolean;
}

export interface FailureGhost extends Cell {
  won: boolean;
  age: number;
}

export interface SimulationStats {
  generation: number;
  fitness: string;
  finished: number;
  population: number;
  timeLeft: string;
  status: string;
}
