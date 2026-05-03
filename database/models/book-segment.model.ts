import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBookSegmentDocument extends Document {
  clerkId: string;
  bookId: Types.ObjectId;
  content: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSegmentSchema = new Schema<IBookSegmentDocument>(
  {
    clerkId: { type: String, required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    wordCount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Text index for full-text search
BookSegmentSchema.index({ content: "text" });

const BookSegment: Model<IBookSegmentDocument> =
  mongoose.models.BookSegment ??
  mongoose.model<IBookSegmentDocument>("BookSegment", BookSegmentSchema);

export default BookSegment;
