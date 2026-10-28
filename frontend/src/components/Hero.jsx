import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Video, User, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const scrollToTopics = (e) => {
    e.preventDefault();
    const elem = document.getElementById('topics');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Copy & Offer */}
          <div className="hero-content">
            <div className="hero-pill">
              <span className="hero-pill-status" aria-hidden="true" />
              <span>Available 10:00 AM – 8:00 PM IST · 1-on-1 Calls</span>
            </div>

            <h1 className="hero-title">
              Let's figure it out together.
            </h1>

            <p className="hero-lead">
              Got questions about AI tools, YouTube growth, or creator workflows? Book a
              one-on-one consultation with Harsha. Bring what you're working on, and let's
              clear your doubts with zero fluff.
            </p>

            {/* Early Bird Offer Card */}
            <div className="hero-offer-card">
              <div className="offer-badge">
                <Sparkles size={14} />
                <span>Early Bird Offer — Save 40%</span>
              </div>
              <div className="offer-pricing-row">
                <div className="offer-price-wrap">
                  <span className="offer-price-current">₹299</span>
                  <span className="offer-price-original">₹499</span>
                  <span className="offer-price-currency">INR</span>
                </div>
                <div className="offer-duration-tag">
                  <Clock size={15} />
                  <span>30–40 Mins Deep Dive</span>
                </div>
              </div>
              <p className="offer-hint">
                <CheckCircle2 size={14} className="offer-check" />
                <span>Direct 1-on-1 Google Meet · Instant calendar invite with 30m reminder</span>
              </p>
            </div>

            <div className="hero-actions">
              <Link to="/book" className="btn btn-primary btn-lg hero-cta-btn">
                <span>Book a Call — ₹299</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#topics"
                onClick={scrollToTopics}
                className="btn btn-secondary btn-lg"
              >
                What We Discuss
              </a>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <Clock size={16} />
                <span>30–40 mins</span>
              </div>
              <span>·</span>
              <div className="hero-meta-item">
                <User size={16} />
                <span>1-on-1 with Harsha</span>
              </div>
              <span>·</span>
              <div className="hero-meta-item">
                <Video size={16} />
                <span>Google Meet</span>
              </div>
              <span>·</span>
              <div className="hero-meta-item">
                <span>10 AM – 8 PM</span>
              </div>
            </div>
          </div>

          {/* Right Column: Harsha's Verified Creator Photo */}
          <div className="hero-media">
            <div className="hero-image-card">
              <div className="hero-image-wrapper">
                <img
                  src="/images/harsha-silver-button.jpg"
                  alt="Harsha with YouTube Silver Creator Award"
                  className="hero-creator-img"
                  loading="eager"
                />
                <div className="hero-award-badge">
                  <div className="award-badge-icon">
                    <Award size={20} />
                  </div>
                  <div className="award-badge-text">
                    <strong>100K+ Subscribers</strong>
                    <span>YouTube Silver Creator Award</span>
                  </div>
                </div>
              </div>

              <div className="hero-card-footer">
                <div className="footer-author-info">
                  <span className="author-name">Harsha Talks</span>
                  <span className="author-title">AI & Content Creator · 1-on-1 Mentorship</span>
                </div>
                <span className="verified-pill">✓ Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
