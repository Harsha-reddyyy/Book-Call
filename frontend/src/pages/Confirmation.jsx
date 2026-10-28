import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Check,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Copy,
  CheckCircle2,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { api } from '../services/api';

export default function Confirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBooking() {
      try {
        const res = await api.getBookingDetails(bookingId);
        if (isMounted) {
          if (res.success && res.booking) {
            setBooking(res.booking);

            // Subtle celebration confetti
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#F47721', '#202020', '#E8E5DF'],
              });
            } catch {
              // Ignore confetti error if unavailable
            }
          } else {
            setError(res.message || 'Booking not found');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (bookingId) {
      loadBooking();
    }
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const copyMeetLink = () => {
    if (booking?.googleMeetUrl) {
      navigator.clipboard.writeText(booking.googleMeetUrl);
      setCopied(true);
      setToast({ type: 'success', message: 'Google Meet link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getGoogleCalendarUrl = () => {
    if (!booking) return '#';
    const title = encodeURIComponent(`1-on-1 Consultation: ${booking.customerName} & Harsha`);
    const startUtc = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endUtc = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const meetUrl = booking.googleMeetUrl || '';
    const details = encodeURIComponent(
      `1-on-1 Consultation Call with Harsha\n` +
      `Topic: ${booking.selectedTopic}\n` +
      `Google Meet: ${meetUrl}\n` +
      `Booking ID: ${booking.bookingId}\n` +
      `Reminder: Please be ready 5 minutes before the scheduled time.`
    );
    const location = encodeURIComponent(meetUrl || 'Google Meet');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '120px 0', textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
          <p>Loading your booking confirmation...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2>Booking Not Found</h2>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>
            We could not find a confirmed booking with reference {bookingId}.
          </p>
          <Link to="/book" className="btn btn-primary">
            Back to Booking Page
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const formattedStartTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const formattedEndTime = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div>
      <Navbar />

      <main className="confirmation-page">
        <div className="container-narrow">
          <div className="confirmation-card">
            <div className="confirmation-status-icon">
              <Check size={32} strokeWidth={2.5} />
            </div>

            <h1 className="confirmation-title">You're on the calendar!</h1>
            <p className="confirmation-subtitle">
              Your 1-on-1 consultation call with Harsha is confirmed. We sent meeting details and invite to <strong>{booking.customerEmail}</strong>.
            </p>

            {/* Google Meet Banner */}
            {booking.googleMeetUrl ? (
              <div className="conf-meet-banner">
                <div className="meet-info-text">
                  <div className="meet-info-title">Google Meet Conference Ready</div>
                  <div className="meet-info-desc">
                    Click below to join the meeting room at your scheduled time.
                  </div>
                </div>

                <div className="conf-meet-actions">
                  <a
                    href={booking.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary conf-btn-join"
                  >
                    <span>Join Google Meet</span>
                    <ExternalLink size={16} />
                  </a>

                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary conf-btn-cal"
                    title="Add to Google Calendar"
                  >
                    <Calendar size={16} />
                    <span>Add to Calendar</span>
                  </a>

                  <button
                    type="button"
                    onClick={copyMeetLink}
                    className="btn btn-subtle conf-btn-copy"
                    title="Copy Meeting Link"
                    aria-label="Copy meeting link"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                        <span className="copy-btn-label">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="copy-btn-label">Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="conf-meet-banner pending">
                <div className="meet-info-text">
                  <div className="meet-info-title" style={{ color: 'var(--text-primary)' }}>Meeting Link Pending</div>
                  <div className="meet-info-desc" style={{ color: 'var(--text-secondary)' }}>
                    Your Google Meet link will be generated and delivered directly to your email shortly.
                  </div>
                </div>
                <div className="conf-meet-actions">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary conf-btn-cal"
                  >
                    <Calendar size={16} />
                    <span>Add to Calendar</span>
                  </a>
                </div>
              </div>
            )}

            {/* Appointment Details Grid */}
            <div className="confirmation-details-box">
              <div className="confirmation-grid">
                <div className="confirmation-detail-item">
                  <span className="conf-label">Booking Reference</span>
                  <span className="conf-value conf-value-mono">
                    {booking.bookingId}
                  </span>
                </div>

                <div className="confirmation-detail-item">
                  <span className="conf-label">Topic</span>
                  <span className="conf-value">{booking.selectedTopic}</span>
                </div>

                <div className="confirmation-detail-item">
                  <span className="conf-label">Date</span>
                  <span className="conf-value">{formattedDate}</span>
                </div>

                <div className="confirmation-detail-item">
                  <span className="conf-label">Time</span>
                  <span className="conf-value">
                    {formattedStartTime} – {formattedEndTime} (IST)
                  </span>
                </div>

                <div className="confirmation-detail-item">
                  <span className="conf-label">Duration</span>
                  <span className="conf-value">30–40 minutes (1-on-1)</span>
                </div>

                <div className="confirmation-detail-item">
                  <span className="conf-label">Customer</span>
                  <span className="conf-value">{booking.customerName}</span>
                </div>
              </div>
            </div>

            {/* Questions Recap */}
            <div className="conf-questions-box">
              <span className="conf-label" style={{ display: 'block', marginBottom: '8px' }}>
                What you shared with Harsha
              </span>
              <div className="conf-questions-content">
                {booking.customerQuestions}
              </div>
            </div>

            {/* Instructions & Next Steps */}
            <div className="conf-tips-box">
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Tips for your 1-on-1 session:
              </p>
              <ul className="conf-tips-list">
                <li>
                  Test your microphone and camera 2-3 minutes before start time.
                </li>
                <li>
                  If you have video links, channel links, or draft ideas, please have them ready to paste in Google Meet chat.
                </li>
                <li>
                  Need to reschedule? Refer to our{' '}
                  <Link to="/cancellation-refund" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    Cancellation & Refund Policy
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <div className="conf-actions">
              <Link to="/" className="btn btn-secondary conf-btn-home">
                <span>Back to Homepage</span>
              </Link>
              <Link to="/book" className="btn btn-subtle">
                <span>Book Another Call</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <Footer />
    </div>
  );
}
