import React from 'react';

export default function About() {
  return (
    <section id="about" className="section-about">
      <div className="container">
        <div className="about-card">
          <div className="about-avatar-wrap" aria-hidden="true">
            <span className="about-avatar-monogram">H</span>
            <span className="about-avatar-badge">Creator</span>
          </div>

          <div className="about-content">
            <div className="section-label">About Me</div>
            <h2 className="section-title">Hey, I'm Harsha</h2>
            <p className="about-quote">
              "I'm a content creator interested in AI, content creation, and
              building things on the internet."
            </p>
            <p className="about-p">
              I created this space for people who have questions and want a
              chance to discuss them directly with me. Instead of leaving comments
              or waiting for replies in DMs, this gives us 20 dedicated,
              undistracted minutes to solve what's in front of you.
            </p>
            <p className="about-p">
              Bring your questions, explain what you're working on, and let's
              make the most of our time together.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
