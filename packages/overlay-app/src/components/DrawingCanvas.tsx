import { useEffect, useRef, useState } from "react";
import type { Point } from "@paintwithchat/shared";
import {
  COLORS,
  BRUSH_SIZES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@paintwithchat/shared";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";

interface DrawingCanvasProps {
  isDrawing: boolean;
  onDrawingStart: (point: Point, color: string, size: number) => void;
  onDrawingMove: (point: Point) => void;
  onDrawingEnd: () => void;
  onRemoteStrokeStart: (
    userId: string,
    point: Point,
    color: string,
    size: number,
  ) => void;
  onRemoteStrokeMove: (userId: string, point: Point) => void;
  onRemoteStrokeEnd: (userId: string) => void;
  onClear: () => void;
}

interface RemoteStroke {
  userId: string;
  points: Point[];
  color: string;
  size: number;
}

export const DrawingCanvas = ({
  isDrawing,
  onDrawingStart,
  onDrawingMove,
  onDrawingEnd,
  onRemoteStrokeStart,
  onRemoteStrokeMove,
  onRemoteStrokeEnd,
  onClear,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[2]);
  const [remoteStrokes, setRemoteStrokes] = useState<Map<string, RemoteStroke>>(
    new Map(),
  );

  // Drawing context
  const getContext = () => canvasRef.current?.getContext("2d");

  // Get point from mouse event
  const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Draw line between two points
  const drawLine = (
    from: Point,
    to: Point,
    color: string,
    size: number,
    ctx?: CanvasRenderingContext2D | null,
  ) => {
    const context = ctx || getContext();
    if (!context) return;

    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getPoint(e);
    setIsMouseDown(true);
    onDrawingStart(point, selectedColor, brushSize);

    // Draw initial point
    const ctx = getContext();
    if (ctx) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown || !isDrawing) return;

    const point = getPoint(e);
    onDrawingMove(point);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    onDrawingEnd();
  };

  // Handle clear canvas
  const handleClear = () => {
    const ctx = getContext();
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    setRemoteStrokes(new Map());
    onClear();
  };

  // Listen for remote drawing events
  useEffect(() => {
    const handleRemoteStart = (
      userId: string,
      point: Point,
      color: string,
      size: number,
    ) => {
      setRemoteStrokes((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, { userId, points: [point], color, size });
        return newMap;
      });

      // Draw initial point
      const ctx = getContext();
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const handleRemoteMove = (userId: string, point: Point) => {
      setRemoteStrokes((prev) => {
        const stroke = prev.get(userId);
        if (!stroke) return prev;

        const lastPoint = stroke.points[stroke.points.length - 1];
        drawLine(lastPoint, point, stroke.color, stroke.size);

        const newMap = new Map(prev);
        newMap.set(userId, {
          ...stroke,
          points: [...stroke.points, point],
        });
        return newMap;
      });
    };

    const handleRemoteEnd = (userId: string) => {
      setRemoteStrokes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    // Store refs for cleanup
    const startHandler = handleRemoteStart;
    const moveHandler = handleRemoteMove;
    const endHandler = handleRemoteEnd;

    // These would be called from parent component via props
    // For now, just expose them
    onRemoteStrokeStart = startHandler;
    onRemoteStrokeMove = moveHandler;
    onRemoteStrokeEnd = endHandler;
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full cursor-crosshair bg-transparent"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {isDrawing && (
        <Card className="absolute bottom-5 left-1/2 -translate-x-1/2 p-5 flex flex-col gap-4 shadow-2xl bg-card/95 backdrop-blur">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold">Color:</div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110",
                    selectedColor === color
                      ? "ring-4 ring-primary"
                      : "ring-2 ring-border",
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold">Brush Size: {brushSize}px</div>
            <div className="flex gap-3 items-center">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center bg-background rounded-lg cursor-pointer transition-all hover:bg-accent",
                    brushSize === size
                      ? "ring-2 ring-primary"
                      : "ring-2 ring-border",
                  )}
                >
                  <div
                    className="rounded-full bg-foreground"
                    style={{
                      width: size,
                      height: size,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleClear}
            variant="destructive"
            className="w-full"
          >
            Clear Canvas
          </Button>
        </Card>
      )}
    </div>
  );
};
