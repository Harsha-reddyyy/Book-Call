import express from 'express';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Availability } from '../models/Availability.js';
import { createPaymentOrder } from '../services/razorpayService.js';
import { bookingLimiter, publicApiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Helper to generate readable Booking ID like BK-8F29A
function generateBookingId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'BK-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/bookings/reserve - Validate slot and create temporary reservation + Razorpay order
router.post('/reserve', bookingLimiter, async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      selectedTopic,
      customerQuestions,
      startTime,
      endTime,
    } = req.body;

    // Field validations
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    const validTopics = [
      'AI tools',
      'YouTube',
      'Instagram',
      'Content creation',
      'Video editing',
      'Other',
    ];
    if (!selectedTopic || !validTopics.includes(selectedTopic)) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a valid consultation topic.',
      });
    }
    if (!customerQuestions || !customerQuestions.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please tell me what questions or doubts you want to discuss.',
      });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Start and end time must be specified.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ success: false, message: 'Invalid start or end time range.' });
    }

    const now = new Date();
    const settings = await Availability.getEffectiveSettings();

    // Check minimum advance notice
    const minNoticeTime = new Date(now.getTime() + settings.minimumNoticeHours * 60 * 60 * 1000);
    if (start < minNoticeTime) {
      return res.status(400).json({
        success: false,
        message: `Bookings require at least ${settings.minimumNoticeHours} hours advance notice.`,
      });
    }

    // Check maximum advance notice
    const maxAdvanceTime = new Date(now.getTime() + settings.maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (start > maxAdvanceTime) {
      return res.status(400).json({
        success: false,
        message: `Bookings cannot be scheduled more than ${settings.maxAdvanceDays} days in advance.`,
      });
    }

    // Concurrency check: Ensure no overlapping confirmed or active reserved bookings
    // Slot overlap: (existingStart < newEnd) AND (existingEnd > newStart)
    const conflict = await Booking.findOne({
      $and: [
        { startTime: { $lt: end } },
        { endTime: { $gt: start } },
        {
          $or: [
            { bookingStatus: 'confirmed' },
            {
              bookingStatus: 'reserved',
              reservationExpiresAt: { $gt: now },
            },
          ],
        },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available. Please select another slot.',
      });
    }

    // Generate unique booking ID
    let bookingId;
    let isUnique = false;
    while (!isUnique) {
      bookingId = generateBookingId();
      const existing = await Booking.findOne({ bookingId });
      if (!existing) isUnique = true;
    }

    // 10-minute temporary reservation window
    const reservationExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const amountPaise = settings.priceInr * 100; // e.g. ₹399 = 39900 paise

    // Create Razorpay order
    const orderData = await createPaymentOrder(bookingId, amountPaise, {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      selectedTopic,
    });

    // Create Booking record with 'reserved' status
    const booking = await Booking.create({
      bookingId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      selectedTopic,
      customerQuestions: customerQuestions.trim(),
      startTime: start,
      endTime: end,
      timeZone: settings.timeZone,
      amountPaise,
      currency: 'INR',
      bookingStatus: 'reserved',
      paymentStatus: 'pending',
      reservationExpiresAt,
      razorpayOrderId: orderData.orderId,
    });

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      orderId: orderData.orderId,
      amount: amountPaise,
      currency: 'INR',
      amountDisplay: `₹${settings.priceInr}`,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      isMockPayment: orderData.isMock,
      reservationExpiresAt: reservationExpiresAt.toISOString(),
      customerDetails: {
        name: booking.customerName,
        email: booking.customerEmail,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:bookingId - Public confirmation details
router.get('/:bookingId', publicApiLimiter, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId: bookingId.toUpperCase() });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    res.json({
      success: true,
      booking: {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        selectedTopic: booking.selectedTopic,
        customerQuestions: booking.customerQuestions,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timeZone: booking.timeZone,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        googleMeetUrl: booking.bookingStatus === 'confirmed' ? booking.googleMeetUrl : null,
        createdAt: booking.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
