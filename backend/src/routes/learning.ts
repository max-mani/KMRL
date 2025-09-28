import express from 'express';
import { OptimizationEngine } from '../services/optimizationEngine';
import { FleetOptimization } from '../models/FleetOptimization';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/learning/update-weights - Update optimization weights based on actual outcomes
router.post('/update-weights', authenticate, async (req: AuthRequest, res) => {
  try {
    const { 
      punctuality, 
      energyUsage, 
      maintenanceCost, 
      brandingCompliance, 
      serviceDisruptions 
    } = req.body;

    if (!punctuality || !energyUsage || !maintenanceCost || !brandingCompliance) {
      return res.status(400).json({
        success: false,
        message: 'All outcome metrics are required'
      });
    }

    const actualOutcomes = {
      punctuality: parseFloat(punctuality),
      energyUsage: parseFloat(energyUsage),
      maintenanceCost: parseFloat(maintenanceCost),
      brandingCompliance: parseFloat(brandingCompliance),
      serviceDisruptions: parseInt(serviceDisruptions) || 0
    };

    const updatedWeights = await OptimizationEngine.updateWeightsFromOutcomes(
      req.user!._id.toString(),
      actualOutcomes
    );

    logger.info(`Weights updated for user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        updatedWeights,
        actualOutcomes,
        message: 'Optimization weights updated successfully based on actual outcomes'
      }
    });
  } catch (error) {
    logger.error('Update weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/learning/optimized-weights/:scenario - Get optimized weights for a scenario
router.get('/optimized-weights/:scenario', authenticate, async (req: AuthRequest, res) => {
  try {
    const { scenario } = req.params;
    
    const optimizedWeights = await OptimizationEngine.getOptimizedWeights(
      req.user!._id.toString(),
      scenario
    );

    res.json({
      success: true,
      data: {
        scenario,
        weights: optimizedWeights,
        description: `Optimized weights for ${scenario} scenario`
      }
    });
  } catch (error) {
    logger.error('Get optimized weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/learning/predictive-insights - Get predictive insights based on historical data
router.get('/predictive-insights', authenticate, async (req: AuthRequest, res) => {
  try {
    const insights = await OptimizationEngine.generatePredictiveInsights(
      req.user!._id.toString()
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Get predictive insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/learning/performance-history - Get performance history for learning analysis
router.get('/performance-history', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const performanceHistory = await FleetOptimization.find({
      userId: req.user!._id,
      isSimulation: false,
      'previousOutcomes.actualPunctuality': { $exists: true }
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .select('date metrics weights previousOutcomes optimizationTime');

    const total = await FleetOptimization.countDocuments({
      userId: req.user!._id,
      isSimulation: false,
      'previousOutcomes.actualPunctuality': { $exists: true }
    });

    // Calculate prediction accuracy metrics
    const accuracyMetrics = performanceHistory.map(record => {
      const predicted = record.metrics;
      const actual = record.previousOutcomes;
      
      return {
        date: record.date,
        punctualityAccuracy: Math.abs(predicted.punctuality - actual.actualPunctuality),
        energyAccuracy: Math.abs(predicted.energyEfficiency - actual.actualEnergyUsage),
        maintenanceAccuracy: Math.abs(predicted.shuntingCost - actual.actualMaintenanceCost),
        brandingAccuracy: Math.abs(predicted.brandingCompliance - actual.actualBrandingCompliance),
        optimizationTime: record.optimizationTime
      };
    });

    res.json({
      success: true,
      data: {
        performanceHistory: accuracyMetrics,
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
    logger.error('Get performance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/learning/feedback - Submit feedback on optimization results
router.post('/feedback', authenticate, async (req: AuthRequest, res) => {
  try {
    const { 
      optimizationId, 
      feedback, 
      rating, 
      actualOutcomes,
      suggestions 
    } = req.body;

    if (!optimizationId || !feedback || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Optimization ID, feedback, and rating are required'
      });
    }

    // Find the optimization record
    const optimization = await FleetOptimization.findById(optimizationId);
    if (!optimization) {
      return res.status(404).json({
        success: false,
        message: 'Optimization record not found'
      });
    }

    // Update with feedback and actual outcomes
    optimization.previousOutcomes = {
      actualPunctuality: actualOutcomes?.punctuality || optimization.metrics.punctuality,
      actualEnergyUsage: actualOutcomes?.energyUsage || optimization.metrics.energyEfficiency,
      actualMaintenanceCost: actualOutcomes?.maintenanceCost || optimization.metrics.shuntingCost,
      actualBrandingCompliance: actualOutcomes?.brandingCompliance || optimization.metrics.brandingCompliance
    };

    // Add feedback to the record
    (optimization as any).feedback = {
      rating: parseInt(rating),
      comments: feedback,
      suggestions: suggestions || [],
      submittedAt: new Date(),
      submittedBy: req.user!._id
    };

    await optimization.save();

    // If actual outcomes are provided, trigger weight learning
    if (actualOutcomes) {
      await OptimizationEngine.updateWeightsFromOutcomes(
        req.user!._id.toString(),
        actualOutcomes
      );
    }

    logger.info(`Feedback submitted for optimization: ${optimizationId} by user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        message: 'Feedback submitted successfully',
        optimizationId,
        rating,
        learned: !!actualOutcomes
      }
    });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/learning/learning-progress - Get learning progress and accuracy metrics
router.get('/learning-progress', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get recent optimizations with outcomes
    const recentOptimizations = await FleetOptimization.find({
      userId: req.user!._id,
      isSimulation: false,
      'previousOutcomes.actualPunctuality': { $exists: true }
    })
    .sort({ date: -1 })
    .limit(10);

    if (recentOptimizations.length === 0) {
      return res.json({
        success: true,
        data: {
          learningProgress: 'insufficient_data',
          message: 'Insufficient data for learning progress analysis'
        }
      });
    }

    // Calculate accuracy metrics
    const accuracyMetrics = recentOptimizations.map(record => {
      const predicted = record.metrics;
      const actual = record.previousOutcomes;
      
      return {
        punctualityError: Math.abs(predicted.punctuality - actual.actualPunctuality),
        energyError: Math.abs(predicted.energyEfficiency - actual.actualEnergyUsage),
        maintenanceError: Math.abs(predicted.shuntingCost - actual.actualMaintenanceCost),
        brandingError: Math.abs(predicted.brandingCompliance - actual.actualBrandingCompliance)
      };
    });

    // Calculate average accuracy
    const avgAccuracy = {
      punctuality: 100 - (accuracyMetrics.reduce((sum, m) => sum + m.punctualityError, 0) / accuracyMetrics.length),
      energy: 100 - (accuracyMetrics.reduce((sum, m) => sum + m.energyError, 0) / accuracyMetrics.length),
      maintenance: 100 - (accuracyMetrics.reduce((sum, m) => sum + m.maintenanceError, 0) / accuracyMetrics.length),
      branding: 100 - (accuracyMetrics.reduce((sum, m) => sum + m.brandingError, 0) / accuracyMetrics.length)
    };

    const overallAccuracy = (avgAccuracy.punctuality + avgAccuracy.energy + avgAccuracy.maintenance + avgAccuracy.branding) / 4;

    // Determine learning progress level
    let learningProgress = 'beginner';
    if (overallAccuracy > 85) learningProgress = 'advanced';
    else if (overallAccuracy > 75) learningProgress = 'intermediate';

    res.json({
      success: true,
      data: {
        learningProgress,
        overallAccuracy: Math.round(overallAccuracy),
        accuracyBreakdown: {
          punctuality: Math.round(avgAccuracy.punctuality),
          energy: Math.round(avgAccuracy.energy),
          maintenance: Math.round(avgAccuracy.maintenance),
          branding: Math.round(avgAccuracy.branding)
        },
        dataPoints: recentOptimizations.length,
        recommendations: overallAccuracy < 70 ? [
          'Provide more accurate actual outcomes data',
          'Increase frequency of feedback submission',
          'Review optimization parameters'
        ] : overallAccuracy < 85 ? [
          'Continue providing feedback for improvement',
          'Monitor prediction accuracy trends'
        ] : [
          'Excellent prediction accuracy achieved',
          'Consider fine-tuning for edge cases'
        ]
      }
    });
  } catch (error) {
    logger.error('Get learning progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as learningRoutes };
