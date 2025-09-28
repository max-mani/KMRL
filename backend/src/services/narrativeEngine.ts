import { logger } from '../utils/logger';

export interface NarrativeContext {
  assignments: Array<{
    trainId: string;
    assignedZone: string;
    previousZone?: string;
    score: number;
    factors: {
      fitness: number;
      jobCard: number;
      branding: number;
      mileage: number;
      cleaning: number;
      geometry: number;
    };
    reasoning: string;
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
  scenario?: string;
  isSimulation: boolean;
  previousOptimization?: any;
}

export interface NarrativeResult {
  summary: string;
  keyChanges: string[];
  recommendations: string[];
  warnings: string[];
  detailedExplanation: string;
  impactAnalysis: {
    positiveImpacts: string[];
    negativeImpacts: string[];
    riskFactors: string[];
  };
  nextSteps: string[];
}

export class NarrativeEngine {
  /**
   * Generate comprehensive narrative explanation for optimization results
   */
  static generateNarrative(context: NarrativeContext): NarrativeResult {
    try {
      const summary = this.generateSummary(context);
      const keyChanges = this.identifyKeyChanges(context);
      const recommendations = this.generateRecommendations(context);
      const warnings = this.identifyWarnings(context);
      const detailedExplanation = this.generateDetailedExplanation(context);
      const impactAnalysis = this.analyzeImpacts(context);
      const nextSteps = this.generateNextSteps(context);

      return {
        summary,
        keyChanges,
        recommendations,
        warnings,
        detailedExplanation,
        impactAnalysis,
        nextSteps
      };
    } catch (error) {
      logger.error('Error generating narrative:', error);
      return {
        summary: 'Optimization completed successfully',
        keyChanges: [],
        recommendations: ['Review optimization results'],
        warnings: [],
        detailedExplanation: 'Optimization process completed with standard parameters',
        impactAnalysis: {
          positiveImpacts: [],
          negativeImpacts: [],
          riskFactors: []
        },
        nextSteps: ['Monitor fleet performance']
      };
    }
  }

  private static generateSummary(context: NarrativeContext): string {
    const { assignments, metrics, isSimulation } = context;
    
    if (isSimulation) {
      return `Simulation completed: ${assignments.length} trains analyzed with ${metrics.serviceTrains} assigned to service, ${metrics.standbyTrains} to standby, and ${metrics.maintenanceTrains} to maintenance. Average optimization score: ${metrics.averageScore}%.`;
    }

    const scenario = context.scenario || 'standard';
    const scenarioDescription = this.getScenarioDescription(scenario);
    
    return `Fleet optimization completed using ${scenarioDescription}. ${assignments.length} trains have been optimally assigned: ${metrics.serviceTrains} to revenue service, ${metrics.standbyTrains} to standby duty, and ${metrics.maintenanceTrains} to maintenance. The optimization achieved an average score of ${metrics.averageScore}% with ${metrics.energyEfficiency}% energy efficiency and ${metrics.punctuality}% predicted punctuality.`;
  }

  private static identifyKeyChanges(context: NarrativeContext): string[] {
    const changes: string[] = [];
    const { assignments, previousOptimization } = context;

    if (previousOptimization) {
      // Compare with previous optimization
      const previousAssignments = previousOptimization.assignments || [];
      
      // Find trains that changed zones
      const zoneChanges = assignments.filter(current => {
        const previous = previousAssignments.find(p => p.trainId === current.trainId);
        return previous && previous.assignedZone !== current.assignedZone;
      });

      zoneChanges.forEach(change => {
        const previous = previousAssignments.find(p => p.trainId === change.trainId);
        changes.push(`Train ${change.trainId} moved from ${previous?.assignedZone} to ${change.assignedZone} due to ${change.reasoning.toLowerCase()}`);
      });

      // Identify score improvements
      const improvedTrains = assignments.filter(current => {
        const previous = previousAssignments.find(p => p.trainId === current.trainId);
        return previous && current.score > previous.score + 5;
      });

      improvedTrains.forEach(train => {
        changes.push(`Train ${train.trainId} improved score from ${previousOptimization.assignments.find(p => p.trainId === train.trainId)?.score} to ${train.score} through optimization`);
      });
    } else {
      // First optimization - identify key assignments
      const highScoreTrains = assignments.filter(a => a.score >= 85);
      const lowScoreTrains = assignments.filter(a => a.score < 60);

      if (highScoreTrains.length > 0) {
        changes.push(`${highScoreTrains.length} trains with scores ≥85% prioritized for service deployment`);
      }

      if (lowScoreTrains.length > 0) {
        changes.push(`${lowScoreTrains.length} trains with scores <60% assigned to maintenance for improvement`);
      }
    }

    // Add metric-based changes
    if (context.metrics.energyEfficiency > 90) {
      changes.push(`Energy efficiency optimized to ${context.metrics.energyEfficiency}% through strategic positioning`);
    }

    if (context.metrics.brandingCompliance > 95) {
      changes.push(`Branding compliance enhanced to ${context.metrics.brandingCompliance}% to meet SLA requirements`);
    }

    return changes;
  }

