import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH, TILE_SIZE } from "../game/constants";
import { renderCanvas } from "../game/renderCanvas";
import type { PlatformerSimulation } from "../game/simulation";
import type { EditorTool } from "../game/types";

interface PlatformerCanvasProps {
  simulation: PlatformerSimulation;
  running: boolean;
  selectedTool: EditorTool;
}

export function PlatformerCanvas({
  simulation,
  running,
  selectedTool,
}: PlatformerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerDown = useRef(false);
  const previousCell = useRef("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    let frameId = 0;
    let lastFrame = 0;

    const frame = (timestamp: number) => {
      if (!lastFrame) lastFrame = timestamp;
      simulation.advanceFrame(Math.min(timestamp - lastFrame, 50), running);
      lastFrame = timestamp;
      renderCanvas(ctx, simulation);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [running, simulation]);

  function paint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * CANVAS_WIDTH / rect.width / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) * CANVAS_HEIGHT / rect.height / TILE_SIZE);
    const cell = `${x},${y}`;
    if (cell === previousCell.current) return;
    previousCell.current = cell;
    simulation.editCell(x, y, selectedTool);
  }

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Editable platformer level"
        onPointerDown={(event) => {
          pointerDown.current = true;
          previousCell.current = "";
          event.currentTarget.setPointerCapture(event.pointerId);
          paint(event);
        }}
        onPointerMove={(event) => {
          if (pointerDown.current) paint(event);
        }}
        onPointerUp={() => {
          pointerDown.current = false;
          previousCell.current = "";
        }}
        onPointerCancel={() => {
          pointerDown.current = false;
          previousCell.current = "";
        }}
      />
    </div>
  );
}
