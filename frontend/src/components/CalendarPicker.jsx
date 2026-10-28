import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2, Calendar as CalIcon } from 'lucide-react';
import { api } from '../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPicker({ onSlotSelect, selectedSlot }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [monthData, setMonthData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  // Pad helper
  const pad = (n) => String(n).padStart(2, '0');

  // Load monthly availability overview
  useEffect(() => {
    let isMounted = true;
    async function fetchMonth() {
      setLoadingMonth(true);
      setError(null);
      try {
        const res = await api.getMonthAvailability(currentYear, currentMonth);
        if (isMounted && res.success) {
          setMonthData(res.days);

          // If no date is currently selected, or selected date is outside this month,
          // automatically select the first available date in this month!
          const firstAvailable = res.days.find((d) => d.hasAvailableSlots);
          if (firstAvailable && (!selectedDate || !selectedDate.startsWith(`${currentYear}-${pad(currentMonth)}`))) {
            setSelectedDate(firstAvailable.date);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoadingMonth(false);
      }
    }

    fetchMonth();
    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  // Load specific slots when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const res = await api.getAvailableSlots(selectedDate);
        if (isMounted && res.success) {
          setSlots(res.slots);
          // If previously selected slot is no longer in this list, clear selection
          if (selectedSlot && selectedSlot.date !== selectedDate) {
            onSlotSelect(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching slots:', err);
          setSlots([]);
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    }

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Month navigation
  const prevMonth = () => {
    if (isPrevDisabled()) return;
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isPrevDisabled = () => {
    return (
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() + 1
    );
  };

  // Build grid calendar
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleSlotClick = (slot) => {
    onSlotSelect(slot);
  };

  return (
    <div className="calendar-wrap">
      {/* Month Navigation */}
      <div className="calendar-month-nav">
        <h3 className="calendar-month-title">
          {MONTHS[currentMonth - 1]} {currentYear}
        </h3>
        <div className="calendar-nav-controls">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={prevMonth}
            disabled={isPrevDisabled()}
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={nextMonth}
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="calendar-grid">
        {DAYS.map((d, idx) => (
          <div key={d} className="calendar-day-header">
            <span className="cal-day-full">{d}</span>
            <span className="cal-day-mini">{DAYS_SHORT[idx]}</span>
          </div>
        ))}

        {/* Empty cells before day 1 */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day-empty" aria-hidden="true" />
        ))}

        {/* Calendar Day Buttons */}
        {Array.from({ length: totalDaysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${pad(currentMonth)}-${pad(dayNum)}`;
          const dayInfo = monthData.find((d) => d.date === dateStr);
          const hasSlots = dayInfo ? dayInfo.hasAvailableSlots : false;
          const isSelected = selectedDate === dateStr;
          const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() + 1 === currentMonth &&
            today.getDate() === dayNum;

          return (
            <button
              key={dateStr}
              type="button"
              className={`calendar-day-btn ${hasSlots ? 'has-slots' : ''} ${
                isSelected ? 'selected' : ''
              }`}
              disabled={!hasSlots || loadingMonth}
              onClick={() => handleDateClick(dateStr)}
              aria-label={`${dateStr}${hasSlots ? ' - Available' : ' - Unavailable'}`}
            >
              <span>{dayNum}</span>
              {isToday && <span className="calendar-today-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Available Slots Section */}
      <div className="slots-section">
        <div className="slots-header">
          <span className="slots-header-title">
            {selectedDate ? (
              <>Times for {(() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              })()}</>
            ) : (
              'Select a date to view available times'
            )}
          </span>
          <span className="slots-timezone">IST (UTC+05:30)</span>
        </div>

        {loadingSlots ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
          </div>
        ) : slots.length > 0 ? (
          <div className="slots-grid">
            {slots.map((slot) => {
              const isSlotSelected =
                selectedSlot && selectedSlot.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  className={`slot-btn ${isSlotSelected ? 'selected' : ''}`}
                  onClick={() => handleSlotClick(slot)}
                  aria-pressed={isSlotSelected}
                >
                  <Clock size={13} className="slot-btn-icon" />
                  <span>{slot.formattedTime}</span>
                </button>
              );
            })}
          </div>
        ) : selectedDate ? (
          <div className="slots-empty">
            No slots available on this date. Please pick another day.
          </div>
        ) : null}
      </div>
    </div>
  );
}
