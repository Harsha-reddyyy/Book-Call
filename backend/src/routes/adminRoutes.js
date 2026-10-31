import express from 'express';
import { Booking } from '../models/Booking.js';
import { Availability } from '../models/Availability.js';
import { requireAdmin } from '../middleware/auth.js';
import { createMeetingEvent } from '../services/calendarService.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import { formatInTimeZone } from 'date-fns-tz';

const router = express.Router();

// All routes in this file require admin authentication
router.use(requireAdmin);

// GET /api/admin/bookings - Fetch bookings with filters & search
router.get('/bookings', async (req, res, next) => {
  try {
    const {
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'startTime',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    // Search by name, email, or bookingId
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { bookingId: searchRegex },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/bookings/:id - Single booking details
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bookings/:id/status - Update booking status, rescheduled date/time, phone, or notes
router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const {
      bookingStatus,
      adminNotes,
      cancellationReason,
      startTime,
      endTime,
      customerPhone,
      selectedTopic,
    } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (bookingStatus) {
      booking.bookingStatus = bookingStatus;
    }
    if (adminNotes !== undefined) {
      booking.adminNotes = adminNotes;
    }
    if (cancellationReason !== undefined) {
      booking.cancellationReason = cancellationReason;
    }
    if (customerPhone !== undefined) {
      booking.customerPhone = customerPhone.trim();
    }
    if (selectedTopic !== undefined) {
      booking.selectedTopic = selectedTopic;
    }
    if (startTime) {
      const newStart = new Date(startTime);
      if (!isNaN(newStart.getTime())) {
        booking.startTime = newStart;
        if (endTime) {
          booking.endTime = new Date(endTime);
        } else {
          booking.endTime = new Date(newStart.getTime() + 30 * 60 * 1000);
        }
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully.',
      booking,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bookings/cleanup - Clean up / bulk delete customer bookings
router.delete('/bookings/cleanup', async (req, res, next) => {
  try {
    const { scope } = req.query; // 'cancelled_expired' | 'completed' | 'all'
    let filter = {};

    if (scope === 'cancelled_expired') {
      filter = { bookingStatus: { $in: ['cancelled', 'expired'] } };
    } else if (scope === 'completed') {
      filter = { bookingStatus: 'completed' };
    } else if (scope === 'all') {
      filter = {};
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid cleanup scope. Must be "cancelled_expired", "completed", or "all".',
      });
    }

    const result = await Booking.deleteMany(filter);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} booking record(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bookings/:id - Delete a single customer booking
router.delete('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Booking ${booking.bookingId} deleted successfully.`,
      deletedId: req.params.id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/bookings/:id/retry-calendar - Retry Google Calendar / Meet creation
router.post('/bookings/:id/retry-calendar', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const calResult = await createMeetingEvent(booking);
    if (calResult.success) {
      booking.calendarStatus = 'created';
      booking.calendarEventId = calResult.calendarEventId;
      booking.googleMeetUrl = calResult.googleMeetUrl;
      booking.calendarError = null;
    } else {
      booking.calendarStatus = 'failed';
      booking.calendarError = calResult.error;
    }

    await booking.save();

    res.json({
      success: calResult.success,
      message: calResult.success
        ? 'Google Calendar event & Meet link generated successfully.'
        : `Calendar generation failed: ${calResult.error}`,
      booking,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/bookings/:id/retry-email - Retry confirmation email
router.post('/bookings/:id/retry-email', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const emailResult = await sendBookingConfirmation(booking);
    if (emailResult.success) {
      booking.emailStatus = 'sent';
      booking.emailError = null;
    } else {
      booking.emailStatus = 'failed';
      booking.emailError = emailResult.error;
    }

    await booking.save();

    res.json({
      success: emailResult.success,
      message: emailResult.success
        ? 'Confirmation email sent successfully.'
        : `Email delivery failed: ${emailResult.error}`,
      booking,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/availability - Get full availability settings
router.get('/availability', async (req, res, next) => {
  try {
    const settings = await Availability.getEffectiveSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/availability - Update availability settings
router.put('/availability', async (req, res, next) => {
  try {
    const {
      availableDays,
      workingHoursStart,
      workingHoursEnd,
      sessionDuration,
      bufferTime,
      breaks,
      blockedDates,
      minimumNoticeHours,
      maxAdvanceDays,
      priceInr,
      originalPriceInr,
    } = req.body;

    let settings = await Availability.findOne();
    if (!settings) {
      settings = new Availability();
    }

    if (availableDays !== undefined) settings.availableDays = availableDays;
    if (workingHoursStart !== undefined) settings.workingHoursStart = workingHoursStart;
    if (workingHoursEnd !== undefined) settings.workingHoursEnd = workingHoursEnd;
    if (sessionDuration !== undefined) settings.sessionDuration = sessionDuration;
    if (bufferTime !== undefined) settings.bufferTime = bufferTime;
    if (breaks !== undefined) settings.breaks = breaks;
    if (blockedDates !== undefined) settings.blockedDates = blockedDates;
    if (minimumNoticeHours !== undefined) settings.minimumNoticeHours = minimumNoticeHours;
    if (maxAdvanceDays !== undefined) settings.maxAdvanceDays = maxAdvanceDays;
    if (priceInr !== undefined) settings.priceInr = priceInr;
    if (originalPriceInr !== undefined) settings.originalPriceInr = originalPriceInr;

    await settings.save();

    res.json({
      success: true,
      message: 'Availability settings updated successfully.',
      settings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export-csv - Export bookings to CSV format
router.get('/export-csv', async (req, res, next) => {
  try {
    const bookings = await Booking.find({}).sort({ startTime: -1 });

    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Email',
      'Topic',
      'Questions',
      'Start Time (IST)',
      'End Time (IST)',
      'Status',
      'Payment Status',
      'Amount (₹)',
      'Google Meet URL',
      'Order ID',
      'Payment ID',
      'Created At',
    ];

    const rows = bookings.map((b) => {
      const timeZone = b.timeZone || 'Asia/Kolkata';
      const startFormatted = formatInTimeZone(new Date(b.startTime), timeZone, 'yyyy-MM-dd hh:mm a');
      const endFormatted = formatInTimeZone(new Date(b.endTime), timeZone, 'yyyy-MM-dd hh:mm a');

      const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

      return [
        escape(b.bookingId),
        escape(b.customerName),
        escape(b.customerEmail),
        escape(b.selectedTopic),
        escape(b.customerQuestions),
        escape(startFormatted),
        escape(endFormatted),
        escape(b.bookingStatus),
        escape(b.paymentStatus),
        escape((b.amountPaise / 100).toFixed(2)),
        escape(b.googleMeetUrl),
        escape(b.razorpayOrderId),
        escape(b.razorpayPaymentId),
        escape(b.createdAt.toISOString()),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="harsha-consultations-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

export default router;
