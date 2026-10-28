import React from 'react';
import { Award, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="section-about">
      <div className="container">
        <div className="about-card">
          <div className="about-photo-wrap">
            <img
              src="/images/harsha-silver-button.jpg"
              alt="Harsha holding YouTube Silver Creator Award"
              className="about-creator-photo"
              loading="lazy"
            />
            <div className="about-photo-badge">
              <Award size={16} />
              <span>100K+ Silver Play Button</span>
            </div>
          </div>

          <div className="about-content">
            <div className="section-label">About Harsha</div>
            <h2 className="section-title">Hey, I'm Harsha</h2>
            <p className="about-quote">
              "Building in public, teaching AI tools, and helping aspiring creators make real progress."
            </p>
            <p className="about-p">
              I run <strong>Harsha Talks</strong> on YouTube with over 100,000 subscribers. Over the past few years, I've seen so many people get stuck on the same hurdles — choosing AI tools, finding video ideas, editing efficiently, or figuring out how to grow.
            </p>
            <p className="about-p">
              Instead of leaving comments or waiting days for replies in DMs, these 1-on-1 calls give us <strong>30–40 dedicated, undistracted minutes</strong> to solve what's in front of you.
            </p>

            <div className="about-highlights-grid">
              <div className="about-highlight-item">
                <Clock size={18} className="highlight-icon" />
                <div>
                  <strong>10:00 AM – 8:00 PM IST</strong>
                  <span>Flexible working hours Mon–Sat</span>
                </div>
              </div>
              <div className="about-highlight-item">
                <Calendar size={18} className="highlight-icon" />
                <div>
                  <strong>30–40 Mins Session</strong>
                  <span>Deep dive with calendar reminders</span>
                </div>
              </div>
              <div className="about-highlight-item">
                <CheckCircle2 size={18} className="highlight-icon" />
                <div>
                  <strong>Early Bird: ₹299</strong>
                  <span>Limited discounted slots (Reg. ₹499)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
