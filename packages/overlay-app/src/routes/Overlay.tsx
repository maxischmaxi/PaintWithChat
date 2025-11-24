import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useOverlaySocket } from "../hooks/useOverlaySocket";
import { DrawingCanvas } from "../components/DrawingCanvas";
import type { Point, DrawingStroke } from "@streamdraw/shared";

export default function Overlay() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const canvasRef = useRef<any>(null);
  const [remoteDrawings, setRemoteDrawings] = useState<Map<string, any>>(
    new Map(),
  );

  const handlers = {
    onStrokeStart: useCallback(
      (userId: string, point: Point, color: string, size: number) => {
        setRemoteDrawings((prev) => {
          const newMap = new Map(prev);
          newMap.set(userId, { points: [point], color, size });
          return newMap;
        });
      },
      [],
    ),
    onStrokeMove: useCallback((userId: string, point: Point) => {
      setRemoteDrawings((prev) => {
        const stroke = prev.get(userId);
        if (!stroke) return prev;

        const newMap = new Map(prev);
        newMap.set(userId, {
          ...stroke,
          points: [...stroke.points, point],
        });
        return newMap;
      });
    }, []),
    onStrokeEnd: useCallback((userId: string, stroke: DrawingStroke) => {
      setRemoteDrawings((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }, []),
    onCanvasClear: useCallback(() => {
      setRemoteDrawings(new Map());
    }, []),
  };

  const { connected, currentDrawerName } = useOverlaySocket(
    sessionId,
    handlers,
  );

  if (!sessionId) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No session ID provided</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Status Bar */}
      {currentDrawerName && (
        <div style={styles.statusBar}>
          <div style={styles.status}>
            <span style={styles.statusDot}>👁</span>
            <span style={styles.statusText}>
              {currentDrawerName} is drawing
            </span>
          </div>
        </div>
      )}

      {/* Drawing Canvas - View Only */}
      <DrawingCanvas
        ref={canvasRef}
        isDrawing={false}
        onDrawingStart={() => {}}
        onDrawingMove={() => {}}
        onDrawingEnd={() => {}}
        onRemoteStrokeStart={handlers.onStrokeStart}
        onRemoteStrokeMove={handlers.onStrokeMove}
        onRemoteStrokeEnd={handlers.onStrokeEnd}
        onClear={() => {}}
      />

      {/* Connection Status */}
      {!connected && (
        <div style={styles.disconnected}>Disconnected from server</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    padding: "20px",
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    color: "white",
    borderRadius: "8px",
    fontSize: "18px",
  },
  statusBar: {
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 24px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "24px",
    backdropFilter: "blur(10px)",
  },
  statusDot: {
    fontSize: "24px",
  },
  statusText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "white",
  },
  disconnected: {
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    color: "white",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
  },
};
