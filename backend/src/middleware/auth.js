import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'harsha-call-booking-jwt-secret-key-change-in-production';

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select('-passwordHash');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Admin account not found.',
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: err.message,
    });
  }
};

export const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
