import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    customerPhone: {
      type: String,
      trim: true,
      maxlength: [25, 'Phone number cannot exceed 25 characters'],
      default: '',
    },
    selectedTopic: {
      type: String,
      required: [true, 'Topic selection is required'],
      enum: {
        values: [
          'AI tools',
          'YouTube',
          'Instagram',
          'Content creation',
          'Video editing',
          'Other',
        ],
        message: '{VALUE} is not a valid consultation topic',
      },
    },
    customerQuestions: {
      type: String,
      required: [true, 'Please provide your questions or doubts'],
      trim: true,
      maxlength: [1500, 'Questions cannot exceed 1500 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    amountPaise: {
      type: Number,
      required: true,
      default: 39900, // ₹399 in paise
    },
    currency: {
      type: String,
      default: 'INR',
    },
    bookingStatus: {
      type: String,
      enum: ['reserved', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'expired'],
      default: 'reserved',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'captured', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    reservationExpiresAt: {
      type: Date,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    calendarEventId: {
      type: String,
    },
    googleMeetUrl: {
      type: String,
    },
    calendarStatus: {
      type: String,
      enum: ['not_requested', 'pending', 'created', 'failed'],
      default: 'pending',
    },
    calendarError: {
      type: String,
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    emailError: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find conflicts
bookingSchema.index({ startTime: 1, bookingStatus: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
