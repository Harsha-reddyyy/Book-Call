# Harsha — 1-on-1 Personal Consultation Booking Platform

A production-ready, custom-crafted personal consultation booking website for **Harsha**, allowing followers and creators from YouTube, Instagram, and social platforms to book dedicated 20-minute 1-on-1 consultations for **₹399 INR**.

Designed with an editorial, human-first aesthetic: warm off-white canvas, crisp charcoal typography, generous whitespace, and restrained warm orange accents. No bloated AI templates, no fake countdowns, no artificial scarcity, and no generic SaaS gradients.

---

## 🌟 Highlights & Architecture

- **Human-Centric Creator Design**: Built around typography, visual hierarchy, clarity, and trust.
- **Dedicated Booking Engine**:
  - Interactive calendar picker with Indian Standard Time (**Asia/Kolkata**, UTC+05:30) slot scheduling.
  - Automatic exclusion of past times, breaks (e.g. lunch), blackout dates, and off-days.
  - Minimum advance notice (configurable, default 2 hours) and maximum booking horizon (default 30 days).
- **Concurrency & Double-Booking Protection**:
  - Temporary **10-minute reservation hold window** (`expiresAt`) when a customer begins checkout.
  - Atomic database-level overlap validation preventing two customers from reserving the same slot.
  - Automatic background cleaner releasing expired, unpaid reservations.
- **Razorpay Payments (₹399 / 39900 paise)**:
  - Cryptographic HMAC-SHA256 signature verification.
  - Raw body webhook processor with idempotent confirmation handling (ensures booking is confirmed even if customer closes browser before redirect).
  - Out-of-the-box safe **development mode simulation** allowing complete end-to-end testing without needing live bank cards.
- **Google Calendar & Google Meet Integration**:
  - Automatically creates a Google Calendar event and generates a dedicated Google Meet room upon confirmed payment.
  - Resilient architecture: calendar failure never drops a paid booking; flags status for 1-click administrative retry.
- **Transactional Emails via Resend**:
  - Beautiful, accessible HTML & plain text booking confirmation sent immediately with meeting link, customer questions summary, and reschedule rules.
- **Protected Admin Dashboard**:
  - Rate-limited JWT authentication with bcrypt password hashing.
  - Bookings management with real-time status filtering (Confirmed, Reserved, Cancelled, Completed, Expired) and customer search.
  - Customer doubt viewer drawer with Razorpay transaction IDs and meeting links.
  - Availability manager: working days, hours, call duration, buffers, lunch breaks, and holiday blackout date manager.
  - Live policy editor for Cancellation & Refund Policy, Privacy Policy, and Terms of Service.
  - One-click CSV export.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Lucide Icons, Canvas Confetti, Custom CSS Design System (no bloated CSS frameworks).
- **Backend**: Node.js, Express.js, Mongoose, Razorpay SDK, Google APIs (`googleapis`), Resend SDK, JWT, bcryptjs, date-fns & date-fns-tz.
- **Database**: MongoDB (supports MongoDB Atlas, local MongoDB, or automatic in-memory fallback for instant zero-config testing).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Installation
Dependencies are already installed in this repository. To reinstall or update at any time:
```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Run Backend & Frontend Concurrently
From the root directory:
```bash
npm run dev
```

Or run individually:
```bash
# Terminal 1: Backend API (Port 5001)
npm run server

# Terminal 2: Frontend (Port 5173)
npm run client
```

### 4. Open in Browser
- **Public Landing Page & Booking**: [http://localhost:5173](http://localhost:5173)
- **Direct Booking Flow**: [http://localhost:5173/book](http://localhost:5173/book)
- **Admin Dashboard**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - **Default Username**: `harsha`
  - **Default Password**: `Harsha@2026`
- **Backend API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🧪 Testing

The platform includes automated unit and integration tests covering slot generation, timezone math, breaks, reservation expiry, payment verification, idempotency, and admin authentication:

```bash
npm test
```

Result: `14 passed, 0 failed` across 3 test suites.

---

## 🔑 Environment Variables Guide

Copy `.env.example` to `backend/.env` and `frontend/.env`:

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string (Leave blank for in-memory fallback) | `mongodb+srv://...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks | `your_webhook_secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-xxx` |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth2 Refresh Token | `1//04xxx` |
| `GOOGLE_CALENDAR_ID` | Target calendar ID | `primary` |
| `RESEND_API_KEY` | Resend API Key | `re_xxx` |
| `EMAIL_FROM` | Sender email address | `Harsha <bookings@yourdomain.com>` |
| `JWT_SECRET` | Secret for signing admin session tokens | `strong-random-hex-string` |
| `ADMIN_SETUP_SECRET` | Token for initial admin setup | `secret-setup-token` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5001/api` |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay Key ID | `rzp_test_...` |

---

## 💳 Razorpay Configuration: Test Mode vs Live Mode

### Test Mode (Free testing before launch)
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Toggle the switch at the top to **Test Mode**.
3. Go to **Account & Settings** → **API Keys** → **Generate Test Key**.
4. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env` and `VITE_RAZORPAY_KEY_ID` in `frontend/.env`.
5. Test payments using Razorpay's test UPI IDs (e.g. `success@razorpay`) or test cards.

