import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section-cta">
      <div className="container">
        <div className="cta-box">
          <div className="section-label">Get Started</div>
          <h2>Have something you want to figure out?</h2>
          <p>
            Book a one-on-one session and let's talk through it. We'll cut through
            the noise and focus on what actually moves your work forward.
          </p>

          <Link to="/book" className="btn btn-primary btn-lg">
            <span>Book Your Call — ₹299</span>
            <ArrowRight size={18} />
          </Link>

          <div className="cta-subtext">
            <Clock size={15} style={{ flexShrink: 0 }} />
            <span>30–40 minute dedicated 1-on-1 session on Google Meet · 10 AM – 8 PM IST</span>
          </div>
        </div>
      </div>
    </section>
  );
}
