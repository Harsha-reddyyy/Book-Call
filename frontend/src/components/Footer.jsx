import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand-logo">
              <span>Harsha</span>
              <span className="brand-dot" aria-hidden="true" />
            </Link>
            <p>
              One-on-one personal consultation sessions for aspiring creators,
              YouTubers, and people building with AI tools.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <span className="footer-col-title">Navigation</span>
              <Link to="/book">Book a Consultation</Link>
              <a href="/#topics">Topics</a>
              <a href="/#how-it-works">How It Works</a>
              <a href="/#faq">FAQ</a>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Social</span>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
              <a href="mailto:harsha@example.com">Contact Email</a>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Legal & Policies</span>
              <Link to="/cancellation-refund">Cancellation & Refund Policy</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms and Conditions</Link>
              <Link to="/admin/login" style={{ color: 'var(--text-muted)' }}>
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {currentYear} Harsha. All rights reserved.</span>
          <span>Indian Standard Time (IST, UTC+05:30)</span>
        </div>
      </div>
    </footer>
  );
}
