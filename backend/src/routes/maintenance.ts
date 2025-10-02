import express from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { OptimizationResult } from '../models/OptimizationResult';
import { logger } from '../utils/logger';

// Function to generate narrative alerts using Gemini AI
async function generateNarrativeAlerts(repairTasks: any[], routineTasks: any[], compact: any[], apiKey?: string): Promise<any[]> {
  const alerts = [];
  
  if (!apiKey) {
    // Fallback alerts without Gemini
    repairTasks.slice(0, 3).forEach((task, index) => {
      alerts.push({
        id: `alert-${index + 1}`,
        trainId: task.trainId,
        type: 'critical',
        message: `Train ${task.trainId} maintenance in progress. Monitor completion.`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    });
    return alerts;
  }

  try {
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare data for narrative generation
    const alertData = repairTasks.slice(0, 5).map(task => ({
      trainId: task.trainId,
      type: task.type,
      status: task.status,
      priority: task.priority,
      description: task.description,
      score: compact.find(c => c.trainId === task.trainId)?.score || 0
    }));

    const prompt = `
You are a railway maintenance coordinator for Kochi Metro Rail Limited (KMRL). 
Generate detailed narrative explanations for active maintenance alerts based on the following data:

MAINTENANCE TASKS:
${alertData.map(task => 
  `- Train ${task.trainId}: ${task.type} maintenance, status: ${task.status}, priority: ${task.priority}, score: ${task.score}%, description: ${task.description}`
).join('\n')}

Generate 3-5 critical alerts with detailed narrative explanations that:
1. Explain why each train requires maintenance
2. Describe the specific issues and their impact
3. Provide context about the maintenance progress
4. Include recommendations for monitoring

Return JSON format:
{
  "alerts": [
    {
      "id": "string",
      "trainId": "string", 
      "type": "critical|warning|info",
      "message": "Detailed narrative explanation",
      "timestamp": "ISO8601 string",
      "resolved": false
    }
  ]
}

Focus on trains with the lowest scores and highest priority. Make the narratives informative and actionable.
`;

    const response = await model.generateContent(prompt);
    const text = response?.response?.text?.() || response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (text) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        const parsed = JSON.parse(jsonText);
        
        if (parsed.alerts && Array.isArray(parsed.alerts)) {
          return parsed.alerts;
        }
      } catch (e) {
        logger.warn('Failed to parse Gemini response for alerts, using fallback');
      }
    }
  } catch (error) {
    logger.warn('Gemini alert generation failed, using fallback', error);
  }

  // Fallback alerts
  return repairTasks.slice(0, 3).map((task, index) => ({
    id: `alert-${index + 1}`,
    trainId: task.trainId,
    type: 'critical',
    message: `Train ${task.trainId} maintenance in progress. Monitor completion.`,
    timestamp: new Date().toISOString(),
    resolved: false
  }));
}

const router = express.Router();

