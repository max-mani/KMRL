import mongoose from 'mongoose';
import { Train } from '../models/Train';
import { IoTSensorData } from '../models/IoTSensor';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://manikandan:Mani19200503@cluster0.cuh1ybv.mongodb.net/kmrl-fleet';

// Sample train data
const sampleTrains = [
  {
    trainId: 'T001',
    name: 'Train 001',
    status: 'running',
    position: { bay: 'S1', x: 100, y: 50, zone: 'service' },
    fitnessCertificate: {
      rollingStock: { valid: true, expiryDate: new Date('2024-12-31'), score: 95 },
      signalling: { valid: true, expiryDate: new Date('2024-11-30'), score: 90 },
      telecom: { valid: true, expiryDate: new Date('2024-12-15'), score: 88 },
      overallScore: 91
    },
    jobCardStatus: {
      openWorkOrders: 2,
      closedWorkOrders: 15,
      criticalIssues: [],
      nextDueDate: new Date('2024-12-20'),
      score: 88
    },
    brandingPriority: {
      advertiser: 'Coca Cola',
      contractHours: 150,
      completedHours: 120,
      priority: 'high',
      slaDeadline: new Date('2024-12-25'),
      score: 80
    },
    mileageBalancing: {
      currentMileage: 2500,
      targetMileage: 2400,
      bogieWear: 15,
      brakePadWear: 20,
      hvacWear: 10,
      score: 85
    },
    cleaningDetailing: {
      lastDeepClean: new Date('2024-11-15'),
      nextScheduled: new Date('2024-12-15'),
      bayOccupancy: false,
      manpowerAvailable: true,
      score: 90
    },
    stablingGeometry: {
      currentBay: 'S1',
      optimalBay: 'S1',
      shuntingDistance: 0,
      turnOutTime: 5,
      score: 100
    },
    iotSensors: {
      vibration: { value: 2.1, threshold: 5.0, status: 'normal' },
      energyUsage: { value: 85, threshold: 100, status: 'normal' },
      doorFaults: { count: 0, threshold: 3, status: 'normal' },
      braking: { efficiency: 95, threshold: 80, status: 'normal' },
      lastUpdated: new Date()
    },
    overallScore: 89,
    lastOptimized: new Date(),
    optimizationReason: 'Excellent condition across all factors - optimal for revenue service'
  },
  {
    trainId: 'T002',
    name: 'Train 002',
    status: 'standby',
    position: { bay: 'ST1', x: 100, y: 150, zone: 'standby' },
    fitnessCertificate: {
      rollingStock: { valid: true, expiryDate: new Date('2024-12-20'), score: 85 },
      signalling: { valid: true, expiryDate: new Date('2024-12-10'), score: 80 },
      telecom: { valid: true, expiryDate: new Date('2024-12-05'), score: 75 },
      overallScore: 80
    },
    jobCardStatus: {
      openWorkOrders: 5,
      closedWorkOrders: 12,
      criticalIssues: ['Brake pad replacement'],
      nextDueDate: new Date('2024-12-18'),
      score: 70
    },
    brandingPriority: {
      advertiser: 'McDonald\'s',
      contractHours: 100,
      completedHours: 45,
      priority: 'high',
      slaDeadline: new Date('2024-12-20'),
      score: 45
    },
    mileageBalancing: {
      currentMileage: 2200,
      targetMileage: 2400,
      bogieWear: 25,
      brakePadWear: 35,
      hvacWear: 20,
      score: 75
    },
    cleaningDetailing: {
      lastDeepClean: new Date('2024-11-20'),
      nextScheduled: new Date('2024-12-20'),
      bayOccupancy: false,
      manpowerAvailable: true,
      score: 80
    },
    stablingGeometry: {
      currentBay: 'ST1',
      optimalBay: 'ST1',
      shuntingDistance: 10,
      turnOutTime: 8,
      score: 85
    },
    iotSensors: {
      vibration: { value: 3.2, threshold: 5.0, status: 'normal' },
      energyUsage: { value: 92, threshold: 100, status: 'normal' },
      doorFaults: { count: 1, threshold: 3, status: 'normal' },
      braking: { efficiency: 88, threshold: 80, status: 'normal' },
      lastUpdated: new Date()
    },
    overallScore: 72,
    lastOptimized: new Date(),
    optimizationReason: 'Good overall condition but branding wrap is critical and needs immediate attention'
  },
  {
    trainId: 'T003',
    name: 'Train 003',
    status: 'maintenance',
    position: { bay: 'IBL1', x: 100, y: 250, zone: 'ibl' },
    fitnessCertificate: {
      rollingStock: { valid: false, expiryDate: new Date('2024-11-25'), score: 30 },
      signalling: { valid: true, expiryDate: new Date('2024-12-30'), score: 70 },
      telecom: { valid: true, expiryDate: new Date('2024-12-20'), score: 65 },
      overallScore: 55
    },
    jobCardStatus: {
      openWorkOrders: 8,
      closedWorkOrders: 5,
      criticalIssues: ['Fitness certificate expired', 'HVAC maintenance'],
      nextDueDate: new Date('2024-12-10'),
      score: 40
    },
    brandingPriority: {
      advertiser: 'Nike',
      contractHours: 200,
      completedHours: 200,
      priority: 'medium',
      slaDeadline: new Date('2024-12-30'),
      score: 100
    },
    mileageBalancing: {
      currentMileage: 2800,
      targetMileage: 2400,
      bogieWear: 40,
      brakePadWear: 45,
      hvacWear: 35,
      score: 50
    },
    cleaningDetailing: {
      lastDeepClean: new Date('2024-10-30'),
      nextScheduled: new Date('2024-12-12'),
      bayOccupancy: true,
      manpowerAvailable: false,
      score: 35
    },
    stablingGeometry: {
      currentBay: 'IBL1',
      optimalBay: 'IBL1',
      shuntingDistance: 5,
      turnOutTime: 15,
      score: 55
    },
    iotSensors: {
      vibration: { value: 6.8, threshold: 5.0, status: 'critical' },
      energyUsage: { value: 105, threshold: 100, status: 'critical' },
      doorFaults: { count: 4, threshold: 3, status: 'critical' },
      braking: { efficiency: 75, threshold: 80, status: 'warning' },
      lastUpdated: new Date()
    },
    overallScore: 45,
    lastOptimized: new Date(),
    optimizationReason: 'Multiple critical issues: fitness certificate expired, job card overdue, cleaning required'
  }
];

