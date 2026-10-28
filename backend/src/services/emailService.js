import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { format as formatZoned } from 'date-fns-tz';
import dotenv from 'dotenv';
dotenv.config();

const sanitizeEnv = (val) => val?.trim().replace(/^['"]|['"]$/g, '');
const resendApiKey = sanitizeEnv(process.env.RESEND_API_KEY);
const emailFrom = sanitizeEnv(process.env.EMAIL_FROM) || 'Harsha Consultations <onboarding@resend.dev>';
const gmailUser = sanitizeEnv(process.env.GMAIL_USER);
const gmailAppPassword = sanitizeEnv(process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, '');

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
  const formattedDate = formatZoned(new Date(booking.startTime), 'EEEE, MMMM d, yyyy', { timeZone });
  const formattedStartTime = formatZoned(new Date(booking.startTime), 'hh:mm a', { timeZone });
  const formattedEndTime = formatZoned(new Date(booking.endTime), 'hh:mm a', { timeZone });

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
        <span class="detail-value">20 minutes</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Topic</span>
        <span class="detail-value">${booking.selectedTopic}</span>
      </div>
    </div>

    ${
      booking.googleMeetUrl
        ? `
      <p style="margin-bottom: 8px;"><strong>Join Online Meeting:</strong></p>
      <a href="${booking.googleMeetUrl}" class="meet-btn" target="_blank">Join Google Meet</a>
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

  // 1. Prioritize Gmail SMTP if configured (sends to ANY customer email)
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
