import express from 'express';
import { Train } from '../models/Train';
import { FleetOptimization } from '../models/FleetOptimization';
import { OptimizationEngine } from '../services/optimizationEngine';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/digital-twin/scenarios
router.get('/scenarios', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get recent optimization results to create realistic scenarios
    const recentOptimization = await FleetOptimization.findOne({
      userId: req.user!._id
    }).sort({ date: -1 });

    const scenarios = [
      {
        id: 'peak-hour-optimization',
        name: 'Peak Hour Optimization',
        description: 'Optimize fleet for morning peak hours (7-9 AM) with high service demand',
        parameters: {
          serviceDemand: 'high',
          energyEfficiency: 'medium',
          maintenancePriority: 'low',
          brandingPriority: 'high'
        },
        baseResults: recentOptimization?.metrics || {
          totalTrains: 25,
          serviceTrains: 18,
          standbyTrains: 5,
          maintenanceTrains: 2,
          averageScore: 82,
          energyEfficiency: 90,
          punctuality: 99.0
        }
      },
      {
        id: 'maintenance-window',
        name: 'Maintenance Window',
        description: 'Schedule maintenance during off-peak hours with focus on reliability',
        parameters: {
          serviceDemand: 'low',
          energyEfficiency: 'high',
          maintenancePriority: 'high',
          brandingPriority: 'medium'
        },
        baseResults: recentOptimization?.metrics || {
          totalTrains: 25,
          serviceTrains: 15,
          standbyTrains: 5,
          maintenanceTrains: 5,
          averageScore: 78,
          energyEfficiency: 92,
          punctuality: 98.8
        }
      },
      {
        id: 'energy-optimization',
        name: 'Energy Optimization',
        description: 'Minimize energy consumption and shunting costs',
        parameters: {
          serviceDemand: 'medium',
          energyEfficiency: 'high',
          maintenancePriority: 'medium',
          brandingPriority: 'low'
        },
        baseResults: recentOptimization?.metrics || {
          totalTrains: 25,
          serviceTrains: 16,
          standbyTrains: 6,
          maintenanceTrains: 3,
          averageScore: 80,
          energyEfficiency: 95,
          punctuality: 98.9
        }
      },
      {
        id: 'branding-compliance',
        name: 'Branding Compliance',
        description: 'Maximize branding exposure and SLA compliance',
        parameters: {
          serviceDemand: 'medium',
          energyEfficiency: 'medium',
          maintenancePriority: 'low',
          brandingPriority: 'high'
        },
        baseResults: recentOptimization?.metrics || {
          totalTrains: 25,
          serviceTrains: 17,
          standbyTrains: 5,
          maintenanceTrains: 3,
          averageScore: 83,
          energyEfficiency: 88,
          punctuality: 99.1
        }
      }
    ];

    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    logger.error('Get scenarios error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/digital-twin/simulate
router.post('/simulate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { scenarioId, parameters, customChanges } = req.body;

    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        message: 'Scenario ID is required'
      });
    }

    // Get current fleet state
    const trains = await Train.find({}).sort({ overallScore: -1 });
    
    // Apply scenario-specific changes
    let simulationChanges: any[] = [];
    
    if (customChanges && Array.isArray(customChanges)) {
      simulationChanges = customChanges;
    } else {
      // Generate scenario-specific changes based on scenarioId
      simulationChanges = generateScenarioChanges(scenarioId, trains, parameters);
    }

    // Run optimization with simulation changes
    const simulationResult = await OptimizationEngine.optimizeFleet(
      req.user!._id.toString(),
      true,
      simulationChanges
    );

    // Generate detailed analysis
    const analysis = generateSimulationAnalysis(simulationResult, scenarioId, parameters);

    logger.info(`Digital twin simulation completed for scenario: ${scenarioId}`);

    res.json({
      success: true,
      data: {
        scenarioId,
        parameters,
        simulationResult,
        analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Digital twin simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/digital-twin/yard-layout
router.get('/yard-layout', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get current train positions
    const trains = await Train.find({}).sort({ overallScore: -1 });
    
    const yardLayout = {
      zones: [
        {
          id: 'service',
          name: 'Service Bay',
          capacity: 18,
          currentOccupancy: trains.filter(t => t.position.zone === 'service').length,
          trains: trains.filter(t => t.position.zone === 'service').map(train => ({
            id: train.trainId,
            name: train.name,
            position: train.position,
            status: train.status,
            score: train.overallScore,
            factors: {
              fitness: train.fitnessCertificate.overallScore,
              jobCard: train.jobCardStatus.score,
              branding: train.brandingPriority.score,
              mileage: train.mileageBalancing.score,
              cleaning: train.cleaningDetailing.score,
              geometry: train.stablingGeometry.score
            }
          }))
        },
        {
          id: 'standby',
          name: 'Standby Bay',
          capacity: 6,
          currentOccupancy: trains.filter(t => t.position.zone === 'standby').length,
          trains: trains.filter(t => t.position.zone === 'standby').map(train => ({
            id: train.trainId,
            name: train.name,
            position: train.position,
            status: train.status,
            score: train.overallScore,
            factors: {
              fitness: train.fitnessCertificate.overallScore,
              jobCard: train.jobCardStatus.score,
              branding: train.brandingPriority.score,
              mileage: train.mileageBalancing.score,
              cleaning: train.cleaningDetailing.score,
              geometry: train.stablingGeometry.score
            }
          }))
        },
        {
          id: 'ibl',
          name: 'Inspection Bay Line (IBL)',
          capacity: 4,
          currentOccupancy: trains.filter(t => t.position.zone === 'ibl').length,
          trains: trains.filter(t => t.position.zone === 'ibl').map(train => ({
            id: train.trainId,
            name: train.name,
            position: train.position,
            status: train.status,
            score: train.overallScore,
            factors: {
              fitness: train.fitnessCertificate.overallScore,
              jobCard: train.jobCardStatus.score,
              branding: train.brandingPriority.score,
              mileage: train.mileageBalancing.score,
              cleaning: train.cleaningDetailing.score,
              geometry: train.stablingGeometry.score
            }
          }))
        },
        {
          id: 'cleaning',
          name: 'Cleaning Bay',
          capacity: 3,
          currentOccupancy: trains.filter(t => t.position.zone === 'cleaning').length,
          trains: trains.filter(t => t.position.zone === 'cleaning').map(train => ({
            id: train.trainId,
            name: train.name,
            position: train.position,
            status: train.status,
            score: train.overallScore,
            factors: {
              fitness: train.fitnessCertificate.overallScore,
              jobCard: train.jobCardStatus.score,
              branding: train.brandingPriority.score,
              mileage: train.mileageBalancing.score,
              cleaning: train.cleaningDetailing.score,
              geometry: train.stablingGeometry.score
            }
          }))
        }
      ],
      connections: [
        { from: 'service', to: 'standby', distance: 100, energyCost: 10, timeMinutes: 5 },
        { from: 'standby', to: 'ibl', distance: 100, energyCost: 10, timeMinutes: 5 },
        { from: 'ibl', to: 'cleaning', distance: 100, energyCost: 10, timeMinutes: 5 },
        { from: 'cleaning', to: 'service', distance: 300, energyCost: 30, timeMinutes: 15 },
        { from: 'service', to: 'ibl', distance: 200, energyCost: 20, timeMinutes: 10 },
        { from: 'standby', to: 'cleaning', distance: 200, energyCost: 20, timeMinutes: 10 }
      ],
      totalTrains: trains.length,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: yardLayout
    });
  } catch (error) {
    logger.error('Get yard layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/digital-twin/move-train
router.post('/move-train', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainId, fromZone, toZone, bay } = req.body;

    if (!trainId || !fromZone || !toZone) {
      return res.status(400).json({
        success: false,
        message: 'Train ID, from zone, and to zone are required'
      });
    }

    // Find the train
    const train = await Train.findOne({ trainId });
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Calculate movement cost and time
    const movementCost = calculateMovementCost(fromZone, toZone);
    const movementTime = calculateMovementTime(fromZone, toZone);

    // Update train position
    const newPosition = {
      bay: bay || `${toZone.toUpperCase()}${Math.floor(Math.random() * 10) + 1}`,
      x: Math.floor(Math.random() * 800) + 100,
      y: getZoneYPosition(toZone),
      zone: toZone
    };

    train.position = newPosition;
    train.status = getStatusFromZone(toZone);
    train.lastOptimized = new Date();
    await train.save();

    res.json({
      success: true,
      data: {
        trainId,
        movement: {
          from: fromZone,
          to: toZone,
          cost: movementCost,
          timeMinutes: movementTime,
          newPosition
        },
        updatedTrain: train
      }
    });
  } catch (error) {
    logger.error('Move train error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions
function generateScenarioChanges(scenarioId: string, trains: any[], parameters: any): any[] {
  const changes: any[] = [];
  
  switch (scenarioId) {
    case 'peak-hour-optimization':
      // Move high-scoring standby trains to service
      trains.filter(t => t.status === 'standby' && t.overallScore >= 80).slice(0, 3).forEach(train => {
        changes.push({
          trainId: train.trainId,
          changes: {
            status: 'running',
            'position.zone': 'service'
          }
        });
      });
      break;
      
    case 'maintenance-window':
      // Move low-scoring service trains to maintenance
      trains.filter(t => t.status === 'running' && t.overallScore < 70).slice(0, 2).forEach(train => {
        changes.push({
          trainId: train.trainId,
          changes: {
            status: 'maintenance',
            'position.zone': 'ibl'
          }
        });
      });
      break;
      
    case 'energy-optimization':
      // Optimize positions to minimize shunting
      trains.forEach(train => {
        if (train.stablingGeometry.shuntingDistance > 50) {
          changes.push({
            trainId: train.trainId,
            changes: {
              'stablingGeometry.shuntingDistance': Math.max(0, train.stablingGeometry.shuntingDistance - 20)
            }
          });
        }
      });
      break;
      
    case 'branding-compliance':
      // Prioritize trains with branding issues
      trains.filter(t => t.brandingPriority.score < 60).forEach(train => {
        changes.push({
          trainId: train.trainId,
          changes: {
            'brandingPriority.score': Math.min(100, train.brandingPriority.score + 20)
          }
        });
      });
      break;
  }
  
  return changes;
}

function generateSimulationAnalysis(result: any, scenarioId: string, parameters: any): any {
  const analysis = {
    impact: {
      scoreChange: result.metrics.averageScore - 80, // Assuming baseline of 80
      energyChange: result.metrics.energyEfficiency - 90, // Assuming baseline of 90
      punctualityChange: result.metrics.punctuality - 99.0, // Assuming baseline of 99.0
      costChange: result.metrics.shuntingCost - 100 // Assuming baseline of 100
    },
    recommendations: result.narrative.recommendations,
    warnings: result.narrative.warnings,
    keyInsights: [
      `Scenario ${scenarioId} shows ${result.metrics.serviceTrains} trains in service`,
      `Energy efficiency: ${result.metrics.energyEfficiency}%`,
      `Estimated punctuality: ${result.metrics.punctuality}%`,
      `Branding compliance: ${result.metrics.brandingCompliance}%`
    ],
    feasibility: {
      implementable: result.metrics.serviceTrains >= 15,
      riskLevel: result.metrics.maintenanceTrains > 5 ? 'high' : 'medium',
      timeToImplement: '2-4 hours'
    }
  };
  
  return analysis;
}

function calculateMovementCost(fromZone: string, toZone: string): number {
  const costs: { [key: string]: { [key: string]: number } } = {
    service: { standby: 10, ibl: 20, cleaning: 30 },
    standby: { service: 10, ibl: 10, cleaning: 20 },
    ibl: { service: 20, standby: 10, cleaning: 10 },
    cleaning: { service: 30, standby: 20, ibl: 10 }
  };
  
  return costs[fromZone]?.[toZone] || 15;
}

function calculateMovementTime(fromZone: string, toZone: string): number {
  const times: { [key: string]: { [key: string]: number } } = {
    service: { standby: 5, ibl: 10, cleaning: 15 },
    standby: { service: 5, ibl: 5, cleaning: 10 },
    ibl: { service: 10, standby: 5, cleaning: 5 },
    cleaning: { service: 15, standby: 10, ibl: 5 }
  };
  
  return times[fromZone]?.[toZone] || 8;
}

function getZoneYPosition(zone: string): number {
  const positions: { [key: string]: number } = {
    service: 50,
    standby: 150,
    ibl: 250,
    cleaning: 350
  };
  
  return positions[zone] || 50;
}

function getStatusFromZone(zone: string): 'running' | 'standby' | 'maintenance' | 'inspection' {
  const statuses: { [key: string]: 'running' | 'standby' | 'maintenance' | 'inspection' } = {
    service: 'running',
    standby: 'standby',
    ibl: 'maintenance',
    cleaning: 'inspection'
  };
  
  return statuses[zone] || 'standby';
}

export { router as digitalTwinRoutes };
