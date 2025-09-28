import mongoose, { Document, Schema } from 'mongoose';

export interface ITrain extends Document {
  trainId: string;
  name: string;
  status: 'running' | 'standby' | 'maintenance' | 'inspection';
  position: {
    bay: string;
    x: number;
    y: number;
    zone: 'service' | 'standby' | 'ibl' | 'cleaning';
  };
  
  // Six-factor analysis data
  fitnessCertificate: {
    rollingStock: { valid: boolean; expiryDate: Date; score: number };
    signalling: { valid: boolean; expiryDate: Date; score: number };
    telecom: { valid: boolean; expiryDate: Date; score: number };
    overallScore: number;
  };
  
  jobCardStatus: {
    openWorkOrders: number;
    closedWorkOrders: number;
    criticalIssues: string[];
    nextDueDate: Date;
    score: number;
  };
  
  brandingPriority: {
    advertiser: string;
    contractHours: number;
    completedHours: number;
    priority: 'high' | 'medium' | 'low';
    slaDeadline: Date;
    score: number;
  };
  
  mileageBalancing: {
    currentMileage: number;
    targetMileage: number;
    bogieWear: number;
    brakePadWear: number;
    hvacWear: number;
    score: number;
  };
  
  cleaningDetailing: {
    lastDeepClean: Date;
    nextScheduled: Date;
    bayOccupancy: boolean;
    manpowerAvailable: boolean;
    score: number;
  };
  
  stablingGeometry: {
    currentBay: string;
    optimalBay: string;
    shuntingDistance: number;
    turnOutTime: number;
    score: number;
  };
  
  // IoT sensor data
  iotSensors: {
    vibration: { value: number; threshold: number; status: 'normal' | 'warning' | 'critical' };
    energyUsage: { value: number; threshold: number; status: 'normal' | 'warning' | 'critical' };
    doorFaults: { count: number; threshold: number; status: 'normal' | 'warning' | 'critical' };
    braking: { efficiency: number; threshold: number; status: 'normal' | 'warning' | 'critical' };
    lastUpdated: Date;
  };
  
  // Overall scoring
  overallScore: number;
  lastOptimized: Date;
  optimizationReason: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const TrainSchema = new Schema<ITrain>({
  trainId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['running', 'standby', 'maintenance', 'inspection'],
    default: 'standby'
  },
  position: {
    bay: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    zone: { 
      type: String, 
      enum: ['service', 'standby', 'ibl', 'cleaning'],
      default: 'standby'
    }
  },
  
  fitnessCertificate: {
    rollingStock: {
      valid: { type: Boolean, required: true },
      expiryDate: { type: Date, required: true },
      score: { type: Number, min: 0, max: 100, required: true }
    },
    signalling: {
      valid: { type: Boolean, required: true },
      expiryDate: { type: Date, required: true },
      score: { type: Number, min: 0, max: 100, required: true }
    },
    telecom: {
      valid: { type: Boolean, required: true },
      expiryDate: { type: Date, required: true },
      score: { type: Number, min: 0, max: 100, required: true }
    },
    overallScore: { type: Number, min: 0, max: 100, required: true }
  },
  
  jobCardStatus: {
    openWorkOrders: { type: Number, default: 0 },
    closedWorkOrders: { type: Number, default: 0 },
    criticalIssues: [{ type: String }],
    nextDueDate: { type: Date, required: true },
    score: { type: Number, min: 0, max: 100, required: true }
  },
  
  brandingPriority: {
    advertiser: { type: String, required: true },
    contractHours: { type: Number, required: true },
    completedHours: { type: Number, default: 0 },
    priority: { 
      type: String, 
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    slaDeadline: { type: Date, required: true },
    score: { type: Number, min: 0, max: 100, required: true }
  },
  
  mileageBalancing: {
    currentMileage: { type: Number, required: true },
    targetMileage: { type: Number, required: true },
    bogieWear: { type: Number, min: 0, max: 100, required: true },
    brakePadWear: { type: Number, min: 0, max: 100, required: true },
    hvacWear: { type: Number, min: 0, max: 100, required: true },
    score: { type: Number, min: 0, max: 100, required: true }
  },
  
  cleaningDetailing: {
    lastDeepClean: { type: Date, required: true },
    nextScheduled: { type: Date, required: true },
    bayOccupancy: { type: Boolean, default: false },
    manpowerAvailable: { type: Boolean, default: true },
    score: { type: Number, min: 0, max: 100, required: true }
  },
  
  stablingGeometry: {
    currentBay: { type: String, required: true },
    optimalBay: { type: String, required: true },
    shuntingDistance: { type: Number, required: true },
    turnOutTime: { type: Number, required: true },
    score: { type: Number, min: 0, max: 100, required: true }
  },
  
  iotSensors: {
    vibration: {
      value: { type: Number, required: true },
      threshold: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
      }
    },
    energyUsage: {
      value: { type: Number, required: true },
      threshold: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
      }
    },
    doorFaults: {
      count: { type: Number, default: 0 },
      threshold: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
      }
    },
    braking: {
      efficiency: { type: Number, min: 0, max: 100, required: true },
      threshold: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
      }
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  overallScore: { type: Number, min: 0, max: 100, required: true },
  lastOptimized: { type: Date, default: Date.now },
  optimizationReason: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes for performance
TrainSchema.index({ trainId: 1 });
TrainSchema.index({ status: 1 });
TrainSchema.index({ 'position.zone': 1 });
TrainSchema.index({ overallScore: -1 });
TrainSchema.index({ lastOptimized: -1 });

export const Train = mongoose.model<ITrain>('Train', TrainSchema);
