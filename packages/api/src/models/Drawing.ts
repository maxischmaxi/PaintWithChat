import mongoose, { Schema, Document } from "mongoose";
import { DrawingStroke, Point } from "@streamdraw/shared";

export interface IDrawing extends Document {
  sessionId: string;
  userId: string;
  username: string;
  strokes: DrawingStroke[];
  createdAt: Date;
}

const PointSchema = new Schema<Point>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const DrawingStrokeSchema = new Schema<DrawingStroke>(
  {
    id: { type: String, required: true },
    points: { type: [PointSchema], required: true },
    color: { type: String, required: true },
    size: { type: Number, required: true },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const DrawingSchema = new Schema<IDrawing>({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  strokes: {
    type: [DrawingStrokeSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for session queries
DrawingSchema.index({ sessionId: 1, createdAt: -1 });

export const Drawing = mongoose.model<IDrawing>("Drawing", DrawingSchema);
