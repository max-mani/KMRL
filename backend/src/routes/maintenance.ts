import express from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { OptimizationResult } from '../models/OptimizationResult';
import { logger } from '../utils/logger';

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

    // Fallback: derive simple tasks if Gemini unavailable
    if (!Array.isArray(tasksPayload?.tasks) || tasksPayload.tasks.length === 0) {
      const derived = compact.map((i, idx) => {
        // Heuristic task typing
        let type: 'routine' | 'inspection' | 'repair' = 'repair';
        if (i.score >= 70 && i.score < 85) type = 'inspection';
        if (i.score >= 85) type = 'routine';
        const status: 'scheduled' | 'in-progress' | 'overdue' = i.score < 55 ? 'overdue' : (i.score < 70 ? 'in-progress' : 'scheduled');
        const dueDate = status === 'overdue'
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          : status === 'scheduled'
            ? new Date(Date.now() + (idx % 2 === 0 ? 2 : 5) * 24 * 60 * 60 * 1000).toISOString()
            : new Date().toISOString();
        return {
          trainId: i.trainId,
          type,
          status,
          priority: i.score < 50 ? 'high' : (i.score < 70 ? 'medium' : 'low'),
          dueDate,
          estimatedDuration: type === 'routine' ? 90 : type === 'inspection' ? 150 : 240,
          description: type === 'routine'
            ? `Routine preventive maintenance scheduled based on stable score (${i.score}).`
            : type === 'inspection'
              ? `Targeted inspection recommended due to moderate score (${i.score}).`
              : `Prioritize corrective maintenance based on low composite score (${i.score}). Focus on weakest factors.`,
          assignedTo: type === 'routine' ? 'Routine Team' : type === 'inspection' ? 'Inspection Team' : 'Maintenance Team',
          progress: status === 'in-progress' ? 0 : 0,
        };
      });
      const alerts = derived.slice(0, Math.min(5, derived.length)).map((t, i) => ({
        id: String(i + 1),
        trainId: t.trainId,
        type: 'critical',
        message: t.description,
        timestamp: new Date().toISOString(),
        resolved: false,
      }));
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


