import React from 'react';
import { Award, Clock, Calendar, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="section-about">
      <div className="container">
        <div className="about-card">
          <div className="about-photo-wrap">
            <img
              src="/images/harsha-silver-button.jpg"
              alt="Harsha holding YouTube Silver Creator Award - 148K Subscribers"
              className="about-creator-photo"
              loading="lazy"
            />
            <div className="about-photo-badge">
              <Award size={16} />
              <span>148K+ YouTube · 25K+ Instagram</span>
            </div>
          </div>

          <div className="about-content">
            <div className="section-label">About Harsha</div>
            <h2 className="section-title">Hey, I'm Harsha 👋</h2>
            <p className="about-quote">
              "Started on December 28, 2025. Grew from zero to 148,000+ YouTube subscribers and 25,000+ Instagram followers in under a year."
            </p>
            <p className="about-p">
              I run <strong>Harsha Talks</strong>. When I started out, I had the exact same questions you might have right now: <em>Which AI tools should I use? How do I write scripts? How do I edit videos that people actually watch? How do I grow without wasting months?</em>
            </p>
            <p className="about-p">
              Every day, hundreds of creators message me in YouTube comments and Instagram DMs asking for advice. It's impossible to give complete answers in text messages. That's why I started these 1-on-1 calls — to give you <strong>30–40 dedicated minutes directly with me on Google Meet</strong>. We talk in simple, clear English and solve whatever is stopping your progress.
            </p>

            <div className="about-highlights-grid">
              <div className="about-highlight-item">
                <TrendingUp size={18} className="highlight-icon" />
                <div>
                  <strong>148K+ YT · 25K+ Insta</strong>
                  <span>Started on Dec 28, 2025</span>
                </div>
              </div>
              <div className="about-highlight-item">
                <Clock size={18} className="highlight-icon" />
                <div>
                  <strong>10:00 AM – 8:00 PM IST</strong>
                  <span>Available Mon–Sat</span>
                </div>
              </div>
              <div className="about-highlight-item">
                <Calendar size={18} className="highlight-icon" />
                <div>
                  <strong>30–40 Mins Call</strong>
                  <span>Early Bird: ₹299 (Reg. ₹499)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
