import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

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
    <header className="site-nav">
      <div className="container site-nav-inner">
        <Link to="/" className="brand-logo" aria-label="Harsha Homepage">
          <span>Harsha</span>
          <span className="brand-dot" aria-hidden="true" />
        </Link>

        {/* Desktop Nav Links */}
        <nav aria-label="Main Navigation">
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

        {/* Desktop CTA */}
        <Link to="/book" className="btn btn-primary nav-cta">
          <span>Book a Call — ₹299</span>
          <ArrowRight size={16} />
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-nav-drawer open">
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
                What We Can Discuss
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }}
                className="mobile-nav-link"
              >
                How It Works
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('about');
                }}
                className="mobile-nav-link"
              >
                About
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('faq');
                }}
                className="mobile-nav-link"
              >
                FAQ
              </a>
            </>
          ) : (
            <>
              <Link
                to="/#topics"
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
              >
                What We Can Discuss
              </Link>
              <Link
                to="/#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
              >
                How It Works
              </Link>
              <Link
                to="/#about"
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
              >
                About
              </Link>
              <Link
                to="/#faq"
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-link"
              >
                FAQ
              </Link>
            </>
          )}
          <Link
            to="/book"
            onClick={() => setMobileOpen(false)}
            className="btn btn-primary"
            style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
          >
            <span>Book a Call — ₹299 (Early Bird)</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </header>
  );
}
