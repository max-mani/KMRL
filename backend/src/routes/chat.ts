import express from 'express';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { Train } from '../models/Train';
import { UploadedData } from '../models/UploadedData';
import { FleetOptimization } from '../models/FleetOptimization';

let GoogleGenerativeAI: any;

type ChatMessage = { role: 'user' | 'model'; content: string };

const router = express.Router();

const sessions = new Map<string, { history: ChatMessage[] }>();

function getSession(userId: string) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { history: [] });
  }
  return sessions.get(userId)!;
}

// Data analysis function to provide intelligent responses
async function analyzeKmrlData(message: string): Promise<string | null> {
  const lowerMessage = message.toLowerCase();
  
  try {
    // Check for specific train questions first (higher priority)
    const trainIdMatch = message.match(/(?:train|T)(\d+)/i);
    if (trainIdMatch) {
      const trainId = `T${trainIdMatch[1].padStart(3, '0')}`;
      const train = await Train.findOne({ trainId: trainId }).lean();
      if (train) {
        return `Train ${train.trainId} (${train.name}) is currently ${train.status} at bay ${train.position.bay} in the ${train.position.zone} zone. Overall score: ${train.overallScore}%. Last optimized: ${train.lastOptimized.toLocaleDateString()}.`;
      }
    }
    
    // Check for train status questions
    if (lowerMessage.includes('train') && (lowerMessage.includes('running') || lowerMessage.includes('status') || lowerMessage.includes('today'))) {
      const trains = await Train.find({}).lean();
      const runningTrains = trains.filter(train => train.status === 'running').length;
      const standbyTrains = trains.filter(train => train.status === 'standby').length;
      const maintenanceTrains = trains.filter(train => train.status === 'maintenance').length;
      const inspectionTrains = trains.filter(train => train.status === 'inspection').length;
      
      return `Currently, there are ${runningTrains} trains in service, ${standbyTrains} trains on standby, ${maintenanceTrains} trains under maintenance, and ${inspectionTrains} trains under inspection. Total fleet size: ${trains.length} trains.`;
    }
    
    // Check for optimization questions
    if (lowerMessage.includes('optimization') || lowerMessage.includes('performance') || lowerMessage.includes('score')) {
      const latestOptimization = await FleetOptimization.findOne({}).sort({ date: -1 }).lean();
      if (latestOptimization) {
        const avgScore = latestOptimization.metrics.averageScore;
        const energyEff = latestOptimization.metrics.energyEfficiency;
        const punctuality = latestOptimization.metrics.punctuality;
        
        return `Latest fleet optimization results show an average score of ${avgScore.toFixed(1)}%, energy efficiency of ${energyEff.toFixed(1)}%, and punctuality of ${punctuality.toFixed(1)}%. The system is continuously optimizing train assignments for maximum efficiency.`;
      }
    }
    
    // Check for maintenance questions
    if (lowerMessage.includes('maintenance') || lowerMessage.includes('service') || lowerMessage.includes('repair')) {
      const trains = await Train.find({}).lean();
      const trainsNeedingMaintenance = trains.filter(train => 
        train.jobCardStatus.openWorkOrders > 0 || 
        train.jobCardStatus.criticalIssues.length > 0 ||
        train.overallScore < 70
      );
      
      if (trainsNeedingMaintenance.length > 0) {
        return `There are ${trainsNeedingMaintenance.length} trains that require attention: ${trainsNeedingMaintenance.slice(0, 3).map(t => `${t.trainId} (Score: ${t.overallScore}%)`).join(', ')}${trainsNeedingMaintenance.length > 3 ? ' and others.' : '.'}`;
      } else {
        return `All trains are currently in good condition with no critical maintenance issues reported.`;
      }
    }
    
    // Check for uploaded data questions
    if (lowerMessage.includes('data') || lowerMessage.includes('upload') || lowerMessage.includes('file')) {
      const uploadedData = await UploadedData.find({ status: 'completed' }).sort({ uploadDate: -1 }).limit(5).lean();
      if (uploadedData.length > 0) {
        const totalRecords = uploadedData.reduce((sum, data) => sum + data.processedData.length, 0);
        return `The system has processed ${uploadedData.length} uploaded data files containing ${totalRecords} train records. Latest upload: ${uploadedData[0].fileName} (${uploadedData[0].processedData.length} records).`;
      }
    }
    
    // Check for energy/efficiency questions
    if (lowerMessage.includes('energy') || lowerMessage.includes('efficiency') || lowerMessage.includes('consumption')) {
      const trains = await Train.find({}).lean();
      const avgEnergyUsage = trains.reduce((sum, train) => sum + train.iotSensors.energyUsage.value, 0) / trains.length;
      const energyWarnings = trains.filter(train => train.iotSensors.energyUsage.status === 'warning' || train.iotSensors.energyUsage.status === 'critical').length;
      
      return `Average energy usage across the fleet: ${avgEnergyUsage.toFixed(1)} units. ${energyWarnings > 0 ? `${energyWarnings} trains have energy usage warnings.` : 'All trains are operating within normal energy consumption levels.'}`;
    }
    
    // Check for IoT sensor questions
    if (lowerMessage.includes('sensor') || lowerMessage.includes('monitoring') || lowerMessage.includes('fault')) {
      const trains = await Train.find({}).lean();
      const faultSummary = {
        vibration: trains.filter(t => t.iotSensors.vibration.status !== 'normal').length,
        energy: trains.filter(t => t.iotSensors.energyUsage.status !== 'normal').length,
        doors: trains.filter(t => t.iotSensors.doorFaults.status !== 'normal').length,
        braking: trains.filter(t => t.iotSensors.braking.status !== 'normal').length
      };
      
      const totalFaults = Object.values(faultSummary).reduce((sum, count) => sum + count, 0);
      if (totalFaults > 0) {
        return `IoT monitoring shows ${totalFaults} sensor alerts across the fleet: ${faultSummary.vibration} vibration alerts, ${faultSummary.energy} energy alerts, ${faultSummary.doors} door fault alerts, and ${faultSummary.braking} braking alerts.`;
      } else {
        return `All IoT sensors are reporting normal readings across the entire fleet. No sensor alerts detected.`;
      }
    }
    
    return null; // No specific data match found
  } catch (error) {
    logger.error('Error analyzing KMRL data:', error);
    return null;
  }
}

