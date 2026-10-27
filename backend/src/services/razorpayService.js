import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const sanitizeEnv = (val) => val?.trim().replace(/^['"]|['"]$/g, '');
const keyId = sanitizeEnv(process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY);
const keySecret = sanitizeEnv(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);
const webhookSecret = sanitizeEnv(process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK);

// Helper to determine if real Razorpay keys are configured
export const isRazorpayConfigured = () => {
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('YOUR_') &&
    !keySecret.includes('YOUR_')
  );
};

let razorpayInstance = null;
if (isRazorpayConfigured()) {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  console.log('[Razorpay] Initialized with Key ID:', keyId.substring(0, 8) + '...');
} else {
  console.log('[Razorpay] Keys not configured or using placeholders. Running in safe Mock/Dev mode.');
}

/**
 * Create a new payment order for a consultation
 * @param {string} bookingId Unique booking ID
 * @param {number} amountPaise Default 39900 (₹399.00)
 * @param {object} notes Custom metadata
 */
export async function createPaymentOrder(bookingId, amountPaise = 39900, notes = {}) {
  if (isRazorpayConfigured() && razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: bookingId,
        notes: {
          bookingId,
          ...notes,
        },
      });
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        isMock: false,
      };
    } catch (err) {
      console.error('[Razorpay] Order creation failed:', err);
      const desc = err.error?.description || err.message || JSON.stringify(err);
      throw new Error(`Razorpay order creation failed: ${desc}`);
    }
  }

  // Safe developer simulation order when keys are pending setup
  const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    orderId: mockOrderId,
    amount: amountPaise,
    currency: 'INR',
    isMock: true,
  };
}

/**
 * Verify Razorpay client payment signature
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // Allow mock signature in simulated dev mode
  if (orderId.startsWith('order_mock_')) {
    return signature === `sig_mock_${orderId}`;
  }

  if (!keySecret) {
    throw new Error('Razorpay Key Secret is missing. Cannot verify signature.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
}

/**
 * Verify Razorpay Webhook signature using raw request body
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!webhookSecret) {
    console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.');
    return false;
  }

  if (!signature || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
