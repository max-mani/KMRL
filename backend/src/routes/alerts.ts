import express from 'express';
import Joi from 'joi';
import { Alert } from '../models/Alert';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createAlertSchema = Joi.object({
  type: Joi.string().valid('critical', 'warning', 'info').required(),
  category: Joi.string().valid('maintenance', 'performance', 'safety', 'system').required(),
  title: Joi.string().max(200).required(),
  message: Joi.string().max(1000).required(),
  trainId: Joi.string().optional(),
  priority: Joi.string().valid('high', 'medium', 'low').default('medium')
});

const updateAlertSchema = Joi.object({
  isRead: Joi.boolean().optional(),
  isResolved: Joi.boolean().optional()
});

// GET /api/alerts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId: req.user!._id };

    // Add filters
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }
    if (req.query.isResolved !== undefined) {
      filter.isResolved = req.query.isResolved === 'true';
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Alert.countDocuments(filter);

    res.json({
      success: true,
      data: {
        alerts,
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
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/alerts/unread-count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const unreadCount = await Alert.countDocuments({
      userId: req.user!._id,
      isRead: false
    });

    const criticalCount = await Alert.countDocuments({
      userId: req.user!._id,
      type: 'critical',
      isResolved: false
    });

    res.json({
      success: true,
      data: {
        unreadCount,
        criticalCount
      }
    });
  } catch (error) {
    logger.error('Get unread alerts count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/alerts
router.post('/', authenticate, authorize('admin', 'supervisor'), async (req: AuthRequest, res) => {
  try {
    const { error, value } = createAlertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const alert = new Alert({
      userId: req.user!._id,
      ...value
    });

    await alert.save();

    logger.info(`Alert created by user: ${req.user!.email}`, {
      alertId: alert._id,
      type: alert.type,
      category: alert.category
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert }
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/alerts/:id
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { error, value } = updateAlertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const alert = await Alert.findOne({
      _id: req.params.id,
      userId: req.user!._id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Update alert
    Object.assign(alert, value);

    // Set resolved timestamp if being resolved
    if (value.isResolved && !alert.isResolved) {
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user!._id as any;
    }

    await alert.save();

    logger.info(`Alert updated by user: ${req.user!.email}`, {
      alertId: alert._id,
      updates: value
    });

    res.json({
      success: true,
      message: 'Alert updated successfully',
      data: { alert }
    });
  } catch (error) {
    logger.error('Update alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/alerts/mark-all-read
router.post('/mark-all-read', authenticate, async (req: AuthRequest, res) => {
  try {
    await Alert.updateMany(
      { userId: req.user!._id, isRead: false },
      { isRead: true }
    );

    logger.info(`All alerts marked as read by user: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'All alerts marked as read'
    });
  } catch (error) {
    logger.error('Mark all alerts as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    logger.info(`Alert deleted by user: ${req.user!.email}`, {
      alertId: alert._id
    });

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/alerts/auto-generate
router.post('/auto-generate', authenticate, async (req: AuthRequest, res) => {
  try {
    // This endpoint would typically be called by a scheduled job
    // For demo purposes, we'll generate some sample alerts

    const sampleAlerts = [
      {
        type: 'critical',
        category: 'maintenance',
        title: 'Overheating detected - Unit 112',
        message: 'Immediate inspection recommended. Temperature readings exceed safe limits.',
        trainId: 'KMRL-112',
        priority: 'high'
      },
      {
        type: 'warning',
        category: 'performance',
        title: 'Branding wrap due - Unit 034',
        message: 'Schedule within the week to avoid delays.',
        trainId: 'KMRL-034',
        priority: 'medium'
      },
      {
        type: 'info',
        category: 'system',
        title: 'Scheduled maintenance reminder',
        message: 'Routine maintenance due for 5 trains this week.',
        priority: 'low'
      }
    ];

    const createdAlerts = [];

    for (const alertData of sampleAlerts) {
      const alert = new Alert({
        userId: req.user!._id,
        ...alertData
      });
      await alert.save();
      createdAlerts.push(alert);
    }

    logger.info(`Auto-generated alerts for user: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Alerts auto-generated successfully',
      data: { alerts: createdAlerts }
    });
  } catch (error) {
    logger.error('Auto-generate alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as alertRoutes };
