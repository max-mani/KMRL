import express from 'express';
import { OptimizationResult } from '../models/OptimizationResult';
import { OptimizationEngine } from '../services/optimizationEngine';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/optimization/today
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayResult = await OptimizationResult.findOne({
      userId: req.user!._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 });

    if (!todayResult) {
      return res.status(404).json({
        success: false,
        message: 'No optimization data found for today'
      });
    }

    res.json({
      success: true,
      data: {
        date: todayResult.date,
        totalTrains: todayResult.totalTrains,
        averageScore: todayResult.averageScore,
        results: todayResult.results
      }
    });
  } catch (error) {
    logger.error('Get today optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/optimization/history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const results = await OptimizationResult.find({
      userId: req.user!._id
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .select('date totalTrains averageScore createdAt');

    const total = await OptimizationResult.countDocuments({
      userId: req.user!._id
    });

    res.json({
      success: true,
      data: {
        results,
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

// GET /api/optimization/compare
router.get('/compare', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayResult, yesterdayResult] = await Promise.all([
      OptimizationResult.findOne({
        userId: req.user!._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).sort({ createdAt: -1 }),
      OptimizationResult.findOne({
        userId: req.user!._id,
        date: {
          $gte: yesterday,
          $lt: today
        }
      }).sort({ createdAt: -1 })
    ]);

    if (!todayResult && !yesterdayResult) {
      return res.status(404).json({
        success: false,
        message: 'No optimization data found for comparison'
      });
    }

    const comparison = {
      today: todayResult ? {
        date: todayResult.date,
        totalTrains: todayResult.totalTrains,
        averageScore: todayResult.averageScore
      } : null,
      yesterday: yesterdayResult ? {
        date: yesterdayResult.date,
        totalTrains: yesterdayResult.totalTrains,
        averageScore: yesterdayResult.averageScore
      } : null,
      changes: {
        averageScoreChange: todayResult && yesterdayResult 
          ? todayResult.averageScore - yesterdayResult.averageScore 
          : 0,
        totalTrainsChange: todayResult && yesterdayResult 
          ? todayResult.totalTrains - yesterdayResult.totalTrains 
          : 0
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    logger.error('Get optimization comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/optimization/simulate
router.post('/simulate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { changes } = req.body;

    if (!changes) {
      return res.status(400).json({
        success: false,
        message: 'Simulation changes are required'
      });
    }

    // Get the most recent optimization result as base data
    const latestResult = await OptimizationResult.findOne({
      userId: req.user!._id
    }).sort({ createdAt: -1 });

    if (!latestResult) {
      return res.status(404).json({
        success: false,
        message: 'No base optimization data found for simulation'
      });
    }

    // Convert optimization results back to processed train data
    const baseData = latestResult.results.map(result => ({
      trainId: result.trainId,
      fitnessCertificate: result.rawData.fitnessCertificate,
      jobCardStatus: result.rawData.jobCardStatus,
      brandingPriority: result.rawData.brandingPriority,
      mileageBalancing: result.rawData.mileageBalancing,
      cleaningDetailing: result.rawData.cleaningDetailing,
      stablingGeometry: result.rawData.stablingGeometry
    }));

    // Run simulation
    const simulationResult = OptimizationEngine.simulateScenario(baseData, changes);

    logger.info(`Simulation run by user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        simulation: simulationResult,
        baseData: {
          totalTrains: latestResult.totalTrains,
          averageScore: latestResult.averageScore
        }
      }
    });
  } catch (error) {
    logger.error('Optimization simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/optimization/fleet-status
router.get('/fleet-status', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayResult = await OptimizationResult.findOne({
      userId: req.user!._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 });

    if (!todayResult) {
      return res.status(404).json({
        success: false,
        message: 'No fleet status data found for today'
      });
    }

    // Calculate fleet status distribution
    const statusCounts = {
      running: 0,
      standby: 0,
      maintenance: 0
    };

    todayResult.results.forEach(result => {
      if (result.score >= 80) {
        statusCounts.running++;
      } else if (result.score >= 45) {
        statusCounts.standby++;
      } else {
        statusCounts.maintenance++;
      }
    });

    res.json({
      success: true,
      data: {
        date: todayResult.date,
        fleetStatus: statusCounts,
        totalTrains: todayResult.totalTrains,
        averageScore: todayResult.averageScore
      }
    });
  } catch (error) {
    logger.error('Get fleet status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as optimizationRoutes };
