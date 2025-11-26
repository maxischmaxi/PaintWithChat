import { useEffect, useRef, useCallback, useState } from "react";
import type { Point, DrawingStroke } from "@paintwithchat/shared";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@paintwithchat/shared";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@paintwithchat/shared";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ViewerCanvasProps {
  socket?: SocketType | null;
}

interface ActiveStroke {
  points: Point[];
  color: string;
  size: number;
}

export const ViewerCanvas = ({ socket }: ViewerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokesRef = useRef<Map<string, ActiveStroke>>(new Map());
  const [completedStrokes, setCompletedStrokes] = useState<DrawingStroke[]>([]);

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

  const drawPoint = useCallback(
    (point: Point, color: string, size: number) => {
      const ctx = getContext();
      if (!ctx) return;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [getContext],
  );

  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    activeStrokesRef.current.clear();
  }, [getContext]);

  const redrawCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    // Clear canvas first
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw all completed strokes
    completedStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      // Draw first point
      drawPoint(stroke.points[0], stroke.color, stroke.size);

      // Draw lines between points
      for (let i = 1; i < stroke.points.length; i++) {
        drawLine(
          stroke.points[i - 1],
          stroke.points[i],
          stroke.color,
          stroke.size,
        );
      }
    });
  }, [getContext, drawPoint, drawLine, completedStrokes]);

  const handleStrokeStart = useCallback(
    (userId: string, point: Point, color: string, size: number) => {
      activeStrokesRef.current.set(userId, {
        points: [point],
        color,
        size,
      });

      // Draw initial point
      drawPoint(point, color, size);
    },
    [drawPoint],
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

  const handleStrokeEnd = useCallback(
    (userId: string, stroke: DrawingStroke) => {
      activeStrokesRef.current.delete(userId);
      // Add completed stroke to state
      setCompletedStrokes((prev) => [...prev, stroke]);
    },
    [],
  );

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

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleLoad = (data: { strokes: DrawingStroke[] }) => {
      console.log("Loading", data.strokes.length, "strokes");
      setCompletedStrokes(data.strokes);
    };

    const handleStart = (data: {
      userId: string;
      point: Point;
      color: string;
      size: number;
    }) => {
      handleStrokeStart(data.userId, data.point, data.color, data.size);
    };

    const handleMove = (data: { userId: string; point: Point }) => {
      handleStrokeMove(data.userId, data.point);
    };

    const handleEnd = (data: { userId: string; stroke: DrawingStroke }) => {
      handleStrokeEnd(data.userId, data.stroke);
    };

    const handleClear = () => {
      console.log("Canvas cleared");
      setCompletedStrokes([]);
      clearCanvas();
    };

    const handleUndo = (data: { strokeId: string }) => {
      console.log("📥 Undo received, strokeId:", data.strokeId);
      setCompletedStrokes((prev) => {
        console.log("📊 Current strokes before undo:", prev.length);
        const newStrokes = prev.slice(0, -1);
        console.log("📊 Strokes after undo:", newStrokes.length);
        return newStrokes;
      });
    };

    socket.on("drawing:load", handleLoad);
    socket.on("drawing:stroke-start", handleStart);
    socket.on("drawing:stroke-move", handleMove);
    socket.on("drawing:stroke-end", handleEnd);
    socket.on("canvas:cleared", handleClear);
    socket.on("drawing:undone", handleUndo);

    return () => {
      socket.off("drawing:load", handleLoad);
      socket.off("drawing:stroke-start", handleStart);
      socket.off("drawing:stroke-move", handleMove);
      socket.off("drawing:stroke-end", handleEnd);
      socket.off("canvas:cleared", handleClear);
      socket.off("drawing:undone", handleUndo);
    };
  }, [
    socket,
    handleStrokeStart,
    handleStrokeMove,
    handleStrokeEnd,
    clearCanvas,
  ]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="bg-white"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
};
