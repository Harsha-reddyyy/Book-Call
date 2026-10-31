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

  // Booking edit / reschedule state
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [savingBookingEdit, setSavingBookingEdit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

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

  // Customer records delete & cleanup state
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupScope, setCleanupScope] = useState('cancelled_expired');
  const [cleaningUp, setCleaningUp] = useState(false);

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

  // Delete a single booking
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    setDeletingBooking(true);
    try {
      const res = await api.deleteBooking(bookingToDelete._id);
      if (res.success) {
        setToast({ type: 'success', message: res.message || 'Booking deleted successfully.' });
        if (selectedBooking && selectedBooking._id === bookingToDelete._id) {
          setSelectedBooking(null);
        }
        setBookingToDelete(null);
        loadBookings();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to delete booking.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error deleting booking.' });
    } finally {
      setDeletingBooking(false);
    }
  };

  // Bulk cleanup customer records
  const handleConfirmCleanup = async () => {
    setCleaningUp(true);
    try {
      const res = await api.cleanupBookings(cleanupScope);
      if (res.success) {
        setToast({
          type: 'success',
          message: res.message || `Cleaned up ${res.deletedCount} booking(s).`,
        });
        setShowCleanupModal(false);
        loadBookings();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to clean up records.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error cleaning up records.' });
    } finally {
      setCleaningUp(false);
    }
  };

  // Open booking detail drawer and pre-fill reschedule inputs
  const handleOpenBookingDetails = (b) => {
    setSelectedBooking(b);
    if (b) {
      const d = new Date(b.startTime);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const timeStr = d.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setEditDate(dateStr);
      setEditTime(timeStr);
      setEditPhone(b.customerPhone || '');
      setEditTopic(b.selectedTopic || '');
      setShowReschedule(false);
    }
  };

  // Save rescheduled booking date/time and contact details
  const handleSaveBookingEdit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBooking) return;
    if (!editDate || !editTime) {
      setToast({ type: 'error', message: 'Please specify both date and time.' });
      return;
    }

    setSavingBookingEdit(true);
    try {
      const isoString = `${editDate}T${editTime}:00+05:30`;
      const newStart = new Date(isoString);
      if (isNaN(newStart.getTime())) {
        throw new Error('Invalid date or time entered.');
      }

      const durationMin = availability?.sessionDuration || 20;
      const newEnd = new Date(newStart.getTime() + durationMin * 60 * 1000);

      const res = await api.updateBookingStatus(selectedBooking._id, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        customerPhone: editPhone.trim(),
        selectedTopic: editTopic.trim(),
      });

      if (res.success) {
        setToast({ type: 'success', message: 'Booking rescheduled & updated successfully!' });
        setSelectedBooking(res.booking);
        setShowReschedule(false);
        loadBookings();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to update booking.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error updating booking.' });
    } finally {
      setSavingBookingEdit(false);
    }
  };

  // Save availability
  const handleSaveAvailability = async (e) => {
    if (e) e.preventDefault();
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

  const selectAllDays = () => {
    if (!availability) return;
    setAvailability({ ...availability, availableDays: [0, 1, 2, 3, 4, 5, 6] });
    setToast({ type: 'success', message: 'All 7 days selected. Click Save Changes to apply.' });
  };

  const selectWeekdaysOnly = () => {
    if (!availability) return;
    setAvailability({ ...availability, availableDays: [1, 2, 3, 4, 5] });
    setToast({ type: 'success', message: 'Mon – Fri selected. Click Save Changes to apply.' });
  };

  const selectMonSat = () => {
    if (!availability) return;
    setAvailability({ ...availability, availableDays: [1, 2, 3, 4, 5, 6] });
    setToast({ type: 'success', message: 'Mon – Sat selected. Click Save Changes to apply.' });
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDate)) {
      setToast({ type: 'error', message: 'Please select a valid date (YYYY-MM-DD).' });
      return;
    }
    const current = availability.blockedDates || [];
    if (current.includes(newBlockedDate)) {
      setToast({ type: 'error', message: `${newBlockedDate} is already blocked.` });
      return;
    }
    setAvailability({ ...availability, blockedDates: [...current, newBlockedDate].sort() });
    setToast({ type: 'success', message: `Added ${newBlockedDate} to blocked dates. Click Save Changes to apply.` });
    setNewBlockedDate('');
  };

  const removeBlockedDate = (dateToRemove) => {
    const updated = (availability.blockedDates || []).filter((d) => d !== dateToRemove);
    setAvailability({ ...availability, blockedDates: updated });
    setToast({ type: 'success', message: `Removed ${dateToRemove} from blocked dates. Click Save Changes to apply.` });
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
            <button
              type="button"
              onClick={() => setShowCleanupModal(true)}
              className="btn btn-secondary btn-sm admin-delete-btn"
              title="Clean up / Delete customer records"
              style={{
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} />
              <span className="sign-out-btn-text">Clean Records</span>
            </button>

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
              <div className="toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCleanupModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="Clean up / Delete customer records"
                >
                  <Trash2 size={14} />
                  <span>Clean Records</span>
                </button>
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
                            weekday: 'short',
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
                                {b.customerPhone && (
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    📞 <a href={`tel:${b.customerPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{b.customerPhone}</a>
                                  </div>
                                )}
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
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleOpenBookingDetails(b)}
                                  >
                                    Details
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: '#ef4444', padding: '6px 8px' }}
                                    onClick={() => setBookingToDelete(b)}
                                    title={`Delete booking ${b.bookingId}`}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
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
                        weekday: 'short',
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
                              {b.customerPhone && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                  📞 {b.customerPhone}
                                </span>
                              )}
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
                              onClick={() => handleOpenBookingDetails(b)}
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
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444', padding: '6px 10px' }}
                              onClick={() => setBookingToDelete(b)}
                              title="Delete booking"
                            >
                              <Trash2 size={14} />
                            </button>
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
                {/* Top Action Bar */}
                <div className="availability-top-bar">
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Availability & Schedule Settings</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Control working days, call hours, pricing, and blackout dates.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>

                <div className="settings-grid">
                  {/* Left Column: Schedule & Working Days */}
                  <div className="settings-card">
                    <h3 className="settings-card-title">Weekly Schedule & Working Hours</h3>

                    <label className="form-label">Available Days of the Week</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={selectAllDays}
                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                      >
                        ✓ Select All 7 Days
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={selectWeekdaysOnly}
                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                      >
                        Mon – Fri Only
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={selectMonSat}
                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                      >
                        Mon – Sat
                      </button>
                    </div>

                    <div className="days-selector" role="group" aria-label="Available Days">
                      {WEEKDAYS.map((day) => {
                        const isChecked = (availability.availableDays || []).includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            className={`day-checkbox-label ${isChecked ? 'selected' : ''}`}
                            onClick={() => toggleDay(day.id)}
                            aria-pressed={isChecked}
                          >
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                border: isChecked ? 'none' : '1.5px solid var(--border-color)',
                                backgroundColor: isChecked ? 'var(--accent)' : 'transparent',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 'bold',
                              }}
                            >
                              {isChecked ? '✓' : ''}
                            </span>
                            <span>{day.name}</span>
                          </button>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Consultation Fee (₹ INR)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.priceInr ?? 399}
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
                      <div className="form-group">
                        <label className="form-label">Original Fee (Strike-through ₹ INR)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.originalPriceInr ?? 499}
                          onChange={(e) =>
                            setAvailability({
                              ...availability,
                              originalPriceInr: parseInt(e.target.value, 10),
                            })
                          }
                          min={1}
                        />
                        <div className="form-hint">Shown crossed-out to highlight discount.</div>
                      </div>
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
                          value={availability.minimumNoticeHours ?? 2}
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
                        <div className="form-hint">Prevent last-minute bookings.</div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max Advance Booking (Days)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={availability.maxAdvanceDays ?? 30}
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addBlockedDate();
                            }
                          }}
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
                            <span key={d} className="badge badge-neutral" style={{ padding: '6px 10px', fontSize: '0.86rem' }}>
                              <span>{d}</span>
                              <button
                                type="button"
                                onClick={() => removeBlockedDate(d)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  marginLeft: '6px',
                                  color: 'var(--danger)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                                title="Unblock date"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="form-hint">No individual dates currently blocked. Select a date above to block.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="availability-save-footer">
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    Remember to save after toggling days or blocking dates.
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Settings...</span>
                      </>
                    ) : (
                      'Save Availability Changes'
                    )}
                  </button>
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
                <span className="conf-label">Phone / WhatsApp</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedBooking.customerPhone ? (
                    <span>
                      <a href={`tel:${selectedBooking.customerPhone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        {selectedBooking.customerPhone}
                      </a>
                      {' · '}
                      <a
                        href={`https://wa.me/${selectedBooking.customerPhone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
                      >
                        WhatsApp
                      </a>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                  )}
                </div>
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

            {/* Reschedule / Edit Booking Date & Details */}
            <div className="reschedule-card">
              <div className="reschedule-header">
                <div className="reschedule-title">
                  <Calendar size={16} style={{ color: 'var(--accent)' }} />
                  <span>Reschedule Call / Edit Booking</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowReschedule(!showReschedule)}
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  {showReschedule ? 'Cancel / Close' : 'Reschedule Date & Time'}
                </button>
              </div>

              {showReschedule ? (
                <form onSubmit={handleSaveBookingEdit} style={{ marginTop: '12px' }}>
                  <div className="reschedule-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>New Date (IST)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>New Start Time (IST)</label>
                      <input
                        type="time"
                        className="form-input"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Phone / WhatsApp</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91..."
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem' }}>Topic</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowReschedule(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={savingBookingEdit}
                    >
                      {savingBookingEdit ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        'Save Rescheduled Date & Time'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Need to change the date or time? Click <strong>Reschedule Date & Time</strong> above to pick a new date/time or update contact info.
                </div>
              )}
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

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', borderColor: '#FFCDD2' }}
                  onClick={() => setBookingToDelete(selectedBooking)}
                  disabled={actionLoading}
                >
                  <Trash2 size={13} />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Booking Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                <h3 className="modal-title" style={{ margin: 0 }}>Delete Customer Record</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setBookingToDelete(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this customer booking? This cannot be undone.
            </p>

            <div
              style={{
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '0.88rem',
              }}
            >
              <div><strong>Booking ID:</strong> {bookingToDelete.bookingId}</div>
              <div style={{ marginTop: '4px' }}><strong>Customer:</strong> {bookingToDelete.customerName} ({bookingToDelete.customerEmail})</div>
              {bookingToDelete.customerPhone && (
                <div style={{ marginTop: '4px' }}><strong>Phone:</strong> {bookingToDelete.customerPhone}</div>
              )}
              <div style={{ marginTop: '4px' }}>
                <strong>Scheduled:</strong>{' '}
                {new Date(bookingToDelete.startTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
              </div>
              <div style={{ marginTop: '4px' }}>
                <strong>Status:</strong> <span className={`status-pill status-${bookingToDelete.bookingStatus}`}>{bookingToDelete.bookingStatus}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBookingToDelete(null)}
                disabled={deletingBooking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleConfirmDelete}
                disabled={deletingBooking}
              >
                {deletingBooking ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Cleanup / Bulk Delete Modal */}
      {showCleanupModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                <h3 className="modal-title" style={{ margin: 0 }}>Clean Up Customer Records</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCleanupModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
              Free up database storage and keep your dashboard clean by removing past, cancelled, or inactive customer bookings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  border: `1.5px solid ${cleanupScope === 'cancelled_expired' ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: cleanupScope === 'cancelled_expired' ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="cleanupScope"
                  value="cancelled_expired"
                  checked={cleanupScope === 'cancelled_expired'}
                  onChange={() => setCleanupScope('cancelled_expired')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Cancelled & Expired Bookings (Recommended)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Removes bookings that were cancelled or timed out during checkout. Safest cleanup.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  border: `1.5px solid ${cleanupScope === 'completed' ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: cleanupScope === 'completed' ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="cleanupScope"
                  value="completed"
                  checked={cleanupScope === 'completed'}
                  onChange={() => setCleanupScope('completed')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Completed Bookings</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Removes past calls that have already concluded.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  border: `1.5px solid ${cleanupScope === 'all' ? '#ef4444' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: cleanupScope === 'all' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="cleanupScope"
                  value="all"
                  checked={cleanupScope === 'all'}
                  onChange={() => setCleanupScope('all')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ef4444' }}>All Booking Records (Reset Database)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Permanently deletes all customer booking records. Use for a fresh start.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCleanupModal(false)}
                disabled={cleaningUp}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleConfirmCleanup}
                disabled={cleaningUp}
              >
                {cleaningUp ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Cleaning Up...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Selected Records</span>
                  </>
                )}
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
    </div>
  );
}
