import { Train } from '../models/Train';
import { IoTSensorData } from '../models/IoTSensor';
import { FleetOptimization } from '../models/FleetOptimization';
import { logger } from '../utils/logger';

export interface MobileAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'fitness' | 'maintenance' | 'branding' | 'energy' | 'safety' | 'efficiency' | 'system';
  title: string;
  message: string;
  trainId?: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: {
    optimizationId?: string;
    sensorData?: any;
    previousValue?: any;
    currentValue?: any;
  };
}

export interface AlertSubscription {
  userId: string;
  categories: string[];
  types: string[];
  priorities: string[];
  enabled: boolean;
  lastChecked: Date;
}

export class MobileAlertsService {
  /**
   * Generate all active alerts for mobile notifications
   */
  static async generateActiveAlerts(): Promise<MobileAlert[]> {
    try {
      const alerts: MobileAlert[] = [];

      // Check for fitness certificate alerts
      const fitnessAlerts = await this.checkFitnessCertificateAlerts();
      alerts.push(...fitnessAlerts);

      // Check for maintenance alerts
      const maintenanceAlerts = await this.checkMaintenanceAlerts();
      alerts.push(...maintenanceAlerts);

      // Check for branding compliance alerts
      const brandingAlerts = await this.checkBrandingAlerts();
      alerts.push(...brandingAlerts);

      // Check for IoT sensor alerts
      const iotAlerts = await this.checkIoTSensorAlerts();
      alerts.push(...iotAlerts);

      // Check for optimization alerts
      const optimizationAlerts = await this.checkOptimizationAlerts();
      alerts.push(...optimizationAlerts);

      // Sort by priority and timestamp
      return alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const typeOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    } catch (error) {
      logger.error('Error generating active alerts:', error);
      return [];
    }
  }

