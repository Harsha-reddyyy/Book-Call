import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { formatInTimeZone } from 'date-fns-tz';
import { generateGoogleCalendarUrl } from './calendarService.js';
import dotenv from 'dotenv';
dotenv.config();

const sanitizeEnv = (val) => val?.trim().replace(/^['"]|['"]$/g, '');
const brevoApiKey = sanitizeEnv(process.env.BREVO_API_KEY);
const brevoSenderEmail = sanitizeEnv(process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'harshavardhanreddy.0712@gmail.com');
const resendApiKey = sanitizeEnv(process.env.RESEND_API_KEY);
const emailFrom = sanitizeEnv(process.env.EMAIL_FROM) || 'Harsha Consultations <onboarding@resend.dev>';
const gmailUser = sanitizeEnv(process.env.GMAIL_USER);
const gmailAppPassword = sanitizeEnv(process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, '');

export const isBrevoConfigured = () => {
  return Boolean(
    brevoApiKey &&
    !brevoApiKey.includes('YOUR_') &&
    !brevoApiKey.includes('placeholder')
  );
};

export const isGmailConfigured = () => {
  return Boolean(
    gmailUser &&
    gmailAppPassword &&
    !gmailAppPassword.includes('YOUR_') &&
    !gmailAppPassword.includes('placeholder')
  );
};

export const isResendConfigured = () => {
  return Boolean(
    resendApiKey &&
    !resendApiKey.includes('YOUR_') &&
    !resendApiKey.includes('placeholder')
  );
};

const resend = isResendConfigured() ? new Resend(resendApiKey) : null;

let gmailTransporter = null;
if (isGmailConfigured()) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
  console.log('[Email] Gmail SMTP Transporter initialized for:', gmailUser);
}

/**
 * Format confirmation email HTML template
 */
function buildConfirmationHtml(booking) {
  const timeZone = booking.timeZone || 'Asia/Kolkata';
  const formattedDate = formatInTimeZone(new Date(booking.startTime), timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(new Date(booking.startTime), timeZone, 'hh:mm a');
  const formattedEndTime = formatInTimeZone(new Date(booking.endTime), timeZone, 'hh:mm a');
  const gcalUrl = generateGoogleCalendarUrl(booking);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF9F6;
      color: #202020;
      margin: 0;
      padding: 30px 15px;
      line-height: 1.6;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E8E5DF;
      border-radius: 8px;
      padding: 36px 32px;
    }
    .header {
      border-bottom: 1px solid #E8E5DF;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #202020;
      letter-spacing: -0.02em;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #202020;
      margin: 0 0 12px 0;
      letter-spacing: -0.01em;
    }
    p {
      margin: 0 0 16px 0;
      color: #4A4A4A;
      font-size: 15px;
    }
    .details-box {
      background-color: #FAF9F6;
      border: 1px solid #E8E5DF;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #EFECE6;
      font-size: 14px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6B6B6B;
      font-weight: 500;
    }
    .detail-value {
      color: #202020;
      font-weight: 600;
      text-align: right;
    }
    .meet-btn {
      display: inline-block;
      background-color: #F47721;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin-top: 10px;
      margin-bottom: 15px;
      text-align: center;
    }
    .questions-box {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E8E5DF;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #E8E5DF;
      font-size: 13px;
      color: #6B6B6B;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Harsha</div>
    </div>

    <h1>Your Consultation is Confirmed</h1>
    <p>Hi ${booking.customerName},</p>
    <p>Thanks for booking a session with me. I'm looking forward to talking through what you're working on and answering your questions.</p>

    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Booking Reference</span>
        <span class="detail-value">${booking.bookingId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${formattedStartTime} – ${formattedEndTime} (IST)</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration</span>
        <span class="detail-value">30–40 minutes (1-on-1 Deep Dive)</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Topic</span>
        <span class="detail-value">${booking.selectedTopic}</span>
      </div>
      ${
        booking.customerPhone
          ? `
      <div class="detail-row">
        <span class="detail-label">Mobile / WhatsApp</span>
        <span class="detail-value">${booking.customerPhone}</span>
      </div>
      `
          : ''
      }
    </div>

    ${
      booking.googleMeetUrl
        ? `
      <p style="margin-bottom: 8px;"><strong>Meeting Details & Calendar:</strong></p>
      <div style="margin: 12px 0 16px 0;">
        <a href="${booking.googleMeetUrl}" class="meet-btn" target="_blank" style="display: inline-block; background-color: #F47721; color: #FFFFFF !important; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 10px; margin-bottom: 8px;">Join Google Meet</a>
        <a href="${gcalUrl}" target="_blank" style="display: inline-block; background-color: #202020; color: #FFFFFF !important; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-bottom: 8px;">📅 Add to Google Calendar (30m reminder)</a>
      </div>
      <p style="font-size: 13px; color: #6B6B6B;">Meeting link: <a href="${booking.googleMeetUrl}" style="color: #F47721;">${booking.googleMeetUrl}</a></p>
    `
        : `<p><em>Google Meet link is being generated and will be sent shortly.</em></p>`
    }

    <div class="questions-box">
      <p style="margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #202020;">What you shared with me:</p>
      <p style="font-size: 14px; color: #4A4A4A; white-space: pre-line; background: #FAF9F6; padding: 12px; border-radius: 4px; border: 1px solid #E8E5DF;">${booking.customerQuestions}</p>
    </div>

    <div class="footer">
      <p style="margin-bottom: 8px;">Need to reschedule or have an issue? Reply directly to this email at least 6 hours before our call.</p>
      <p style="margin-bottom: 0;">Looking forward to our conversation,<br><strong>Harsha</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(booking) {
  const subject = `Confirmed: Consultation with Harsha — ${booking.bookingId}`;
  const html = buildConfirmationHtml(booking);

  // 1. Brevo HTTPS API (Top priority: port 443, reliable on Render free tier, sends to any recipient)
  if (isBrevoConfigured()) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Harsha Consultations',
            email: brevoSenderEmail,
          },
          to: [
            {
              email: booking.customerEmail,
              name: booking.customerName || 'Valued Client',
            },
          ],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP ${response.status}`);
      }

      console.log(`[Email] Brevo confirmation delivered to ${booking.customerEmail} (MessageId: ${data.messageId})`);
      return { success: true, emailId: data.messageId, error: null };
    } catch (err) {
      console.error('[Brevo Error] Failed to send email:', err.message);
      // Fall through to other providers
    }
  }

  // 2. Gmail SMTP if configured
  if (isGmailConfigured() && gmailTransporter) {
    try {
      const fromHeader = `"Harsha Consultations" <${gmailUser}>`;
      const info = await gmailTransporter.sendMail({
        from: fromHeader,
        to: booking.customerEmail,
        subject,
        html,
      });

      console.log(`[Email] Gmail confirmation sent to ${booking.customerEmail} (ID: ${info.messageId})`);
      return { success: true, emailId: info.messageId, error: null };
    } catch (err) {
      console.error('[Gmail Error] Failed to send email:', err.message);
      // Fall through to Resend if available
    }
  }

  // 2. Resend API
  if (isResendConfigured() && resend) {
    try {
      const response = await resend.emails.send({
        from: emailFrom,
        to: [booking.customerEmail],
        subject,
        html,
      });

      if (response.error) {
        console.warn('[Email Warning]', response.error.message);
        // If testing in sandbox (onboarding@resend.dev), forward notification to admin so Harsha always gets it
        const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'harshavardhanreddy.0712@gmail.com';
        if (booking.customerEmail !== adminEmail) {
          try {
            await resend.emails.send({
              from: emailFrom,
              to: [adminEmail],
              subject: `[Admin Alert] New Consultation Booked — ${booking.bookingId}`,
              html,
            });
            console.log(`[Email] Admin notification delivered to ${adminEmail}`);
          } catch (adminErr) {
            console.warn('[Email Admin Fallback Error]', adminErr.message);
          }
        }
        return { success: false, emailId: null, error: response.error.message };
      }

      console.log(`[Email] Confirmation sent to ${booking.customerEmail} (ID: ${response.data?.id})`);
      return { success: true, emailId: response.data?.id, error: null };
    } catch (err) {
      console.error('[Email Error] Failed to send confirmation:', err.message);
      return { success: false, emailId: null, error: err.message };
    }
  }

  // Graceful development simulation log
  console.log(`[Email Simulated] To: ${booking.customerEmail} | Subject: ${subject}`);
  return { success: true, emailId: `mock_email_${Date.now()}`, error: null, isMock: true };
}

/**
 * Format host notification HTML template for Harsha
 */
function buildHostNotificationHtml(booking) {
  const timeZone = booking.timeZone || 'Asia/Kolkata';
  const formattedDate = formatInTimeZone(new Date(booking.startTime), timeZone, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatInTimeZone(new Date(booking.startTime), timeZone, 'hh:mm a');
  const formattedEndTime = formatInTimeZone(new Date(booking.endTime), timeZone, 'hh:mm a');
  const gcalHostUrl = generateGoogleCalendarUrl(booking, true);
  const rawPhone = booking.customerPhone?.replace(/[^\d]/g, '') || '';
  const waUrl = rawPhone ? `https://wa.me/${rawPhone}` : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF9F6;
      color: #202020;
      margin: 0;
      padding: 30px 15px;
      line-height: 1.6;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E8E5DF;
      border-radius: 8px;
      padding: 36px 32px;
    }
    .badge {
      display: inline-block;
      background-color: #F47721;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #202020;
      margin: 0 0 16px 0;
      letter-spacing: -0.02em;
    }
    .details-box {
      background-color: #FAF9F6;
      border: 1px solid #E8E5DF;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #EFECE6;
      font-size: 14px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6B6B6B;
      font-weight: 500;
    }
    .detail-value {
      font-weight: 600;
      color: #202020;
      text-align: right;
    }
    .questions-box {
      margin-top: 20px;
      padding: 16px;
      background: #FFFFFF;
      border: 1px solid #E8E5DF;
      border-radius: 6px;
    }
    .btn {
      display: inline-block;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .btn-primary {
      background-color: #F47721;
      color: #FFFFFF !important;
    }
    .btn-secondary {
      background-color: #202020;
      color: #FFFFFF !important;
    }
    .btn-wa {
      background-color: #25D366;
      color: #FFFFFF !important;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #E8E5DF;
      font-size: 13px;
      color: #6B6B6B;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">New Booking Confirmed</div>
    <h1>${booking.customerName} booked a consultation</h1>
    <p style="color: #4A4A4A; font-size: 15px; margin-top: 0;">
      A new 1-on-1 consultation session has been scheduled and paid via Razorpay (₹${(booking.amountPaise / 100).toFixed(0)}).
    </p>

    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Client Name</span>
        <span class="detail-value">${booking.customerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client Email</span>
        <span class="detail-value"><a href="mailto:${booking.customerEmail}" style="color: #F47721;">${booking.customerEmail}</a></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client Phone / WhatsApp</span>
        <span class="detail-value">
          ${booking.customerPhone || 'Not provided'}
          ${waUrl ? ` · <a href="${waUrl}" style="color: #25D366; text-decoration: none; font-weight: 600;" target="_blank">Chat WhatsApp</a>` : ''}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value" style="font-family: monospace;">${booking.bookingId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${formattedStartTime} – ${formattedEndTime} (IST)</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Topic</span>
        <span class="detail-value">${booking.selectedTopic}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment ID</span>
        <span class="detail-value" style="font-family: monospace;">${booking.razorpayPaymentId || 'Verified'}</span>
      </div>
    </div>

    ${
      booking.googleMeetUrl
        ? `
      <div style="margin: 20px 0;">
        <p style="font-weight: 600; margin-bottom: 8px;">Meeting Room & Calendar:</p>
        <a href="${booking.googleMeetUrl}" class="btn btn-primary" target="_blank">🎥 Open Google Meet</a>
        <a href="${gcalHostUrl}" class="btn btn-secondary" target="_blank">📅 Add to My Google Calendar</a>
        <p style="font-size: 13px; color: #6B6B6B; margin-top: 6px;">
          Meet Link: <a href="${booking.googleMeetUrl}" style="color: #F47721;">${booking.googleMeetUrl}</a>
        </p>
      </div>
    `
        : ''
    }

    <div class="questions-box">
      <p style="margin: 0 0 6px 0; font-weight: 600; font-size: 14px; color: #202020;">What ${booking.customerName} shared with you:</p>
      <p style="font-size: 14px; color: #4A4A4A; white-space: pre-line; margin: 0;">${booking.customerQuestions}</p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">You can reply directly to this email to get in touch with <strong>${booking.customerName}</strong> (${booking.customerEmail}).</p>
      <p style="margin: 0; color: #9B9B9B; font-size: 12px;">Harsha Consultations Automated Booking Engine</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send notification email to Harsha (Host) when a consultation is booked
 */
export async function sendHostNotification(booking) {
  const hostEmail = process.env.ADMIN_DEFAULT_EMAIL || 'harshavardhanreddy.0712@gmail.com';
  const subject = `⚡ New Booking: ${booking.customerName} — ${booking.bookingId} (${booking.selectedTopic})`;
  const html = buildHostNotificationHtml(booking);

  // 1. Brevo HTTPS API
  if (isBrevoConfigured()) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Harsha Booking Bot',
            email: brevoSenderEmail,
          },
          to: [
            {
              email: hostEmail,
              name: 'Harsha',
            },
          ],
          replyTo: {
            email: booking.customerEmail,
            name: booking.customerName,
          },
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP ${response.status}`);
      }

      console.log(`[Email] Host notification delivered to ${hostEmail} (MessageId: ${data.messageId})`);
      return { success: true, emailId: data.messageId, error: null };
    } catch (err) {
      console.error('[Brevo Error] Host notification failed:', err.message);
    }
  }

  // 2. Gmail SMTP
  if (isGmailConfigured() && gmailTransporter) {
    try {
      const info = await gmailTransporter.sendMail({
        from: `"Harsha Booking Bot" <${gmailUser}>`,
        to: hostEmail,
        replyTo: booking.customerEmail,
        subject,
        html,
      });

      console.log(`[Email] Host notification sent to ${hostEmail} (ID: ${info.messageId})`);
      return { success: true, emailId: info.messageId, error: null };
    } catch (err) {
      console.error('[Gmail Error] Host notification failed:', err.message);
    }
  }

  // 3. Resend API
  if (isResendConfigured() && resend) {
    try {
      const response = await resend.emails.send({
        from: emailFrom,
        to: [hostEmail],
        reply_to: booking.customerEmail,
        subject,
        html,
      });

      if (response.error) {
        console.warn('[Resend Host Warning]', response.error.message);
        return { success: false, emailId: null, error: response.error.message };
      }

      console.log(`[Email] Host notification sent to ${hostEmail} (ID: ${response.data?.id})`);
      return { success: true, emailId: response.data?.id, error: null };
    } catch (err) {
      console.error('[Email Error] Host notification failed:', err.message);
      return { success: false, emailId: null, error: err.message };
    }
  }

  console.log(`[Email Simulated Host Alert] To: ${hostEmail} | Subject: ${subject}`);
  return { success: true, emailId: `mock_host_${Date.now()}`, error: null, isMock: true };
}
