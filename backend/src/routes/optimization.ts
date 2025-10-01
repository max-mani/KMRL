import express from 'express';
import { OptimizationResult } from '../models/OptimizationResult';
import { OptimizationEngine } from '../services/optimizationEngine';
import { NarrativeEngine } from '../services/narrativeEngine';
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
      if (result.score >= 65) {
        statusCounts.running++;
      } else if (result.score >= 50) {
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

// POST /api/optimization/narrative/trains - Generate simple-English narratives for trains
router.post(['/narrative/trains', '/narrative/trains/'], authenticate, async (req: AuthRequest, res) => {
  try {
    const { trains } = req.body as {
      trains: Array<{
        trainId: string;
        score: number;
        inductionStatus?: string;
        factors?: {
          fitness?: { score: number } | number;
          jobCard?: { score: number } | number;
          branding?: { score: number } | number;
          mileage?: { score: number } | number;
          cleaning?: { score: number } | number;
          geometry?: { score: number } | number;
        };
        previousAssignedZone?: string;
        stablingBay?: number;
        cleaningSlot?: number;
      }>;
    };

    if (!Array.isArray(trains) || trains.length === 0) {
      return res.status(400).json({ success: false, message: 'trains array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let GoogleGenerativeAI: any = null;
    if (apiKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      } catch (e) {
        GoogleGenerativeAI = null;
      }
    }

    const buildPrompt = (t: any) => {
      const f = t.factors || {};
      const getScore = (v: any) => (typeof v === 'number' ? v : Number(v?.score ?? 0));
      const fitness = getScore(f.fitness);
      const jobCard = getScore(f.jobCard);
      const branding = getScore(f.branding);
      const mileage = getScore(f.mileage);
      const cleaning = getScore(f.cleaning);
      const geometry = getScore(f.geometry);
      const zone = (t.inductionStatus || t.assignedZone || '').toString().toLowerCase();
      return [
        `You are an assistant for Kochi Metro operations. Explain in simple, non-technical English why this train has been placed in its current state.`,
        `Keep it to 2-3 sentences. Avoid percentages dump. Mention only the most relevant factors.`,
        `Train ID: ${t.trainId}`,
        `Overall score: ${Math.round(Number(t.score) || 0)}`,
        `Current state: ${zone || 'unknown'}`,
        `Key factors (0-100): fitness ${fitness}, job card ${jobCard}, branding ${branding}, mileage ${mileage}, cleaning ${cleaning}, geometry ${geometry}.`,
        t.stablingBay ? `Stabling bay: ${t.stablingBay}` : '',
        t.cleaningSlot ? `Cleaning slot: ${t.cleaningSlot}` : '',
        `Respond with a concise narrative suitable for a dashboard tool-tip.`
      ].filter(Boolean).join('\n');
    };

    const useGemini = Boolean(apiKey && GoogleGenerativeAI);

    const results = await Promise.all(trains.map(async (t) => {
      try {
        if (useGemini) {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const prompt = buildPrompt(t);
          const resp = await model.generateContent(prompt);
          const text = resp?.response?.text?.() || resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            return { trainId: t.trainId, narrative: text.trim() };
          }
        }
      } catch (e) {
        // fall back below
      }

      // Fallback to internal narrative engine
      try {
        const assignment = {
          trainId: t.trainId,
          assignedZone: (t.inductionStatus || 'standby').toString(),
          score: Number(t.score) || 0,
          factors: {
            fitness: Number((t.factors?.fitness as any)?.score ?? t.factors?.fitness ?? 0),
            jobCard: Number((t.factors?.jobCard as any)?.score ?? t.factors?.jobCard ?? 0),
            branding: Number((t.factors?.branding as any)?.score ?? t.factors?.branding ?? 0),
            mileage: Number((t.factors?.mileage as any)?.score ?? t.factors?.mileage ?? 0),
            cleaning: Number((t.factors?.cleaning as any)?.score ?? t.factors?.cleaning ?? 0),
            geometry: Number((t.factors?.geometry as any)?.score ?? t.factors?.geometry ?? 0),
          },
          reasoning: 'Assignment based on multi-factor optimization.'
        } as any;
        const narrative = NarrativeEngine.generateTrainNarrative(assignment);
        return { trainId: t.trainId, narrative };
      } catch (e) {
        return { trainId: t.trainId, narrative: 'Optimized placement based on current maintenance, fitness, and operational factors.' };
      }
    }));

    return res.json({ success: true, narratives: results });
  } catch (error) {
    logger.error('Generate train narratives error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