  private static generateRecommendations(context: NarrativeContext): string[] {
    const recommendations: string[] = [];
    const { assignments, metrics } = context;

    // Analyze train scores
    const lowScoreTrains = assignments.filter(a => a.score < 70);
    if (lowScoreTrains.length > 0) {
      recommendations.push(`Focus on improving ${lowScoreTrains.length} trains with scores below 70% - prioritize fitness certificates and maintenance`);
    }

    // Analyze specific factors
    const fitnessIssues = assignments.filter(a => a.factors.fitness < 60);
    if (fitnessIssues.length > 0) {
      recommendations.push(`Address fitness certificate issues for ${fitnessIssues.length} trains to ensure service readiness`);
    }

    const brandingIssues = assignments.filter(a => a.factors.branding < 50);
    if (brandingIssues.length > 0) {
      recommendations.push(`Prioritize branding compliance for ${brandingIssues.length} trains to avoid SLA penalties`);
    }

    const maintenanceIssues = assignments.filter(a => a.factors.jobCard < 50);
    if (maintenanceIssues.length > 0) {
      recommendations.push(`Complete pending maintenance work orders for ${maintenanceIssues.length} trains`);
    }

    // Service capacity recommendations
    if (metrics.serviceTrains < 15) {
      recommendations.push(`Consider increasing service fleet size - current ${metrics.serviceTrains} trains may impact punctuality during peak hours`);
    }

    if (metrics.serviceTrains > 20) {
      recommendations.push(`Optimize service deployment - ${metrics.serviceTrains} trains in service may exceed optimal capacity`);
    }

    // Energy efficiency recommendations
    if (metrics.energyEfficiency < 85) {
      recommendations.push(`Review train positioning and routing to improve energy efficiency from current ${metrics.energyEfficiency}%`);
    }

    // Mileage balancing recommendations
    if (metrics.mileageBalance < 80) {
      recommendations.push(`Implement mileage balancing strategy to equalize wear across fleet components`);
    }

    return recommendations;
  }

  private static identifyWarnings(context: NarrativeContext): string[] {
    const warnings: string[] = [];
    const { assignments, metrics } = context;

    // Service capacity warnings
    if (metrics.serviceTrains < 15) {
      warnings.push(`Only ${metrics.serviceTrains} trains assigned to service - this may impact the 99.5% punctuality target during peak hours`);
    }

    // Maintenance capacity warnings
    if (metrics.maintenanceTrains > 5) {
      warnings.push(`${metrics.maintenanceTrains} trains in maintenance - high maintenance load may strain resources`);
    }

    // Critical train warnings
    const criticalTrains = assignments.filter(a => a.score < 50);
    if (criticalTrains.length > 0) {
      warnings.push(`${criticalTrains.length} trains with critical scores (<50%) require immediate attention`);
    }

    // Branding compliance warnings
    if (metrics.brandingCompliance < 80) {
      warnings.push(`Branding compliance at ${metrics.brandingCompliance}% - risk of SLA penalties from advertisers`);
    }

    // Energy efficiency warnings
    if (metrics.energyEfficiency < 80) {
      warnings.push(`Energy efficiency below target at ${metrics.energyEfficiency}% - may increase operational costs`);
    }

    // Fitness certificate warnings
    const expiredCertificates = assignments.filter(a => a.factors.fitness < 70);
    if (expiredCertificates.length > 0) {
      warnings.push(`${expiredCertificates.length} trains have fitness certificate issues that could cause service disruptions`);
    }

    return warnings;
  }