  /**
   * Check for fitness certificate alerts
   */
  private static async checkFitnessCertificateAlerts(): Promise<MobileAlert[]> {
    const alerts: MobileAlert[] = [];
    
    try {
      const trains = await Train.find({});
      
      for (const train of trains) {
        const { fitnessCertificate } = train;
        
        // Check for expired certificates
        const now = new Date();
        
        if (!fitnessCertificate.rollingStock.valid || fitnessCertificate.rollingStock.expiryDate < now) {
          alerts.push({
            id: `fitness-${train.trainId}-rolling`,
            type: 'critical',
            category: 'fitness',
            title: 'Rolling Stock Certificate Expired',
            message: `Train ${train.trainId} rolling stock fitness certificate has expired. Immediate action required.`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`,
            metadata: {
              sensorData: fitnessCertificate.rollingStock,
              previousValue: 'valid',
              currentValue: 'expired'
            }
          });
        }
        
        if (!fitnessCertificate.signalling.valid || fitnessCertificate.signalling.expiryDate < now) {
          alerts.push({
            id: `fitness-${train.trainId}-signalling`,
            type: 'critical',
            category: 'fitness',
            title: 'Signalling Certificate Expired',
            message: `Train ${train.trainId} signalling fitness certificate has expired. Service may be affected.`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`,
            metadata: {
              sensorData: fitnessCertificate.signalling,
              previousValue: 'valid',
              currentValue: 'expired'
            }
          });
        }
        
        if (!fitnessCertificate.telecom.valid || fitnessCertificate.telecom.expiryDate < now) {
          alerts.push({
            id: `fitness-${train.trainId}-telecom`,
            type: 'critical',
            category: 'fitness',
            title: 'Telecom Certificate Expired',
            message: `Train ${train.trainId} telecom fitness certificate has expired. Communication systems may be affected.`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`,
            metadata: {
              sensorData: fitnessCertificate.telecom,
              previousValue: 'valid',
              currentValue: 'expired'
            }
          });
        }
        
        // Check for certificates expiring soon (within 7 days)
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (fitnessCertificate.rollingStock.expiryDate <= sevenDaysFromNow && fitnessCertificate.rollingStock.expiryDate > now) {
          alerts.push({
            id: `fitness-${train.trainId}-rolling-warning`,
            type: 'warning',
            category: 'fitness',
            title: 'Rolling Stock Certificate Expiring Soon',
            message: `Train ${train.trainId} rolling stock certificate expires in ${Math.ceil((fitnessCertificate.rollingStock.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days.`,
            trainId: train.trainId,
            priority: 'medium',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`
          });
        }
      }
    } catch (error) {
      logger.error('Error checking fitness certificate alerts:', error);
    }
    
    return alerts;
  }

  /**
   * Check for maintenance alerts
   */
  private static async checkMaintenanceAlerts(): Promise<MobileAlert[]> {
    const alerts: MobileAlert[] = [];
    
    try {
      const trains = await Train.find({});
      
      for (const train of trains) {
        const { jobCardStatus, overallScore } = train;
        
        // Check for critical maintenance issues
        if (jobCardStatus.criticalIssues.length > 0) {
          alerts.push({
            id: `maintenance-${train.trainId}-critical`,
            type: 'critical',
            category: 'maintenance',
            title: 'Critical Maintenance Issues',
            message: `Train ${train.trainId} has ${jobCardStatus.criticalIssues.length} critical maintenance issues: ${jobCardStatus.criticalIssues.join(', ')}`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`,
            metadata: {
              sensorData: jobCardStatus,
              previousValue: 'normal',
              currentValue: 'critical'
            }
          });
        }
        
        // Check for low overall scores
        if (overallScore < 50) {
          alerts.push({
            id: `maintenance-${train.trainId}-low-score`,
            type: 'warning',
            category: 'maintenance',
            title: 'Train Performance Critical',
            message: `Train ${train.trainId} has critical performance score of ${overallScore}%. Immediate maintenance required.`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`
          });
        }
        
        // Check for overdue maintenance
        const now = new Date();
        if (jobCardStatus.nextDueDate < now) {
          alerts.push({
            id: `maintenance-${train.trainId}-overdue`,
            type: 'warning',
            category: 'maintenance',
            title: 'Maintenance Overdue',
            message: `Train ${train.trainId} maintenance is overdue by ${Math.ceil((now.getTime() - jobCardStatus.nextDueDate.getTime()) / (1000 * 60 * 60 * 24))} days.`,
            trainId: train.trainId,
            priority: 'medium',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/maintenance?train=${train.trainId}`
          });
        }
      }
    } catch (error) {
      logger.error('Error checking maintenance alerts:', error);
    }
    
    return alerts;
  }

  /**
   * Check for branding compliance alerts
   */
  private static async checkBrandingAlerts(): Promise<MobileAlert[]> {
    const alerts: MobileAlert[] = [];
    
    try {
      const trains = await Train.find({});
      
      for (const train of trains) {
        const { brandingPriority } = train;
        const now = new Date();
        const daysUntilDeadline = Math.ceil((brandingPriority.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check for SLA deadline approaching
        if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
          alerts.push({
            id: `branding-${train.trainId}-deadline`,
            type: 'critical',
            category: 'branding',
            title: 'Branding SLA Deadline Critical',
            message: `Train ${train.trainId} branding SLA deadline in ${daysUntilDeadline} days. Current completion: ${Math.round((brandingPriority.completedHours / brandingPriority.contractHours) * 100)}%`,
            trainId: train.trainId,
            priority: 'high',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/performance?train=${train.trainId}`
          });
        }
        
        // Check for low completion rate
        const completionRate = (brandingPriority.completedHours / brandingPriority.contractHours) * 100;
        if (completionRate < 50 && daysUntilDeadline <= 7) {
          alerts.push({
            id: `branding-${train.trainId}-low-completion`,
            type: 'warning',
            category: 'branding',
            title: 'Branding Compliance Risk',
            message: `Train ${train.trainId} branding completion only ${Math.round(completionRate)}%. Risk of SLA penalty.`,
            trainId: train.trainId,
            priority: 'medium',
            timestamp: new Date(),
            acknowledged: false,
            actionRequired: true,
            actionUrl: `/performance?train=${train.trainId}`
          });
        }
      }
    } catch (error) {
      logger.error('Error checking branding alerts:', error);
    }
    
    return alerts;
  }

  /**
   * Check for IoT sensor alerts
   */
  private static async checkIoTSensorAlerts(): Promise<MobileAlert[]> {
    const alerts: MobileAlert[] = [];
    
    try {
      // Get recent IoT sensor data with critical or warning status
      const recentSensorData = await IoTSensorData.find({
        status: { $in: ['critical', 'warning'] },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ timestamp: -1 });

      for (const sensorData of recentSensorData) {
        const alertType = sensorData.status === 'critical' ? 'critical' : 'warning';
        const priority = sensorData.status === 'critical' ? 'high' : 'medium';
        
        alerts.push({
          id: `iot-${sensorData.trainId}-${sensorData.sensorType}-${sensorData._id}`,
          type: alertType,
          category: 'safety',
          title: `${sensorData.sensorType.charAt(0).toUpperCase() + sensorData.sensorType.slice(1)} Sensor Alert`,
          message: `Train ${sensorData.trainId} ${sensorData.sensorType} sensor showing ${sensorData.status} reading: ${sensorData.value}${sensorData.unit}`,
          trainId: sensorData.trainId,
          priority,
          timestamp: sensorData.timestamp,
          acknowledged: false,
          actionRequired: sensorData.status === 'critical',
          actionUrl: `/dashboard?train=${sensorData.trainId}`,
          metadata: {
            sensorData: sensorData,
            previousValue: 'normal',
            currentValue: sensorData.value
          }
        });
      }
    } catch (error) {
      logger.error('Error checking IoT sensor alerts:', error);
    }
    
    return alerts;
  }

  /**
   * Check for optimization alerts
   */
  private static async checkOptimizationAlerts(): Promise<MobileAlert[]> {
    const alerts: MobileAlert[] = [];
    
    try {
      // Get the most recent optimization result
      const latestOptimization = await FleetOptimization.findOne({
        isSimulation: false
      }).sort({ date: -1 });

      if (!latestOptimization) {
        return alerts;
      }

      const { metrics } = latestOptimization;

      // Check for low service capacity
      if (metrics.serviceTrains < 15) {
        alerts.push({
          id: 'optimization-low-service-capacity',
          type: 'warning',
          category: 'efficiency',
          title: 'Low Service Capacity',
          message: `Only ${metrics.serviceTrains} trains assigned to service. May impact punctuality during peak hours.`,
          priority: 'medium',
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true,
          actionUrl: '/digital-twin',
          metadata: {
            optimizationId: latestOptimization._id.toString(),
            previousValue: 18,
            currentValue: metrics.serviceTrains
          }
        });
      }

      // Check for high maintenance load
      if (metrics.maintenanceTrains > 5) {
        alerts.push({
          id: 'optimization-high-maintenance',
          type: 'warning',
          category: 'maintenance',
          title: 'High Maintenance Load',
          message: `${metrics.maintenanceTrains} trains in maintenance. May strain maintenance resources.`,
          priority: 'medium',
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true,
          actionUrl: '/maintenance',
          metadata: {
            optimizationId: latestOptimization._id.toString(),
            previousValue: 3,
            currentValue: metrics.maintenanceTrains
          }
        });
      }

      // Check for low energy efficiency
      if (metrics.energyEfficiency < 80) {
        alerts.push({
          id: 'optimization-low-energy-efficiency',
          type: 'warning',
          category: 'energy',
          title: 'Low Energy Efficiency',
          message: `Energy efficiency at ${metrics.energyEfficiency}% is below target. Review train positioning and routing.`,
          priority: 'low',
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true,
          actionUrl: '/performance',
          metadata: {
            optimizationId: latestOptimization._id.toString(),
            previousValue: 90,
            currentValue: metrics.energyEfficiency
          }
        });
      }

      // Check for low branding compliance
      if (metrics.brandingCompliance < 80) {
        alerts.push({
          id: 'optimization-low-branding-compliance',
          type: 'warning',
          category: 'branding',
          title: 'Low Branding Compliance',
          message: `Branding compliance at ${metrics.brandingCompliance}% may result in advertiser penalties.`,
          priority: 'medium',
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true,
          actionUrl: '/performance',
          metadata: {
            optimizationId: latestOptimization._id.toString(),
            previousValue: 95,
            currentValue: metrics.brandingCompliance
          }
        });
      }

      // Success alert for good optimization
      if (metrics.averageScore >= 85 && metrics.serviceTrains >= 15 && metrics.energyEfficiency >= 90) {
        alerts.push({
          id: 'optimization-success',
          type: 'success',
          category: 'system',
          title: 'Excellent Optimization Results',
          message: `Fleet optimization achieved ${metrics.averageScore}% average score with ${metrics.serviceTrains} service trains and ${metrics.energyEfficiency}% energy efficiency.`,
          priority: 'low',
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: false,
          actionUrl: '/dashboard',
          metadata: {
            optimizationId: latestOptimization._id.toString()
          }
        });
      }
    } catch (error) {
      logger.error('Error checking optimization alerts:', error);
    }
    
    return alerts;
  }

  /**
   * Filter alerts based on user subscription preferences
   */
  static filterAlertsForUser(alerts: MobileAlert[], subscription: AlertSubscription): MobileAlert[] {
    if (!subscription.enabled) {
      return [];
    }

    return alerts.filter(alert => {
      // Check category
      if (subscription.categories.length > 0 && !subscription.categories.includes(alert.category)) {
        return false;
      }

      // Check type
      if (subscription.types.length > 0 && !subscription.types.includes(alert.type)) {
        return false;
      }

      // Check priority
      if (subscription.priorities.length > 0 && !subscription.priorities.includes(alert.priority)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get alert statistics for dashboard
   */
  static getAlertStatistics(alerts: MobileAlert[]): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    success: number;
    acknowledged: number;
    pending: number;
    byCategory: Record<string, number>;
  } {
    const stats = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      success: 0,
      acknowledged: 0,
      pending: 0,
      byCategory: {} as Record<string, number>
    };

    for (const alert of alerts) {
      stats[alert.type]++;
      stats[alert.acknowledged ? 'acknowledged' : 'pending']++;
      
      if (!stats.byCategory[alert.category]) {
        stats.byCategory[alert.category] = 0;
      }
      stats.byCategory[alert.category]++;
    }

    return stats;
  }
}