// Generate additional trains
const generateAdditionalTrains = (): any[] => {
  const trains = [];
  const advertisers = ['Samsung', 'Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla', 'BMW', 'Mercedes'];
  const statuses = ['running', 'standby', 'maintenance', 'inspection'];
  
  for (let i = 4; i <= 25; i++) {
    const trainId = `T${i.toString().padStart(3, '0')}`;
    const advertiser = advertisers[Math.floor(Math.random() * advertisers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    trains.push({
      trainId,
      name: `Train ${i.toString().padStart(3, '0')}`,
      status,
      position: { 
        bay: `S${i}`, 
        x: 100 + (i * 50), 
        y: 50 + (Math.floor(Math.random() * 4) * 100), 
        zone: 'service' 
      },
      fitnessCertificate: {
        rollingStock: { 
          valid: Math.random() > 0.1, 
          expiryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), 
          score: Math.floor(Math.random() * 40) + 60 
        },
        signalling: { 
          valid: Math.random() > 0.05, 
          expiryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), 
          score: Math.floor(Math.random() * 40) + 60 
        },
        telecom: { 
          valid: Math.random() > 0.05, 
          expiryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), 
          score: Math.floor(Math.random() * 40) + 60 
        },
        overallScore: Math.floor(Math.random() * 40) + 60
      },
      jobCardStatus: {
        openWorkOrders: Math.floor(Math.random() * 10),
        closedWorkOrders: Math.floor(Math.random() * 20) + 5,
        criticalIssues: Math.random() > 0.7 ? ['Maintenance overdue'] : [],
        nextDueDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
        score: Math.floor(Math.random() * 40) + 60
      },
      brandingPriority: {
        advertiser,
        contractHours: Math.floor(Math.random() * 200) + 100,
        completedHours: Math.floor(Math.random() * 150),
        priority: Math.random() > 0.5 ? 'high' : 'medium',
        slaDeadline: new Date(Date.now() + Math.random() * 20 * 24 * 60 * 60 * 1000),
        score: Math.floor(Math.random() * 40) + 60
      },
      mileageBalancing: {
        currentMileage: Math.floor(Math.random() * 1000) + 2000,
        targetMileage: 2400,
        bogieWear: Math.floor(Math.random() * 50),
        brakePadWear: Math.floor(Math.random() * 50),
        hvacWear: Math.floor(Math.random() * 50),
        score: Math.floor(Math.random() * 40) + 60
      },
      cleaningDetailing: {
        lastDeepClean: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextScheduled: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000),
        bayOccupancy: Math.random() > 0.8,
        manpowerAvailable: Math.random() > 0.2,
        score: Math.floor(Math.random() * 40) + 60
      },
      stablingGeometry: {
        currentBay: `S${i}`,
        optimalBay: `S${i}`,
        shuntingDistance: Math.floor(Math.random() * 20),
        turnOutTime: Math.floor(Math.random() * 15) + 5,
        score: Math.floor(Math.random() * 40) + 60
      },
      iotSensors: {
        vibration: { 
          value: Math.random() * 8, 
          threshold: 5.0, 
          status: Math.random() > 0.8 ? 'warning' : 'normal' 
        },
        energyUsage: { 
          value: Math.floor(Math.random() * 40) + 70, 
          threshold: 100, 
          status: 'normal' 
        },
        doorFaults: { 
          count: Math.floor(Math.random() * 5), 
          threshold: 3, 
          status: Math.random() > 0.9 ? 'warning' : 'normal' 
        },
        braking: { 
          efficiency: Math.floor(Math.random() * 30) + 70, 
          threshold: 80, 
          status: Math.random() > 0.9 ? 'warning' : 'normal' 
        },
        lastUpdated: new Date()
      },
      overallScore: Math.floor(Math.random() * 40) + 60,
      lastOptimized: new Date(),
      optimizationReason: 'Generated train data for demonstration'
    });
  }
  
  return trains;
};

