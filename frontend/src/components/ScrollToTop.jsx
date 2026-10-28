import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Ensures that on SPA route transitions:
 * 1. window.history.scrollRestoration is set to 'manual' so mobile browsers
 *    don't restore previous route scroll positions.
 * 2. window scroll is reset unless handled by a specialized page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // If navigating to a new route, reset scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
