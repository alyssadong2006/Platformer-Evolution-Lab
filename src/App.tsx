import { useEffect, useRef, useState } from "react";
import { EditorToolbar } from "./components/EditorToolbar";
import { LearningExplanation } from "./components/LearningExplanation";
import { PlatformerCanvas } from "./components/PlatformerCanvas";
import { TrainingPanel } from "./components/TrainingPanel";
import { PlatformerSimulation } from "./game/simulation";
import type { EditorTool } from "./game/types";

export default function App() {
  const simulationRef = useRef<PlatformerSimulation | null>(null);
  if (!simulationRef.current) simulationRef.current = new PlatformerSimulation();
  const simulation = simulationRef.current;
  const [selectedTool, setSelectedTool] = useState<EditorTool>("solid");
  const [population, setPopulation] = useState(24);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(() => simulation.getStats());

  useEffect(() => {
    const timer = window.setInterval(() => setStats(simulation.getStats()), 100);
    return () => window.clearInterval(timer);
  }, [simulation]);

  function toggleTraining() {
    if (running) simulation.pause();
    else simulation.start();
    setRunning(!running);
  }

  function resetGeneration() {
    simulation.reset(population);
    setRunning(false);
    setStats(simulation.getStats());
  }

  function clearLevel() {
    simulation.clearLevel();
    setStats(simulation.getStats());
  }

  function changePopulation(value: number) {
    setPopulation(value);
    simulation.status = "Population size will take effect when the generation is reset.";
    setStats(simulation.getStats());
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">NEUROEVOLUTION PLAYGROUND</p>
          <h1>Platformer Evolution Lab</h1>
          <p className="subtitle">Build a level. Watch a population learn to reach the finish.</p>
        </div>
        <div className="generation-card" aria-live="polite">
          <span>GENERATION</span>
          <strong>{stats.generation}</strong>
        </div>
      </header>

      <section className="workspace" aria-label="Platformer sandbox">
        <aside className="sidebar">
          <EditorToolbar
            selectedTool={selectedTool}
            onSelect={setSelectedTool}
            onClear={clearLevel}
          />
          <TrainingPanel
            population={population}
            stats={stats}
            running={running}
            onPopulationChange={changePopulation}
            onToggle={toggleTraining}
            onReset={resetGeneration}
          />
          <section className="panel legend-panel">
            <h2>What you’re seeing</h2>
            <p><span className="legend-dot agent-dot"></span>Active agents</p>
            <p><span className="legend-dot sensor-dot"></span>Best agent’s sensors</p>
            <p><span className="legend-dot ghost-dot"></span>Recent failure locations</p>
            <p className="help legend-note">Agents use 8 distance rays, goal direction, velocity, and grounded state.</p>
          </section>
          <p className="status" role="status">{stats.status}</p>
        </aside>

        <section className="stage">
          <div className="stage-heading">
            <div>
              <h2>Sandbox</h2>
              <span>20 × 15 tile grid</span>
            </div>
            <span className="live-badge"><i></i> LIVE EDITING</span>
          </div>
          <PlatformerCanvas
            simulation={simulation}
            running={running}
            selectedTool={selectedTool}
          />
          <div className="stage-footer">
            <span>Changes apply immediately, even while agents are running.</span>
            <span className="key-hint">TIP&nbsp; Drag to paint tiles</span>
          </div>
          <LearningExplanation />
        </section>
      </section>
      <footer>Built with React, TypeScript, Vite, and Matter.js.</footer>
    </main>
  );
}
