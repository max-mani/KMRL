import mongoose, { Document, Schema } from 'mongoose';

export interface IOptimizationResult extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  results: TrainOptimizationResult[];
  totalTrains: number;
  averageScore: number;
  createdAt: Date;
}

export interface TrainOptimizationResult {
  trainId: string;
  score: number;
  factors: {
    fitness: 'great' | 'good' | 'ok' | 'bad';
    jobCard: 'great' | 'good' | 'ok' | 'bad';
    branding: 'great' | 'good' | 'ok' | 'bad';
    mileage: 'great' | 'good' | 'ok' | 'bad';
    cleaning: 'great' | 'good' | 'ok' | 'bad';
    geometry: 'great' | 'good' | 'ok' | 'bad';
  };
  reason: string;
  rawData: {
    fitnessCertificate: number;
    jobCardStatus: number;
    brandingPriority: number;
    mileageBalancing: number;
    cleaningDetailing: number;
    stablingGeometry: number;
  };
}

const TrainOptimizationResultSchema = new Schema({
  trainId: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  factors: {
    fitness: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true },
    jobCard: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true },
    branding: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true },
    mileage: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true },
    cleaning: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true },
    geometry: { type: String, enum: ['great', 'good', 'ok', 'bad'], required: true }
  },
  reason: { type: String, required: true },
  rawData: {
    fitnessCertificate: { type: Number, required: true },
    jobCardStatus: { type: Number, required: true },
    brandingPriority: { type: Number, required: true },
    mileageBalancing: { type: Number, required: true },
    cleaningDetailing: { type: Number, required: true },
    stablingGeometry: { type: Number, required: true }
  }
}, { _id: false });

const OptimizationResultSchema = new Schema<IOptimizationResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  results: {
    type: [TrainOptimizationResultSchema],
    required: true
  },
  totalTrains: {
    type: Number,
    required: true
  },
  averageScore: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
OptimizationResultSchema.index({ userId: 1, date: -1 });
OptimizationResultSchema.index({ date: -1 });

export const OptimizationResult = mongoose.model<IOptimizationResult>('OptimizationResult', OptimizationResultSchema);