// POST /api/maintenance/predict
// Uses Gemini (if configured) to generate structured maintenance tasks from uploaded optimization results
router.post('/predict', authenticate, async (req: AuthRequest, res) => {
  try {
    const bodyResults = Array.isArray(req.body?.results) ? req.body.results : undefined;

    let results: any[] = [];
    if (bodyResults && bodyResults.length) {
      results = bodyResults;
    } else {
      // fallback: load today's results for this user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayResult = await OptimizationResult.findOne({
        userId: req.user!._id,
        date: { $gte: today, $lt: tomorrow }
      }).sort({ createdAt: -1 }).lean();
      if (!todayResult) {
        return res.status(404).json({ success: false, message: 'No optimization data found to predict maintenance' });
      }
      results = (todayResult as any).results || [];
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    let GoogleGenerativeAI: any = null;
    if (apiKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      } catch (e) {
        GoogleGenerativeAI = null;
      }
    }

    // Narrow down to maintenance candidates (or lowest scores) to keep prompt compact
    const maintenanceCandidates = results.filter((r: any) => (String(r.inductionStatus || '').toLowerCase() === 'maintenance'))
      .slice(0, 25);
    const fallbackCandidates = maintenanceCandidates.length ? maintenanceCandidates : [...results]
      .sort((a: any, b: any) => Number(a.score || 0) - Number(b.score || 0))
      .slice(0, 25);

    const compact = fallbackCandidates.map((r: any) => ({
      trainId: r.trainId,
      score: Number(r.score) || 0,
      inductionStatus: r.inductionStatus || 'maintenance',
      factors: {
        fitness: Number((r.factors?.fitness as any)?.score ?? r.factors?.fitness ?? 0),
        jobCard: Number((r.factors?.jobCard as any)?.score ?? r.factors?.jobCard ?? 0),
        branding: Number((r.factors?.branding as any)?.score ?? r.factors?.branding ?? 0),
        mileage: Number((r.factors?.mileage as any)?.score ?? r.factors?.mileage ?? 0),
        cleaning: Number((r.factors?.cleaning as any)?.score ?? r.factors?.cleaning ?? 0),
        geometry: Number((r.factors?.geometry as any)?.score ?? r.factors?.geometry ?? 0),
      }
    }));

    const buildPrompt = (items: any[]) => {
      const lines = items.map(i => (
        `- ${i.trainId}: score=${i.score}, status=${String(i.inductionStatus||'').toLowerCase()}, ` +
        `fitness=${i.factors.fitness}, jobCard=${i.factors.jobCard}, branding=${i.factors.branding}, ` +
        `mileage=${i.factors.mileage}, cleaning=${i.factors.cleaning}, geometry=${i.factors.geometry}`
      ));
      return [
        'You are a railway maintenance planner for Kochi Metro (KMRL).',
        'Given per-train optimization scores across six factors, propose a concise, prioritized maintenance plan.',
        'Return STRICT JSON with the schema:',
        '{ "tasks": [ { "trainId": string, "type": "routine"|"inspection"|"repair", "status": "scheduled"|"in-progress"|"completed"|"overdue", "priority": "high"|"medium"|"low", "dueDate": ISO8601 string, "estimatedDuration": number (minutes), "description": string, "assignedTo": string, "progress": number (0-100) } ], "alerts": [ { "id": string, "trainId": string, "type": "critical"|"warning"|"info", "message": string, "timestamp": ISO8601 string, "resolved": boolean } ] }',
        'Focus on trains with low scores or maintenance status. Include 3-5 critical alerts.',
        'Now analyze these trains:\n' + lines.join('\n'),
        'Only output JSON. No commentary.'
      ].join('\n\n');
    };

    let tasksPayload: any = { tasks: [], alerts: [] };

    if (apiKey && GoogleGenerativeAI) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = buildPrompt(compact);
        const resp = await model.generateContent(prompt);
        const text = resp?.response?.text?.() || resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          // Extract JSON safely
          const jsonText = (() => {
            try {
              // Attempt direct parse
              JSON.parse(text);
              return text;
            } catch {
              const match = text.match(/\{[\s\S]*\}$/);
              return match ? match[0] : '{}';
            }
          })();
          const parsed = JSON.parse(jsonText);
          if (parsed && typeof parsed === 'object') {
            tasksPayload = parsed;
          }
        }
      } catch (e) {
        logger.warn('Gemini maintenance prediction failed, falling back', e as any);
      }
    }

    // Fallback: derive comprehensive tasks if Gemini unavailable
    if (!Array.isArray(tasksPayload?.tasks) || tasksPayload.tasks.length === 0) {
      const derived = [];
      
      // Generate comprehensive routine maintenance tasks for all trains
      const routineTasks = [];
      
      // Generate daily routine tasks for all trains
      compact.forEach((i, idx) => {
        // Daily routine tasks
        routineTasks.push({
          trainId: i.trainId,
          type: 'routine',
          status: 'scheduled',
          priority: 'low',
          dueDate: new Date(Date.now() + (idx % 7 + 1) * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 90,
          description: `Daily routine maintenance for Train ${i.trainId}. Includes exterior cleaning, interior sanitization, and basic system checks.`,
          assignedTo: 'Daily Maintenance Team',
          progress: 0,
        });
        
        // Weekly routine tasks for high-scoring trains
        if (i.score >= 80) {
          routineTasks.push({
            trainId: i.trainId,
            type: 'routine',
            status: 'scheduled',
            priority: 'low',
            dueDate: new Date(Date.now() + (idx % 14 + 7) * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 180,
            description: `Weekly comprehensive maintenance for Train ${i.trainId}. Includes detailed cleaning, lubrication, and preventive checks.`,
            assignedTo: 'Weekly Maintenance Team',
            progress: 0,
          });
        }
        
        // Monthly routine tasks
        routineTasks.push({
          trainId: i.trainId,
          type: 'routine',
          status: 'scheduled',
          priority: 'medium',
          dueDate: new Date(Date.now() + (idx % 30 + 15) * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 240,
          description: `Monthly deep maintenance for Train ${i.trainId}. Includes comprehensive cleaning, system calibration, and preventive maintenance.`,
          assignedTo: 'Monthly Maintenance Team',
          progress: 0,
        });
      });
      
      // Generate additional routine tasks for specific maintenance types
      const additionalRoutineTasks = [
        {
          trainId: 'System',
          type: 'routine',
          status: 'scheduled',
          priority: 'low',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 60,
          description: 'Routine yard cleaning and maintenance equipment inspection.',
          assignedTo: 'Yard Maintenance Team',
          progress: 0,
        },
        {
          trainId: 'System',
          type: 'routine',
          status: 'scheduled',
          priority: 'low',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 120,
          description: 'Routine track and platform maintenance inspection.',
          assignedTo: 'Infrastructure Team',
          progress: 0,
        },
        {
          trainId: 'System',
          type: 'routine',
          status: 'scheduled',
          priority: 'medium',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 300,
          description: 'Routine safety system inspection and testing.',
          assignedTo: 'Safety Team',
          progress: 0,
        }
      ];
      
      routineTasks.push(...additionalRoutineTasks);

      // Generate inspection tasks for medium-scoring trains
      const inspectionTasks = compact
        .filter(i => i.score >= 60 && i.score < 80)
        .map((i, idx) => {
          const type: 'routine' | 'inspection' | 'repair' = 'inspection';
          const status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' = 'scheduled';
          const dueDate = new Date(Date.now() + (idx % 5 + 1) * 24 * 60 * 60 * 1000).toISOString();
          
          return {
            trainId: i.trainId,
            type,
            status,
            priority: 'medium',
            dueDate,
            estimatedDuration: 180,
            description: `Detailed inspection for Train ${i.trainId}. Check fitness certificates, job card status, and system components.`,
            assignedTo: 'Inspection Team',
            progress: 0,
          };
        });

      // Generate repair tasks for low-scoring trains
      const repairTasks = compact
        .filter(i => i.score < 60)
        .map((i, idx) => {
          const type: 'routine' | 'inspection' | 'repair' = 'repair';
          const status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' = i.score < 40 ? 'overdue' : 'in-progress';
        const dueDate = status === 'overdue'
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + (idx % 3 + 1) * 24 * 60 * 60 * 1000).toISOString();
          
        return {
          trainId: i.trainId,
          type,
          status,
            priority: i.score < 40 ? 'high' : 'medium',
          dueDate,
            estimatedDuration: 300,
            description: `Corrective maintenance for Train ${i.trainId}. Address critical issues affecting performance score (${i.score}%).`,
            assignedTo: 'Repair Team',
            progress: status === 'in-progress' ? Math.floor(Math.random() * 50) : 0,
        };
      });

      // Combine all tasks
      derived.push(...routineTasks, ...inspectionTasks, ...repairTasks);

      // Generate alerts with narrative explanations using Gemini AI
      const alerts = await generateNarrativeAlerts(repairTasks, routineTasks, compact, apiKey);

      tasksPayload = { tasks: derived, alerts };
    }

    // Normalize output
    const tasks = (tasksPayload.tasks || []).map((t: any, idx: number) => ({
      id: String(idx + 1),
      trainId: String(t.trainId || ''),
      type: (t.type || 'repair'),
      status: (t.status || 'in-progress'),
      priority: (t.priority || 'high'),
      dueDate: t.dueDate || new Date().toISOString(),
      estimatedDuration: Number(t.estimatedDuration) || 240,
      description: String(t.description || 'Scheduled maintenance task'),
      assignedTo: t.assignedTo || 'Maintenance Team',
      progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
    }));
    const alerts = (tasksPayload.alerts || []).map((a: any, i: number) => ({
      id: String(a.id || i + 1),
      trainId: String(a.trainId || tasks[i]?.trainId || ''),
      type: (a.type || 'critical'),
      message: String(a.message || 'Critical maintenance required'),
      timestamp: a.timestamp || new Date().toISOString(),
      resolved: Boolean(a.resolved === true ? true : false),
    }));

    // Ensure status distribution includes some overdue and scheduled if missing
    try {
      const trainIdToScore = new Map<string, number>(compact.map((i) => [String(i.trainId), Number(i.score) || 0]));
      const counts = (arr: any[]) => ({
        overdue: arr.filter((x) => x.status === 'overdue').length,
        inProgress: arr.filter((x) => x.status === 'in-progress').length,
        scheduled: arr.filter((x) => x.status === 'scheduled').length,
      });
      const current = counts(tasks);
      if (tasks.length > 0 && (current.overdue === 0 || current.scheduled === 0)) {
        const sorted = tasks
          .map((t) => ({
            task: t,
            score: trainIdToScore.get(String(t.trainId)) ?? 100,
          }))
          .sort((a, b) => (a.score - b.score));

        const total = sorted.length;
        const overdueCount = Math.max(1, Math.floor(total * 0.2));
        const scheduledCount = Math.max(1, Math.floor(total * 0.3));

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        // Assign lowest scores to overdue
        for (let i = 0; i < overdueCount && i < total; i++) {
          const t = sorted[i].task;
          t.status = 'overdue';
          t.dueDate = new Date(yesterday).toISOString();
          t.priority = 'high';
        }

        // Assign next chunk to in-progress
        for (let i = overdueCount; i < Math.min(overdueCount + Math.max(1, Math.floor(total * 0.3)), total); i++) {
          const t = sorted[i].task;
          t.status = 'in-progress';
          if (!t.dueDate) t.dueDate = now.toISOString();
        }

        // Assign next chunk to scheduled
        for (let i = overdueCount + Math.max(1, Math.floor(total * 0.3)); i < Math.min(overdueCount + Math.max(1, Math.floor(total * 0.3)) + scheduledCount, total); i++) {
          const t = sorted[i].task;
          t.status = 'scheduled';
          t.dueDate = new Date(i % 2 === 0 ? inTwoDays : inFiveDays).toISOString();
          if (t.priority === 'high') t.priority = 'medium';
        }
      }
    } catch (_) {
      // best-effort; ignore rebalancing errors
    }

    return res.json({ success: true, data: { tasks, alerts } });
  } catch (error) {
    logger.error('Maintenance prediction error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export { router as maintenanceRoutes };