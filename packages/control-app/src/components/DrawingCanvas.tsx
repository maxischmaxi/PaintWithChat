import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Eraser, Pencil, Trash2, Undo } from "lucide-react";
import type { Point, DrawingStroke } from "@paintwithchat/shared";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  BRUSH_SIZES,
} from "@paintwithchat/shared";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@paintwithchat/shared";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface DrawingCanvasProps {
  socket?: SocketType | null;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
}

export const DrawingCanvas = ({ socket }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]); // Black
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES[2]); // 10px
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const undoingRef = useRef(false);

  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getContext("2d");
  }, []);

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoordinates = useCallback(
    (e: MouseEvent | TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      let clientX: number;
      let clientY: number;

      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  // Draw a line between two points
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

  // Draw a point
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

  // Redraw all strokes from history
  const redrawCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    // Clear and fill with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Redraw all strokes
    strokes.forEach((stroke) => {
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
  }, [getContext, strokes, drawPoint, drawLine]);

  // Handle mouse/touch down
  const handlePointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getCanvasCoordinates(e);
      if (!point) return;

      setIsDrawing(true);
      currentStrokeRef.current = [point];

      const drawColor = tool === "eraser" ? "#FFFFFF" : selectedColor;
      const drawSize = tool === "eraser" ? brushSize * 2 : brushSize;

      // Draw initial point
      drawPoint(point, drawColor, drawSize);

      // Emit socket event
      if (socket) {
        socket.emit("drawing:start", {
          point,
          color: drawColor,
          size: drawSize,
        });
      }
    },
    [getCanvasCoordinates, drawPoint, selectedColor, brushSize, tool, socket],
  );

  // Handle mouse/touch move
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const point = getCanvasCoordinates(e);
      if (!point) return;

      const lastPoint =
        currentStrokeRef.current[currentStrokeRef.current.length - 1];
      const drawColor = tool === "eraser" ? "#FFFFFF" : selectedColor;
      const drawSize = tool === "eraser" ? brushSize * 2 : brushSize;

      // Draw line
      drawLine(lastPoint, point, drawColor, drawSize);

      // Add to current stroke
      currentStrokeRef.current.push(point);

      // Emit socket event
      if (socket) {
        socket.emit("drawing:move", { point });
      }
    },
    [
      isDrawing,
      getCanvasCoordinates,
      drawLine,
      selectedColor,
      brushSize,
      tool,
      socket,
    ],
  );

  // Handle mouse/touch up
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    const drawColor = tool === "eraser" ? "#FFFFFF" : selectedColor;
    const drawSize = tool === "eraser" ? brushSize * 2 : brushSize;

    // Generate unique stroke ID
    const strokeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save stroke to history with ID
    const newStroke: Stroke = {
      id: strokeId,
      points: [...currentStrokeRef.current],
      color: drawColor,
      size: drawSize,
    };
    setStrokes((prev) => [...prev, newStroke]);

    currentStrokeRef.current = [];

    // Emit socket event
    if (socket) {
      socket.emit("drawing:end");
    }
  }, [isDrawing, selectedColor, brushSize, tool, socket]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setStrokes([]);

    // Emit socket event
    if (socket) {
      socket.emit("canvas:clear");
    }
  }, [getContext, socket]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    // Prevent rapid double-clicks
    if (undoingRef.current) {
      console.log("⚠️ Undo already in progress, ignoring");
      return;
    }

    undoingRef.current = true;

    setStrokes((prev) => {
      // Check if there are strokes to undo using the actual current state
      if (prev.length === 0) {
        console.log("⚠️ No strokes to undo");
        undoingRef.current = false;
        return prev;
      }

      console.log("🔙 Undo clicked, current strokes:", prev.length);

      // Emit socket event ONLY, don't remove locally
      // The server will broadcast back to all clients including us
      if (socket) {
        console.log("📤 Emitting undo event to socket");
        socket.emit("drawing:undo");
      } else {
        console.warn("⚠️ No socket available");
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        undoingRef.current = false;
      }, 100);

      // Don't modify state here - wait for server broadcast
      return prev;
    });
  }, [socket]);

  // Redraw canvas when strokes change (for undo)
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Fill with white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Setup socket event listeners for remote drawing
  useEffect(() => {
    if (!socket) return;

    const handleRemoteLoad = (data: { strokes: DrawingStroke[] }) => {
      console.log("Loading existing drawings:", data.strokes.length);
      setStrokes(
        data.strokes.map((s) => ({
          id: s.id,
          points: s.points,
          color: s.color,
          size: s.size,
        })),
      );
    };

    const handleRemoteClear = () => {
      console.log("Canvas cleared remotely");
      const ctx = getContext();
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      setStrokes([]);
    };

    const handleRemoteUndo = (data: { strokeId: string }) => {
      console.log("📥 Remote undo received, strokeId:", data.strokeId);
      setStrokes((prev) => {
        console.log("📊 Strokes before remote undo:", prev.length);
        const newStrokes = prev.slice(0, -1);
        console.log("📊 Strokes after remote undo:", newStrokes.length);
        return newStrokes;
      });
    };

    socket.on("drawing:load", handleRemoteLoad);
    socket.on("canvas:cleared", handleRemoteClear);
    socket.on("drawing:undone", handleRemoteUndo);

    return () => {
      socket.off("drawing:load", handleRemoteLoad);
      socket.off("canvas:cleared", handleRemoteClear);
      socket.off("drawing:undone", handleRemoteUndo);
    };
  }, [socket, getContext]);

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    // Touch events
    canvas.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      canvas.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);

      canvas.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-muted/30 rounded-lg overflow-hidden"
    >
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="bg-white shadow-xl cursor-crosshair"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-center gap-6 justify-center flex-wrap">
          {/* Tool Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Tool:</span>
            <Button
              variant={tool === "pencil" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("pencil")}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Pencil
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("eraser")}
              className="gap-2"
            >
              <Eraser className="h-4 w-4" />
              Eraser
            </Button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Color:</span>
            <div className="flex gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    selectedColor === color
                      ? "border-primary scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Size:</span>
            <div className="flex gap-1">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-10 h-10 rounded border-2 flex items-center justify-center transition-all ${
                    brushSize === size
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  title={`${size}px`}
                >
                  <div
                    className="rounded-full bg-foreground"
                    style={{
                      width: Math.min(size, 20),
                      height: Math.min(size, 20),
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="gap-2"
            >
              <Undo className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
