import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

export const isGoogleCalendarConfigured = () => {
  return Boolean(
    clientId &&
    clientSecret &&
    refreshToken &&
    !clientId.includes('YOUR_') &&
    !clientSecret.includes('YOUR_')
  );
};

let oauth2Client = null;
if (isGoogleCalendarConfigured()) {
  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  console.log('[Google Calendar] OAuth2 Client initialized.');
} else {
  console.log('[Google Calendar] Credentials not fully configured. Running in fallback/dev mode.');
}

/**
 * Create a Google Calendar event with a Google Meet conference
 * @param {object} booking Booking model instance
 */
export async function createMeetingEvent(booking) {
  if (isGoogleCalendarConfigured() && oauth2Client) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const eventPayload = {
        summary: `1-on-1 Consultation: ${booking.customerName} & Harsha`,
        description: `Consultation Call with Harsha\n\nTopic: ${booking.selectedTopic}\nQuestions / Doubts:\n${booking.customerQuestions}\n\nClient: ${booking.customerName} (${booking.customerEmail})\nBooking ID: ${booking.bookingId}`,
        start: {
          dateTime: new Date(booking.startTime).toISOString(),
          timeZone: booking.timeZone || 'Asia/Kolkata',
        },
        end: {
          dateTime: new Date(booking.endTime).toISOString(),
          timeZone: booking.timeZone || 'Asia/Kolkata',
        },
        attendees: [
          { email: booking.customerEmail, displayName: booking.customerName },
        ],
        conferenceData: {
          createRequest: {
            requestId: `meet-${booking.bookingId}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: eventPayload,
        conferenceDataVersion: 1,
      });

      const event = response.data;
      const meetUrl =
        event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
        event.hangoutLink ||
        null;

      return {
        success: true,
        calendarEventId: event.id,
        googleMeetUrl: meetUrl,
        error: null,
      };
    } catch (err) {
      console.error('[Google Calendar Error]', err.message);
      return {
        success: false,
        calendarEventId: null,
        googleMeetUrl: null,
        error: err.message,
      };
    }
  }

  // Graceful fallback for local development or when credentials are not yet set
  // Generate a realistic meeting URL placeholder so the booking flow works end-to-end
  return {
    success: true,
    calendarEventId: `cal_mock_${booking.bookingId}`,
    googleMeetUrl: `https://meet.google.com/hrs-${booking.bookingId.toLowerCase().slice(-7)}`,
    error: null,
    isMock: true,
  };
}
