import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand-logo" aria-label="Harsha Homepage">
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
              <Link to="/book" className="footer-link">Book a Call — ₹299</Link>
              <a href="/#topics" className="footer-link">Topics</a>
              <a href="/#how-it-works" className="footer-link">How It Works</a>
              <a href="/#about" className="footer-link">About Harsha</a>
              <a href="/#faq" className="footer-link">FAQ</a>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Connect</span>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Instagram (@harshatalks)
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                YouTube (Harsha Talks)
              </a>
              <a href="mailto:harsha@example.com" className="footer-link">
                harsha@example.com
              </a>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">Legal & Policies</span>
              <Link to="/cancellation-refund" className="footer-link">Cancellation & Refund Policy</Link>
              <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms and Conditions</Link>
              <Link to="/admin/login" className="footer-link" style={{ color: 'var(--text-muted)' }}>
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {currentYear} Harsha Talks. All rights reserved.</span>
          <span>Indian Standard Time (IST, UTC+05:30)</span>
        </div>
      </div>
    </footer>
  );
}
