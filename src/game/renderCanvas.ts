import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_COLUMNS,
  GRID_ROWS,
  RAY_DIRECTIONS,
  RAY_LENGTH,
  TILE_SIZE,
} from "./constants";
import type { PlatformerSimulation } from "./simulation";
import type { Cell } from "./types";

function drawMarker(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  color: string,
  label: string,
): void {
  const centerX = cell.x * TILE_SIZE + TILE_SIZE / 2;
  const centerY = cell.y * TILE_SIZE + TILE_SIZE / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#172033";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, centerX, centerY + 0.5);
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  simulation: PlatformerSimulation,
): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#101a2b";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = "rgba(110, 132, 160, 0.13)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_COLUMNS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE + 0.5, 0);
    ctx.lineTo(x * TILE_SIZE + 0.5, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE + 0.5);
    ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE + 0.5);
    ctx.stroke();
  }

  for (const [tileKey, type] of simulation.tiles) {
    const [x, y] = tileKey.split(",").map(Number);
    if (type === "solid") {
      ctx.fillStyle = "#318a69";
      ctx.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.fillStyle = "#52c18d";
      ctx.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, 5);
    } else {
      ctx.fillStyle = "#e45b6c";
      ctx.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.fillStyle = "#ffb0a9";
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE + 4, (y + 1) * TILE_SIZE - 3);
      ctx.lineTo(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + 5);
      ctx.lineTo((x + 1) * TILE_SIZE - 4, (y + 1) * TILE_SIZE - 3);
      ctx.closePath();
      ctx.fill();
    }
  }
  drawMarker(ctx, simulation.goal, "#f5cb67", "★");
  drawMarker(ctx, simulation.spawn, "#75b8ff", "S");

  simulation.ghosts.forEach((ghost) => {
    ctx.globalAlpha = Math.max(0.08, 0.48 - ghost.age / 550);
    ctx.fillStyle = ghost.won ? "#f5cb67" : "#f08a91";
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ghost.age++;
  });
  for (let index = simulation.ghosts.length - 1; index >= 0; index--) {
    if (simulation.ghosts[index].age >= 550) simulation.ghosts.splice(index, 1);
  }

  const sensors = simulation.getBestActiveSensors();
  if (sensors) {
    rayDirections(sensors.rays, sensors.origin, ctx);
  }
  simulation.agents.forEach((agent, index) => {
    if (agent.done) return;
    ctx.globalAlpha = index === 0 ? 0.95 : 0.52;
    ctx.fillStyle = "#75b8ff";
    ctx.fillRect(agent.body.bounds.min.x, agent.body.bounds.min.y, 20, 26);
    ctx.globalAlpha = 1;
  });
}

function rayDirections(
  rays: number[],
  origin: Cell,
  ctx: CanvasRenderingContext2D,
): void {
  RAY_DIRECTIONS.forEach((direction, index) => {
    ctx.strokeStyle = "rgba(101, 230, 178, 0.34)";
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    const length = rays[index] * RAY_LENGTH;
    ctx.lineTo(origin.x + direction.x * length, origin.y + direction.y * length);
    ctx.stroke();
  });
}
