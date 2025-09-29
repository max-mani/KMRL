import express from 'express';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }

    if (!GoogleGenerativeAI) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const session = getSession(userId);

    const systemPreamble = context
      ? `You are an assistant for KMRL Fleet Optimization. Use this context when answering:\n${JSON.stringify(context).slice(0, 12000)}`
      : 'You are an assistant for KMRL Fleet Optimization.';

    const historyText = session.history
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = `${systemPreamble}\n\n${historyText ? historyText + '\n' : ''}User: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
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


