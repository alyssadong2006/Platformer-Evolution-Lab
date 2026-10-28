import Matter from "matter-js";
import {
  AGENT_CATEGORY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GENERATION_SECONDS,
  GRID_COLUMNS,
  GRID_ROWS,
  PHYSICS_STEP_MS,
  RAY_DIRECTIONS,
  RAY_LENGTH,
  STATIC_CATEGORY,
  TILE_SIZE,
} from "./constants";
import { cellCenter, cellKey, createDefaultTiles, distance } from "./level";
import {
  activateNetwork,
  createGenome,
  crossoverGenomes,
  mutateGenome,
} from "./neuralNetwork";
import type { Agent, Cell, EditorTool, FailureGhost, SimulationStats, TileKind } from "./types";

const { Engine, Bodies, Body, Composite } = Matter;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class PlatformerSimulation {
  readonly engine = Engine.create({ enableSleeping: false });
  readonly tiles = createDefaultTiles();
  readonly agents: Agent[] = [];
  readonly ghosts: FailureGhost[] = [];
  goal: Cell = { x: 18, y: 12 };
  spawn: Cell = { x: 1, y: 12 };
  generation = 1;
  elapsed = 0;
  status = "Choose an editor tool to modify the sample level, then start evolution.";

  private readonly staticBodies = new Map<string, Matter.Body>();
  private accumulator = 0;
  private transitionMs = 0;
  private population = 24;
  private bestFitness = -Infinity;

  constructor() {
    this.engine.gravity.y = 1;
    this.engine.gravity.scale = 0.001;
    this.rebuildLevelBodies();
    this.spawnGeneration(1);
  }

  editCell(x: number, y: number, tool: EditorTool): void {
    if (x < 0 || y < 0 || x >= GRID_COLUMNS || y >= GRID_ROWS) return;
    if (tool === "goal") {
      this.removeTile(x, y);
      this.goal = { x, y };
      this.status = "Finish line moved. Agents will use the new target immediately.";
      return;
    }
    if (tool === "spawn") {
      this.removeTile(x, y);
      this.spawn = { x, y };
      this.status = "Spawn point moved. It will be used for the next generation.";
      return;
    }
    if (tool === "erase") {
      this.removeTile(x, y);
      return;
    }

    const tileKey = cellKey(x, y);
    const existing = this.staticBodies.get(tileKey);
    if (existing) Composite.remove(this.engine.world, existing);
    this.tiles.set(tileKey, tool);
    const body = this.createTileBody(x, y, tool);
    this.staticBodies.set(tileKey, body);
    Composite.add(this.engine.world, body);
  }

  clearLevel(): void {
    this.tiles.clear();
    this.rebuildLevelBodies();
    this.status = "Level cleared. Add a floor, spawn, and finish before training.";
  }

  reset(population: number): void {
    this.population = population;
    this.spawnGeneration(1);
    this.status = "Generation reset. Current level edits have been preserved.";
  }

  start(): void {
    this.status = `Generation ${this.generation} is learning. Edit the level at any time.`;
  }

  pause(): void {
    this.status = "Evolution paused. Level edits are still applied live.";
  }

  advanceFrame(deltaMs: number, active: boolean): void {
    if (!active) return;
    if (this.transitionMs > 0) {
      this.transitionMs -= deltaMs;
      if (this.transitionMs <= 0) {
        this.evolve();
        this.status = `Generation ${this.generation} is learning. Edit the level at any time.`;
      }
      return;
    }

    this.accumulator += Math.min(deltaMs, 50);
    while (this.accumulator >= PHYSICS_STEP_MS) {
      Engine.update(this.engine, PHYSICS_STEP_MS);
      this.elapsed += PHYSICS_STEP_MS / 1000;
      this.agents.forEach((agent) => this.updateAgent(agent));
      this.accumulator -= PHYSICS_STEP_MS;
      if (this.elapsed >= GENERATION_SECONDS || this.isGenerationComplete()) {
        this.finishGeneration();
        break;
      }
    }
  }

  getStats(): SimulationStats {
    return {
      generation: this.generation,
      fitness: Number.isFinite(this.bestFitness) ? this.bestFitness.toFixed(1) : "—",
      finished: this.agents.filter((agent) => agent.done).length,
      population: this.population,
      timeLeft: `${Math.max(0, GENERATION_SECONDS - this.elapsed).toFixed(1)}s`,
      status: this.status,
    };
  }

  getBestActiveSensors(): { origin: Cell; rays: number[] } | null {
    const active = this.agents.filter((agent) => !agent.done);
    if (!active.length) return null;
    const best = active.reduce((first, second) =>
      first.fitness > second.fitness ? first : second,
    );
    return { origin: { ...best.body.position }, rays: this.sense(best).rays };
  }

  private createTileBody(x: number, y: number, type: TileKind): Matter.Body {
    return Bodies.rectangle(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE,
      TILE_SIZE,
      {
        isStatic: true,
        label: type,
        friction: 0.8,
        collisionFilter: { category: STATIC_CATEGORY, mask: AGENT_CATEGORY },
      },
    );
  }

  private rebuildLevelBodies(): void {
    for (const body of this.staticBodies.values()) Composite.remove(this.engine.world, body);
    this.staticBodies.clear();
    for (const [tileKey, type] of this.tiles) {
      const [x, y] = tileKey.split(",").map(Number);
      const body = this.createTileBody(x, y, type);
      this.staticBodies.set(tileKey, body);
      Composite.add(this.engine.world, body);
    }
  }

  private removeTile(x: number, y: number): void {
    const tileKey = cellKey(x, y);
    this.tiles.delete(tileKey);
    const body = this.staticBodies.get(tileKey);
    if (body) Composite.remove(this.engine.world, body);
    this.staticBodies.delete(tileKey);
  }

  private spawnGeneration(generation: number, genomes?: number[][]): void {
    for (const agent of this.agents) Composite.remove(this.engine.world, agent.body);
    this.agents.length = 0;
    this.generation = generation;
    this.elapsed = 0;
    this.accumulator = 0;
    this.transitionMs = 0;
    this.bestFitness = -Infinity;
    const nextGenomes = genomes ?? Array.from({ length: this.population }, createGenome);
    for (const genome of nextGenomes) this.agents.push(this.createAgent(genome));
    this.status = `Generation ${this.generation} is ready. Start evolution when you’re ready.`;
  }

  private createAgent(genome: number[]): Agent {
    const body = Bodies.rectangle(
      this.spawn.x * TILE_SIZE + TILE_SIZE / 2,
      this.spawn.y * TILE_SIZE + TILE_SIZE / 2,
      20,
      26,
      {
        friction: 0.05,
        frictionAir: 0.015,
        restitution: 0,
        label: "agent",
        collisionFilter: { category: AGENT_CATEGORY, mask: STATIC_CATEGORY },
      },
    );
    Composite.add(this.engine.world, body);
    return {
      body,
      genome,
      startDistance: distance(body.position, cellCenter(this.goal, TILE_SIZE)),
      fitness: 0,
      done: false,
      won: false,
      grounded: false,
    };
  }

  private sense(agent: Agent): { inputs: number[]; rays: number[] } {
    const origin = agent.body.position;
    const rays = RAY_DIRECTIONS.map((direction) => {
      let nearest = RAY_LENGTH;
      for (const [tileKey] of this.tiles) {
        const [x, y] = tileKey.split(",").map(Number);
        const hit = this.rayRectangleDistance(
          origin,
          direction,
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );
        if (hit !== null && hit < nearest) nearest = hit;
      }
      return nearest / RAY_LENGTH;
    });
    const goal = cellCenter(this.goal, TILE_SIZE);
    const velocity = agent.body.velocity;
    return {
      inputs: [
        ...rays,
        clamp((goal.x - origin.x) * 2 / CANVAS_WIDTH, -1, 1),
        clamp((goal.y - origin.y) * 2 / CANVAS_HEIGHT, -1, 1),
        clamp(velocity.x / 6, -1, 1),
        clamp(velocity.y / 10, -1, 1),
        agent.grounded ? 1 : -1,
      ],
      rays,
    };
  }

  private rayRectangleDistance(
    origin: Matter.Vector,
    direction: Cell,
    x: number,
    y: number,
    width: number,
    height: number,
  ): number | null {
    let low = 0;
    let high = RAY_LENGTH;
    for (const axis of ["x", "y"] as const) {
      const d = direction[axis];
      const min = axis === "x" ? x : y;
      const max = min + (axis === "x" ? width : height);
      if (Math.abs(d) < 1e-8) {
        if (origin[axis] < min || origin[axis] > max) return null;
        continue;
      }
      let t1 = (min - origin[axis]) / d;
      let t2 = (max - origin[axis]) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      low = Math.max(low, t1);
      high = Math.min(high, t2);
      if (low > high) return null;
    }
    return low >= 0 && low <= RAY_LENGTH ? low : null;
  }

  private isGrounded(agent: Agent): boolean {
    if (agent.body.velocity.y < -0.5) return false;
    const { min, max } = agent.body.bounds;
    for (const [tileKey, type] of this.tiles) {
      if (type !== "solid") continue;
      const [x, y] = tileKey.split(",").map(Number);
      const top = y * TILE_SIZE;
      if (max.y <= top + 4 && max.y >= top - 4 &&
          max.x - 2 > x * TILE_SIZE && min.x + 2 < (x + 1) * TILE_SIZE) return true;
    }
    return false;
  }

  private overlapsTile(body: Matter.Body, tileX: number, tileY: number): boolean {
    const left = tileX * TILE_SIZE;
    const top = tileY * TILE_SIZE;
    return body.bounds.max.x > left && body.bounds.min.x < left + TILE_SIZE &&
      body.bounds.max.y > top && body.bounds.min.y < top + TILE_SIZE;
  }

  private updateAgent(agent: Agent): void {
    if (agent.done) return;
    agent.grounded = this.isGrounded(agent);
    const [left, right, jump] = activateNetwork(agent.genome, this.sense(agent).inputs);
    const steering = clamp(right - left, -1, 1);
    Body.setVelocity(agent.body, {
      x: clamp(agent.body.velocity.x + steering * 0.38, -5.2, 5.2),
      y: agent.body.velocity.y,
    });
    if (jump > 0.35 && agent.grounded) {
      Body.setVelocity(agent.body, { x: agent.body.velocity.x, y: -9.3 });
      agent.grounded = false;
    }

    for (const [tileKey, type] of this.tiles) {
      if (type !== "hazard") continue;
      const [x, y] = tileKey.split(",").map(Number);
      if (this.overlapsTile(agent.body, x, y)) {
        this.finishAgent(agent, false);
        return;
      }
    }
    if (this.overlapsTile(agent.body, this.goal.x, this.goal.y)) {
      this.finishAgent(agent, true);
      return;
    }
    if (agent.body.position.y > CANVAS_HEIGHT + TILE_SIZE ||
        agent.body.position.x < -TILE_SIZE ||
        agent.body.position.x > CANVAS_WIDTH + TILE_SIZE) {
      this.finishAgent(agent, false);
      return;
    }
    agent.fitness = agent.startDistance -
      distance(agent.body.position, cellCenter(this.goal, TILE_SIZE)) -
      this.elapsed * 0.1;
    this.bestFitness = Math.max(this.bestFitness, agent.fitness);
  }

  private finishAgent(agent: Agent, won: boolean): void {
    if (agent.done) return;
    agent.done = true;
    agent.won = won;
    if (won) agent.fitness += 1000;
    this.ghosts.push({ x: agent.body.position.x, y: agent.body.position.y, won, age: 0 });
    if (this.ghosts.length > 80) this.ghosts.splice(0, this.ghosts.length - 80);
    Composite.remove(this.engine.world, agent.body);
  }

  private isGenerationComplete(): boolean {
    return this.agents.length > 0 && this.agents.every((agent) => agent.done);
  }

  private finishGeneration(): void {
    for (const agent of this.agents) {
      if (!agent.done) this.finishAgent(agent, false);
      this.bestFitness = Math.max(this.bestFitness, agent.fitness);
    }
    const winner = this.agents.some((agent) => agent.won);
    this.status = winner
      ? `Generation ${this.generation} reached the finish! Breeding the next population…`
      : `Generation ${this.generation} finished. Best fitness: ${this.bestFitness.toFixed(1)}. Breeding…`;
    this.transitionMs = 900;
  }

  private evolve(): void {
    const ranked = [...this.agents].sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(2, Math.ceil(this.population * 0.2));
    const elites = ranked.slice(0, eliteCount).map((agent) => agent.genome);
    const nextGenomes = elites.map((genome) => genome.slice());
    while (nextGenomes.length < this.population) {
      const parentA = elites[Math.floor(Math.random() * elites.length)];
      const parentB = elites[Math.floor(Math.random() * elites.length)];
      nextGenomes.push(mutateGenome(crossoverGenomes(parentA, parentB)));
    }
    const bestFitness = ranked[0]?.fitness ?? 0;
    this.spawnGeneration(this.generation + 1, nextGenomes);
    this.bestFitness = bestFitness;
  }
}
