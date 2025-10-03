import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { uploadRoutes } from './routes/upload';
import { optimizationRoutes } from './routes/optimization';
import { alertRoutes } from './routes/alerts';
import { maintenanceRoutes } from './routes/maintenance';
import { digitalTwinRoutes } from './routes/digitalTwin';
import { fleetRoutes } from './routes/fleet';
import { learningRoutes } from './routes/learning';
import { mobileAlertsRoutes } from './routes/mobileAlerts';
import { chatRoutes } from './routes/chat';
import performanceRoutes from './routes/performance';

// Load environment variables
dotenv.config({ path: './.env' });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet());

// CORS configuration with debugging
const isProduction = process.env.NODE_ENV === 'production';

logger.info(`CORS Origin configured for NODE_ENV=${process.env.NODE_ENV} (isProduction=${isProduction})`);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, always allow localhost origins
    if (!isProduction) {
      return callback(null, true);
    }
    
    // In production, check specific origins
    const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || [
      'https://kmrl-fleet-optimization.netlify.app'
    ]).map(o => o.trim());
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// Ensure preflight requests are handled for all routes
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/mobile-alerts', mobileAlertsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/performance', performanceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      logger.error('MONGODB_URI environment variable is required');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    logger.info('MongoDB Atlas connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

export default app;
