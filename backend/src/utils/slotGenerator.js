import { parse, addMinutes, format, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatZoned } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Generate available slots for a given date in YYYY-MM-DD format
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {object} availabilitySettings Availability model document
 * @param {Array} existingBookings Active bookings on that day (confirmed or active reservation)
 * @param {Date} now Current timestamp
 */
export function generateDaySlots(dateStr, availabilitySettings, existingBookings = [], now = new Date()) {
  const {
    availableDays,
    workingHoursStart,
    workingHoursEnd,
    sessionDuration = 20,
    bufferTime = 10,
    breaks = [],
    blockedDates = [],
    minimumNoticeHours = 2,
    timeZone = TIMEZONE,
  } = availabilitySettings;

  // 1. Check if the date is explicitly blocked
  if (blockedDates.includes(dateStr)) {
    return [];
  }

  // 2. Parse date in target timezone to check day of week
  // Create a base date in IST: e.g. 2026-10-26 00:00:00 IST
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  const dayDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const zonedDayDate = toZonedTime(dayDate, timeZone);
  const dayOfWeek = zonedDayDate.getDay(); // 0 is Sunday, 1 is Monday...

  if (!availableDays.includes(dayOfWeek)) {
    return [];
  }

  // Parse start and end hours for that day
  const [startHour, startMin] = workingHoursStart.split(':').map(Number);
  const [endHour, endMin] = workingHoursEnd.split(':').map(Number);

  // Minimum cutoff time (now + minimumNoticeHours)
  const minNoticeCutoff = addMinutes(now, minimumNoticeHours * 60);

  const slots = [];
  let currentMinuteOffset = startHour * 60 + startMin;
  const endMinuteOffset = endHour * 60 + endMin;

  // Pre-calculate breaks in minutes from midnight
  const parsedBreaks = breaks.map((b) => {
    const [bStartH, bStartM] = b.start.split(':').map(Number);
    const [bEndH, bEndM] = b.end.split(':').map(Number);
    return {
      start: bStartH * 60 + bStartM,
      end: bEndH * 60 + bEndM,
    };
  });

  while (currentMinuteOffset + sessionDuration <= endMinuteOffset) {
    const slotStartMin = currentMinuteOffset;
    const slotEndMin = slotStartMin + sessionDuration;

    // Check if slot overlaps with any break
    const overlapsBreak = parsedBreaks.some(
      (b) => slotStartMin < b.end && slotEndMin > b.start
    );

    if (!overlapsBreak) {
      const slotStartH = Math.floor(slotStartMin / 60);
      const slotStartM = slotStartMin % 60;
      const slotEndH = Math.floor(slotEndMin / 60);
      const slotEndM = slotEndMin % 60;

      // Construct ISO Date objects representing this exact time in Asia/Kolkata
      // Construct date string: YYYY-MM-DDTHH:mm:00 in IST
      const pad = (n) => String(n).padStart(2, '0');
      const startStr = `${dateStr}T${pad(slotStartH)}:${pad(slotStartM)}:00`;
      const endStr = `${dateStr}T${pad(slotEndH)}:${pad(slotEndM)}:00`;

      // Convert local IST time string into UTC Date
      const slotStartDate = fromZonedTime(startStr, timeZone);
      const slotEndDate = fromZonedTime(endStr, timeZone);

      // Check minimum notice requirement
      const isPastOrTooSoon = isBefore(slotStartDate, minNoticeCutoff);

      if (!isPastOrTooSoon) {
        // Check collision with existing confirmed or currently held bookings
        const hasCollision = existingBookings.some((booking) => {
          // If status is confirmed, it blocks the slot
          // If status is reserved and reservationExpiresAt > now, it blocks the slot
          const isActiveReservation =
            booking.bookingStatus === 'reserved' &&
            booking.reservationExpiresAt &&
            isAfter(new Date(booking.reservationExpiresAt), now);

          const isConfirmed = booking.bookingStatus === 'confirmed';

          if (!isActiveReservation && !isConfirmed) {
            return false;
          }

          const bStart = new Date(booking.startTime).getTime();
          const bEnd = new Date(booking.endTime).getTime();
          const sStart = slotStartDate.getTime();
          const sEnd = slotEndDate.getTime();

          // Standard interval overlap condition: max(start1, start2) < min(end1, end2)
          return Math.max(bStart, sStart) < Math.min(bEnd, sEnd);
        });

        if (!hasCollision) {
          // Format user-friendly time string (e.g. "10:00 AM")
          const formattedTime = formatZoned(slotStartDate, 'hh:mm a', { timeZone });
          slots.push({
            date: dateStr,
            startTime: slotStartDate.toISOString(),
            endTime: slotEndDate.toISOString(),
            formattedTime,
            formattedRange: `${formattedTime} – ${formatZoned(slotEndDate, 'hh:mm a', { timeZone })}`,
            durationMinutes: sessionDuration,
            timeZone,
          });
        }
      }
    }

    // Step forward by sessionDuration + bufferTime
    currentMinuteOffset += sessionDuration + bufferTime;
  }

  return slots;
}
