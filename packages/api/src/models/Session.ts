import mongoose, { Schema, Document } from "mongoose";
import { UserSession } from "@paintwithchat/shared";

export interface ISession extends Document {
  streamerId: string;
  streamerName: string;
  active: boolean;
  currentDrawerId: string | null;
  activeUsers: UserSession[];
  createdAt: Date;
  endedAt?: Date;
}

const UserSessionSchema = new Schema<UserSession>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    avatar: { type: String, required: true },
    socketId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>({
  streamerId: {
    type: String,
    required: true,
    index: true,
  },
  streamerName: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  currentDrawerId: {
    type: String,
    default: null,
  },
  activeUsers: {
    type: [UserSessionSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
});

// Index for finding active sessions
SessionSchema.index({ streamerId: 1, active: 1 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);
