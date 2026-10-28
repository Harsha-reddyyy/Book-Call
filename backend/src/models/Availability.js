import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    // Available days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Default: Mon to Sat (1, 2, 3, 4, 5, 6)
    availableDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6],
    },
    // Working hours in 24h format HH:mm (IST) - 10:00 AM to 8:00 PM (20:00)
    workingHoursStart: {
      type: String,
      default: '10:00',
    },
    workingHoursEnd: {
      type: String,
      default: '20:00',
    },
    // Duration in minutes (30-40 min sessions)
    sessionDuration: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    // Buffer between calls in minutes
    bufferTime: {
      type: Number,
      default: 10,
      min: 0,
      max: 60,
    },
    // Breaks during the day
    breaks: [
      {
        start: { type: String, required: true }, // e.g. "13:00"
        end: { type: String, required: true },   // e.g. "14:00"
        label: { type: String, default: 'Lunch Break' },
      },
    ],
    // Blocked specific calendar dates (Format: 'YYYY-MM-DD')
    blockedDates: {
      type: [String],
      default: [],
    },
    // Minimum advance notice required in hours before booking
    minimumNoticeHours: {
      type: Number,
      default: 2,
      min: 0,
    },
    // Maximum days in advance that a booking can be scheduled
    maxAdvanceDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 90,
    },
    // Consultation price in INR: Early Bird ₹299 (Original ₹499)
    priceInr: {
      type: Number,
      default: 299,
      min: 1,
    },
    originalPriceInr: {
      type: Number,
      default: 499,
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
  }
);

// We generally keep a single active configuration document
availabilitySchema.statics.getEffectiveSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      availableDays: [1, 2, 3, 4, 5, 6],
      workingHoursStart: '10:00',
      workingHoursEnd: '19:00',
      sessionDuration: 20,
      bufferTime: 10,
      breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
      blockedDates: [],
      minimumNoticeHours: 2,
      maxAdvanceDays: 30,
      priceInr: 399,
      timeZone: 'Asia/Kolkata',
    });
  }
  return settings;
};

export const Availability = mongoose.model('Availability', availabilitySchema);
