import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadedData, ProcessedTrainData } from '../models/UploadedData';
import { OptimizationResult } from '../models/OptimizationResult';
import { OptimizationEngine } from '../services/optimizationEngine';
import { PythonOptimizationService } from '../services/pythonOptimizationService';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { uploadBufferToFirebase, isFirebaseConfigured } from '../utils/firebase';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Helper function to validate required columns
const validateRequiredColumns = (data: any[]): { isValid: boolean; missingColumns: string[] } => {
  const requiredColumns = [
    'trainId',
    'fitnessCertificate',
    'jobCardStatus',
    'brandingPriority',
    'mileageBalancing',
    'cleaningDetailing',
    'stablingGeometry'
  ];

  if (data.length === 0) {
    return { isValid: false, missingColumns: requiredColumns };
  }

  const dataColumns = Object.keys(data[0]);
  const missingColumns = requiredColumns.filter(col => !dataColumns.includes(col));

  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
};

// Helper function to process and validate data
const processData = (rawData: any[]): ProcessedTrainData[] => {
  return rawData.map((row, index) => {
    // Convert string values to numbers where needed
    const processedRow: ProcessedTrainData = {
      trainId: String(row.trainId || `TRAIN-${index + 1}`),
      fitnessCertificate: Number(row.fitnessCertificate) || 0,
      jobCardStatus: Number(row.jobCardStatus) || 0,
      brandingPriority: Number(row.brandingPriority) || 0,
      mileageBalancing: Number(row.mileageBalancing) || 0,
      cleaningDetailing: Number(row.cleaningDetailing) || 0,
      stablingGeometry: Number(row.stablingGeometry) || 0
    };

    // Validate score ranges (0-100)
    Object.keys(processedRow).forEach(key => {
      if (key !== 'trainId' && typeof processedRow[key as keyof ProcessedTrainData] === 'number') {
        const value = processedRow[key as keyof ProcessedTrainData] as number;
        if (value < 0) processedRow[key as keyof ProcessedTrainData] = 0;
        if (value > 100) processedRow[key as keyof ProcessedTrainData] = 100;
      }
    });

    return processedRow;
  });
};