  private static generateDetailedExplanation(context: NarrativeContext): string {
    const { assignments, metrics, scenario } = context;
    
    let explanation = `The optimization algorithm analyzed ${assignments.length} trains using a multi-objective approach that considers six key factors: fitness certificates, job card status, branding priorities, mileage balancing, cleaning schedules, and stabling geometry.\n\n`;

    if (scenario) {
      explanation += `For the ${scenario} scenario, the algorithm prioritized `;
      switch (scenario) {
        case 'peak-hour-optimization':
          explanation += 'service capacity and punctuality, ensuring maximum trains are available for revenue service during high-demand periods.';
          break;
        case 'maintenance-window':
          explanation += 'maintenance scheduling and reliability, allocating more trains for inspection and repair during off-peak hours.';
          break;
        case 'energy-optimization':
          explanation += 'energy efficiency and cost reduction, minimizing shunting distances and optimizing train positioning.';
          break;
        case 'branding-compliance':
          explanation += 'branding exposure and SLA compliance, ensuring advertiser requirements are met.';
          break;
        default:
          explanation += 'balanced optimization across all factors.';
      }
      explanation += '\n\n';
    }

    explanation += `The assignment results show ${metrics.serviceTrains} trains in service (target: 15-18), ${metrics.standbyTrains} in standby (target: 5-6), and ${metrics.maintenanceTrains} in maintenance (target: 2-4). `;

    explanation += `The average optimization score of ${metrics.averageScore}% indicates `;
    if (metrics.averageScore >= 85) {
      explanation += 'excellent fleet condition with minimal optimization needed.';
    } else if (metrics.averageScore >= 75) {
      explanation += 'good fleet condition with some areas for improvement.';
    } else if (metrics.averageScore >= 65) {
      explanation += 'moderate fleet condition requiring attention to maintenance and fitness certificates.';
    } else {
      explanation += 'poor fleet condition requiring immediate intervention and maintenance.';
    }

    explanation += ` Energy efficiency at ${metrics.energyEfficiency}% and predicted punctuality of ${metrics.punctuality}% support the optimization decisions.`;

    return explanation;
  }

  private static analyzeImpacts(context: NarrativeContext): {
    positiveImpacts: string[];
    negativeImpacts: string[];
    riskFactors: string[];
  } {
    const { metrics, assignments } = context;
    const positiveImpacts: string[] = [];
    const negativeImpacts: string[] = [];
    const riskFactors: string[] = [];

    // Positive impacts
    if (metrics.energyEfficiency > 90) {
      positiveImpacts.push(`High energy efficiency (${metrics.energyEfficiency}%) reduces operational costs`);
    }

    if (metrics.brandingCompliance > 95) {
      positiveImpacts.push(`Excellent branding compliance (${metrics.brandingCompliance}%) ensures advertiser satisfaction`);
    }

    if (metrics.punctuality > 99) {
      positiveImpacts.push(`High predicted punctuality (${metrics.punctuality}%) maintains service quality`);
    }

    const highScoreTrains = assignments.filter(a => a.score >= 80);
    if (highScoreTrains.length > assignments.length * 0.6) {
      positiveImpacts.push(`${highScoreTrains.length} trains in excellent condition (≥80% score) ensure reliable service`);
    }

    // Negative impacts
    if (metrics.serviceTrains < 15) {
      negativeImpacts.push(`Limited service capacity (${metrics.serviceTrains} trains) may cause delays during peak hours`);
    }

    if (metrics.maintenanceTrains > 5) {
      negativeImpacts.push(`High maintenance load (${metrics.maintenanceTrains} trains) increases operational complexity`);
    }

    if (metrics.shuntingCost > 200) {
      negativeImpacts.push(`High shunting cost (₹${metrics.shuntingCost}) increases operational expenses`);
    }

    // Risk factors
    const criticalTrains = assignments.filter(a => a.score < 50);
    if (criticalTrains.length > 0) {
      riskFactors.push(`${criticalTrains.length} trains with critical scores pose service disruption risks`);
    }

    const fitnessIssues = assignments.filter(a => a.factors.fitness < 70);
    if (fitnessIssues.length > 0) {
      riskFactors.push(`${fitnessIssues.length} trains have fitness certificate issues that could cause regulatory violations`);
    }

    if (metrics.brandingCompliance < 80) {
      riskFactors.push(`Low branding compliance (${metrics.brandingCompliance}%) risks advertiser penalties and revenue loss`);
    }

    return { positiveImpacts, negativeImpacts, riskFactors };
  }

