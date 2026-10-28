import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronRight, MessageSquare, HelpCircle, User, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  // Prevent background scrolling when mobile navigation drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    setMobileOpen(false);
    if (isHome) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header className="site-nav">
        <div className="container site-nav-inner">
          <Link to="/" className="brand-logo" aria-label="Harsha Homepage">
            <span>Harsha</span>
            <span className="brand-dot" aria-hidden="true" />
          </Link>

          {/* Desktop Nav Links (Visible on >= 960px) */}
          <nav aria-label="Main Navigation" className="desktop-nav-wrap">
            <ul className="nav-links">
              <li>
                {isHome ? (
                  <a
                    href="#topics"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('topics');
                    }}
                    className="nav-link"
                  >
                    What We Can Discuss
                  </a>
                ) : (
                  <Link to="/#topics" className="nav-link">
                    What We Can Discuss
                  </Link>
                )}
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('how-it-works');
                    }}
                    className="nav-link"
                  >
                    How It Works
                  </a>
                ) : (
                  <Link to="/#how-it-works" className="nav-link">
                    How It Works
                  </Link>
                )}
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('about');
                    }}
                    className="nav-link"
                  >
                    About
                  </a>
                ) : (
                  <Link to="/#about" className="nav-link">
                    About
                  </Link>
                )}
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#faq"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('faq');
                    }}
                    className="nav-link"
                  >
                    FAQ
                  </a>
                ) : (
                  <Link to="/#faq" className="nav-link">
                    FAQ
                  </Link>
                )}
              </li>
            </ul>
          </nav>

          {/* Header Actions Area (Desktop CTA & Mobile/Tablet Controls) */}
          <div className="nav-actions-wrap">
            {/* Direct Compact CTA visible on Mobile & Tablet for fast 1-tap booking */}
            <Link to="/book" className="btn btn-primary nav-mobile-cta" aria-label="Book Call Early Bird ₹299">
              <span>Book</span>
              <span className="nav-mobile-cta-price">₹299</span>
            </Link>

            {/* Full Desktop CTA */}
            <Link to="/book" className="btn btn-primary nav-cta">
              <span>Book a Call — ₹299</span>
              <ArrowRight size={16} />
            </Link>

            {/* Mobile / Tablet Toggle Button with 44x44px accessible touch target */}
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop Overlay for Mobile Drawer */}
      <div
        className={`mobile-nav-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Modern Slide-down / Full-screen Sheet Mobile Drawer */}
      <div
        className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="mobile-drawer-header">
          <Link to="/" className="brand-logo" onClick={() => setMobileOpen(false)}>
            <span>Harsha</span>
            <span className="brand-dot" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mobile-drawer-body">
          <div className="mobile-offer-pill">
            <Sparkles size={14} className="mobile-pill-icon" />
            <span>Early Bird Offer: ₹299 for 30–40 Mins</span>
          </div>

          <nav className="mobile-nav-menu" aria-label="Mobile Navigation">
            {isHome ? (
              <>
                <a
                  href="#topics"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('topics');
                  }}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <MessageSquare size={18} className="mobile-link-icon" />
                    <span>What We Can Discuss</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </a>

                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('how-it-works');
                  }}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <Sparkles size={18} className="mobile-link-icon" />
                    <span>How It Works</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </a>

                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                  }}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <User size={18} className="mobile-link-icon" />
                    <span>About Harsha</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </a>

                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('faq');
                  }}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <HelpCircle size={18} className="mobile-link-icon" />
                    <span>Frequently Asked Questions</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/#topics"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <MessageSquare size={18} className="mobile-link-icon" />
                    <span>What We Can Discuss</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </Link>

                <Link
                  to="/#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <Sparkles size={18} className="mobile-link-icon" />
                    <span>How It Works</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </Link>

                <Link
                  to="/#about"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <User size={18} className="mobile-link-icon" />
                    <span>About Harsha</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </Link>

                <Link
                  to="/#faq"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-nav-link"
                >
                  <span className="mobile-link-text">
                    <HelpCircle size={18} className="mobile-link-icon" />
                    <span>Frequently Asked Questions</span>
                  </span>
                  <ChevronRight size={18} className="mobile-link-arrow" />
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="mobile-drawer-footer">
          <Link
            to="/book"
            onClick={() => setMobileOpen(false)}
            className="btn btn-primary mobile-drawer-cta"
          >
            <span>Book a Call — ₹299 (Early Bird)</span>
            <ArrowRight size={18} />
          </Link>
          <div className="mobile-drawer-microcopy">
            <span>Direct Google Meet call · Instant calendar invite</span>
          </div>
        </div>
      </div>
    </>
  );
}
