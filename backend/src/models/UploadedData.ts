import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadedData extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: 'csv' | 'excel' | 'google-sheet';
  fileSize: number;
  storage: {
    provider: 'firebase' | 'local' | 'none';
    bucket?: string;
    path?: string;
    url?: string;
  };
  originalData: any[];
  processedData: ProcessedTrainData[];
  uploadDate: Date;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface ProcessedTrainData {
  trainId: string;
  fitnessCertificate: number;
  jobCardStatus: number;
  brandingPriority: number;
  mileageBalancing: number;
  cleaningDetailing: number;
  stablingGeometry: number;
  [key: string]: any; // For additional fields
}

const ProcessedTrainDataSchema = new Schema({
  trainId: { type: String, required: true },
  fitnessCertificate: { type: Number, min: 0, max: 100 },
  jobCardStatus: { type: Number, min: 0, max: 100 },
  brandingPriority: { type: Number, min: 0, max: 100 },
  mileageBalancing: { type: Number, min: 0, max: 100 },
  cleaningDetailing: { type: Number, min: 0, max: 100 },
  stablingGeometry: { type: Number, min: 0, max: 100 }
}, { _id: false });

const UploadedDataSchema = new Schema<IUploadedData>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'excel', 'google-sheet'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  storage: {
    provider: { type: String, enum: ['firebase', 'local', 'none'], default: 'none' },
    bucket: { type: String },
    path: { type: String },
    url: { type: String }
  },
  originalData: {
    type: [Schema.Types.Mixed],
    required: true
  } as any,
  processedData: {
    type: [ProcessedTrainDataSchema],
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

export const UploadedData = mongoose.model<IUploadedData>('UploadedData', UploadedDataSchema);