  private static generateNextSteps(context: NarrativeContext): string[] {
    const nextSteps: string[] = [];
    const { isSimulation, assignments, metrics } = context;

    if (isSimulation) {
      nextSteps.push('Review simulation results and consider implementing recommended changes');
      nextSteps.push('Analyze impact of proposed changes on operational metrics');
      nextSteps.push('Validate assumptions and constraints used in simulation');
      return nextSteps;
    }

    // Implementation steps
    nextSteps.push('Implement the optimized train assignments immediately');
    nextSteps.push('Update yard layout and train positioning according to optimization results');

    // Monitoring steps
    nextSteps.push('Monitor actual performance metrics against predicted values');
    nextSteps.push('Track punctuality, energy usage, and maintenance costs for validation');

    // Follow-up actions
    const lowScoreTrains = assignments.filter(a => a.score < 70);
    if (lowScoreTrains.length > 0) {
      nextSteps.push(`Schedule maintenance and fitness certificate renewal for ${lowScoreTrains.length} low-scoring trains`);
    }

    const brandingIssues = assignments.filter(a => a.factors.branding < 60);
    if (brandingIssues.length > 0) {
      nextSteps.push(`Coordinate with advertisers to address branding compliance for ${brandingIssues.length} trains`);
    }

    // Continuous improvement
    nextSteps.push('Collect feedback on optimization results for algorithm improvement');
    nextSteps.push('Update optimization weights based on actual performance outcomes');

    return nextSteps;
  }

  private static getScenarioDescription(scenario: string): string {
    switch (scenario) {
      case 'peak-hour-optimization':
        return 'peak-hour optimization strategy';
      case 'maintenance-window':
        return 'maintenance-focused optimization strategy';
      case 'energy-optimization':
        return 'energy-efficient optimization strategy';
      case 'branding-compliance':
        return 'branding compliance optimization strategy';
      default:
        return 'standard multi-objective optimization strategy';
    }
  }

  /**
   * Generate simplified narrative for mobile/summary views
   */
  static generateBriefNarrative(context: NarrativeContext): string {
    const { assignments, metrics, isSimulation } = context;
    
    if (isSimulation) {
      return `Simulation: ${assignments.length} trains optimized. ${metrics.serviceTrains} service, ${metrics.standbyTrains} standby, ${metrics.maintenanceTrains} maintenance. Score: ${metrics.averageScore}%`;
    }

    const scenario = context.scenario || 'standard';
    return `${scenario.replace('-', ' ')} optimization completed. ${metrics.serviceTrains} trains in service, ${metrics.averageScore}% average score, ${metrics.punctuality}% punctuality target.`;
  }

  /**
   * Generate narrative for specific train assignment
   */
  static generateTrainNarrative(assignment: any, previousAssignment?: any): string {
    const { trainId, assignedZone, score, factors, reasoning } = assignment;
    
    let narrative = `Train ${trainId} assigned to ${assignedZone} zone with ${score}% score. `;
    
    if (previousAssignment && previousAssignment.assignedZone !== assignedZone) {
      narrative += `Moved from ${previousAssignment.assignedZone} due to optimization. `;
    }
    
    narrative += reasoning + ' ';
    
    // Highlight critical factors
    const criticalFactors = [];
    if (factors.fitness < 60) criticalFactors.push('fitness certificate issues');
    if (factors.jobCard < 60) criticalFactors.push('maintenance overdue');
    if (factors.branding < 60) criticalFactors.push('branding compliance risk');
    
    if (criticalFactors.length > 0) {
      narrative += `Critical issues: ${criticalFactors.join(', ')}.`;
    } else {
      narrative += 'All factors within acceptable ranges.';
    }
    
    return narrative;
  }
}
