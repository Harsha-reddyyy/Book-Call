import express from 'express';
import { Booking } from '../models/Booking.js';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpayService.js';
import { createMeetingEvent } from '../services/calendarService.js';
import { sendBookingConfirmation } from '../services/emailService.js';

const router = express.Router();

/**
 * Helper to process fulfillment after payment is verified
 * Creates calendar event & sends confirmation email
 */
async function fulfillBooking(booking) {
  // 1. Google Calendar / Google Meet creation
  if (booking.calendarStatus !== 'created') {
    try {
      const calResult = await createMeetingEvent(booking);
      if (calResult.success) {
        booking.calendarStatus = 'created';
        booking.calendarEventId = calResult.calendarEventId;
        booking.googleMeetUrl = calResult.googleMeetUrl;
        booking.calendarError = null;
      } else {
        booking.calendarStatus = 'failed';
        booking.calendarError = calResult.error || 'Unknown calendar error';
      }
    } catch (err) {
      booking.calendarStatus = 'failed';
      booking.calendarError = err.message;
    }
  }

  // 2. Email confirmation delivery
  if (booking.emailStatus !== 'sent') {
    try {
      const emailResult = await sendBookingConfirmation(booking);
      if (emailResult.success) {
        booking.emailStatus = 'sent';
        booking.emailError = null;
      } else {
        booking.emailStatus = 'failed';
        booking.emailError = emailResult.error || 'Failed to send confirmation email';
      }
    } catch (err) {
      booking.emailStatus = 'failed';
      booking.emailError = err.message;
    }
  }

  await booking.save();
  return booking;
}

// POST /api/payments/verify - Verify payment from browser Checkout modal
router.post('/verify', async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details.',
      });
    }

    const booking = await Booking.findOne({ bookingId: bookingId.toUpperCase() });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking reference not found.',
      });
    }

    // Idempotency: If already confirmed, return success immediately
    if (booking.bookingStatus === 'confirmed') {
      return res.json({
        success: true,
        message: 'Booking is already confirmed.',
        booking: {
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          startTime: booking.startTime,
          endTime: booking.endTime,
          googleMeetUrl: booking.googleMeetUrl,
          bookingStatus: booking.bookingStatus,
        },
      });
    }

    // Verify cryptographic signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Update payment & booking status
    booking.bookingStatus = 'confirmed';
    booking.paymentStatus = 'captured';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.reservationExpiresAt = null; // Clear expiration

    await booking.save();

    // Fulfill calendar and email
    const updatedBooking = await fulfillBooking(booking);

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking: {
        bookingId: updatedBooking.bookingId,
        customerName: updatedBooking.customerName,
        customerEmail: updatedBooking.customerEmail,
        selectedTopic: updatedBooking.selectedTopic,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        timeZone: updatedBooking.timeZone,
        googleMeetUrl: updatedBooking.googleMeetUrl,
        bookingStatus: updatedBooking.bookingStatus,
        paymentStatus: updatedBooking.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook - Razorpay webhook handler
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody; // Captured by express raw parser

    if (!signature || !rawBody) {
      return res.status(400).send('Missing webhook signature or payload');
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Webhook] Invalid signature received.');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    const eventType = event.event;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = event.payload.payment?.entity || event.payload.order?.entity;
      const orderId = paymentEntity.order_id || paymentEntity.id;
      const receipt = paymentEntity.receipt || paymentEntity.notes?.bookingId;

      const booking = await Booking.findOne({
        $or: [{ razorpayOrderId: orderId }, { bookingId: receipt }],
      });

      if (booking) {
        if (booking.bookingStatus !== 'confirmed') {
          booking.bookingStatus = 'confirmed';
          booking.paymentStatus = 'captured';
          booking.razorpayPaymentId = paymentEntity.id || booking.razorpayPaymentId;
          booking.reservationExpiresAt = null;
          await booking.save();

          await fulfillBooking(booking);
          console.log(`[Webhook] Confirmed booking: ${booking.bookingId}`);
        } else {
          console.log(`[Webhook] Booking ${booking.bookingId} already confirmed.`);
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.bookingStatus !== 'confirmed') {
          booking.paymentStatus = 'failed';
          await booking.save();
          console.log(`[Webhook] Marked payment failed for booking: ${booking.bookingId}`);
        }
      }
    }

    // Acknowledge receipt to Razorpay
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(500).send('Webhook processing error');
  }
});

export default router;
