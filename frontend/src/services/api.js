const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function getAuthHeader() {
  const token = localStorage.getItem('harsha_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // Public Availability
  async getAvailabilitySettings() {
    const res = await fetch(`${API_BASE_URL}/availability/settings`);
    return handleResponse(res);
  },

  async getAvailableSlots(dateStr) {
    const res = await fetch(`${API_BASE_URL}/availability/slots?date=${dateStr}`);
    return handleResponse(res);
  },

  async getMonthAvailability(year, month) {
    const res = await fetch(`${API_BASE_URL}/availability/month?year=${year}&month=${month}`);
    return handleResponse(res);
  },

  // Public Booking & Reservation
  async reserveSlot(bookingData) {
    const res = await fetch(`${API_BASE_URL}/bookings/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },

  async getBookingDetails(bookingId) {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
    return handleResponse(res);
  },

  // Payment Verification
  async verifyPayment(paymentPayload) {
    const res = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });
    return handleResponse(res);
  },

  // Public Policies
  async getPolicy(type) {
    const res = await fetch(`${API_BASE_URL}/policies/${type}`);
    return handleResponse(res);
  },

  // Admin Auth
  async adminLogin(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async getAdminMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Admin Bookings Management
  async getAdminBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/admin/bookings?${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateBookingStatus(id, updateData) {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse(res);
  },

  async retryCalendar(id) {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/retry-calendar`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async retryEmail(id) {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/retry-email`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async deleteBooking(id) {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async cleanupBookings(scope = 'cancelled_expired') {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/cleanup?scope=${encodeURIComponent(scope)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Admin Availability
  async getAdminAvailability() {
    const res = await fetch(`${API_BASE_URL}/admin/availability`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateAdminAvailability(settings) {
    const res = await fetch(`${API_BASE_URL}/admin/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  // Admin Policy Editor
  async updatePolicy(type, title, content) {
    const res = await fetch(`${API_BASE_URL}/policies/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ title, content }),
    });
    return handleResponse(res);
  },

  // Export CSV
  async exportBookingsCsv() {
    const res = await fetch(`${API_BASE_URL}/admin/export-csv`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harsha-consultations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
