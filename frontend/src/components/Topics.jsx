import React from 'react';

const topics = [
  {
    number: '01',
    title: 'AI Tools & Workflows',
    description:
      'Discuss tools, practical everyday use cases, prompt techniques, and how to integrate AI directly into your creator workflow.',
  },
  {
    number: '02',
    title: 'YouTube & Instagram',
    description:
      'Discuss content ideas, packaging, YouTube Shorts, Instagram Reels, hooks, pacing, and retaining viewer attention.',
  },
  {
    number: '03',
    title: 'Content Creation',
    description:
      'Work through questions about getting started, overcoming consistency blocks, equipment choices, and improving your production process.',
  },
  {
    number: '04',
    title: 'Your Specific Doubts',
    description:
      'Bring your own raw questions, link your videos or draft ideas, and explain the exact puzzle you are currently trying to solve.',
  },
];

export default function Topics() {
  return (
    <section id="topics" className="section-topics">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Consultation Topics</div>
          <h2 className="section-title">What's on your mind?</h2>
          <p className="section-subtitle">
            Every session is focused entirely on you. You choose what we focus
            on, and we spend the 20 minutes getting straight to the point.
          </p>
        </div>

        <div className="topics-grid">
          {topics.map((item) => (
            <div key={item.number} className="topic-card">
              <div className="topic-number">{item.number}</div>
              <h3 className="topic-title">{item.title}</h3>
              <p className="topic-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
