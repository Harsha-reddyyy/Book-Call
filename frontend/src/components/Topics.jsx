import React from 'react';
import { Cpu, Youtube, Instagram, CheckSquare } from 'lucide-react';

const topics = [
  {
    number: '01',
    icon: Cpu,
    title: 'AI Tools for Creators',
    description:
      'Learn the best free & paid AI tools to write scripts, create eye-catching thumbnails, and finish videos in half the time.',
  },
  {
    number: '02',
    icon: Youtube,
    title: 'YouTube Growth & Channel Setup',
    description:
      'How I grew to 148K subscribers: choosing viral video topics, writing catchy titles, good thumbnails, and getting more views.',
  },
  {
    number: '03',
    icon: Instagram,
    title: 'Instagram Reels & Personal Brand',
    description:
      'How to create reels that get followers, writing strong first-3-second hooks, simple editing styles, and staying consistent.',
  },
  {
    number: '04',
    icon: CheckSquare,
    title: 'Your Specific Doubts & Review',
    description:
      'Share your YouTube channel link or video draft. I will review it live on the call and tell you exactly what to fix and improve.',
  },
];

export default function Topics() {
  return (
    <section id="topics" className="section-topics">
      <div className="container">
        <div className="section-header">
          <div className="section-label">What We Can Discuss</div>
          <h2 className="section-title">Pick what you need help with</h2>
          <p className="section-subtitle">
            Every session is 100% focused on you. We have 30–40 dedicated minutes on Google Meet to solve your exact doubts in simple, easy English.
          </p>
        </div>

        <div className="topics-grid">
          {topics.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.number} className="topic-card">
                <div className="topic-card-header">
                  <div className="topic-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <span className="topic-number">{item.number}</span>
                </div>
                <h3 className="topic-title">{item.title}</h3>
                <p className="topic-desc">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