// Generate IoT sensor data
const generateIoTSensorData = (): any[] => {
  const sensorData = [];
  const sensorTypes = ['vibration', 'energy', 'door', 'braking', 'temperature', 'humidity'];
  
  for (let i = 1; i <= 25; i++) {
    const trainId = `T${i.toString().padStart(3, '0')}`;
    
    sensorTypes.forEach(sensorType => {
      for (let j = 0; j < 10; j++) {
        const timestamp = new Date(Date.now() - j * 2 * 60 * 60 * 1000); // Every 2 hours
        
        sensorData.push({
          trainId,
          sensorType,
          value: Math.random() * 100,
          unit: sensorType === 'temperature' ? '°C' : sensorType === 'humidity' ? '%' : 'units',
          threshold: {
            warning: 70,
            critical: 90
          },
          status: Math.random() > 0.9 ? 'warning' : 'normal',
          alertLevel: Math.random() > 0.95 ? 'medium' : 'none',
          timestamp,
          location: {
            bay: `S${i}`,
            zone: 'service',
            coordinates: { x: 100 + (i * 50), y: 50 }
          },
          metadata: {
            sensorId: `SENSOR_${trainId}_${sensorType}`,
            firmwareVersion: '1.2.3',
            batteryLevel: Math.floor(Math.random() * 40) + 60,
            signalStrength: Math.floor(Math.random() * 40) + 60,
            calibrationDate: new Date('2024-01-01'),
            lastMaintenance: new Date('2024-06-01')
          },
          quality: {
            confidence: Math.floor(Math.random() * 10) + 90,
            accuracy: Math.floor(Math.random() * 10) + 90,
            reliability: Math.floor(Math.random() * 10) + 90
          }
        });
      }
    });
  }
  
  return sensorData;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Train.deleteMany({});
    await IoTSensorData.deleteMany({});
    logger.info('Cleared existing data');

    // Insert sample trains
    const allTrains = [...sampleTrains, ...generateAdditionalTrains()];
    await Train.insertMany(allTrains);
    logger.info(`Inserted ${allTrains.length} trains`);

    // Insert IoT sensor data
    const iotData = generateIoTSensorData();
    await IoTSensorData.insertMany(iotData);
    logger.info(`Inserted ${iotData.length} IoT sensor records`);

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding error:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
