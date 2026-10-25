import express from 'express';
import { Availability } from '../models/Availability.js';
import { Booking } from '../models/Booking.js';
import { generateDaySlots } from '../utils/slotGenerator.js';
import { publicApiLimiter } from '../middleware/rateLimiter.js';
import { toZonedTime } from 'date-fns-tz';

const router = express.Router();

// GET /api/availability/settings - Public availability configurations
router.get('/settings', publicApiLimiter, async (req, res, next) => {
  try {
    const settings = await Availability.getEffectiveSettings();
    res.json({
      success: true,
      settings: {
        availableDays: settings.availableDays,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        sessionDuration: settings.sessionDuration,
        priceInr: settings.priceInr,
        timeZone: settings.timeZone,
        minimumNoticeHours: settings.minimumNoticeHours,
        maxAdvanceDays: settings.maxAdvanceDays,
        blockedDates: settings.blockedDates,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/availability/slots?date=YYYY-MM-DD - Get available slots for a specific date
router.get('/slots', publicApiLimiter, async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    const settings = await Availability.getEffectiveSettings();

    // Find all bookings for this day that are either confirmed or currently active reservations
    // Start of day in UTC roughly +/- 1 day buffer to catch all timezone overlaps
    const [y, m, d] = date.split('-').map(Number);
    const dayStartUtc = new Date(Date.UTC(y, m - 1, d - 1, 0, 0, 0));
    const dayEndUtc = new Date(Date.UTC(y, m - 1, d + 2, 0, 0, 0));

    const existingBookings = await Booking.find({
      startTime: { $gte: dayStartUtc, $lte: dayEndUtc },
      bookingStatus: { $in: ['confirmed', 'reserved'] },
    }).select('startTime endTime bookingStatus reservationExpiresAt');

    const slots = generateDaySlots(date, settings, existingBookings, new Date());

    res.json({
      success: true,
      date,
      timeZone: settings.timeZone,
      sessionDuration: settings.sessionDuration,
      priceInr: settings.priceInr,
      totalSlots: slots.length,
      slots,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/availability/month?year=2026&month=10 - Overview of dates with available slots
router.get('/month', publicApiLimiter, async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10); // 1 to 12

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month parameters.',
      });
    }

    const settings = await Availability.getEffectiveSettings();
    const daysInMonth = new Date(year, month, 0).getDate();
    const now = new Date();

    const monthDates = [];
    const pad = (n) => String(n).padStart(2, '0');

    // Fetch existing bookings for the whole month
    const startOfMonthUtc = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonthUtc = new Date(Date.UTC(year, month, 1, 23, 59, 59));

    const existingBookings = await Booking.find({
      startTime: { $gte: startOfMonthUtc, $lte: endOfMonthUtc },
      bookingStatus: { $in: ['confirmed', 'reserved'] },
    }).select('startTime endTime bookingStatus reservationExpiresAt');

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const slots = generateDaySlots(dateStr, settings, existingBookings, now);
      monthDates.push({
        date: dateStr,
        hasAvailableSlots: slots.length > 0,
        availableSlotCount: slots.length,
      });
    }

    res.json({
      success: true,
      year,
      month,
      timeZone: settings.timeZone,
      days: monthDates,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
