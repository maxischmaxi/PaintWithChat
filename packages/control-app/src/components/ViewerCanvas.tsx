import { useEffect, useRef, useCallback } from "react";
import type { Point } from "@streamdraw/shared";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@streamdraw/shared";

interface ViewerCanvasProps {
  onStrokeStart?: (
    userId: string,
    point: Point,
    color: string,
    size: number,
  ) => void;
  onStrokeMove?: (userId: string, point: Point) => void;
  onStrokeEnd?: (userId: string) => void;
  onClear?: () => void;
}

interface ActiveStroke {
  points: Point[];
  color: string;
  size: number;
}

export const ViewerCanvas = ({
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  onClear,
}: ViewerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokesRef = useRef<Map<string, ActiveStroke>>(new Map());

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getContext("2d");
  }, []);

  const drawLine = useCallback(
    (from: Point, to: Point, color: string, size: number) => {
      const ctx = getContext();
      if (!ctx) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [getContext],
  );

  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    activeStrokesRef.current.clear();
  }, [getContext]);

  const handleStrokeStart = useCallback(
    (userId: string, point: Point, color: string, size: number) => {
      activeStrokesRef.current.set(userId, {
        points: [point],
        color,
        size,
      });

      // Draw initial point
      const ctx = getContext();
      if (ctx) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [getContext],
  );

  const handleStrokeMove = useCallback(
    (userId: string, point: Point) => {
      const stroke = activeStrokesRef.current.get(userId);
      if (!stroke) return;

      const lastPoint = stroke.points[stroke.points.length - 1];
      drawLine(lastPoint, point, stroke.color, stroke.size);

      stroke.points.push(point);
    },
    [drawLine],
  );

  const handleStrokeEnd = useCallback((userId: string) => {
    activeStrokesRef.current.delete(userId);
  }, []);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Wire up event handlers
  useEffect(() => {
    if (onStrokeStart) {
      // This is a bit hacky but we need to expose these handlers
      (window as any).__canvasStrokeStart = handleStrokeStart;
    }
    if (onStrokeMove) {
      (window as any).__canvasStrokeMove = handleStrokeMove;
    }
    if (onStrokeEnd) {
      (window as any).__canvasStrokeEnd = handleStrokeEnd;
    }
    if (onClear) {
      (window as any).__canvasClear = clearCanvas;
    }

    return () => {
      delete (window as any).__canvasStrokeStart;
      delete (window as any).__canvasStrokeMove;
      delete (window as any).__canvasStrokeEnd;
      delete (window as any).__canvasClear;
    };
  }, [handleStrokeStart, handleStrokeMove, handleStrokeEnd, clearCanvas]);

  return (
    <div className="w-full h-full bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-0">
      <canvas
        ref={canvasRef}
        className="bg-white shadow-xl"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
};
