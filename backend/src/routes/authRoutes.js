import express from 'express';
import { Admin } from '../models/Admin.js';
import { generateToken, requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// POST /api/auth/login - Secure admin login with rate limiting
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() },
      ],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Verify token and get current admin info
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

// POST /api/auth/setup-initial - Protected initial admin creation with ADMIN_SETUP_SECRET
router.post('/setup-initial', async (req, res, next) => {
  try {
    const { setupSecret, username, email, password, name } = req.body;
    const requiredSecret = process.env.ADMIN_SETUP_SECRET;

    if (!requiredSecret || requiredSecret.trim() === '') {
      return res.status(403).json({
        success: false,
        message: 'ADMIN_SETUP_SECRET is not configured on the server.',
      });
    }

    if (setupSecret !== requiredSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret.',
      });
    }

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists. Use the login page or update through the dashboard.',
      });
    }

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    const passwordHash = await Admin.hashPassword(password);
    const newAdmin = await Admin.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || 'Harsha',
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      message: 'Initial administrator account created successfully.',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        name: newAdmin.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
