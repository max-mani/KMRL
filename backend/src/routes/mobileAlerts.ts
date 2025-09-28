import express from 'express';
import { MobileAlertsService, MobileAlert, AlertSubscription } from '../services/mobileAlertsService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/mobile-alerts/active - Get all active alerts for mobile
router.get('/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await MobileAlertsService.generateActiveAlerts();
    
    // Filter alerts based on user preferences (if available)
    // For now, return all alerts
    const filteredAlerts = alerts;

    res.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        statistics: MobileAlertsService.getAlertStatistics(filteredAlerts),
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/statistics - Get alert statistics
router.get('/statistics', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await MobileAlertsService.generateActiveAlerts();
    const statistics = MobileAlertsService.getAlertStatistics(alerts);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Get alert statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/mobile-alerts/acknowledge/:alertId - Acknowledge an alert
router.post('/acknowledge/:alertId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { alertId } = req.params;
    
    // In a real implementation, you would update the alert in the database
    // For now, we'll simulate the acknowledgment
    
    logger.info(`Alert ${alertId} acknowledged by user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        alertId,
        acknowledged: true,
        acknowledgedBy: req.user!.email,
        acknowledgedAt: new Date(),
        message: 'Alert acknowledged successfully'
      }
    });
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/train/:trainId - Get alerts for specific train
router.get('/train/:trainId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainId } = req.params;
    const allAlerts = await MobileAlertsService.generateActiveAlerts();
    
    const trainAlerts = allAlerts.filter(alert => alert.trainId === trainId);

    res.json({
      success: true,
      data: {
        trainId,
        alerts: trainAlerts,
        count: trainAlerts.length
      }
    });
  } catch (error) {
    logger.error('Get train alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/category/:category - Get alerts by category
router.get('/category/:category', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category } = req.params;
    const allAlerts = await MobileAlertsService.generateActiveAlerts();
    
    const categoryAlerts = allAlerts.filter(alert => alert.category === category);

    res.json({
      success: true,
      data: {
        category,
        alerts: categoryAlerts,
        count: categoryAlerts.length
      }
    });
  } catch (error) {
    logger.error('Get category alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/mobile-alerts/subscription - Update user alert subscription preferences
router.post('/subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    const { categories, types, priorities, enabled } = req.body;

    // In a real implementation, you would save this to the database
    const subscription: AlertSubscription = {
      userId: req.user!._id.toString(),
      categories: categories || [],
      types: types || [],
      priorities: priorities || [],
      enabled: enabled !== undefined ? enabled : true,
      lastChecked: new Date()
    };

    logger.info(`Alert subscription updated for user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        subscription,
        message: 'Alert subscription preferences updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/subscription - Get user alert subscription preferences
router.get('/subscription', authenticate, async (req: AuthRequest, res) => {
  try {
    // In a real implementation, you would fetch this from the database
    const subscription: AlertSubscription = {
      userId: req.user!._id.toString(),
      categories: ['fitness', 'maintenance', 'branding', 'energy', 'safety', 'efficiency'],
      types: ['critical', 'warning', 'info'],
      priorities: ['high', 'medium', 'low'],
      enabled: true,
      lastChecked: new Date()
    };

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/push-token - Register device for push notifications
router.post('/push-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // In a real implementation, you would save this to the database
    logger.info(`Push token registered for user: ${req.user!.email}, platform: ${platform}, device: ${deviceId}`);

    res.json({
      success: true,
      data: {
        userId: req.user!._id.toString(),
        token,
        platform,
        deviceId,
        registeredAt: new Date(),
        message: 'Push token registered successfully'
      }
    });
  } catch (error) {
    logger.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/mobile-alerts/test - Send test notification
router.post('/test', authenticate, async (req: AuthRequest, res) => {
  try {
    // In a real implementation, you would send an actual push notification
    logger.info(`Test notification sent to user: ${req.user!.email}`);

    res.json({
      success: true,
      data: {
        message: 'Test notification sent successfully',
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/mobile-alerts/history - Get alert history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // In a real implementation, you would fetch from alert history table
    const mockHistory = [
      {
        id: 'alert-1',
        type: 'critical',
        category: 'fitness',
        title: 'Rolling Stock Certificate Expired',
        message: 'Train T001 rolling stock certificate expired',
        trainId: 'T001',
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        acknowledged: true,
        acknowledgedBy: req.user!.email,
        acknowledgedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: 'alert-2',
        type: 'warning',
        category: 'maintenance',
        title: 'Maintenance Overdue',
        message: 'Train T003 maintenance is overdue by 2 days',
        trainId: 'T003',
        priority: 'medium',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        acknowledged: false
      }
    ];

    res.json({
      success: true,
      data: {
        alerts: mockHistory,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalResults: mockHistory.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    logger.error('Get alert history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as mobileAlertsRoutes };
