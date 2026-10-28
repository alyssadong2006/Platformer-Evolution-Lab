# Platformer Evolution Lab

A browser-based 2D platformer editor and neuroevolution demo. React and
TypeScript power the UI and game modules, Vite handles development and builds,
Matter.js provides collisions and gravity, and a small genetic algorithm
evolves neural-network controllers.

## Run it

Install Node.js, then run `npm install` once and `npm run dev`. Vite prints a
local URL to open in your browser. Run `npm run build` to type-check and create
a production build in `dist/`.

## Use the sandbox

- Select Block, Spikes, Goal, Spawn, or Erase, then click or drag on the grid.
- Start evolution to run the selected population (20, 24, or 30 agents).
- Agents share the same editable level and run until they finish or the
  15-second generation limit is reached. The best 20% seed the next generation
  through crossover and mutation.
- Level edits update the physics world and agent sensors immediately. Moving
  the spawn point affects the next generation; reset the generation to apply a
  new population size or restart from the current level.

Each controller has 13 inputs (eight obstacle rays, normalized goal offset,
velocity, and grounded state), a 16-node tanh hidden layer, and three action
outputs (left, right, and jump). Fitness rewards progress toward the goal,
penalizes elapsed time, and gives a completion bonus.

This is population-based learning: an agent's brain stays fixed during its run.
At the end of each generation, the highest-scoring brains are selected,
combined, and mutated to form the next generation. The network layout stays
fixed; only its weights evolve.

## Code layout

- `src/components/` contains the React editor controls, canvas, and learning
  explanation.
- `src/game/` contains the platformer simulation, rendering, level utilities,
  neural network, and shared game types.
- `src/App.tsx` composes the screen; `src/main.tsx` starts the React app.
- `styles.css` contains the visual styles; `vite.config.ts` configures the
  development server and production bundler.
