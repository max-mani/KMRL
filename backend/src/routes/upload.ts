import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadedData, ProcessedTrainData } from '../models/UploadedData';
import { OptimizationResult } from '../models/OptimizationResult';
import { OptimizationEngine } from '../services/optimizationEngine';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

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

    // Save to database
    const uploadedData = new UploadedData({
      userId: req.user!._id,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      originalData: rawData,
      processedData,
      status: 'completed'
    });

    await uploadedData.save();

    // Run optimization
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

    logger.info(`Data uploaded and processed by user: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Data uploaded and processed successfully',
      data: {
        uploadId: uploadedData._id,
        totalTrains: processedData.length,
        averageScore: Math.round(averageScore),
        optimizationResults: optimizationResults.slice(0, 10) // Return first 10 results
      }
    });

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

    // Run optimization
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

    logger.info(`Google Sheet data imported and processed by user: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Google Sheet data imported and processed successfully',
      data: {
        uploadId: uploadedData._id,
        totalTrains: processedData.length,
        averageScore: Math.round(averageScore),
        optimizationResults: optimizationResults.slice(0, 10) // Return first 10 results
      }
    });

  } catch (error) {
    logger.error('Google Sheet import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing Google Sheet data'
    });
  }
});

export { router as uploadRoutes };
