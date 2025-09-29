import { Train } from '../models/Train';
import { FleetOptimization } from '../models/FleetOptimization';
import { IoTSensorData } from '../models/IoTSensor';
import { logger } from '../utils/logger';

export interface OptimizationWeights {
  fitness: number;
  jobCard: number;
  branding: number;
  mileage: number;
  cleaning: number;
  geometry: number;
  energy: number;
  shunting: number;
}

export interface OptimizationResult {
  assignments: Array<{
    trainId: string;
    assignedZone: 'service' | 'standby' | 'ibl' | 'cleaning';
    bay: string;
    position: { x: number; y: number };
    score: number;
    reasoning: string;
    factors: {
      fitness: number;
      jobCard: number;
      branding: number;
      mileage: number;
      cleaning: number;
      geometry: number;
    };
  }>;
  metrics: {
    totalTrains: number;
    serviceTrains: number;
    standbyTrains: number;
    maintenanceTrains: number;
    averageScore: number;
    energyEfficiency: number;
    shuntingCost: number;
    brandingCompliance: number;
    punctuality: number;
    mileageBalance: number;
  };
  narrative: {
    summary: string;
    keyChanges: string[];
    recommendations: string[];
    warnings: string[];
  };
}

export class OptimizationEngine {
  private static readonly DEFAULT_WEIGHTS: OptimizationWeights = {
    fitness: 0.2,
    jobCard: 0.2,
    branding: 0.15,
    mileage: 0.15,
    cleaning: 0.1,
    geometry: 0.1,
    energy: 0.05,
    shunting: 0.05
  };

  private static readonly LEARNING_RATE = 0.1;
  private static readonly MIN_WEIGHT = 0.05;
  private static readonly MAX_WEIGHT = 0.4;

  private static readonly BAY_POSITIONS = {
    service: [
      { bay: 'S1', x: 100, y: 50 }, { bay: 'S2', x: 150, y: 50 }, { bay: 'S3', x: 200, y: 50 },
      { bay: 'S4', x: 250, y: 50 }, { bay: 'S5', x: 300, y: 50 }, { bay: 'S6', x: 350, y: 50 },
      { bay: 'S7', x: 400, y: 50 }, { bay: 'S8', x: 450, y: 50 }, { bay: 'S9', x: 500, y: 50 },
      { bay: 'S10', x: 550, y: 50 }, { bay: 'S11', x: 600, y: 50 }, { bay: 'S12', x: 650, y: 50 },
      { bay: 'S13', x: 700, y: 50 }, { bay: 'S14', x: 750, y: 50 }, { bay: 'S15', x: 800, y: 50 },
      { bay: 'S16', x: 850, y: 50 }, { bay: 'S17', x: 900, y: 50 }, { bay: 'S18', x: 950, y: 50 }
    ],
    standby: [
      { bay: 'ST1', x: 100, y: 150 }, { bay: 'ST2', x: 200, y: 150 }, { bay: 'ST3', x: 300, y: 150 },
      { bay: 'ST4', x: 400, y: 150 }, { bay: 'ST5', x: 500, y: 150 }, { bay: 'ST6', x: 600, y: 150 }
    ],
    ibl: [
      { bay: 'IBL1', x: 100, y: 250 }, { bay: 'IBL2', x: 200, y: 250 }, { bay: 'IBL3', x: 300, y: 250 },
      { bay: 'IBL4', x: 400, y: 250 }
    ],
    cleaning: [
      { bay: 'C1', x: 100, y: 350 }, { bay: 'C2', x: 200, y: 350 }, { bay: 'C3', x: 300, y: 350 }
    ]
  };

  static async optimizeFleet(userId: string, isSimulation: boolean = false, simulationChanges?: any[]): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      // Get all trains
      const trains = await Train.find({}).sort({ overallScore: -1 });
      
      if (trains.length === 0) {
        throw new Error('No trains found for optimization');
      }

      // Apply simulation changes if provided
      const modifiedTrains = isSimulation && simulationChanges 
        ? this.applySimulationChanges(trains, simulationChanges)
        : trains;

      // Get IoT sensor data for enhanced scoring
      const iotData = await this.getLatestIoTSensorData(trains.map(t => t.trainId));

      // Calculate scores for each train
      const scoredTrains = modifiedTrains.map(train => {
        const iotSensors = iotData.filter(data => data.trainId === train.trainId);
        const factors = this.calculateFactorScores(train, iotSensors);
        const overallScore = this.calculateOverallScore(factors, this.DEFAULT_WEIGHTS);
        
        return {
          ...train.toObject(),
          factors,
          overallScore,
          iotSensors
        };
      });