// POST /api/upload/data
router.post('/data', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileType = req.file.originalname.endsWith('.csv') ? 'csv' : 'excel';
    let rawData: any[] = [];

    // Parse file based on type
    if (fileType === 'csv') {
      const csvContent = require('fs').readFileSync(filePath, 'utf8');
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });
      rawData = parseResult.data;
    } else {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(worksheet);
    }

    // Validate required columns
    const validation = validateRequiredColumns(rawData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Missing required columns',
        missingColumns: validation.missingColumns
      });
    }

    // Process data
    const processedData = processData(rawData);

    // Attempt to upload original file to Firebase Storage
    let storageInfo: { provider: 'firebase' | 'local' | 'none'; bucket?: string; path?: string; url?: string } = { provider: 'none' };
    try {
      const buffer = fs.readFileSync(filePath);
      if (isFirebaseConfigured()) {
        const dest = `uploads/${req.user!._id}/${Date.now()}-${path.basename(filePath)}`;
        const uploaded = await uploadBufferToFirebase(buffer, dest, fileType === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        if (uploaded) {
          storageInfo = { provider: 'firebase', bucket: uploaded.bucket, path: uploaded.path, url: uploaded.publicUrl };
        }
      }
    } catch (e) {
      logger.warn('Failed to upload to Firebase, proceeding without remote storage');
    } finally {
      // Cleanup local file regardless
      try { fs.unlinkSync(filePath); } catch {}
    }

    // Save to database
    const uploadedData = new UploadedData({
      userId: req.user!._id,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      storage: storageInfo,
      originalData: rawData,
      processedData,
      status: 'completed'
    });

    await uploadedData.save();

    // Run Python optimization
    try {
      const pythonResults = await PythonOptimizationService.runOptimization(processedData);
      
      if (!pythonResults.success) {
        throw new Error(pythonResults.error || 'Python optimization failed');
      }

      // Convert Python results to our format
      const optimizationResults = pythonResults.results!.map(result => ({
        trainId: result.trainId,
        score: result.overallScore,
        factors: {
          fitness: { score: result.fitnessScore, status: result.fitnessScore >= 90 ? 'great' : result.fitnessScore >= 75 ? 'good' : result.fitnessScore >= 60 ? 'ok' : 'bad' },
          jobCard: { score: result.jobCardScore, status: result.jobCardScore >= 90 ? 'great' : result.jobCardScore >= 75 ? 'good' : result.jobCardScore >= 60 ? 'ok' : 'bad' },
          branding: { score: result.brandingScore, status: result.brandingScore >= 90 ? 'great' : result.brandingScore >= 75 ? 'good' : result.brandingScore >= 60 ? 'ok' : 'bad' },
          mileage: { score: result.mileageScore, status: result.mileageScore >= 90 ? 'great' : result.mileageScore >= 75 ? 'good' : result.mileageScore >= 60 ? 'ok' : 'bad' },
          cleaning: { score: result.cleaningScore, status: result.cleaningScore >= 90 ? 'great' : result.cleaningScore >= 75 ? 'good' : result.cleaningScore >= 60 ? 'ok' : 'bad' },
          geometry: { score: result.geometryScore, status: result.geometryScore >= 90 ? 'great' : result.geometryScore >= 75 ? 'good' : result.geometryScore >= 60 ? 'ok' : 'bad' }
        },
        inductionStatus: result.inductionStatus,
        cleaningSlot: result.cleaningSlot,
        stablingBay: result.stablingBay,
        reason: result.explainability
      }));

      // Save optimization results (store full per-train objects)
      const optimizationResult = new OptimizationResult({
        userId: req.user!._id,
        results: optimizationResults.map(r => ({
          trainId: r.trainId,
          score: r.score,
          factors: {
            fitness: r.factors.fitness.status as any,
            jobCard: r.factors.jobCard.status as any,
            branding: r.factors.branding.status as any,
            mileage: r.factors.mileage.status as any,
            cleaning: r.factors.cleaning.status as any,
            geometry: r.factors.geometry.status as any
          },
          reason: r.reason,
          rawData: {
            fitnessCertificate: processedData.find(p => p.trainId === r.trainId)?.fitnessCertificate || 0,
            jobCardStatus: processedData.find(p => p.trainId === r.trainId)?.jobCardStatus || 0,
            brandingPriority: processedData.find(p => p.trainId === r.trainId)?.brandingPriority || 0,
            mileageBalancing: processedData.find(p => p.trainId === r.trainId)?.mileageBalancing || 0,
            cleaningDetailing: processedData.find(p => p.trainId === r.trainId)?.cleaningDetailing || 0,
            stablingGeometry: processedData.find(p => p.trainId === r.trainId)?.stablingGeometry || 0
          }
        })),
        totalTrains: optimizationResults.length,
        averageScore: Math.round(pythonResults.summary!.averageScore)
      });

      await optimizationResult.save();

      logger.info(`Data uploaded and processed by user: ${req.user!.email} using Python optimization`);

      res.json({
        success: true,
        message: 'Data uploaded and processed successfully with Python optimization',
        data: {
          uploadId: uploadedData._id,
          totalTrains: processedData.length,
          averageScore: Math.round(pythonResults.summary!.averageScore),
          optimizationResults: optimizationResults,
          summary: pythonResults.summary
        }
      });

    } catch (pythonError) {
      logger.error('Python optimization failed, falling back to basic optimization:', pythonError);
      
      // Fallback to basic optimization
      const scores = processedData.map(train => {
        const factors = {
          fitness: train.fitnessCertificate,
          jobCard: train.jobCardStatus,
          branding: train.brandingPriority,
          mileage: train.mileageBalancing,
          cleaning: train.cleaningDetailing,
          geometry: train.stablingGeometry
        };
        return OptimizationEngine.calculateOverallScore(factors, OptimizationEngine['DEFAULT_WEIGHTS']);
      });

      const averageScore = scores.length > 0 
        ? scores.reduce((sum, result) => sum + result, 0) / scores.length
        : 0;

      const responseResults = processedData.map((p, idx) => {
        const score = Math.round(scores[idx] || 0);
        const toStatus = (v: number) => (v >= 85 ? 'great' : v >= 65 ? 'good' : v >= 45 ? 'ok' : 'bad');
        const inductionStatus = score >= 70 ? 'revenue' : score >= 55 ? 'standby' : 'maintenance';
        return {
          trainId: p.trainId,
          score,
          inductionStatus,
          cleaningSlot: 0,
          stablingBay: 0,
          factors: {
            fitness: { score: Math.round(p.fitnessCertificate), status: toStatus(p.fitnessCertificate) },
            jobCard: { score: Math.round(p.jobCardStatus), status: toStatus(p.jobCardStatus) },
            branding: { score: Math.round(p.brandingPriority), status: toStatus(p.brandingPriority) },
            mileage: { score: Math.round(p.mileageBalancing), status: toStatus(p.mileageBalancing) },
            cleaning: { score: Math.round(p.cleaningDetailing), status: toStatus(p.cleaningDetailing) },
            geometry: { score: Math.round(p.stablingGeometry), status: toStatus(p.stablingGeometry) }
          },
          reason: 'Baseline optimization from weighted factors',
          rawData: {
            fitnessCertificate: p.fitnessCertificate,
            jobCardStatus: p.jobCardStatus,
            brandingPriority: p.brandingPriority,
            mileageBalancing: p.mileageBalancing,
            cleaningDetailing: p.cleaningDetailing,
            stablingGeometry: p.stablingGeometry
          }
        };
      });

      const dbResults = responseResults.map(r => ({
        trainId: r.trainId,
        score: r.score,
        factors: {
          fitness: r.factors.fitness.status as any,
          jobCard: r.factors.jobCard.status as any,
          branding: r.factors.branding.status as any,
          mileage: r.factors.mileage.status as any,
          cleaning: r.factors.cleaning.status as any,
          geometry: r.factors.geometry.status as any
        },
        reason: r.reason,
        rawData: r.rawData
      }));

      // Save optimization results (basic)
      const optimizationResult = new OptimizationResult({
        userId: req.user!._id,
        results: dbResults,
        totalTrains: dbResults.length,
        averageScore: Math.round(averageScore)
      });

      await optimizationResult.save();

      logger.info(`Data uploaded and processed by user: ${req.user!.email} using fallback optimization`);

      res.json({
        success: true,
        message: 'Data uploaded and processed successfully (using fallback optimization)',
        data: {
          uploadId: uploadedData._id,
          totalTrains: processedData.length,
          averageScore: Math.round(averageScore),
          optimizationResults: responseResults
        }
      });
    }

  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file'
    });
  }
});

