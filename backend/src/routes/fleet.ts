import express from 'express';
import { Train } from '../models/Train';
import { FleetOptimization } from '../models/FleetOptimization';
import { IoTSensorData } from '../models/IoTSensor';
import { OptimizationEngine } from '../services/optimizationEngine';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/fleet/status - Get real-time fleet status
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const trains = await Train.find({}).sort({ overallScore: -1 });
    
    const fleetStatus = {
      totalTrains: trains.length,
      running: trains.filter(t => t.status === 'running').length,
      standby: trains.filter(t => t.status === 'standby').length,
      maintenance: trains.filter(t => t.status === 'maintenance').length,
      inspection: trains.filter(t => t.status === 'inspection').length,
      averageScore: trains.reduce((sum, t) => sum + t.overallScore, 0) / trains.length,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: fleetStatus
    });
  } catch (error) {
    logger.error('Get fleet status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/fleet/trains - Get all trains with detailed information
router.get('/trains', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const trains = await Train.find({})
      .sort({ overallScore: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Train.countDocuments({});

    res.json({
      success: true,
      data: {
        trains,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get trains error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/fleet/train/:trainId - Get specific train details
router.get('/train/:trainId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainId } = req.params;
    
    const train = await Train.findOne({ trainId });
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Get recent IoT sensor data
    const iotData = await IoTSensorData.find({
      trainId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 }).limit(50);

    res.json({
      success: true,
      data: {
        train,
        iotData
      }
    });
  } catch (error) {
    logger.error('Get train details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/fleet/optimize - Run fleet optimization
router.post('/optimize', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await OptimizationEngine.optimizeFleet(req.user!._id.toString());
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Fleet optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/fleet/simulate - Run what-if simulation
router.post('/simulate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { changes } = req.body;
    
    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        message: 'Simulation changes are required'
      });
    }

    const result = await OptimizationEngine.optimizeFleet(
      req.user!._id.toString(), 
      true, 
      changes
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Fleet simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/fleet/optimization-history - Get optimization history
router.get('/optimization-history', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const optimizations = await FleetOptimization.find({
      userId: req.user!._id
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .select('date metrics narrative optimizationTime isSimulation');

    const total = await FleetOptimization.countDocuments({
      userId: req.user!._id
    });

    res.json({
      success: true,
      data: {
        optimizations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get optimization history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/fleet/iot-data - Get IoT sensor data
router.get('/iot-data', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainId, sensorType, hours = 24 } = req.query;
    
    const query: any = {
      timestamp: { $gte: new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000) }
    };
    
    if (trainId) query.trainId = trainId;
    if (sensorType) query.sensorType = sensorType;

    const iotData = await IoTSensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    res.json({
      success: true,
      data: iotData
    });
  } catch (error) {
    logger.error('Get IoT data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/fleet/alerts - Get critical alerts and warnings
router.get('/alerts', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = [];
    
    // Check for trains with critical issues
    const criticalTrains = await Train.find({
      $or: [
        { 'fitnessCertificate.rollingStock.valid': false },
        { 'fitnessCertificate.signalling.valid': false },
        { 'fitnessCertificate.telecom.valid': false },
        { 'jobCardStatus.criticalIssues': { $exists: true, $ne: [] } },
        { overallScore: { $lt: 40 } }
      ]
    });

    criticalTrains.forEach(train => {
      if (!train.fitnessCertificate.rollingStock.valid) {
        alerts.push({
          type: 'critical',
          trainId: train.trainId,
          message: 'Rolling stock fitness certificate expired',
          timestamp: new Date()
        });
      }
      if (!train.fitnessCertificate.signalling.valid) {
        alerts.push({
          type: 'critical',
          trainId: train.trainId,
          message: 'Signalling fitness certificate expired',
          timestamp: new Date()
        });
      }
      if (!train.fitnessCertificate.telecom.valid) {
        alerts.push({
          type: 'critical',
          trainId: train.trainId,
          message: 'Telecom fitness certificate expired',
          timestamp: new Date()
        });
      }
      if (train.jobCardStatus.criticalIssues.length > 0) {
        alerts.push({
          type: 'critical',
          trainId: train.trainId,
          message: `Critical job card issues: ${train.jobCardStatus.criticalIssues.join(', ')}`,
          timestamp: new Date()
        });
      }
    });

    // Check for branding compliance issues
    const brandingIssues = await Train.find({
      'brandingPriority.score': { $lt: 50 },
      'brandingPriority.slaDeadline': { $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    brandingIssues.forEach(train => {
      alerts.push({
        type: 'warning',
        trainId: train.trainId,
        message: 'Branding compliance at risk - SLA deadline approaching',
        timestamp: new Date()
      });
    });

    // Check for IoT sensor alerts
    const iotAlerts = await IoTSensorData.find({
      status: { $in: ['warning', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 }).limit(20);

    iotAlerts.forEach(sensor => {
      alerts.push({
        type: sensor.status === 'critical' ? 'critical' : 'warning',
        trainId: sensor.trainId,
        message: `${sensor.sensorType} sensor ${sensor.status} alert`,
        timestamp: sensor.timestamp
      });
    });

    // Sort alerts by severity and timestamp
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1 };
      if (severityOrder[a.type] !== severityOrder[b.type]) {
        return severityOrder[a.type] - severityOrder[b.type];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.json({
      success: true,
      data: {
        alerts: alerts.slice(0, 50), // Limit to 50 most recent alerts
        total: alerts.length
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/fleet/train/:trainId - Update train data
router.put('/train/:trainId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainId } = req.params;
    const updates = req.body;

    const train = await Train.findOneAndUpdate(
      { trainId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    res.json({
      success: true,
      data: train
    });
  } catch (error) {
    logger.error('Update train error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/fleet/iot-data - Add IoT sensor data
router.post('/iot-data', authenticate, async (req: AuthRequest, res) => {
  try {
    const iotData = new IoTSensorData(req.body);
    await iotData.save();

    res.json({
      success: true,
      data: iotData
    });
  } catch (error) {
    logger.error('Add IoT data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as fleetRoutes };
