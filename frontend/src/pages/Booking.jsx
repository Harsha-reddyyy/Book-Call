import React, { useState, useRef } from 'react';
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
  CalendarCheck,
  Sparkles,
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
  const formCardRef = useRef(null);

  // Selected slot state
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form input state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    selectedTopic: 'AI tools',
    customerQuestions: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    if (errors.slot) {
      setErrors((prev) => ({ ...prev, slot: null }));
    }
    // On small screens, if a slot was just chosen, gently scroll towards details form
    if (slot && window.innerWidth < 860 && formCardRef.current) {
      setTimeout(() => {
        formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

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
      newErrors.slot = 'Please choose an available date and time slot for your call.';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Please enter your full name.';
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Please enter your email address.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.customerEmail.trim())) {
      newErrors.customerEmail = 'Please provide a valid email address.';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Mobile or WhatsApp number is required.';
    } else if (!/^[0-9+() -]{8,20}$/.test(formData.customerPhone.trim())) {
      newErrors.customerPhone = 'Please provide a valid phone number (at least 10 digits).';
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

  const handleBookingSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validate()) {
      const firstError = Object.values(errors)[0] || 'Please fill in all required fields.';
      setToast({ type: 'error', message: firstError });
      return;
    }

    if (!window.Razorpay) {
      setToast({
        type: 'error',
        message: 'Payment gateway is initializing. Please refresh the page or check your connection.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create temporary reservation & get Razorpay order
      const reservation = await api.reserveSlot({
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        selectedTopic: formData.selectedTopic,
        customerQuestions: formData.customerQuestions.trim(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (!reservation.success) {
        throw new Error(reservation.message || 'Could not reserve slot.');
      }

      // 2. Real Razorpay Checkout Modal
      const options = {
        key: reservation.keyId,
        amount: reservation.amount,
        currency: reservation.currency || 'INR',
        name: 'Harsha Consultation',
        description: `30–40 min 1-on-1 Call (${formData.selectedTopic})`,
        order_id: reservation.orderId,
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: formData.customerPhone,
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
              if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
              }
              navigate(`/confirmation/${reservation.bookingId}`, {
                state: {
                  booking: verifyRes.booking,
                  fromPayment: true,
                },
              });
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
            setToast({
              type: 'info',
              message: 'Payment window closed. Your slot is held for 10 minutes if you want to complete it.',
            });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        setIsSubmitting(false);
        setToast({
          type: 'error',
          message: `Payment failed: ${response.error?.description || 'Transaction unsuccessful'}`,
        });
      });

      razorpayInstance.open();
    } catch (err) {
      setIsSubmitting(false);
      setToast({
        type: 'error',
        message: err.message || 'An error occurred while creating your reservation.',
      });
    }
  };

  return (
    <div className="booking-page-wrap">
      <Navbar />

      <main className="booking-page">
        <div className="container">
          {/* Header */}
          <div className="booking-header">
            <Link to="/" className="booking-header-back">
              <ArrowLeft size={16} />
              <span>Back to overview</span>
            </Link>

            <h1 className="booking-header-title">Book a 1-on-1 Consultation</h1>

            <div className="booking-meta-bar">
              <div className="booking-meta-item">
                <Clock size={15} />
                <span>Duration: <strong>30–40 mins</strong></span>
              </div>
              <span className="booking-meta-dot" aria-hidden="true">·</span>
              <div className="booking-meta-item">
                <Video size={15} />
                <span>Format: <strong>Google Meet</strong></span>
              </div>
              <span className="booking-meta-dot" aria-hidden="true">·</span>
              <div className="booking-meta-item">
                <span>Fee: <strong style={{ color: 'var(--accent)' }}>₹299 INR</strong> <s style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '4px' }}>₹499</s></span>
              </div>
              <span className="booking-meta-dot" aria-hidden="true">·</span>
              <div className="booking-meta-item">
                <span>Hours: <strong>10:00 AM – 8:00 PM IST</strong></span>
              </div>
            </div>
          </div>

          {/* Responsive 2-Step Layout */}
          <div className="booking-layout">
            {/* Step 1: Calendar & Time Slots */}
            <div className="booking-card booking-card-calendar">
              <div className="booking-step-badge">
                <span className="step-num">Step 1</span>
                <span>Choose Date & Time</span>
              </div>
              <h2 className="booking-card-title">Select Date & Time</h2>
              <p className="booking-card-subtitle">
                Pick an available slot. All appointment times are in Indian Standard Time (IST).
              </p>

              <CalendarPicker
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />

              {errors.slot && (
                <div className="form-error booking-slot-error">
                  <AlertCircle size={15} />
                  <span>{errors.slot}</span>
                </div>
              )}
            </div>

            {/* Step 2: Customer Details & Payment */}
            <div className="booking-card booking-card-form" ref={formCardRef}>
              <div className="booking-step-badge">
                <span className="step-num">Step 2</span>
                <span>Your Details & Payment</span>
              </div>
              <h2 className="booking-card-title">Tell Me What You Need</h2>
              <p className="booking-card-subtitle">
                Help me prepare so we can dive straight into your questions.
              </p>

              {/* Slot Summary */}
              {selectedSlot ? (
                <div className="booking-summary-banner">
                  <div className="summary-header">
                    <CalendarCheck size={18} className="summary-icon" />
                    <span className="summary-title">Selected Appointment</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Date</span>
                    <span className="summary-val">{selectedSlot.date}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time</span>
                    <span className="summary-val">{selectedSlot.formattedRange || selectedSlot.formattedTime} (IST)</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Duration</span>
                    <span className="summary-val">30–40 minutes</span>
                  </div>
                  <div className="summary-row total">
                    <span className="summary-label">Total Due</span>
                    <span className="summary-val">₹299.00</span>
                  </div>
                </div>
              ) : (
                <div className="booking-summary-placeholder">
                  <Clock size={18} style={{ margin: '0 auto 6px', color: 'var(--accent)' }} />
                  <div>Select an available date & time above to proceed.</div>
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

                {/* Mobile / WhatsApp Number */}
                <div className="form-group">
                  <label htmlFor="customerPhone" className="form-label">
                    Mobile / WhatsApp Number <span className="required">*</span>
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className={`form-input ${errors.customerPhone ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="form-hint">
                    Required for meeting reminder and WhatsApp consultation updates.
                  </div>
                  {errors.customerPhone && (
                    <div className="form-error">{errors.customerPhone}</div>
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
                    placeholder="Briefly describe what you're working on, questions you have, or any specific links you want me to look at..."
                    className={`form-textarea ${errors.customerQuestions ? 'error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.customerQuestions && (
                    <div className="form-error">{errors.customerQuestions}</div>
                  )}
                </div>

                {/* Early Bird Price Callout Box */}
                <div className="booking-price-callout">
                  <div>
                    <span className="price-callout-badge">
                      ⚡ Early Bird Offer
                    </span>
                    <div className="price-callout-sub">
                      30–40 min 1-on-1 session
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="price-callout-amount">₹299</span>
                    <s className="price-callout-original">₹499</s>
                  </div>
                </div>

                {/* Submit / Pay Button */}
                <button
                  type="submit"
                  className="btn btn-primary booking-submit-btn"
                  disabled={isSubmitting || !selectedSlot}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Reservation...</span>
                    </>
                  ) : (
                    <span>Book a Call — ₹299</span>
                  )}
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
