export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GRID_COLUMNS = 20;
export const GRID_ROWS = 15;
export const TILE_SIZE = CANVAS_WIDTH / GRID_COLUMNS;
export const RAY_LENGTH = TILE_SIZE * 5;
export const INPUT_COUNT = 13;
export const HIDDEN_COUNT = 16;
export const OUTPUT_COUNT = 3;
export const GENERATION_SECONDS = 15;
export const PHYSICS_STEP_MS = 1000 / 60;
export const STATIC_CATEGORY = 0x0001;
export const AGENT_CATEGORY = 0x0002;
export const RAY_DIRECTIONS = Array.from({ length: 8 }, (_, index) => {
  const angle = index * Math.PI / 4;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});
