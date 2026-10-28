import {
  HIDDEN_COUNT,
  INPUT_COUNT,
  OUTPUT_COUNT,
} from "./constants";

const randomWeight = () => Math.random() * 2 - 1;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function createGenome(): number[] {
  return Array.from(
    { length: HIDDEN_COUNT * (INPUT_COUNT + 1) + OUTPUT_COUNT * (HIDDEN_COUNT + 1) },
    randomWeight,
  );
}

export function activateNetwork(genome: number[], inputs: number[]): number[] {
  const hidden = new Array<number>(HIDDEN_COUNT);
  let offset = 0;
  for (let node = 0; node < HIDDEN_COUNT; node++) {
    let sum = genome[offset + INPUT_COUNT];
    for (let input = 0; input < INPUT_COUNT; input++) {
      sum += genome[offset + input] * inputs[input];
    }
    hidden[node] = Math.tanh(sum);
    offset += INPUT_COUNT + 1;
  }

  const output = new Array<number>(OUTPUT_COUNT);
  for (let node = 0; node < OUTPUT_COUNT; node++) {
    let sum = genome[offset + HIDDEN_COUNT];
    for (let input = 0; input < HIDDEN_COUNT; input++) {
      sum += genome[offset + input] * hidden[input];
    }
    output[node] = Math.tanh(sum);
    offset += HIDDEN_COUNT + 1;
  }
  return output;
}

export function mutateGenome(genome: number[]): number[] {
  return genome.map((weight) => {
    if (Math.random() > 0.13) return weight;
    const u1 = Math.max(Math.random(), 1e-10);
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return clamp(weight + gaussian * 0.45, -5, 5);
  });
}

export function crossoverGenomes(parentA: number[], parentB: number[]): number[] {
  return parentA.map((weight, index) =>
    Math.random() < 0.5 ? weight : parentB[index],
  );
}