// POST /api/upload/google-sheet
router.post('/google-sheet', authenticate, async (req: AuthRequest, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheet URL is required'
      });
    }

    // Convert Google Sheet URL to CSV export URL
    const csvUrl = url.replace('/edit#gid=', '/export?format=csv&gid=');

    // Fetch CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch Google Sheet data'
      });
    }

    const csvContent = await response.text();
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    const rawData = parseResult.data;

    // Validate required columns
    const validation = validateRequiredColumns(rawData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Missing required columns',
        missingColumns: validation.missingColumns
      });
    }

    // Process data
    const processedData = processData(rawData);

    // Save to database
    const uploadedData = new UploadedData({
      userId: req.user!._id,
      fileName: 'Google Sheet Import',
      fileType: 'google-sheet',
      fileSize: csvContent.length,
      originalData: rawData,
      processedData,
      status: 'completed'
    });

    await uploadedData.save();

    // Run Python optimization
    try {
      const pythonResults = await PythonOptimizationService.runOptimization(processedData);
      
      if (!pythonResults.success) {
        throw new Error(pythonResults.error || 'Python optimization failed');
      }

      // Convert Python results to our format
      const optimizationResults = pythonResults.results!.map(result => ({
        trainId: result.trainId,
        score: result.overallScore,
        factors: {
          fitness: { score: result.fitnessScore, status: result.fitnessScore >= 90 ? 'great' : result.fitnessScore >= 75 ? 'good' : result.fitnessScore >= 60 ? 'ok' : 'bad' },
          jobCard: { score: result.jobCardScore, status: result.jobCardScore >= 90 ? 'great' : result.jobCardScore >= 75 ? 'good' : result.jobCardScore >= 60 ? 'ok' : 'bad' },
          branding: { score: result.brandingScore, status: result.brandingScore >= 90 ? 'great' : result.brandingScore >= 75 ? 'good' : result.brandingScore >= 60 ? 'ok' : 'bad' },
          mileage: { score: result.mileageScore, status: result.mileageScore >= 90 ? 'great' : result.mileageScore >= 75 ? 'good' : result.mileageScore >= 60 ? 'ok' : 'bad' },
          cleaning: { score: result.cleaningScore, status: result.cleaningScore >= 90 ? 'great' : result.cleaningScore >= 75 ? 'good' : result.cleaningScore >= 60 ? 'ok' : 'bad' },
          geometry: { score: result.geometryScore, status: result.geometryScore >= 90 ? 'great' : result.geometryScore >= 75 ? 'good' : result.geometryScore >= 60 ? 'ok' : 'bad' }
        },
        inductionStatus: result.inductionStatus,
        cleaningSlot: result.cleaningSlot,
        stablingBay: result.stablingBay,
        reason: result.explainability
      }));

      // Save optimization results
      const optimizationResult = new OptimizationResult({
        userId: req.user!._id,
        results: optimizationResults.map(r => r.score),
        totalTrains: optimizationResults.length,
        averageScore: Math.round(pythonResults.summary!.averageScore)
      });

      await optimizationResult.save();

      logger.info(`Google Sheet data imported and processed by user: ${req.user!.email} using Python optimization`);

      res.json({
        success: true,
        message: 'Google Sheet data imported and processed successfully with Python optimization',
        data: {
          uploadId: uploadedData._id,
          totalTrains: processedData.length,
          averageScore: Math.round(pythonResults.summary!.averageScore),
          optimizationResults: optimizationResults.slice(0, 10), // Return first 10 results
          summary: pythonResults.summary
        }
      });

    } catch (pythonError) {
      logger.error('Python optimization failed, falling back to basic optimization:', pythonError);
      
      // Fallback to basic optimization
      const optimizationResults = processedData.map(train => {
        const factors = {
          fitness: train.fitnessCertificate,
          jobCard: train.jobCardStatus,
          branding: train.brandingPriority,
          mileage: train.mileageBalancing,
          cleaning: train.cleaningDetailing,
          geometry: train.stablingGeometry
        };
        return OptimizationEngine.calculateOverallScore(factors, OptimizationEngine['DEFAULT_WEIGHTS']);
      });

      const averageScore = optimizationResults.reduce((sum, result) => sum + result, 0) / optimizationResults.length;

      // Save optimization results
      const optimizationResult = new OptimizationResult({
        userId: req.user!._id,
        results: optimizationResults,
        totalTrains: optimizationResults.length,
        averageScore: Math.round(averageScore)
      });

      await optimizationResult.save();

      logger.info(`Google Sheet data imported and processed by user: ${req.user!.email} using fallback optimization`);

      res.json({
        success: true,
        message: 'Google Sheet data imported and processed successfully (using fallback optimization)',
        data: {
          uploadId: uploadedData._id,
          totalTrains: processedData.length,
          averageScore: Math.round(averageScore),
          optimizationResults: optimizationResults.slice(0, 10) // Return first 10 results
        }
      });
    }

  } catch (error) {
    logger.error('Google Sheet import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing Google Sheet data'
    });
  }
});

// GET /api/upload/health - Check Python optimization service health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await PythonOptimizationService.checkServiceHealth();
    
    res.json({
      success: true,
      pythonService: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'Python optimization service is running' : 'Python optimization service is not available'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      pythonService: 'error',
      message: 'Health check failed'
    });
  }
});

export { router as uploadRoutes };
