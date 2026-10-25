import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Video, User } from 'lucide-react';

export default function Hero() {
  const scrollToTopics = (e) => {
    e.preventDefault();
    const elem = document.getElementById('topics');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-status" aria-hidden="true" />
            <span>Open for 1-on-1 calls this month</span>
          </div>

          <h1 className="hero-title">
            Let's figure it out together.
          </h1>

          <p className="hero-lead">
            Got questions about AI tools, YouTube, or content creation? Book a
            one-on-one call with me, tell me what you're working on, and let's
            work through your doubts.
          </p>

          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary btn-lg">
              <span>Book a Call — ₹399</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="#topics"
              onClick={scrollToTopics}
              className="btn btn-secondary btn-lg"
            >
              See What We Can Discuss
            </a>
          </div>

          <div className="hero-meta">
            <div className="hero-meta-item">
              <Clock size={16} />
              <span>20 minutes</span>
            </div>
            <span>·</span>
            <div className="hero-meta-item">
              <User size={16} />
              <span>One-on-one</span>
            </div>
            <span>·</span>
            <div className="hero-meta-item">
              <Video size={16} />
              <span>Google Meet</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
