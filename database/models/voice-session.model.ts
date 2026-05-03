import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVoiceSessionDocument extends Document {
  clerkId: string;
  bookId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  billingPeriodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceSessionSchema = new Schema<IVoiceSessionDocument>(
  {
    clerkId: { type: String, required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    billingPeriodStart: { type: Date, required: true },
  },
  { timestamps: true }
);

const VoiceSession: Model<IVoiceSessionDocument> =
  mongoose.models.VoiceSession ??
  mongoose.model<IVoiceSessionDocument>("VoiceSession", VoiceSessionSchema);

export default VoiceSession;
