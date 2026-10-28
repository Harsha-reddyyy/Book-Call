import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Pick your slot',
    description:
      'Choose any date and time between 10:00 AM and 8:00 PM IST that fits your schedule.',
  },
  {
    step: '02',
    title: 'Tell me your doubts',
    description:
      'Write down your questions or paste your YouTube/Instagram link so I can review it before our call.',
  },
  {
    step: '03',
    title: 'Join on Google Meet',
    description:
      'Pay ₹299 securely via UPI or Card. You get the Google Meet link immediately on your screen and email, plus a 30-min reminder.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-how">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Process</div>
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">
            Three simple steps to go from questions in your head to a focused
            discussion.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((item) => (
            <div key={item.step} className="step-card">
              <div className="step-index">{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
