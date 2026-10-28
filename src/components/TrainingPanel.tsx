import type { SimulationStats } from "../game/types";

interface TrainingPanelProps {
  population: number;
  stats: SimulationStats;
  running: boolean;
  onPopulationChange: (population: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

export function TrainingPanel({
  population,
  stats,
  running,
  onPopulationChange,
  onToggle,
  onReset,
}: TrainingPanelProps) {
  return (
    <section className="panel training-panel">
      <h2>Training</h2>
      <label className="field-label" htmlFor="population">Population size</label>
      <select
        id="population"
        value={population}
        onChange={(event) => onPopulationChange(Number(event.target.value))}
      >
        <option value={20}>20 agents</option>
        <option value={24}>24 agents</option>
        <option value={30}>30 agents</option>
      </select>
      <div className="button-stack">
        <button className="button primary" onClick={onToggle}>
          {running ? "Ⅱ Pause evolution" : "▶ Start evolution"}
        </button>
        <button className="button secondary" onClick={onReset}>Reset generation</button>
      </div>
      <div className="stats">
        <div><span>BEST FITNESS</span><strong>{stats.fitness}</strong></div>
        <div><span>FINISHED</span><strong>{stats.finished} / {stats.population}</strong></div>
        <div><span>TIME LEFT</span><strong>{stats.timeLeft}</strong></div>
      </div>
    </section>
  );
}
