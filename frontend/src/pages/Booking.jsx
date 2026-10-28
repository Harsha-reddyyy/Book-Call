import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Video,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CalendarPicker from '../components/CalendarPicker';
import Toast from '../components/Toast';
import { api } from '../services/api';

const TOPICS = [
  'AI tools',
  'YouTube',
  'Instagram',
  'Content creation',
  'Video editing',
  'Other',
];

export default function Booking() {
  const navigate = useNavigate();

  // Selected slot state
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form input state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    selectedTopic: 'AI tools',
    customerQuestions: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Simulated test payment modal state (for dev mode)
  const [mockPaymentModal, setMockPaymentModal] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedSlot) {
      newErrors.slot = 'Please choose a date and time slot for your call.';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Please enter your full name.';
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Please enter your email address.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.customerEmail.trim())) {
      newErrors.customerEmail = 'Please provide a valid email address.';
    }
    if (!formData.selectedTopic) {
      newErrors.selectedTopic = 'Please select a topic.';
    }
    if (!formData.customerQuestions.trim()) {
      newErrors.customerQuestions = 'Please tell me what questions you want to discuss.';
    } else if (formData.customerQuestions.trim().length < 10) {
      newErrors.customerQuestions = 'Please provide a little more detail (at least 10 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookingSubmit = async (e, isInstantTest = false) => {
    if (e) e.preventDefault();

    if (!validate()) {
      const firstError = Object.values(errors)[0] || 'Please fill in all required fields.';
      setToast({ type: 'error', message: firstError });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create temporary reservation & get Razorpay order
      const reservation = await api.reserveSlot({
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        selectedTopic: formData.selectedTopic,
        customerQuestions: formData.customerQuestions.trim(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (!reservation.success) {
        throw new Error(reservation.message || 'Could not reserve slot.');
      }

      // 2. Payment Gateway handling
      if (isInstantTest || reservation.isMockPayment || !window.Razorpay) {
        // Safe development simulation modal
        setMockPaymentModal({
          bookingId: reservation.bookingId,
          orderId: reservation.orderId,
          amountDisplay: reservation.amountDisplay || '₹399',
        });
        setIsSubmitting(false);
      } else {
        // Real Razorpay Checkout Modal
        const options = {
          key: reservation.keyId,
          amount: reservation.amount,
          currency: reservation.currency || 'INR',
          name: 'Harsha Consultation',
          description: `20-minute 1-on-1 Call (${formData.selectedTopic})`,
          order_id: reservation.orderId,
          prefill: {
            name: formData.customerName,
            email: formData.customerEmail,
          },
          theme: {
            color: '#F47721',
          },
          handler: async function (response) {
            try {
              setIsSubmitting(true);
              const verifyRes = await api.verifyPayment({
                bookingId: reservation.bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                navigate(`/confirmation/${reservation.bookingId}`);
              } else {
                throw new Error(verifyRes.message || 'Payment verification failed.');
              }
            } catch (vErr) {
              setToast({ type: 'error', message: vErr.message });
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              if (reservation.keyId?.startsWith('rzp_test_')) {
                setMockPaymentModal({
                  bookingId: reservation.bookingId,
                  orderId: reservation.orderId,
                  amountDisplay: reservation.amountDisplay || '₹399',
                });
              } else {
                setToast({
                  type: 'info',
                  message: 'Payment cancelled. Your slot is held for 10 minutes if you want to complete it.',
                });
              }
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response) {
          setIsSubmitting(false);
          setToast({
            type: 'error',
            message: `Payment failed: ${response.error.description || 'Transaction unsuccessful'}`,
          });
        });

        razorpayInstance.open();
      }
    } catch (err) {
      setIsSubmitting(false);
      setToast({
        type: 'error',
        message: err.message || 'An error occurred while creating your reservation.',
      });
    }
  };

  // Complete simulated test payment
  const completeSimulatedPayment = async () => {
    if (!mockPaymentModal) return;
    setIsSubmitting(true);

    try {
      const verifyRes = await api.verifyPayment({
        bookingId: mockPaymentModal.bookingId,
        razorpay_order_id: mockPaymentModal.orderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: `sig_test_${mockPaymentModal.orderId}`,
      });

      if (verifyRes.success) {
        setMockPaymentModal(null);
        navigate(`/confirmation/${mockPaymentModal.bookingId}`);
      } else {
        throw new Error(verifyRes.message || 'Simulated verification failed.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div>
      <Navbar />

      <main className="booking-page">
        <div className="container">
          <div className="booking-header">
            <Link to="/" className="booking-header-back">
              <ArrowLeft size={16} />
              <span>Back to overview</span>
            </Link>

            <h1 className="booking-header-title">Book a 1-on-1 Consultation</h1>

            <div className="booking-meta-bar">
              <div className="booking-meta-item">
                <Clock size={16} />
                <span>Duration: <strong>30–40 mins</strong></span>
              </div>
              <span className="booking-meta-dot">·</span>
              <div className="booking-meta-item">
                <Video size={16} />
                <span>Format: <strong>Google Meet</strong></span>
              </div>
              <span className="booking-meta-dot">·</span>
              <div className="booking-meta-item">
                <span>Fee: <strong style={{ color: 'var(--accent)' }}>₹299 INR</strong> <s style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '4px' }}>₹499</s></span>
              </div>
              <span className="booking-meta-dot">·</span>
              <div className="booking-meta-item">
                <span>Hours: <strong>10:00 AM – 8:00 PM IST</strong></span>
              </div>
            </div>
          </div>

          <div className="booking-layout">
            {/* Left Column: Calendar & Time Slots */}
            <div className="booking-card">
              <h2 className="booking-card-title">1. Select Date & Time</h2>
              <p className="booking-card-subtitle">
                Pick an available slot. All appointment times are shown in Indian
                Standard Time (IST).
              </p>

              <CalendarPicker
                onSlotSelect={setSelectedSlot}
                selectedSlot={selectedSlot}
              />

              {errors.slot && (
                <div className="form-error" style={{ marginTop: '14px' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {errors.slot}
                </div>
              )}
            </div>

            {/* Right Column: Customer Details & Payment */}
            <div className="booking-card">
              <h2 className="booking-card-title">2. Tell Me What You Need</h2>
              <p className="booking-card-subtitle">
                Help me prepare so we can dive straight into your questions.
              </p>

              {/* Slot Summary */}
              {selectedSlot ? (
                <div className="booking-summary-banner">
                  <div className="summary-row">
                    <span className="summary-label">Date</span>
                    <span className="summary-val">{selectedSlot.date}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time</span>
                    <span className="summary-val">{selectedSlot.formattedRange} (IST)</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Duration</span>
                    <span className="summary-val">20 minutes</span>
                  </div>
                  <div className="summary-row total">
                    <span className="summary-label">Total Due</span>
                    <span className="summary-val">₹399.00</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px dashed var(--border-color)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '24px',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Select an available date & time on the left to proceed with booking.
                </div>
              )}

              <form onSubmit={handleBookingSubmit} noValidate>
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="customerName" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`form-input ${errors.customerName ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.customerName && (
                    <div className="form-error">{errors.customerName}</div>
                  )}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label htmlFor="customerEmail" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="rahul@example.com"
                    className={`form-input ${errors.customerEmail ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="form-hint">
                    Meeting link & confirmation will be sent to this email.
                  </div>
                  {errors.customerEmail && (
                    <div className="form-error">{errors.customerEmail}</div>
                  )}
                </div>

                {/* Primary Topic */}
                <div className="form-group">
                  <label htmlFor="selectedTopic" className="form-label">
                    Primary Topic <span className="required">*</span>
                  </label>
                  <select
                    id="selectedTopic"
                    name="selectedTopic"
                    value={formData.selectedTopic}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={isSubmitting}
                  >
                    {TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Questions or Doubts */}
                <div className="form-group">
                  <label htmlFor="customerQuestions" className="form-label">
                    Your Questions or Doubts <span className="required">*</span>
                  </label>
                  <textarea
                    id="customerQuestions"
                    name="customerQuestions"
                    rows={4}
                    value={formData.customerQuestions}
                    onChange={handleInputChange}
                    placeholder="Briefly describe what you're working on, what questions you have, or any specific links you want me to look at..."
                    className={`form-textarea ${errors.customerQuestions ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.customerQuestions && (
                    <div className="form-error">{errors.customerQuestions}</div>
                  )}
                </div>

                {/* Early Bird Price Callout Box */}
                <div
                  style={{
                    backgroundColor: 'rgba(244, 119, 33, 0.08)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                      ⚡ Early Bird Offer
                    </span>
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                      30–40 min 1-on-1 session
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹299</span>
                    <s style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px' }}>₹499</s>
                  </div>
                </div>

                {/* Submit / Pay Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
                  disabled={isSubmitting || !selectedSlot}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Book a Call — ₹299</span>
                  )}
                </button>

                {/* 1-Click Sandbox Test Option */}
                <button
                  type="button"
                  onClick={(e) => handleBookingSubmit(e, true)}
                  className="btn"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '12px',
                    fontSize: '0.92rem',
                    backgroundColor: 'rgba(244, 119, 33, 0.08)',
                    color: 'var(--accent)',
                    border: '1px dashed var(--accent)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                  }}
                  disabled={isSubmitting || !selectedSlot}
                >
                  ⚡ Test Mode: 1-Click Instant Complete (Skip Popup)
                </button>
              </form>

              {/* Trust Badges */}
              <div className="booking-trust-list">
                <div className="trust-item">
                  <ShieldCheck size={16} className="trust-icon" />
                  <span>Secure checkout via Razorpay (UPI, Cards, NetBanking)</span>
                </div>
                <div className="trust-item">
                  <CheckCircle size={16} className="trust-icon" />
                  <span>Instant Google Meet invite sent upon confirmation</span>
                </div>
                <div className="trust-item">
                  <HelpCircle size={16} className="trust-icon" />
                  <span>
                    Free rescheduling up to 6 hours before call ·{' '}
                    <Link to="/cancellation-refund" style={{ color: 'var(--accent)' }}>
                      Policy
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simulated Dev Payment Modal */}
      {mockPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Simulated Payment Checkout</h3>
            </div>
            <p style={{ marginBottom: '16px', fontSize: '0.94rem' }}>
              Razorpay is currently in safe development test mode. In production with live keys, this opens the official Razorpay Checkout popup.
            </p>
            <div
              style={{
                backgroundColor: 'var(--surface-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Booking ID:</span>
                <strong>{mockPaymentModal.bookingId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Amount:</span>
                <strong>{mockPaymentModal.amountDisplay}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <span className="badge badge-accent">Ready for Payment</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={completeSimulatedPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Complete Test Payment (₹399)'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMockPaymentModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
