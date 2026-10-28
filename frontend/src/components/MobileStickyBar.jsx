import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function MobileStickyBar() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Only show on home page
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show when scrolled down past initial hero CTA (> 320px)
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // Hide when near the bottom CTA/footer
      const nearBottom = scrollY + winHeight > docHeight - 380;

      if (scrollY > 300 && !nearBottom) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  if (!isHome) return null;

  return (
    <aside
      className={`mobile-sticky-bar ${visible ? 'visible' : ''}`}
      aria-label="Quick booking call-to-action"
    >
      <div className="mobile-sticky-inner">
        <div className="mobile-sticky-info">
          <div className="mobile-sticky-price-row">
            <span className="mobile-sticky-price">₹299</span>
            <span className="mobile-sticky-original">₹499</span>
            <span className="mobile-sticky-tag">Save 40%</span>
          </div>
          <span className="mobile-sticky-subtext">30–40 min 1-on-1 Google Meet</span>
        </div>

        <Link to="/book" className="btn btn-primary mobile-sticky-btn">
          <span>Book Call</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </aside>
  );
}
