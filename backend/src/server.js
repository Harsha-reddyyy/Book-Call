import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { ensureDefaultAdminAndData } from './utils/seedAdmin.js';
import { Booking } from './models/Booking.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import policyRoutes from './routes/policyRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Allow all during dev/demo
    },
    credentials: true,
  })
);

// Express JSON middleware with rawBody capture for Razorpay webhook verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Harsha Consultation Booking API',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/policies', policyRoutes);

// Expired Reservation Cleaner: Runs every 2 minutes
setInterval(async () => {
  try {
    const now = new Date();
    const expiredCount = await Booking.updateMany(
      {
        bookingStatus: 'reserved',
        reservationExpiresAt: { $lt: now },
      },
      {
        bookingStatus: 'expired',
      }
    );
    if (expiredCount.modifiedCount > 0) {
      console.log(`[Cleaner] Released ${expiredCount.modifiedCount} expired slot reservation(s).`);
    }
  } catch (err) {
    console.error('[Cleaner Error]', err.message);
  }
}, 2 * 60 * 1000);

// Global Error Handler
app.use(errorHandler);

// Start Server
export async function startServer() {
  try {
    await connectDB();
    await ensureDefaultAdminAndData();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`⚡ Harsha Booking Backend running on port ${PORT}`);
      console.log(`📍 API Base: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });

    return { app, server };
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Automatically start when executed directly
if (process.argv[1]?.endsWith('server.js')) {
  startServer();
}

export default app;
