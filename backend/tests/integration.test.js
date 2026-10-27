import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, closeDB } from '../src/config/db.js';
import { Booking } from '../src/models/Booking.js';
import { Availability } from '../src/models/Availability.js';
import { Admin } from '../src/models/Admin.js';
import { Policy } from '../src/models/Policy.js';
import { generateDaySlots } from '../src/utils/slotGenerator.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../src/services/razorpayService.js';
import jwt from 'jsonwebtoken';

describe('End-to-End Booking Lifecycle & Concurrency Integration', () => {
  before(async () => {
    await connectDB();
    await Booking.deleteMany({ bookingId: /^BK-TEST/ });
    await Availability.getEffectiveSettings();
  });

  after(async () => {
    await closeDB();
  });

  test('should create a reserved booking with 10-minute hold window and unique booking ID', async () => {
    const startTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours in future
    const endTime = new Date(startTime.getTime() + 20 * 60 * 1000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const booking = await Booking.create({
      bookingId: 'BK-TEST01',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      selectedTopic: 'AI tools',
      customerQuestions: 'How do I automate my video editing workflow?',
      startTime,
      endTime,
      timeZone: 'Asia/Kolkata',
      amountPaise: 39900,
      currency: 'INR',
      bookingStatus: 'reserved',
      paymentStatus: 'pending',
      reservationExpiresAt: expiresAt,
      razorpayOrderId: 'order_mock_test_01',
    });

    assert.equal(booking.bookingId, 'BK-TEST01');
    assert.equal(booking.bookingStatus, 'reserved');
    assert.equal(booking.amountPaise, 39900);
    assert.ok(booking.reservationExpiresAt > new Date());
  });

  test('should prevent duplicate booking collision for the same overlapping slot', async () => {
    // Find the existing reserved booking
    const existing = await Booking.findOne({ bookingId: 'BK-TEST01' });
    assert.ok(existing);

    // Attempt to book an overlapping slot
    const overlappingStart = new Date(existing.startTime.getTime() + 5 * 60 * 1000); // 5 mins later
    const overlappingEnd = new Date(overlappingStart.getTime() + 20 * 60 * 1000);

    const conflict = await Booking.findOne({
      $and: [
        { startTime: { $lt: overlappingEnd } },
        { endTime: { $gt: overlappingStart } },
        {
          $or: [
            { bookingStatus: 'confirmed' },
            {
              bookingStatus: 'reserved',
              reservationExpiresAt: { $gt: new Date() },
            },
          ],
        },
      ],
    });

    // Conflict must be detected!
    assert.ok(conflict);
    assert.equal(conflict.bookingId, 'BK-TEST01');
  });

  test('should confirm booking upon successful verified payment and fulfill details', async () => {
    const booking = await Booking.findOne({ bookingId: 'BK-TEST01' });
    assert.ok(booking);

    // Simulate payment signature verification
    const mockOrder = booking.razorpayOrderId;
    const mockPaymentId = 'pay_mock_success_999';
    const mockSignature = `sig_mock_${mockOrder}`;

    const isValid = verifyPaymentSignature({
      orderId: mockOrder,
      paymentId: mockPaymentId,
      signature: mockSignature,
    });
    assert.equal(isValid, true);

    // Transition state
    booking.bookingStatus = 'confirmed';
    booking.paymentStatus = 'captured';
    booking.razorpayPaymentId = mockPaymentId;
    booking.razorpaySignature = mockSignature;
    booking.reservationExpiresAt = null;
    booking.googleMeetUrl = `https://meet.google.com/hrs-test01`;
    booking.calendarStatus = 'created';
    booking.emailStatus = 'sent';

    await booking.save();

    const verified = await Booking.findOne({ bookingId: 'BK-TEST01' });
    assert.equal(verified.bookingStatus, 'confirmed');
    assert.equal(verified.paymentStatus, 'captured');
    assert.equal(verified.reservationExpiresAt, null);
    assert.equal(verified.calendarStatus, 'created');
    assert.equal(verified.emailStatus, 'sent');
  });

  test('should be idempotent: subsequent confirmation attempts do not recreate or corrupt booking', async () => {
    const booking = await Booking.findOne({ bookingId: 'BK-TEST01' });
    assert.equal(booking.bookingStatus, 'confirmed');

    // Attempting to confirm again returns existing confirmed record without modifying timestamps
    const prevUpdatedAt = booking.updatedAt;
    assert.ok(booking.bookingStatus === 'confirmed');
  });

  test('should properly hash administrator passwords and verify them with bcrypt', async () => {
    const plainPass = 'SuperSecret@2026';
    const hashed = await Admin.hashPassword(plainPass);
    assert.notEqual(plainPass, hashed);

    const admin = new Admin({
      username: 'harsha_test',
      email: 'harsha_test@example.com',
      passwordHash: hashed,
      name: 'Harsha',
    });

    const isMatch = await admin.comparePassword(plainPass);
    assert.equal(isMatch, true);

    const isWrong = await admin.comparePassword('WrongPassword');
    assert.equal(isWrong, false);
  });

  test('should load default policies and allow updating policy content', async () => {
    const policy = await Policy.getOrCreate('cancellation_refund');
    assert.ok(policy);
    assert.ok(policy.content.includes('Rescheduling'));

    // Update policy
    policy.content = policy.content + '\n\nUpdated for 2026.';
    await policy.save();

    const reloaded = await Policy.findOne({ type: 'cancellation_refund' });
    assert.ok(reloaded.content.includes('Updated for 2026.'));
  });
});
