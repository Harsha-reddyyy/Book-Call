import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Mail,
  Download,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Toast from '../components/Toast';
import { api } from '../services/api';

const WEEKDAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active navigation tab: 'bookings' | 'availability' | 'policies'
  const [activeTab, setActiveTab] = useState('bookings');

  // Admin user
  const [adminUser, setAdminUser] = useState(null);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Availability settings state
  const [availability, setAvailability] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Policy state
  const [policyType, setPolicyType] = useState('cancellation_refund');
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('harsha_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    async function verifyAuth() {
      try {
        const res = await api.getAdminMe();
        if (res.success && res.admin) {
          setAdminUser(res.admin);
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    }

    verifyAuth();
  }, [navigate]);

  // Load bookings
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getAdminBookings(params);
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load bookings' });
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [activeTab, statusFilter]);

  // Load availability settings
  const loadAvailability = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.getAdminAvailability();
      if (res.success && res.settings) {
        setAvailability(res.settings);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load availability' });
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'availability') {
      loadAvailability();
    }
  }, [activeTab]);

  // Load policy
  const loadPolicy = async (type) => {
    setLoadingPolicy(true);
    try {
      const res = await api.getPolicy(type);
      if (res.success && res.policy) {
        setPolicyTitle(res.policy.title);
        setPolicyContent(res.policy.content);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load policy' });
    } finally {
      setLoadingPolicy(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'policies') {
      loadPolicy(policyType);
    }
  }, [activeTab, policyType]);

  const handleLogout = () => {
    localStorage.removeItem('harsha_admin_token');
    localStorage.removeItem('harsha_admin_user');
    navigate('/admin/login');
  };

  // Actions on a booking
  const handleRetryCalendar = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.retryCalendar(id);
      setToast({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      if (res.success) {
        loadBookings();
        if (selectedBooking && selectedBooking._id === id) {
          setSelectedBooking(res.booking);
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryEmail = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.retryEmail(id);
      setToast({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      if (res.success) {
        loadBookings();
        if (selectedBooking && selectedBooking._id === id) {
          setSelectedBooking(res.booking);
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.updateBookingStatus(id, { bookingStatus: newStatus });
      setToast({ type: 'success', message: 'Status updated successfully' });
      loadBookings();
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(res.booking);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Save availability
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.updateAdminAvailability(availability);
      if (res.success) {
        setToast({ type: 'success', message: 'Availability settings saved successfully!' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleDay = (dayId) => {
    if (!availability) return;
    const current = availability.availableDays || [];
    const updated = current.includes(dayId)
      ? current.filter((d) => d !== dayId)
      : [...current, dayId];
    setAvailability({ ...availability, availableDays: updated });
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) {
      setToast({ type: 'error', message: 'Please select a valid date (YYYY-MM-DD).' });
      return;
    }
    const current = availability.blockedDates || [];
    if (!current.includes(newBlockedDate)) {
      setAvailability({ ...availability, blockedDates: [...current, newBlockedDate] });
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (dateToRemove) => {
    const updated = (availability.blockedDates || []).filter((d) => d !== dateToRemove);
    setAvailability({ ...availability, blockedDates: updated });
  };

  // Save policy
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await api.updatePolicy(policyType, policyTitle, policyContent);
      if (res.success) {
        setToast({ type: 'success', message: 'Policy content updated successfully!' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Admin Top Header */}
      <header className="admin-header">
        <div className="admin-header-row">
          <div className="admin-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Harsha</span>
              <span className="brand-dot" />
            </Link>
            <span className="admin-badge">Admin Portal</span>
          </div>

          {/* User Actions */}
          <div className="admin-user-actions">
            <span className="admin-user-name">
              <strong>{adminUser?.username || 'Admin'}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm admin-sign-out-btn"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="sign-out-btn-text">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Calendar size={16} />
            <span>Bookings</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            <Settings size={16} />
            <span>Availability Settings</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            <FileText size={16} />
            <span>Policy Editor</span>
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="admin-main">
        {/* ================= TAB 1: BOOKINGS ================= */}
        {activeTab === 'bookings' && (
          <div>
            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="toolbar-filters">
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input toolbar-search"
                    placeholder="Search name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadBookings()}
                  />
                </div>

                {/* Status Filter */}
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="reserved">Reserved (Pending)</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>

                <button
                  type="button"
                  onClick={loadBookings}
                  className="btn btn-secondary btn-sm"
                  title="Refresh bookings"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Actions */}
              <div className="toolbar-actions">
                <button
                  type="button"
                  onClick={api.exportBookingsCsv}
                  className="btn btn-secondary btn-sm"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Bookings View: Desktop Table & Mobile Cards */}
            <div className="table-container">
              {loadingBookings ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No bookings found matching your current filter.
                </div>
              ) : (
                <>
                  {/* Desktop Table (Visible >= 768px) */}
                  <div className="admin-desktop-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Topic</th>
                          <th>Date & Time (IST)</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Meet Link</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => {
                          const startDate = new Date(b.startTime);
                          const dateStr = startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'Asia/Kolkata',
                          });
                          const timeStr = startDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata',
                          });

                          return (
                            <tr key={b._id}>
                              <td>
                                <span className="table-booking-id">{b.bookingId}</span>
                              </td>
                              <td>
                                <div className="table-cust-name">{b.customerName}</div>
                                <div className="table-cust-email">{b.customerEmail}</div>
                              </td>
                              <td>{b.selectedTopic}</td>
                              <td>
                                <div>{dateStr}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  {timeStr}
                                </div>
                              </td>
                              <td>
                                <span className={`status-pill status-${b.paymentStatus}`}>
                                  {b.paymentStatus}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill status-${b.bookingStatus}`}>
                                  {b.bookingStatus}
                                </span>
                              </td>
                              <td>
                                {b.googleMeetUrl ? (
                                  <a
                                    href={b.googleMeetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <span>Join</span>
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedBooking(b)}
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Booking Cards (Visible < 768px) */}
                  <div className="admin-mobile-cards-wrap">
                    {bookings.map((b) => {
                      const startDate = new Date(b.startTime);
                      const dateStr = startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'Asia/Kolkata',
                      });
                      const timeStr = startDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata',
                      });

                      return (
                        <div key={b._id} className="admin-booking-card">
                          <div className="admin-card-header">
                            <span className="table-booking-id">{b.bookingId}</span>
                            <div className="admin-card-status-group">
                              <span className={`status-pill status-${b.paymentStatus}`}>
                                {b.paymentStatus}
                              </span>
                              <span className={`status-pill status-${b.bookingStatus}`}>
                                {b.bookingStatus}
                              </span>
                            </div>
                          </div>

                          <div className="admin-card-body">
                            <div className="admin-card-cust">
                              <strong>{b.customerName}</strong>
                              <span className="admin-card-email">{b.customerEmail}</span>
                            </div>

                            <div className="admin-card-meta-row">
                              <div className="admin-card-meta-item">
                                <span className="meta-tag">{b.selectedTopic}</span>
                              </div>
                              <div className="admin-card-meta-item">
                                <Clock size={13} style={{ color: 'var(--accent)' }} />
                                <span>{dateStr} · {timeStr} IST</span>
                              </div>
                            </div>
                          </div>

                          <div className="admin-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => setSelectedBooking(b)}
                            >
                              View Details
                            </button>
                            {b.googleMeetUrl && (
                              <a
                                href={b.googleMeetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span>Join Meet</span>
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: AVAILABILITY SETTINGS ================= */}
        {activeTab === 'availability' && (
          <div>
            {loadingSettings || !availability ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <p>Loading availability configuration...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveAvailability}>
                <div className="settings-grid">
                  {/* Left Column: Schedule & Working Days */}
                  <div className="settings-card">
                    <h3 className="settings-card-title">Weekly Schedule & Working Hours</h3>

                    <label className="form-label">Available Days of the Week</label>
                    <div className="days-selector">
                      {WEEKDAYS.map((day) => {
                        const isChecked = (availability.availableDays || []).includes(day.id);
                        return (
                          <label
                            key={day.id}
                            className={`day-checkbox-label ${isChecked ? 'selected' : ''}`}
                            onClick={() => toggleDay(day.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ display: 'none' }}
                            />
                            <span>{day.name}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Start Time (IST)</label>
                        <input
                          type="time"
                          className="form-input"
                          value={availability.workingHoursStart || '10:00'}
                          onChange={(e) =>
                            setAvailability({ ...availability, workingHoursStart: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time (IST)</label>
                        <input
                          type="time"
                          className="form-input"
                          value={availability.workingHoursEnd || '19:00'}
                          onChange={(e) =>
                            setAvailability({ ...availability, workingHoursEnd: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Call Duration (Minutes)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.sessionDuration || 20}
                          onChange={(e) =>
                            setAvailability({
                              ...availability,
                              sessionDuration: parseInt(e.target.value, 10),
                            })
                          }
                          min={10}
                          max={120}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Buffer Between Calls (Minutes)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.bufferTime || 10}
                          onChange={(e) =>
                            setAvailability({
                              ...availability,
                              bufferTime: parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={60}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Consultation Fee (₹ INR)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={availability.priceInr || 399}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            priceInr: parseInt(e.target.value, 10),
                          })
                        }
                        min={1}
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Limits & Blocked Dates */}
                  <div className="settings-card">
                    <h3 className="settings-card-title">Booking Rules & Blackout Dates</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Minimum Notice (Hours)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.minimumNoticeHours || 2}
                          onChange={(e) =>
                            setAvailability({
                              ...availability,
                              minimumNoticeHours: parseInt(e.target.value, 10),
                            })
                          }
                          min={0}
                          max={48}
                          required
                        />
                        <div className="form-hint">Prevent last-minute surprises.</div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max Advance Booking (Days)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.maxAdvanceDays || 30}
                          onChange={(e) =>
                            setAvailability({
                              ...availability,
                              maxAdvanceDays: parseInt(e.target.value, 10),
                            })
                          }
                          min={1}
                          max={90}
                          required
                        />
                        <div className="form-hint">Furthest days ahead visitors can book.</div>
                      </div>
                    </div>

                    {/* Blocked Dates Manager */}
                    <div className="form-group">
                      <label className="form-label">Block Specific Dates (Holidays / Days Off)</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={newBlockedDate}
                          onChange={(e) => setNewBlockedDate(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={addBlockedDate}
                        >
                          <Plus size={16} />
                          <span>Block Date</span>
                        </button>
                      </div>

                      {availability.blockedDates && availability.blockedDates.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {availability.blockedDates.map((d) => (
                            <span key={d} className="badge badge-neutral" style={{ padding: '6px 10px' }}>
                              <span>{d}</span>
                              <button
                                type="button"
                                onClick={() => removeBlockedDate(d)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  marginLeft: '4px',
                                  color: 'var(--danger)',
                                }}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="form-hint">No individual dates currently blocked.</div>
                      )}
                    </div>

                    <div style={{ marginTop: '36px' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving Settings...' : 'Save Availability Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB 3: POLICY EDITOR ================= */}
        {activeTab === 'policies' && (
          <div className="policy-editor-card">
            <h3 className="settings-card-title">Customer Policies & Terms Editor</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              These policies are publicly accessible to customers before and after booking.
            </p>

            {/* Policy Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                className={`btn ${policyType === 'cancellation_refund' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setPolicyType('cancellation_refund')}
              >
                Cancellation & Refund
              </button>
              <button
                type="button"
                className={`btn ${policyType === 'privacy_policy' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setPolicyType('privacy_policy')}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className={`btn ${policyType === 'terms_of_service' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setPolicyType('terms_of_service')}
              >
                Terms of Service
              </button>
            </div>

            {loadingPolicy ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
                <p>Loading policy content...</p>
              </div>
            ) : (
              <form onSubmit={handleSavePolicy}>
                <div className="form-group">
                  <label className="form-label">Policy Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={policyTitle}
                    onChange={(e) => setPolicyTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Policy Content (Markdown / Text)</label>
                  <textarea
                    rows={14}
                    className="form-textarea"
                    value={policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    required
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPolicy}
                >
                  {savingPolicy ? 'Saving Policy...' : 'Save Policy Changes'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Booking {selectedBooking.bookingId}</h3>
                <span className={`status-pill status-${selectedBooking.bookingStatus}`} style={{ marginTop: '4px' }}>
                  {selectedBooking.bookingStatus}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBooking(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-grid">
              <div>
                <span className="conf-label">Customer Name</span>
                <div style={{ fontWeight: 600 }}>{selectedBooking.customerName}</div>
              </div>
              <div>
                <span className="conf-label">Customer Email</span>
                <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{selectedBooking.customerEmail}</div>
              </div>
              <div>
                <span className="conf-label">Topic</span>
                <div>{selectedBooking.selectedTopic}</div>
              </div>
              <div>
                <span className="conf-label">Amount</span>
                <div>₹{(selectedBooking.amountPaise / 100).toFixed(2)} ({selectedBooking.paymentStatus})</div>
              </div>
              <div>
                <span className="conf-label">Time (IST)</span>
                <div>
                  {new Date(selectedBooking.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}
                </div>
              </div>
              <div>
                <span className="conf-label">Razorpay Order ID</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', wordBreak: 'break-all' }}>
                  {selectedBooking.razorpayOrderId || '—'}
                </div>
              </div>
            </div>

            {/* Google Meet Link */}
            <div style={{ marginBottom: '20px' }}>
              <span className="conf-label">Google Meet Link</span>
              {selectedBooking.googleMeetUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <a
                    href={selectedBooking.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', fontWeight: 600 }}
                  >
                    {selectedBooking.googleMeetUrl}
                  </a>
                  <ExternalLink size={14} style={{ color: 'var(--accent)' }} />
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Not yet generated (Status: {selectedBooking.calendarStatus || 'pending'})
                </div>
              )}
            </div>

            {/* Customer Questions */}
            <div style={{ marginBottom: '24px' }}>
              <span className="conf-label">Submitted Questions & Doubts</span>
              <div
                style={{
                  backgroundColor: 'var(--surface-subtle)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  marginTop: '6px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.94rem',
                }}
              >
                {selectedBooking.customerQuestions}
              </div>
            </div>

            {/* Operational Recovery Actions */}
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Administrative Actions:</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRetryCalendar(selectedBooking._id)}
                  disabled={actionLoading}
                >
                  <RefreshCw size={13} />
                  <span>Retry Google Meet Creation</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRetryEmail(selectedBooking._id)}
                  disabled={actionLoading}
                >
                  <Mail size={13} />
                  <span>Resend Confirmation Email</span>
                </button>

                {selectedBooking.bookingStatus !== 'cancelled' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)', borderColor: '#FFCDD2' }}
                    onClick={() => handleStatusChange(selectedBooking._id, 'cancelled')}
                    disabled={actionLoading}
                  >
                    Mark as Cancelled
                  </button>
                )}

                {selectedBooking.bookingStatus !== 'completed' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleStatusChange(selectedBooking._id, 'completed')}
                    disabled={actionLoading}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
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
    </div>
  );
}
