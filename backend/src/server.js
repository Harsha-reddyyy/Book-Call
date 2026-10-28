import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
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
  const rzpKey = process.env.RAZORPAY_KEY_ID?.trim();
  const rzpSec = process.env.RAZORPAY_KEY_SECRET?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  res.json({
    status: 'ok',
    service: 'Harsha Consultation Booking API',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    razorpay: {
      configured: Boolean(rzpKey && rzpSec),
      keyIdPrefix: rzpKey ? `${rzpKey.substring(0, 12)}...` : 'missing',
      secretLength: rzpSec ? rzpSec.length : 0,
    },
    email: {
      provider: process.env.BREVO_API_KEY ? 'brevo_api' : process.env.GMAIL_USER ? 'gmail_smtp' : resendKey ? 'resend' : 'mock',
      configured: Boolean(process.env.BREVO_API_KEY || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || (resendKey && !resendKey.includes('placeholder'))),
      brevoSender: process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || undefined,
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    },
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

// Serve static frontend assets in unified deployment mode if dist exists
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start Server
export async function startServer() {
  try {
    await connectDB();
    await ensureDefaultAdminAndData();

    const server = await new Promise((resolve, reject) => {
      const s = app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`⚡ Harsha Booking Backend running on port ${PORT}`);
        console.log(`📍 API Base: http://localhost:${PORT}/api`);
        console.log(`===============================================`);
        resolve(s);
      });

      s.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`\n❌ [Server Error] Port ${PORT} is already in use by another running process.`);
          console.error(`💡 Tip: Close the other terminal running the server, or kill the process using 'lsof -ti :${PORT} | xargs kill -9'\n`);
        } else {
          console.error('[Server Error]', err.message);
        }
        reject(err);
      });
    });

    return { app, server };
  } catch (err) {
    process.exit(1);
  }
}

// Automatically start when executed directly
if (process.argv[1]?.endsWith('server.js')) {
  startServer();
}

export default app;
