import express from 'express';
import { Policy } from '../models/Policy.js';
import { requireAdmin } from '../middleware/auth.js';
import { publicApiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/policies/:type - Public endpoint to retrieve policy content
router.get('/:type', publicApiLimiter, async (req, res, next) => {
  try {
    const { type } = req.params;
    const validTypes = ['cancellation_refund', 'privacy_policy', 'terms_of_service'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy type requested.',
      });
    }

    const policy = await Policy.getOrCreate(type);
    res.json({
      success: true,
      policy: {
        type: policy.type,
        title: policy.title,
        content: policy.content,
        lastUpdated: policy.lastUpdated,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/policies/:type - Admin endpoint to update policy content
router.put('/:type', requireAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;
    const { title, content } = req.body;

    const validTypes = ['cancellation_refund', 'privacy_policy', 'terms_of_service'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy type.',
      });
    }

    let policy = await Policy.findOne({ type });
    if (!policy) {
      policy = new Policy({ type });
    }

    if (title) policy.title = title;
    if (content !== undefined) policy.content = content;
    policy.lastUpdated = new Date();
    policy.updatedBy = req.admin?.name || 'Admin';

    await policy.save();

    res.json({
      success: true,
      message: 'Policy updated successfully.',
      policy,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