// Test endpoint to list available models
router.get('/models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }

    if (!GoogleGenerativeAI) {
      GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();
    
    return res.json({ success: true, models: models });
  } catch (error: any) {
    logger.error('Error listing models:', error);
    return res.status(500).json({ success: false, message: 'Failed to list models', error: error?.message || String(error) });
  }
});

router.post('/message', async (req: AuthRequest, res) => {
  try {
    // Optional auth: try to resolve userId; fall back to IP-based session key
    let userId: string | undefined = req.user?._id?.toString();
    if (!userId) {
      const authHeader = req.header('Authorization');
      const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;
      if (token && token.includes('.') && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
          if (decoded?.userId) userId = String(decoded.userId);
        } catch (_) {
          // ignore malformed token; continue anonymously
        }
      }
    }
    if (!userId) {
      userId = `${req.ip || 'anon'}:${(req.headers['user-agent'] as string) || 'ua'}`;
    }
    const { message, context } = req.body as { message?: string; context?: any };
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const session = getSession(userId);

    // First, try to get a data-driven response
    const dataResponse = await analyzeKmrlData(message);
    if (dataResponse) {
      session.history.push({ role: 'user', content: message });
      session.history.push({ role: 'model', content: dataResponse });
      return res.json({ success: true, reply: dataResponse });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chat failed', error: 'GEMINI_API_KEY not configured' });
    }

    if (!GoogleGenerativeAI) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPreamble = context
      ? `You are an assistant for KMRL Fleet Optimization. Use this context when answering:\n${JSON.stringify(context).slice(0, 12000)}`
      : 'You are an assistant for KMRL Fleet Optimization.';

    const historyText = session.history
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = `${systemPreamble}\n\n${historyText ? historyText + '\n' : ''}User: ${message}\nAssistant:`;

    let result: any;
    try {
      result = await model.generateContent(prompt);
    } catch (modelErr: any) {
      logger.error('Gemini generateContent error:', modelErr);
      
      // Check if the question is related to KMRL/Kochi Metro
      const lowerMessage = message.toLowerCase();
      
      // KMRL-related keywords
      const kmrlKeywords = [
        'train', 'trains', 'metro', 'kmrl', 'kochi', 'fleet', 'rail', 'railway', 
        'station', 'stations', 'schedule', 'scheduling', 'maintenance', 'optimization',
        'performance', 'operation', 'operations', 'system', 'monitoring', 'alert',
        'alerts', 'data', 'analytics', 'fleet management', 'train status', 'running',
        'delay', 'delays', 'route', 'routes', 'passenger', 'passengers', 'service'
      ];
      
      // Non-KMRL topics to decline
      const nonKmrlKeywords = [
        'solar', 'panel', 'panels', 'cooking', 'recipe', 'food', 'sports',
        'movie', 'music', 'game', 'shopping', 'hotel', 'restaurant',
        'medical', 'health', 'doctor', 'medicine', 'education', 'school', 'college'
      ];
      
      // Check if message contains KMRL-related keywords
      const isKmrlRelated = kmrlKeywords.some(keyword => lowerMessage.includes(keyword));
      const isNonKmrlTopic = nonKmrlKeywords.some(keyword => lowerMessage.includes(keyword));
      
      let fallbackResponse = '';
      
      if (isNonKmrlTopic && !isKmrlRelated) {
        // Decline non-KMRL topics
        fallbackResponse = 'I\'m sorry, I can only assist with questions related to KMRL (Kochi Metro Rail Limited) operations, fleet management, and metro rail services. Please ask me about train operations, scheduling, maintenance, or other metro rail topics.';
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        fallbackResponse = 'Hello! I\'m your KMRL Fleet Optimization assistant. I can help you with questions about Kochi Metro train operations, fleet management, scheduling, maintenance, and performance analytics. How can I assist you today?';
      } else if (lowerMessage.includes('help')) {
        fallbackResponse = 'I can help you with KMRL (Kochi Metro Rail Limited) topics including:\n• Train operations and scheduling\n• Fleet management and maintenance\n• Performance optimization\n• Data analytics and insights\n• System monitoring and alerts\n• Metro rail services and routes\n\nWhat would you like to know about Kochi Metro?';
      } else if (lowerMessage.includes('status') || lowerMessage.includes('running')) {
        fallbackResponse = 'The KMRL Fleet Optimization system is running normally. All systems are operational and monitoring is active. For specific train status information, please check the real-time dashboard or contact the operations center.';
      } else if (lowerMessage.includes('optimization')) {
        fallbackResponse = 'KMRL Fleet optimization involves analyzing train performance data, scheduling efficiency, and maintenance patterns to improve overall metro rail system performance. This includes route optimization, energy efficiency, and passenger service improvements.';
      } else if (isKmrlRelated) {
        // Generic response for KMRL-related questions
        fallbackResponse = 'Thank you for your question about KMRL operations. I\'m currently experiencing some technical difficulties with the AI service, but I can tell you that our team is working to optimize Kochi Metro services. For immediate assistance, please contact our operations center or check the real-time dashboard for current information.';
      } else {
        // Default response for unclear topics
        fallbackResponse = 'I\'m sorry, I can only assist with questions related to KMRL (Kochi Metro Rail Limited) operations, fleet management, and metro rail services. Please ask me about train operations, scheduling, maintenance, or other metro rail topics.';
      }
      
      const text = fallbackResponse;
      
      session.history.push({ role: 'user', content: message });
      session.history.push({ role: 'model', content: text });
      
      return res.json({ success: true, reply: text });
    }
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(' ') || 'Sorry, I could not generate a response.';

    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'model', content: text });

    return res.json({ success: true, reply: text });
  } catch (error: any) {
    logger.error('Chat error:', error);
    return res.status(500).json({ success: false, message: 'Chat failed', error: error?.message || String(error) });
  }
});

router.post('/reset', async (req: AuthRequest, res) => {
  try {
    let userId: string | undefined = req.user?._id?.toString();
    if (!userId) {
      const authHeader = req.header('Authorization');
      const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;
      if (token && token.includes('.') && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
          if (decoded?.userId) userId = String(decoded.userId);
        } catch (_) {
          // ignore
        }
      }
    }
    if (!userId) {
      userId = `${req.ip || 'anon'}:${(req.headers['user-agent'] as string) || 'ua'}`;
    }
    sessions.delete(userId);
    return res.json({ success: true, message: 'Chat session reset' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to reset chat' });
  }
});

export { router as chatRoutes };


