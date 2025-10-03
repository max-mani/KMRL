import express from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { ManualOverride } from '../models/ManualOverride'

const router = express.Router()

// GET /api/overrides - fetch current user's overrides
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const doc = await ManualOverride.findOne({ userId: req.user!._id })
    res.json({ success: true, data: { overrides: doc?.overrides || {} } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load overrides' })
  }
})

// PUT /api/overrides - replace overrides map
router.put('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const overrides = (req.body?.overrides || {}) as Record<string, any>
    const doc = await ManualOverride.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: { overrides } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: { overrides: doc.overrides } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save overrides' })
  }
})

// PATCH /api/overrides - update subset of keys
router.patch('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const partial = (req.body?.overrides || {}) as Record<string, any>
    const doc = await ManualOverride.findOne({ userId: req.user!._id })
    const current = doc?.overrides || {}
    const next = { ...current, ...partial }
    const saved = await ManualOverride.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: { overrides: next } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: { overrides: saved.overrides } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update overrides' })
  }
})

// DELETE /api/overrides/:key - delete a specific key
router.delete('/:key', authenticate, async (req: AuthRequest, res) => {
  try {
    const key = req.params.key
    const doc = await ManualOverride.findOne({ userId: req.user!._id })
    const current = doc?.overrides || {}
    if (key in current) delete current[key]
    const saved = await ManualOverride.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: { overrides: current } },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: { overrides: saved.overrides } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete override' })
  }
})

export { router as overridesRoutes }