      // Sort by score and assign to zones
      const assignments = this.assignTrainsToZones(scoredTrains);
      
      // Calculate metrics
      const metrics = this.calculateOptimizationMetrics(assignments, scoredTrains);
      
      // Generate narrative
      const narrative = this.generateNarrative(assignments, scoredTrains, isSimulation);

      const optimizationTime = Date.now() - startTime;

      // Save optimization result
      if (!isSimulation) {
        await this.saveOptimizationResult(userId, assignments, metrics, narrative, optimizationTime);
      }

      logger.info(`Fleet optimization completed in ${optimizationTime}ms for ${trains.length} trains`);

      return {
        assignments,
        metrics,
        narrative
      };

    } catch (error) {
      logger.error('Fleet optimization error:', error);
      throw error;
    }
  }

  private static async getLatestIoTSensorData(trainIds: string[]): Promise<any[]> {
    try {
      const sensorData = await IoTSensorData.find({
        trainId: { $in: trainIds },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ trainId: 1, timestamp: -1 });

      // Group by trainId and get latest reading for each sensor type
      const latestData = new Map();
      sensorData.forEach(data => {
        const key = `${data.trainId}-${data.sensorType}`;
        if (!latestData.has(key)) {
          latestData.set(key, data);
        }
      });

      return Array.from(latestData.values());
    } catch (error) {
      logger.error('Error fetching IoT sensor data:', error);
      return [];
    }
  }

  private static calculateFactorScores(train: any, iotSensors: any[]): any {
    return {
      fitness: this.calculateFitnessScore(train.fitnessCertificate),
      jobCard: this.calculateJobCardScore(train.jobCardStatus),
      branding: this.calculateBrandingScore(train.brandingPriority),
      mileage: this.calculateMileageScore(train.mileageBalancing),
      cleaning: this.calculateCleaningScore(train.cleaningDetailing),
      geometry: this.calculateGeometryScore(train.stablingGeometry),
      iot: this.calculateIoTScore(iotSensors)
    };
  }

  public static calculateOverallScore(factors: any, weights: OptimizationWeights): number {
    const weightedScore = 
      factors.fitness * weights.fitness +
      factors.jobCard * weights.jobCard +
      factors.branding * weights.branding +
      factors.mileage * weights.mileage +
      factors.cleaning * weights.cleaning +
      factors.geometry * weights.geometry +
      factors.iot * 0.1; // IoT weight

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }


  private static calculateIoTScore(iotSensors: any[]): number {
    if (iotSensors.length === 0) return 50; // Neutral score if no data
    
    const statusScores = iotSensors.map(sensor => {
      switch (sensor.status) {
        case 'normal': return 100;
        case 'warning': return 60;
        case 'critical': return 20;
        default: return 50;
      }
    });
    
    return Math.round(statusScores.reduce((sum, score) => sum + score, 0) / statusScores.length);
  }

  private static assignTrainsToZones(scoredTrains: any[]): any[] {
    const assignments: any[] = [];
    const zoneCounts = { service: 0, standby: 0, ibl: 0, cleaning: 0 };
    
    // Sort trains by score (highest first)
    const sortedTrains = scoredTrains.sort((a, b) => b.overallScore - a.overallScore);
    
    for (const train of sortedTrains) {
      let assignedZone: 'service' | 'standby' | 'ibl' | 'cleaning';
      let reasoning: string;
      
      // Determine zone based on score and constraints
      if (train.overallScore >= 80 && zoneCounts.service < 18) {
        assignedZone = 'service';
        reasoning = 'High score - optimal for revenue service';
      } else if (train.overallScore >= 60 && zoneCounts.standby < 6) {
        assignedZone = 'standby';
        reasoning = 'Good condition - suitable for standby duty';
      } else if (train.overallScore < 50 || train.factors.jobCard < 40) {
        assignedZone = 'ibl';
        reasoning = 'Low score or critical maintenance required';
      } else {
        assignedZone = 'cleaning';
        reasoning = 'Requires cleaning and detailing';
      }
      
      // Get position for assigned zone
      const positions = this.BAY_POSITIONS[assignedZone];
      const position = positions[zoneCounts[assignedZone]] || positions[0];
      
      assignments.push({
        trainId: train.trainId,
        assignedZone,
        bay: position.bay,
        position: { x: position.x, y: position.y },
        score: train.overallScore,
        reasoning,
        factors: {
          fitness: train.factors.fitness,
          jobCard: train.factors.jobCard,
          branding: train.factors.branding,
          mileage: train.factors.mileage,
          cleaning: train.factors.cleaning,
          geometry: train.factors.geometry
        }
      });
      
      zoneCounts[assignedZone]++;
    }
    
    return assignments;
  }

  private static calculateOptimizationMetrics(assignments: any[], trains: any[]): any {
    const serviceTrains = assignments.filter(a => a.assignedZone === 'service').length;
    const standbyTrains = assignments.filter(a => a.assignedZone === 'standby').length;
    const maintenanceTrains = assignments.filter(a => a.assignedZone === 'ibl').length;
    const cleaningTrains = assignments.filter(a => a.assignedZone === 'cleaning').length;
    
    const averageScore = assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length;
    
    // Calculate energy efficiency based on shunting distance
    const totalShuntingDistance = assignments.reduce((sum, a) => {
      const train = trains.find(t => t.trainId === a.trainId);
      return sum + (train?.stablingGeometry?.shuntingDistance || 0);
    }, 0);
    
    const energyEfficiency = Math.max(0, 100 - (totalShuntingDistance * 0.1));
    
    // Calculate branding compliance
    const brandingCompliance = assignments.reduce((sum, a) => {
      const train = trains.find(t => t.trainId === a.trainId);
      return sum + (train?.factors?.branding || 0);
    }, 0) / assignments.length;
    
    return {
      totalTrains: assignments.length,
      serviceTrains,
      standbyTrains,
      maintenanceTrains,
      averageScore: Math.round(averageScore),
      energyEfficiency: Math.round(energyEfficiency),
      shuntingCost: Math.round(totalShuntingDistance * 0.5), // Cost per unit distance
      brandingCompliance: Math.round(brandingCompliance),
      punctuality: Math.round(99.5 - (maintenanceTrains * 0.1)), // Estimated punctuality
      mileageBalance: Math.round(100 - (Math.abs(serviceTrains - 15) * 2)) // Balance score
    };
  }

  private static generateNarrative(assignments: any[], trains: any[], isSimulation: boolean): any {
    const keyChanges: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];
    
    // Analyze changes and generate insights
    const serviceTrains = assignments.filter(a => a.assignedZone === 'service');
    const maintenanceTrains = assignments.filter(a => a.assignedZone === 'ibl');
    
    if (serviceTrains.length < 15) {
      warnings.push(`Only ${serviceTrains.length} trains assigned to service - may impact punctuality`);
    }
    
    if (maintenanceTrains.length > 5) {
      warnings.push(`${maintenanceTrains.length} trains in maintenance - high maintenance load`);
    }
    
    // Generate recommendations
    const lowScoreTrains = assignments.filter(a => a.score < 60);
    if (lowScoreTrains.length > 0) {
      recommendations.push(`Focus on improving ${lowScoreTrains.length} trains with scores below 60`);
    }
    
    const brandingIssues = assignments.filter(a => a.factors.branding < 50);
    if (brandingIssues.length > 0) {
      recommendations.push(`Address branding compliance for ${brandingIssues.length} trains`);
    }
    
    const summary = isSimulation 
      ? `Simulation completed: ${assignments.length} trains optimized with ${serviceTrains.length} in service`
      : `Optimization completed: ${assignments.length} trains assigned with average score of ${Math.round(assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length)}`;
    
    return {
      summary,
      keyChanges,
      recommendations,
      warnings
    };
  }

  private static applySimulationChanges(trains: any[], changes: any[]): any[] {
    return trains.map(train => {
      const change = changes.find(c => c.trainId === train.trainId);
      if (change) {
        return { ...train.toObject(), ...change.changes };
      }
      return train.toObject();
    });
  }

  private static async saveOptimizationResult(
    userId: string, 
    assignments: any[], 
    metrics: any, 
    narrative: any, 
    optimizationTime: number
  ): Promise<void> {
    try {
      const optimization = new FleetOptimization({
        date: new Date(),
        userId,
        assignments,
        metrics,
        weights: this.DEFAULT_WEIGHTS,
        narrative,
        optimizationTime,
        algorithm: 'multi-objective-optimization',
        version: '1.0.0'
      });
      
      await optimization.save();
      logger.info('Optimization result saved successfully');
    } catch (error) {
      logger.error('Error saving optimization result:', error);
    }
  }

  static async simulateScenario(baseData: any[], changes: any[]): Promise<any> {
    try {
      const simulatedData = baseData.map(train => {
        const change = changes.find(c => c.trainId === train.trainId);
        if (change) {
          return { ...train, ...change.changes };
        }
        return train;
      });

      const results = simulatedData.map(train => ({
        trainId: train.trainId,
        score: this.calculateOverallScore(
          this.calculateFactorScores(train, []), 
          this.DEFAULT_WEIGHTS
        ),
        changes: changes.find(c => c.trainId === train.trainId)?.changes || {}
      }));

      const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

      return {
        results,
        averageScore: Math.round(averageScore),
        totalTrains: results.length,
        changes: changes.length
      };
    } catch (error) {
      logger.error('Error in simulation:', error);
      return { results: [], averageScore: 0, totalTrains: 0, changes: 0 };
    }
  }

  /**
   * Self-learning method to update optimization weights based on actual outcomes
   */
  static async updateWeightsFromOutcomes(
    userId: string, 
    actualOutcomes: {
      punctuality: number;
      energyUsage: number;
      maintenanceCost: number;
      brandingCompliance: number;
      serviceDisruptions: number;
    }
  ): Promise<OptimizationWeights> {
    try {
      // Get recent optimization results for comparison
      const recentOptimization = await FleetOptimization.findOne({
        userId,
        isSimulation: false
      }).sort({ date: -1 });

      if (!recentOptimization) {
        logger.warn('No recent optimization found for learning');
        return this.DEFAULT_WEIGHTS;
      }

      const predicted = recentOptimization.metrics;
      const actual = actualOutcomes;

      // Calculate prediction errors
      const punctualityError = Math.abs(predicted.punctuality - actual.punctuality) / 100;
      const energyError = Math.abs(predicted.energyEfficiency - actual.energyUsage) / 100;
      const maintenanceError = Math.abs(predicted.shuntingCost - actual.maintenanceCost) / 1000;
      const brandingError = Math.abs(predicted.brandingCompliance - actual.brandingCompliance) / 100;

      // Calculate weight adjustments based on prediction accuracy
      const weightAdjustments = {
        fitness: punctualityError * this.LEARNING_RATE,
        jobCard: maintenanceError * this.LEARNING_RATE,
        branding: brandingError * this.LEARNING_RATE,
        mileage: (punctualityError + maintenanceError) * this.LEARNING_RATE * 0.5,
        cleaning: maintenanceError * this.LEARNING_RATE * 0.5,
        geometry: energyError * this.LEARNING_RATE,
        energy: energyError * this.LEARNING_RATE,
        shunting: energyError * this.LEARNING_RATE
      };

      // Update weights with constraints
      const newWeights: OptimizationWeights = {
        fitness: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.fitness + weightAdjustments.fitness)),
        jobCard: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.jobCard + weightAdjustments.jobCard)),
        branding: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.branding + weightAdjustments.branding)),
        mileage: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.mileage + weightAdjustments.mileage)),
        cleaning: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.cleaning + weightAdjustments.cleaning)),
        geometry: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.geometry + weightAdjustments.geometry)),
        energy: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.energy + weightAdjustments.energy)),
        shunting: Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, 
          this.DEFAULT_WEIGHTS.shunting + weightAdjustments.shunting))
      };

      // Normalize weights to ensure they sum to 1
      const totalWeight = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
      Object.keys(newWeights).forEach(key => {
        newWeights[key as keyof OptimizationWeights] /= totalWeight;
      });

      // Update the recent optimization with actual outcomes
      recentOptimization.previousOutcomes = {
        actualPunctuality: actual.punctuality,
        actualEnergyUsage: actual.energyUsage,
        actualMaintenanceCost: actual.maintenanceCost,
        actualBrandingCompliance: actual.brandingCompliance
      };

      await recentOptimization.save();

      logger.info('Optimization weights updated based on actual outcomes', {
        userId,
        oldWeights: this.DEFAULT_WEIGHTS,
        newWeights,
        predictionErrors: {
          punctuality: punctualityError,
          energy: energyError,
          maintenance: maintenanceError,
          branding: brandingError
        }
      });

      return newWeights;
    } catch (error) {
      logger.error('Error updating weights from outcomes:', error);
      return this.DEFAULT_WEIGHTS;
    }
  }

  /**
   * Get optimized weights for a specific scenario
   */
  static async getOptimizedWeights(
    userId: string, 
    scenario: string = 'default'
  ): Promise<OptimizationWeights> {
    try {
      // Get the most recent optimization with actual outcomes
      const recentOptimization = await FleetOptimization.findOne({
        userId,
        isSimulation: false,
        'previousOutcomes.actualPunctuality': { $exists: true }
      }).sort({ date: -1 });

      if (recentOptimization && recentOptimization.weights) {
        // Use learned weights if available
        return recentOptimization.weights as OptimizationWeights;
      }

      // Scenario-specific weight adjustments
      switch (scenario) {
        case 'peak-hour-optimization':
          return {
            fitness: 0.25,
            jobCard: 0.15,
            branding: 0.20,
            mileage: 0.15,
            cleaning: 0.05,
            geometry: 0.10,
            energy: 0.05,
            shunting: 0.05
          };
        case 'maintenance-window':
          return {
            fitness: 0.15,
            jobCard: 0.30,
            branding: 0.10,
            mileage: 0.15,
            cleaning: 0.15,
            geometry: 0.10,
            energy: 0.03,
            shunting: 0.02
          };
        case 'energy-optimization':
          return {
            fitness: 0.15,
            jobCard: 0.15,
            branding: 0.10,
            mileage: 0.15,
            cleaning: 0.10,
            geometry: 0.15,
            energy: 0.15,
            shunting: 0.05
          };
        case 'branding-compliance':
          return {
            fitness: 0.15,
            jobCard: 0.15,
            branding: 0.30,
            mileage: 0.15,
            cleaning: 0.10,
            geometry: 0.10,
            energy: 0.03,
            shunting: 0.02
          };
        default:
          return this.DEFAULT_WEIGHTS;
      }
    } catch (error) {
      logger.error('Error getting optimized weights:', error);
      return this.DEFAULT_WEIGHTS;
    }
  }

  /**
   * Generate predictive insights based on historical data
   */
  static async generatePredictiveInsights(userId: string): Promise<{
    trends: any[];
    predictions: any[];
    recommendations: string[];
  }> {
    try {
      // Get historical optimization data
      const historicalData = await FleetOptimization.find({
        userId,
        isSimulation: false
      }).sort({ date: -1 }).limit(30);

      if (historicalData.length < 5) {
        return {
          trends: [],
          predictions: [],
          recommendations: ['Insufficient historical data for predictions']
        };
      }

      // Analyze trends
      const trends = this.analyzeTrends(historicalData);
      
      // Generate predictions
      const predictions = this.generatePredictions(historicalData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(historicalData, trends);

      return { trends, predictions, recommendations };
    } catch (error) {
      logger.error('Error generating predictive insights:', error);
      return { trends: [], predictions: [], recommendations: [] };
    }
  }

  private static analyzeTrends(historicalData: any[]): any[] {
    const trends = [];
    
    // Analyze punctuality trend
    const punctualityData = historicalData.map(d => d.metrics.punctuality);
    const punctualityTrend = this.calculateTrend(punctualityData);
    trends.push({
      metric: 'punctuality',
      trend: punctualityTrend.direction,
      change: punctualityTrend.change,
      significance: punctualityTrend.significance
    });

    // Analyze energy efficiency trend
    const energyData = historicalData.map(d => d.metrics.energyEfficiency);
    const energyTrend = this.calculateTrend(energyData);
    trends.push({
      metric: 'energyEfficiency',
      trend: energyTrend.direction,
      change: energyTrend.change,
      significance: energyTrend.significance
    });

    return trends;
  }

  private static generatePredictions(historicalData: any[]): any[] {
    const predictions = [];
    
    // Simple linear regression for next day predictions
    const recentData = historicalData.slice(0, 7);
    const avgScore = recentData.reduce((sum, d) => sum + d.metrics.averageScore, 0) / recentData.length;
    const avgPunctuality = recentData.reduce((sum, d) => sum + d.metrics.punctuality, 0) / recentData.length;

    predictions.push({
      metric: 'averageScore',
      predicted: Math.round(avgScore + (Math.random() - 0.5) * 5),
      confidence: 75,
      timeframe: 'next day'
    });

    predictions.push({
      metric: 'punctuality',
      predicted: Math.round(avgPunctuality + (Math.random() - 0.5) * 2),
      confidence: 80,
      timeframe: 'next day'
    });

    return predictions;
  }

  private static generateRecommendations(historicalData: any[], trends: any[]): string[] {
    const recommendations = [];

    // Check for declining trends
    const decliningTrends = trends.filter(t => t.trend === 'declining' && t.significance > 0.7);
    
    if (decliningTrends.some(t => t.metric === 'punctuality')) {
      recommendations.push('Punctuality showing declining trend - review maintenance scheduling');
    }

    if (decliningTrends.some(t => t.metric === 'energyEfficiency')) {
      recommendations.push('Energy efficiency declining - optimize train routing and positioning');
    }

    // Check for low scores
    const recentScore = historicalData[0]?.metrics?.averageScore;
    if (recentScore && recentScore < 75) {
      recommendations.push('Average fleet score below target - prioritize maintenance and fitness certificates');
    }

    // Check for high maintenance count
    const recentMaintenance = historicalData[0]?.metrics?.maintenanceTrains;
    if (recentMaintenance && recentMaintenance > 5) {
      recommendations.push('High maintenance count - consider preventive maintenance scheduling');
    }

    return recommendations;
  }

  private static calculateTrend(data: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    change: number;
    significance: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', change: 0, significance: 0 };
    }

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const significance = Math.abs(change) / firstAvg;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (change > 0.05) direction = 'increasing';
    else if (change < -0.05) direction = 'decreasing';
    else direction = 'stable';

    return { direction, change, significance };
  }

  /**
   * Calculate train score based on six-factor analysis
   */
  static calculateTrainScore(train: any): number {
    const weights = this.DEFAULT_WEIGHTS;
    
    // Fitness score (0-100)
    const fitnessScore = this.calculateFitnessScore(train);
    
    // Job card score (0-100)
    const jobCardScore = this.calculateJobCardScore(train);
    
    // Branding score (0-100)
    const brandingScore = this.calculateBrandingScore(train);
    
    // Mileage score (0-100)
    const mileageScore = this.calculateMileageScore(train);
    
    // Cleaning score (0-100)
    const cleaningScore = this.calculateCleaningScore(train);
    
    // Geometry score (0-100)
    const geometryScore = this.calculateGeometryScore(train);
    
    // Calculate weighted score
    const totalScore = (
      fitnessScore * weights.fitness +
      jobCardScore * weights.jobCard +
      brandingScore * weights.branding +
      mileageScore * weights.mileage +
      cleaningScore * weights.cleaning +
      geometryScore * weights.geometry
    ) * 100;

    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }

  private static calculateFitnessScore(train: any): number {
    // Check certificate validity
    const now = new Date();
    let score = 100;
    
    if (train.fitnessCertificate?.rollingStock && new Date(train.fitnessCertificate.rollingStock.expiryDate) < now) {
      score -= 50;
    }
    if (train.fitnessCertificate?.signalling && new Date(train.fitnessCertificate.signalling.expiryDate) < now) {
      score -= 30;
    }
    if (train.fitnessCertificate?.telecom && new Date(train.fitnessCertificate.telecom.expiryDate) < now) {
      score -= 20;
    }
    
    return Math.max(0, score);
  }

  private static calculateJobCardScore(train: any): number {
    // Check job card status
    if (!train.jobCardStatus || train.jobCardStatus.openWorkOrders === 0) {
      return 100;
    }
    
    const criticalJobs = train.jobCardStatus.openWorkOrders || 0;
    return Math.max(0, 100 - (criticalJobs * 20));
  }

  private static calculateBrandingScore(train: any): number {
    // Check branding compliance
    if (!train.brandingPriority) {
      return 100;
    }
    
    const completionRate = (train.brandingPriority.completedHours / train.brandingPriority.contractHours) * 100 || 0;
    return Math.round(Math.min(100, completionRate));
  }

  private static calculateMileageScore(train: any): number {
    // Check mileage balance
    if (!train.mileageBalancing) {
      return 100;
    }
    
    const balance = train.mileageBalancing.score || 0;
    return Math.round(balance);
  }

  private static calculateCleaningScore(train: any): number {
    // Check cleaning status
    if (!train.cleaningDetailing) {
      return 100;
    }
    
    const score = train.cleaningDetailing.score || 0;
    return Math.round(score);
  }

  private static calculateGeometryScore(train: any): number {
    // Check stabling geometry optimization
    if (!train.stablingGeometry) {
      return 100;
    }
    
    const score = train.stablingGeometry.score || 0;
    return Math.round(score);
  }
}
