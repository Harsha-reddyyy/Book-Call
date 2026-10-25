import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateDaySlots } from '../src/utils/slotGenerator.js';
import { verifyPaymentSignature } from '../src/services/razorpayService.js';

describe('Slot Generation & Availability Engine', () => {
  const dummySettings = {
    availableDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    workingHoursStart: '10:00',
    workingHoursEnd: '12:00',
    sessionDuration: 20,
    bufferTime: 10,
    breaks: [],
    blockedDates: ['2026-11-01'],
    minimumNoticeHours: 0,
    timeZone: 'Asia/Kolkata',
  };

  test('should generate expected number of slots for a normal working day', () => {
    // 10:00 to 12:00 = 120 minutes
    // Each call = 20 min + 10 min buffer = 30 min stride
    // 10:00, 10:30, 11:00, 11:30 -> 4 slots
    // 2026-10-27 is a Tuesday (day 2)
    const fixedNow = new Date('2026-10-26T00:00:00Z');
    const slots = generateDaySlots('2026-10-27', dummySettings, [], fixedNow);

    assert.equal(slots.length, 4);
    assert.equal(slots[0].formattedTime, '10:00 AM');
    assert.equal(slots[1].formattedTime, '10:30 AM');
    assert.equal(slots[2].formattedTime, '11:00 AM');
    assert.equal(slots[3].formattedTime, '11:30 AM');
  });

  test('should exclude explicitly blocked dates', () => {
    const fixedNow = new Date('2026-10-26T00:00:00Z');
    const slots = generateDaySlots('2026-11-01', dummySettings, [], fixedNow);
    assert.equal(slots.length, 0);
  });

  test('should exclude days not in availableDays (e.g. Sunday)', () => {
    // 2026-11-08 is a Sunday (day 0)
    const fixedNow = new Date('2026-10-26T00:00:00Z');
    const slots = generateDaySlots('2026-11-08', dummySettings, [], fixedNow);
    assert.equal(slots.length, 0);
  });

  test('should avoid slots that overlap with an existing confirmed booking', () => {
    const fixedNow = new Date('2026-10-26T00:00:00Z');
    // Pre-calculate what 10:00 AM IST is in UTC
    // 10:00 AM IST is 04:30 AM UTC
    const existingConfirmed = [
      {
        startTime: new Date('2026-10-27T04:30:00.000Z'), // 10:00 AM IST
        endTime: new Date('2026-10-27T04:50:00.000Z'),   // 10:20 AM IST
        bookingStatus: 'confirmed',
      },
    ];

    const slots = generateDaySlots('2026-10-27', dummySettings, existingConfirmed, fixedNow);

    // First slot (10:00 AM) must be filtered out
    assert.equal(slots.length, 3);
    assert.equal(slots[0].formattedTime, '10:30 AM');
  });

  test('should avoid slots with active (unexpired) reservation', () => {
    const fixedNow = new Date('2026-10-26T00:00:00Z');
    const activeReservation = [
      {
        startTime: new Date('2026-10-27T05:00:00.000Z'), // 10:30 AM IST
        endTime: new Date('2026-10-27T05:20:00.000Z'),
        bookingStatus: 'reserved',
        reservationExpiresAt: new Date('2026-10-26T01:00:00Z'), // expires in future relative to fixedNow
      },
    ];

    const slots = generateDaySlots('2026-10-27', dummySettings, activeReservation, fixedNow);
    assert.equal(slots.length, 3);
    assert.ok(!slots.some((s) => s.formattedTime === '10:30 AM'));
  });

  test('should NOT block slots if reservation has already expired', () => {
    const fixedNow = new Date('2026-10-26T05:00:00Z');
    const expiredReservation = [
      {
        startTime: new Date('2026-10-27T05:00:00.000Z'),
        endTime: new Date('2026-10-27T05:20:00.000Z'),
        bookingStatus: 'reserved',
        reservationExpiresAt: new Date('2026-10-26T04:00:00Z'), // in past
      },
    ];

    const slots = generateDaySlots('2026-10-27', dummySettings, expiredReservation, fixedNow);
    // 10:30 AM slot must be available because reservation expired!
    assert.equal(slots.length, 4);
    assert.ok(slots.some((s) => s.formattedTime === '10:30 AM'));
  });
});

describe('Razorpay Signature Verification', () => {
  test('should verify mock signatures in development mode correctly', () => {
    const mockOrder = 'order_mock_12345';
    const mockSig = `sig_mock_${mockOrder}`;
    const result = verifyPaymentSignature({
      orderId: mockOrder,
      paymentId: 'pay_12345',
      signature: mockSig,
    });
    assert.equal(result, true);
  });

  test('should reject invalid mock signatures', () => {
    const mockOrder = 'order_mock_12345';
    const result = verifyPaymentSignature({
      orderId: mockOrder,
      paymentId: 'pay_12345',
      signature: 'invalid_signature',
    });
    assert.equal(result, false);
  });
});
