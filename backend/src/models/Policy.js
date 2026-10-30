import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: ['cancellation_refund', 'privacy_policy', 'terms_of_service'],
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Initial default policies generator
policySchema.statics.getOrCreate = async function (type) {
  let policy = await this.findOne({ type });
  if (!policy) {
    let defaults = {
      title: '',
      content: '',
    };

    if (type === 'cancellation_refund') {
      defaults = {
        title: 'Cancellation and Refund Policy',
        content: `### 1. Rescheduling Policy
We understand that plans can change. You can reschedule your consultation free of charge up to 6 hours before the scheduled call time by sending an email with your booking reference to harshavardhanreddy.0712@gmail.com. Rescheduling requests made within 6 hours of the session are subject to slot availability.

### 2. Customer Cancellations & Refunds
- **Full Refund:** Cancellations made at least 12 hours prior to the scheduled consultation are eligible for a 100% refund.
- **Partial Refund:** Cancellations made between 4 to 12 hours prior to the call are eligible for a 50% refund, or you may choose to reschedule at no additional cost.
- **Non-Refundable:** Cancellations made less than 4 hours before the scheduled time are non-refundable as the time slot has been reserved exclusively for you.

### 3. Missed Appointments (No-Shows)
If you fail to join the meeting within 10 minutes of the scheduled start time without prior notice, the session will be marked as a no-show and cannot be refunded or rescheduled.

### 4. Technical Issues
- **Issues on Our End:** If a technical glitch on Harsha's side prevents the call from happening or causes significant disruption, you will be offered an immediate full refund or a priority reschedule at your convenience.
- **Issues on Your End:** If you experience connectivity issues, we will do our best to extend or accommodate you where the schedule permits, but we cannot guarantee additional time if subsequent slots are booked.

### 5. Cancellation by Harsha
In the rare event that Harsha must cancel a session due to unforeseen personal or emergency circumstances, you will be notified immediately and provided a choice between an immediate 100% refund or an expedited priority rescheduling.

### 6. Processing Time for Refunds
All approved refunds are processed back to the original payment method via Razorpay within 5–7 business days, depending on your bank or card issuer.

### 7. Support & Cancellation Contact
For any cancellation, refund, or rescheduling requests, please email harshavardhanreddy.0712@gmail.com with your Booking ID and details.`,
      };
    } else if (type === 'privacy_policy') {
      defaults = {
        title: 'Privacy Policy',
        content: `### 1. Information We Collect
We collect only the essential information needed to conduct your 1-on-1 consultation:
- Your full name, email address, and mobile/WhatsApp number.
- Your selected consultation topic and the specific questions or doubts you submit.
- Payment transaction details provided by Razorpay (we never store card, CVV, UPI PIN, or banking credentials).
- Meeting details (Google Meet appointment record).

### 2. How We Use Your Information
Your information is used strictly to:
- Schedule, confirm, and provide access to your consultation call.
- Prepare relevant guidance and review your questions prior to the session.
- Send booking confirmations, Google Meet links, session reminders, and WhatsApp/email updates.
- Address any customer support, rescheduling, or refund inquiries.

### 3. Data Protection and Sharing
We do not sell, rent, or distribute your personal information to third parties or marketing platforms. Information is securely transmitted only to service providers essential to the booking service (Razorpay for payment processing, Google Calendar/Meet for scheduling, and transactional email providers).

### 4. Data Retention
Booking records and customer notes are maintained to assist with session follow-ups and accounting compliance. You may request deletion of your booking contact record at any time by emailing us.

### 5. Contact Us
If you have questions about this Privacy Policy, your personal data, or wish to request data updates/deletion, contact Harsha directly at harshavardhanreddy.0712@gmail.com.`,
      };
    } else if (type === 'terms_of_service') {
      defaults = {
        title: 'Terms and Conditions',
        content: `### 1. Consultation Nature
The 1-on-1 consultation with Harsha is an advisory and conversational session designed to answer questions, share creator experience, and discuss AI tools, content workflows, and video strategies. It does not constitute formal legal, financial, investment, or guaranteed commercial consulting.

### 2. Session Duration and Conduct
Each consultation session is scheduled for 30–40 minutes unless otherwise agreed. Both parties agree to maintain professional, respectful, and constructive conduct. Sessions will not be recorded without mutual explicit consent.

### 3. Booking and Payment
Bookings are confirmed only upon successful payment through our authorized payment gateway (Razorpay). The consultation fee is displayed clearly during booking. Any slot held temporarily will be automatically released if payment is not completed within the reservation window.

### 4. Changes to Terms
We reserve the right to revise these terms or policies at any time. Changes will take effect immediately upon updating this page.

### 5. Contact Information
For questions, support, or inquiries regarding your consultation booking or these terms, please contact Harsha at harshavardhanreddy.0712@gmail.com.`,
      };
    }

    policy = await this.create({
      type,
      title: defaults.title,
      content: defaults.content,
      lastUpdated: new Date(),
      updatedBy: 'System',
    });
  }
  return policy;
};

export const Policy = mongoose.model('Policy', policySchema);
