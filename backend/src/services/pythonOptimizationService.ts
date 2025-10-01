import { spawn } from 'child_process';
import { logger } from '../utils/logger';
import path from 'path';

export interface OptimizationResult {
  trainId: string;
  inductionStatus: 'revenue' | 'standby' | 'maintenance';
  overallScore: number;
  fitnessScore: number;
  jobCardScore: number;
  brandingScore: number;
  mileageScore: number;
  cleaningScore: number;
  geometryScore: number;
  cleaningSlot: number;
  stablingBay: number;
  explainability: string;
}

export interface OptimizationSummary {
  totalTrains: number;
  revenueTrains: number;
  standbyTrains: number;
  maintenanceTrains: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface PythonOptimizationResponse {
  success: boolean;
  results?: OptimizationResult[];
  summary?: OptimizationSummary;
  error?: string;
}

export class PythonOptimizationService {
  private static readonly PYTHON_SCRIPT_PATH = path.join(__dirname, '../../engine/python_optimization_service.py');
  private static readonly PYTHON_EXECUTABLE = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

  /**
   * Run optimization using the Python service
   */
  static async runOptimization(data: any[]): Promise<PythonOptimizationResponse> {
    return new Promise((resolve, reject) => {
      try {
        // Convert data to JSON string
        const jsonData = JSON.stringify(data);
        
        logger.info(`Running Python optimization for ${data.length} trains`);
        
        // Spawn Python process
        const pythonProcess = spawn(this.PYTHON_EXECUTABLE, [this.PYTHON_SCRIPT_PATH, jsonData], {
          cwd: path.dirname(this.PYTHON_SCRIPT_PATH),
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              logger.info(`Python optimization completed successfully`);
              resolve(result);
            } catch (parseError) {
              logger.error('Failed to parse Python optimization result:', parseError);
              reject(new Error('Failed to parse optimization result'));
            }
          } else {
            logger.error(`Python optimization failed with code ${code}:`, stderr);
            reject(new Error(`Python optimization failed: ${stderr}`));
          }
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
          logger.error('Failed to start Python optimization process:', error);
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });

        // Set timeout
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Python optimization timeout'));
        }, 30000); // 30 second timeout

      } catch (error) {
        logger.error('Error running Python optimization:', error);
        reject(error);
      }
    });
  }

  /**
   * Check if Python service is available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      // Test with minimal data
      const testData = [{
        trainId: 'TEST001',
        fitnessCertificate: 100,
        jobCardStatus: 100,
        brandingPriority: 100,
        mileageBalancing: 100,
        cleaningDetailing: 100,
        stablingGeometry: 100
      }];

      const result = await this.runOptimization(testData);
      return result.success;
    } catch (error) {
      logger.error('Python service health check failed:', error);
      return false;
    }
  }

  /**
   * Convert frontend data format to Python service format
   */
  static convertDataFormat(frontendData: any[]): any[] {
    return frontendData.map((train, index) => ({
      trainId: train.trainId || `T${String(index + 1).padStart(3, '0')}`,
      fitnessCertificate: train.fitnessCertificate || 0,
      jobCardStatus: train.jobCardStatus || 0,
      brandingPriority: train.brandingPriority || 0,
      mileageBalancing: train.mileageBalancing || 0,
      cleaningDetailing: train.cleaningDetailing || 0,
      stablingGeometry: train.stablingGeometry || 0
    }));
  }
}
