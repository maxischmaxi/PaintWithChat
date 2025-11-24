import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  twitchId: string;
  username: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  twitchId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUser>("User", UserSchema);
