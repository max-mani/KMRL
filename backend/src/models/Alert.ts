import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'critical' | 'warning' | 'info';
  category: 'maintenance' | 'performance' | 'safety' | 'system';
  title: string;
  message: string;
  trainId?: string;
  isRead: boolean;
  isResolved: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

const AlertSchema = new Schema<IAlert>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'performance', 'safety', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  trainId: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
AlertSchema.index({ userId: 1, createdAt: -1 });
AlertSchema.index({ isRead: 1, isResolved: 1 });
AlertSchema.index({ type: 1, priority: 1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
