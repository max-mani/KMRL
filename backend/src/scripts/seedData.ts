import mongoose from 'mongoose';
import { Train } from '../models/Train';
import { IoTSensorData } from '../models/IoTSensor';
import { FleetOptimization } from '../models/FleetOptimization';
import { Alert } from '../models/Alert';
import { OptimizationResult } from '../models/OptimizationResult';
import { User } from '../models/User';
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

// Generate IoT sensor data for past 30 days (reduced frequency)
const generateIoTSensorData = (): any[] => {
  const sensorData = [];
  const sensorTypes = ['vibration', 'energy', 'door', 'braking', 'temperature', 'humidity'];
  
  for (let i = 1; i <= 25; i++) {
    const trainId = `T${i.toString().padStart(3, '0')}`;
    
    sensorTypes.forEach(sensorType => {
      // Generate data for past 30 days, once per day (reduced from every 4 hours)
      for (let day = 0; day < 30; day++) {
        const timestamp = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
          
          // Generate realistic sensor values with some variation
          let value, status, alertLevel;
          
          switch (sensorType) {
            case 'vibration':
              value = Math.random() * 8; // 0-8 mm/s
              status = value > 5 ? 'critical' : value > 3 ? 'warning' : 'normal';
              alertLevel = value > 5 ? 'high' : value > 3 ? 'medium' : 'none';
              break;
            case 'energy':
              value = Math.random() * 50 + 50; // 50-100 kWh
              status = value > 90 ? 'warning' : 'normal';
              alertLevel = value > 90 ? 'medium' : 'none';
              break;
            case 'temperature':
              value = Math.random() * 20 + 20; // 20-40°C
              status = value > 35 ? 'warning' : 'normal';
              alertLevel = value > 35 ? 'medium' : 'none';
              break;
            case 'humidity':
              value = Math.random() * 40 + 40; // 40-80%
              status = value > 70 ? 'warning' : 'normal';
              alertLevel = value > 70 ? 'low' : 'none';
              break;
            case 'door':
              value = Math.random() * 5; // 0-5 faults
              status = value > 3 ? 'critical' : value > 1 ? 'warning' : 'normal';
              alertLevel = value > 3 ? 'high' : value > 1 ? 'medium' : 'none';
              break;
            case 'braking':
              value = Math.random() * 30 + 70; // 70-100% efficiency
              status = value < 80 ? 'warning' : 'normal';
              alertLevel = value < 80 ? 'medium' : 'none';
              break;
            default:
              value = Math.random() * 100;
              status = 'normal';
              alertLevel = 'none';
          }
          
          sensorData.push({
            trainId,
            sensorType,
            value: Math.round(value * 100) / 100,
            unit: sensorType === 'temperature' ? '°C' : sensorType === 'humidity' ? '%' : sensorType === 'energy' ? 'kWh' : sensorType === 'vibration' ? 'mm/s' : 'units',
            threshold: {
              warning: sensorType === 'vibration' ? 3 : sensorType === 'energy' ? 90 : sensorType === 'temperature' ? 35 : sensorType === 'humidity' ? 70 : sensorType === 'door' ? 1 : sensorType === 'braking' ? 85 : 70,
              critical: sensorType === 'vibration' ? 5 : sensorType === 'energy' ? 95 : sensorType === 'temperature' ? 40 : sensorType === 'humidity' ? 80 : sensorType === 'door' ? 3 : sensorType === 'braking' ? 75 : 90
            },
            status,
            alertLevel,
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

// Generate historical optimization data for past 30 days
const generateHistoricalOptimizationData = (userId: string): any[] => {
  const optimizationData = [];
  const advertisers = ['Coca Cola', 'McDonald\'s', 'Nike', 'Samsung', 'Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla', 'BMW'];
  
  for (let day = 0; day < 30; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    
    // Generate realistic metrics with some variation
    const punctuality = Math.random() * 5 + 95; // 95-100%
    const energyEfficiency = Math.random() * 15 + 80; // 80-95%
    const brandingCompliance = Math.random() * 10 + 85; // 85-95%
    const shuntingCost = Math.random() * 100 + 150; // 150-250
    const mileageBalance = Math.random() * 10 + 85; // 85-95%
    
    const assignments = generateTrainAssignments();
    const serviceTrains = assignments.filter(a => a.assignedZone === 'service').length;
    const standbyTrains = assignments.filter(a => a.assignedZone === 'standby').length;
    const maintenanceTrains = assignments.filter(a => a.assignedZone === 'ibl').length;
    const averageScore = Math.round(assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length);
    
    optimizationData.push({
      date,
      userId,
      assignments,
      metrics: {
        totalTrains: assignments.length,
        serviceTrains,
        standbyTrains,
        maintenanceTrains,
        averageScore,
        punctuality: Math.round(punctuality * 100) / 100,
        energyEfficiency: Math.round(energyEfficiency * 100) / 100,
        brandingCompliance: Math.round(brandingCompliance * 100) / 100,
        shuntingCost: Math.round(shuntingCost),
        mileageBalance: Math.round(mileageBalance * 100) / 100
      },
      weights: {
        fitness: 0.2,
        jobCard: 0.15,
        branding: 0.2,
        mileage: 0.15,
        cleaning: 0.1,
        geometry: 0.1,
        energy: 0.1
      },
      previousOutcomes: {
        actualPunctuality: Math.min(100, Math.max(0, punctuality + (Math.random() - 0.5) * 2)),
        actualEnergyUsage: Math.min(100, Math.max(0, energyEfficiency + (Math.random() - 0.5) * 3)),
        actualMaintenanceCost: Math.max(0, shuntingCost + (Math.random() - 0.5) * 20),
        actualBrandingCompliance: Math.min(100, Math.max(0, brandingCompliance + (Math.random() - 0.5) * 2))
      },
      isSimulation: false,
      narrative: {
        summary: `Optimization completed for ${date.toDateString()} with ${Math.round(punctuality)}% punctuality and ₹${Math.round(shuntingCost)} shunting cost`,
        keyChanges: [
          'Adjusted train assignments based on fitness scores',
          'Optimized branding compliance for high-priority trains',
          'Balanced energy consumption across fleet'
        ],
        recommendations: [
          'Schedule maintenance for trains with low fitness scores',
          'Review branding contracts for compliance optimization',
          'Monitor energy consumption patterns'
        ],
        warnings: day % 7 === 0 ? ['High energy consumption detected'] : []
      },
      optimizationTime: Math.floor(Math.random() * 2000) + 1000, // 1-3 seconds
      algorithm: 'genetic',
      version: '2.1.0'
    });
  }
  
  return optimizationData;
};

// Generate train assignments for optimization
const generateTrainAssignments = (): any[] => {
  const assignments = [];
  const zones = ['service', 'standby', 'ibl', 'cleaning'];
  
  for (let i = 1; i <= 25; i++) {
    const trainId = `T${i.toString().padStart(3, '0')}`;
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const score = Math.floor(Math.random() * 40) + 60;
    
    assignments.push({
      trainId,
      assignedZone: zone,
      bay: zone === 'service' ? `S${i}` : zone === 'standby' ? `ST${i}` : zone === 'ibl' ? `IBL${i}` : `C${i}`,
      position: {
        x: 100 + (i * 50),
        y: 50 + (Math.floor(Math.random() * 4) * 100)
      },
      score,
      reasoning: `Train ${trainId} assigned to ${zone} zone based on fitness score of ${score} and operational requirements`,
      factors: {
        fitness: Math.floor(Math.random() * 30) + 70,
        jobCard: Math.floor(Math.random() * 30) + 70,
        branding: Math.floor(Math.random() * 30) + 70,
        mileage: Math.floor(Math.random() * 30) + 70,
        cleaning: Math.floor(Math.random() * 30) + 70,
        geometry: Math.floor(Math.random() * 30) + 70
      }
    });
  }
  
  return assignments;
};

// Generate alerts for past 30 days
const generateAlerts = (userId: string): any[] => {
  const alerts = [];
  const alertTypes = ['critical', 'warning', 'info'];
  const categories = ['maintenance', 'performance', 'safety', 'system'];
  const alertTemplates = [
    { title: 'Fitness Certificate Expired', message: 'Fitness certificate has expired for train T003 and requires immediate attention' },
    { title: 'High Vibration Alert', message: 'Vibration levels above threshold detected in train T007' },
    { title: 'Energy Consumption Warning', message: 'Energy consumption above normal levels for train T012' },
    { title: 'Branding Wrap Delay', message: 'Branding wrap completion delayed for train T015' },
    { title: 'Maintenance Overdue', message: 'Scheduled maintenance is overdue for train T020' },
    { title: 'Door Fault Detected', message: 'Door operation fault detected in train T005' },
    { title: 'Braking Efficiency Low', message: 'Braking efficiency below acceptable threshold for train T008' },
    { title: 'Sensor Malfunction', message: 'Temperature sensor malfunction detected in train T010' },
    { title: 'Humidity Critical', message: 'Humidity levels critical in train T014' },
    { title: 'Signal Strength Low', message: 'Low signal strength detected for train T018' }
  ];
  
  for (let day = 0; day < 30; day++) {
    // Generate 1-3 alerts per day
    const numAlerts = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numAlerts; i++) {
      const timestamp = new Date(Date.now() - (day * 24 + Math.random() * 24) * 60 * 60 * 1000);
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const trainId = `T${Math.floor(Math.random() * 25) + 1}`;
      const isResolved = Math.random() > 0.7;
      
      alerts.push({
        userId,
        type,
        category,
        title: template.title,
        message: template.message.replace(/T\d+/, trainId),
        trainId,
        isRead: Math.random() > 0.5,
        isResolved,
        priority: type === 'critical' ? 'high' : type === 'warning' ? 'medium' : 'low',
        createdAt: timestamp,
        resolvedAt: isResolved ? new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
        resolvedBy: isResolved ? new mongoose.Types.ObjectId() : null
      });
    }
  }
  
  return alerts;
};

// Generate optimization results for past 30 days
const generateOptimizationResults = (userId: string): any[] => {
  const results = [];
  
  for (let day = 0; day < 30; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
    const trainResults = [];
    
    for (let i = 1; i <= 25; i++) {
      const trainId = `T${i.toString().padStart(3, '0')}`;
      const score = Math.floor(Math.random() * 40) + 60;
      
      const getFactorStatus = (score: number): 'great' | 'good' | 'ok' | 'bad' => {
        if (score >= 90) return 'great';
        if (score >= 75) return 'good';
        if (score >= 60) return 'ok';
        return 'bad';
      };

      const fitnessScore = Math.floor(Math.random() * 30) + 70;
      const jobCardScore = Math.floor(Math.random() * 30) + 70;
      const brandingScore = Math.floor(Math.random() * 30) + 70;
      const mileageScore = Math.floor(Math.random() * 30) + 70;
      const cleaningScore = Math.floor(Math.random() * 30) + 70;
      const geometryScore = Math.floor(Math.random() * 30) + 70;

      trainResults.push({
        trainId,
        score,
        factors: {
          fitness: getFactorStatus(fitnessScore),
          jobCard: getFactorStatus(jobCardScore),
          branding: getFactorStatus(brandingScore),
          mileage: getFactorStatus(mileageScore),
          cleaning: getFactorStatus(cleaningScore),
          geometry: getFactorStatus(geometryScore)
        },
        reason: `Train ${trainId} optimized based on current condition and requirements`,
        rawData: {
          fitnessCertificate: fitnessScore,
          jobCardStatus: jobCardScore,
          brandingPriority: brandingScore,
          mileageBalancing: mileageScore,
          cleaningDetailing: cleaningScore,
          stablingGeometry: geometryScore
        }
      });
    }
    
    const averageScore = Math.round(trainResults.reduce((sum, t) => sum + t.score, 0) / trainResults.length);
    
    results.push({
      userId,
      results: trainResults,
      totalTrains: trainResults.length,
      averageScore,
      createdAt: date
    });
  }
  
  return results;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Train.deleteMany({});
    await IoTSensorData.deleteMany({});
    await FleetOptimization.deleteMany({});
    await Alert.deleteMany({});
    await OptimizationResult.deleteMany({});
    logger.info('Cleared existing data');

    // Create a test user if none exists
    let testUser = await User.findOne({ email: 'test@kmrl.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@kmrl.com',
        password: 'password123', // Will be hashed by the pre-save hook
        role: 'admin'
      });
      await testUser.save();
      logger.info('Created test user');
    }

    // Insert sample trains
    const allTrains = [...sampleTrains, ...generateAdditionalTrains()];
    await Train.insertMany(allTrains);
    logger.info(`Inserted ${allTrains.length} trains`);

    // Insert IoT sensor data for past 30 days
    const iotData = generateIoTSensorData();
    await IoTSensorData.insertMany(iotData);
    logger.info(`Inserted ${iotData.length} IoT sensor records`);

    // Insert historical optimization data
    const optimizationData = generateHistoricalOptimizationData(testUser._id.toString());
    await FleetOptimization.insertMany(optimizationData);
    logger.info(`Inserted ${optimizationData.length} optimization records`);

    // Insert alerts
    const alerts = generateAlerts(testUser._id.toString());
    await Alert.insertMany(alerts);
    logger.info(`Inserted ${alerts.length} alert records`);

    // Insert optimization results
    const optimizationResults = generateOptimizationResults(testUser._id.toString());
    await OptimizationResult.insertMany(optimizationResults);
    logger.info(`Inserted ${optimizationResults.length} optimization result records`);

    logger.info('Database seeding completed successfully');
    logger.info('Sample data includes:');
    logger.info(`- ${allTrains.length} trains`);
    logger.info(`- ${iotData.length} IoT sensor readings (30 days)`);
    logger.info(`- ${optimizationData.length} optimization records (30 days)`);
    logger.info(`- ${alerts.length} alerts (30 days)`);
    logger.info(`- ${optimizationResults.length} optimization results (30 days)`);
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
