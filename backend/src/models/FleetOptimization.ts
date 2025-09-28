import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainAssignment {
  trainId: string;
  assignedZone: 'service' | 'standby' | 'ibl' | 'cleaning';
  bay: string;
  position: { x: number; y: number };
  score: number;
  reasoning: string;
  factors: {
    fitness: number;
    jobCard: number;
    branding: number;
    mileage: number;
    cleaning: number;
    geometry: number;
  };
}

export interface IOptimizationMetrics {
  totalTrains: number;
  serviceTrains: number;
  standbyTrains: number;
  maintenanceTrains: number;
  averageScore: number;
  energyEfficiency: number;
  shuntingCost: number;
  brandingCompliance: number;
  punctuality: number;
  mileageBalance: number;
}

export interface IFleetOptimization extends Document {
  date: Date;
  userId: Schema.Types.ObjectId;
  
  // Optimization results
  assignments: ITrainAssignment[];
  metrics: IOptimizationMetrics;
  
  // Optimization parameters
  weights: {
    fitness: number;
    jobCard: number;
    branding: number;
    mileage: number;
    cleaning: number;
    geometry: number;
    energy: number;
    shunting: number;
  };
  
  // Learning data
  previousOutcomes: {
    actualPunctuality: number;
    actualEnergyUsage: number;
    actualMaintenanceCost: number;
    actualBrandingCompliance: number;
  };
  
  // Simulation data
  isSimulation: boolean;
  simulationChanges?: {
    trainId: string;
    changes: Record<string, any>;
  }[];
  
  // Narrative explanation
  narrative: {
    summary: string;
    keyChanges: string[];
    recommendations: string[];
    warnings: string[];
  };
  
  // Metadata
  optimizationTime: number; // milliseconds
  algorithm: string;
  version: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const TrainAssignmentSchema = new Schema<ITrainAssignment>({
  trainId: { type: String, required: true },
  assignedZone: { 
    type: String, 
    enum: ['service', 'standby', 'ibl', 'cleaning'],
    required: true 
  },
  bay: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  score: { type: Number, min: 0, max: 100, required: true },
  reasoning: { type: String, required: true },
  factors: {
    fitness: { type: Number, min: 0, max: 100, required: true },
    jobCard: { type: Number, min: 0, max: 100, required: true },
    branding: { type: Number, min: 0, max: 100, required: true },
    mileage: { type: Number, min: 0, max: 100, required: true },
    cleaning: { type: Number, min: 0, max: 100, required: true },
    geometry: { type: Number, min: 0, max: 100, required: true }
  }
});

const OptimizationMetricsSchema = new Schema<IOptimizationMetrics>({
  totalTrains: { type: Number, required: true },
  serviceTrains: { type: Number, required: true },
  standbyTrains: { type: Number, required: true },
  maintenanceTrains: { type: Number, required: true },
  averageScore: { type: Number, min: 0, max: 100, required: true },
  energyEfficiency: { type: Number, min: 0, max: 100, required: true },
  shuntingCost: { type: Number, required: true },
  brandingCompliance: { type: Number, min: 0, max: 100, required: true },
  punctuality: { type: Number, min: 0, max: 100, required: true },
  mileageBalance: { type: Number, min: 0, max: 100, required: true }
});

const FleetOptimizationSchema = new Schema<IFleetOptimization>({
  date: { type: Date, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  assignments: [TrainAssignmentSchema],
  metrics: OptimizationMetricsSchema,
  
  weights: {
    fitness: { type: Number, min: 0, max: 1, default: 0.2 },
    jobCard: { type: Number, min: 0, max: 1, default: 0.2 },
    branding: { type: Number, min: 0, max: 1, default: 0.15 },
    mileage: { type: Number, min: 0, max: 1, default: 0.15 },
    cleaning: { type: Number, min: 0, max: 1, default: 0.1 },
    geometry: { type: Number, min: 0, max: 1, default: 0.1 },
    energy: { type: Number, min: 0, max: 1, default: 0.05 },
    shunting: { type: Number, min: 0, max: 1, default: 0.05 }
  },
  
  previousOutcomes: {
    actualPunctuality: { type: Number, min: 0, max: 100 },
    actualEnergyUsage: { type: Number },
    actualMaintenanceCost: { type: Number },
    actualBrandingCompliance: { type: Number, min: 0, max: 100 }
  },
  
  isSimulation: { type: Boolean, default: false },
  simulationChanges: [{
    trainId: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, required: true }
  }],
  
  narrative: {
    summary: { type: String, required: true },
    keyChanges: [{ type: String }],
    recommendations: [{ type: String }],
    warnings: [{ type: String }]
  },
  
  optimizationTime: { type: Number, required: true },
  algorithm: { type: String, default: 'multi-objective-optimization' },
  version: { type: String, default: '1.0.0' }
}, {
  timestamps: true
});

// Indexes for performance
FleetOptimizationSchema.index({ date: -1 });
FleetOptimizationSchema.index({ userId: 1, date: -1 });
FleetOptimizationSchema.index({ isSimulation: 1 });
FleetOptimizationSchema.index({ 'metrics.averageScore': -1 });

export const FleetOptimization = mongoose.model<IFleetOptimization>('FleetOptimization', FleetOptimizationSchema);
