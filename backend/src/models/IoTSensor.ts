import mongoose, { Document, Schema } from 'mongoose';

export interface IIoTSensorData extends Document {
  trainId: string;
  sensorType: 'vibration' | 'energy' | 'door' | 'braking' | 'temperature' | 'humidity';
  
  // Sensor readings
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  
  // Status and alerts
  status: 'normal' | 'warning' | 'critical';
  alertLevel: 'none' | 'low' | 'medium' | 'high';
  
  // Metadata
  timestamp: Date;
  location: {
    bay: string;
    zone: string;
    coordinates: { x: number; y: number };
  };
  
  // Additional sensor-specific data
  metadata: {
    sensorId: string;
    firmwareVersion: string;
    batteryLevel?: number;
    signalStrength?: number;
    calibrationDate: Date;
    lastMaintenance: Date;
  };
  
  // Data quality
  quality: {
    confidence: number; // 0-100
    accuracy: number; // 0-100
    reliability: number; // 0-100
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const IoTSensorDataSchema = new Schema<IIoTSensorData>({
  trainId: { type: String, required: true },
  sensorType: { 
    type: String, 
    enum: ['vibration', 'energy', 'door', 'braking', 'temperature', 'humidity'],
    required: true 
  },
  
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  threshold: {
    warning: { type: Number, required: true },
    critical: { type: Number, required: true }
  },
  
  status: { 
    type: String, 
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  alertLevel: { 
    type: String, 
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none'
  },
  
  timestamp: { type: Date, default: Date.now },
  location: {
    bay: { type: String, required: true },
    zone: { type: String, required: true },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  },
  
  metadata: {
    sensorId: { type: String, required: true },
    firmwareVersion: { type: String, required: true },
    batteryLevel: { type: Number, min: 0, max: 100 },
    signalStrength: { type: Number, min: 0, max: 100 },
    calibrationDate: { type: Date, required: true },
    lastMaintenance: { type: Date, required: true }
  },
  
  quality: {
    confidence: { type: Number, min: 0, max: 100, default: 95 },
    accuracy: { type: Number, min: 0, max: 100, default: 98 },
    reliability: { type: Number, min: 0, max: 100, default: 99 }
  }
}, {
  timestamps: true
});

// Indexes for performance
IoTSensorDataSchema.index({ trainId: 1, timestamp: -1 });
IoTSensorDataSchema.index({ sensorType: 1, timestamp: -1 });
IoTSensorDataSchema.index({ status: 1, alertLevel: 1 });
IoTSensorDataSchema.index({ 'location.zone': 1, timestamp: -1 });
IoTSensorDataSchema.index({ timestamp: -1 });

// Compound index for efficient queries
IoTSensorDataSchema.index({ trainId: 1, sensorType: 1, timestamp: -1 });

export const IoTSensorData = mongoose.model<IIoTSensorData>('IoTSensorData', IoTSensorDataSchema);
