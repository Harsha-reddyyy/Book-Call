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
          <p style={{ margin: '16px 0 24px' }}>
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
              Your 1-on-1 consultation call with Harsha is confirmed. We sent a
              confirmation email with meeting details to <strong>{booking.customerEmail}</strong>.
            </p>

            {/* Google Meet Banner */}
            {booking.googleMeetUrl ? (
              <div className="conf-meet-banner">
                <div>
                  <div className="meet-info-title">Google Meet Conference Ready</div>
                  <div className="meet-info-desc">
                    Click below to open the meeting room at the scheduled time.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a
                    href={booking.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <span>Join Google Meet</span>
                    <ExternalLink size={16} />
                  </a>

                  <button
                    type="button"
                    onClick={copyMeetLink}
                    className="btn btn-secondary"
                    title="Copy Meeting Link"
                  >
                    {copied ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="conf-meet-banner" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="meet-info-title" style={{ color: 'var(--text-primary)' }}>Meeting Link Pending</div>
                  <div className="meet-info-desc" style={{ color: 'var(--text-secondary)' }}>
                    Your meeting details will be delivered directly to your email shortly.
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Details Table */}
            <div className="confirmation-details-box">
              <div className="confirmation-grid">
                <div className="confirmation-detail-item">
                  <span className="conf-label">Booking Reference</span>
                  <span className="conf-value" style={{ fontFamily: 'var(--font-mono)' }}>
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
                  <span className="conf-value">20 minutes</span>
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
            <div style={{ marginBottom: '32px', fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>Tips for our call:</strong>
              </p>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '6px' }}>
                  Please test your microphone and camera a couple of minutes before the start time.
                </li>
                <li style={{ marginBottom: '6px' }}>
                  If you have video links, channel links, or draft ideas, please have them ready to share in chat.
                </li>
                <li>
                  Need to reschedule? Refer to our{' '}
                  <Link to="/cancellation-refund" style={{ color: 'var(--accent)' }}>
                    Cancellation & Refund Policy
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <div className="conf-actions">
              <Link to="/" className="btn btn-secondary">
                Back to Homepage
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
