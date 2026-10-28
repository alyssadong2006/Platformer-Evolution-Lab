import type { EditorTool } from "../game/types";

interface EditorToolbarProps {
  selectedTool: EditorTool;
  onSelect: (tool: EditorTool) => void;
  onClear: () => void;
}

const tools: { id: EditorTool; label: string; swatch: string }[] = [
  { id: "solid", label: "Block", swatch: "solid" },
  { id: "hazard", label: "Spikes", swatch: "hazard" },
  { id: "goal", label: "Goal", swatch: "goal" },
  { id: "spawn", label: "Spawn", swatch: "spawn" },
  { id: "erase", label: "Erase", swatch: "erase" },
];

export function EditorToolbar({ selectedTool, onSelect, onClear }: EditorToolbarProps) {
  return (
    <section className="panel">
      <h2>Level editor</h2>
      <p className="help">Choose a tool, then click or drag on the grid.</p>
      <div className="tool-grid" role="group" aria-label="Editor tools">
        {tools.map(({ id, label, swatch }) => (
          <button
            className={`tool${selectedTool === id ? " active" : ""}`}
            data-tool={id}
            aria-pressed={selectedTool === id}
            key={id}
            onClick={() => onSelect(id)}
          >
            <span className={`swatch ${swatch}`}>{id === "erase" ? "×" : ""}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="editor-actions">
        <button className="button secondary" onClick={onClear}>Clear level</button>
      </div>
    </section>
  );
}