### Webhook Setup (Crucial for 100% reliability)
1. In Razorpay Dashboard, go to **Account & Settings** → **Webhooks** → **Add New Webhook**.
2. Webhook URL: `https://your-backend-domain.com/api/payments/webhook`
3. Secret: Enter a strong random secret and copy it to `RAZORPAY_WEBHOOK_SECRET`.
4. Active Events: Select:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
5. Save the webhook.

### Switching to Live Mode
1. Ensure your Razorpay account KYC is approved and business details are verified.
2. Toggle to **Live Mode** in Razorpay Dashboard.
3. Generate **Live API Keys**.
4. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your backend environment variables (e.g. on Render) and frontend (`VITE_RAZORPAY_KEY_ID` on Vercel).

---

## 📅 Google Calendar & Meet Integration Setup

To allow the system to create Google Calendar events with Google Meet links automatically:

1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create a project named `Harsha-Booking`.
3. Go to **APIs & Services** → **Library**, search for **Google Calendar API**, and click **Enable**.
4. Go to **APIs & Services** → **OAuth consent screen**:
   - User Type: **External**
   - App Name: `Harsha Booking`
   - Developer contact email: your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar.events`
5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**:
   - Application Type: **Web application**
   - Authorized redirect URIs: Add `https://developers.google.com/oauthplayground`
   - Copy the generated `Client ID` and `Client Secret`.
6. Generate a Refresh Token via Google OAuth Playground:
   - Go to [Google Developers OAuth Playground](https://developers.google.com/oauthplayground).
   - Click the gear icon (top right), check **Use your own OAuth credentials**, and paste your `Client ID` and `Client Secret`.
   - In Step 1 (Select & authorize APIs), paste `https://www.googleapis.com/auth/calendar.events` and click **Authorize APIs**.
   - Sign in with your Google account and grant permissions.
   - In Step 2, click **Exchange authorization code for tokens**.
   - Copy the `refresh_token`.
7. Paste `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` into your `backend/.env`.

---

## ✉️ Resend Email Setup

1. Sign up at [resend.com](https://resend.com).
2. Go to **Domains** and add your domain (e.g. `yourdomain.com`).
3. Add the required DNS records (SPF, DKIM, MX) in your domain registrar (GoDaddy, Namecheap, Cloudflare).
4. Go to **API Keys** → **Create API Key**.
5. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Harsha <bookings@yourdomain.com>`) in `backend/.env`.

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push this repository to GitHub.
2. In Vercel, import the repository and select `frontend` as the **Root Directory**.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_live_...`
7. Click **Deploy**.

### Backend Deployment (Render / Railway)
1. In Render, create a new **Web Service** connected to your repository.
2. Root Directory: `backend`.
3. Environment: `Node`.
4. Build Command: `npm install`.
5. Start Command: `node src/server.js`.
6. Add the environment variables from `backend/.env.example`:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: Random 32+ character string.
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
   - `RESEND_API_KEY`, `EMAIL_FROM`.
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`.
7. Click **Deploy**.

---

## ✅ Pre-Launch Checklist

Before announcing your consultation booking link on Instagram or YouTube:

- [ ] MongoDB Atlas cluster created and connected.
- [ ] Razorpay Live API Keys generated and placed in backend & frontend environment variables.
- [ ] Razorpay Webhook registered pointing to your live backend `/api/payments/webhook`.
- [ ] Google Calendar API credentials & refresh token generated and tested.
- [ ] Resend domain verified and test email sent.
- [ ] Admin default password changed in Admin Portal.
- [ ] Working days, hours, lunch breaks, and buffer times reviewed in Admin Portal.
- [ ] Complete one real test booking end-to-end with a ₹399 payment.
