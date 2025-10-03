import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IManualOverride extends Document {
  userId: Schema.Types.ObjectId;
  overrides: Record<string, any>;
  updatedAt: Date;
  createdAt: Date;
}

const ManualOverrideSchema = new Schema<IManualOverride>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    overrides: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const ManualOverride: Model<IManualOverride> =
  mongoose.models.ManualOverride || mongoose.model<IManualOverride>('ManualOverride', ManualOverrideSchema);


