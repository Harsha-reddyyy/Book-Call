import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Book your slot',
    description:
      'Choose an available date and time that fits your schedule. All times are displayed in Indian Standard Time (IST).',
  },
  {
    step: '02',
    title: 'Tell me your questions',
    description:
      'Share the specific topics and doubts you want to discuss so I can review them beforehand and make every minute count.',
  },
  {
    step: '03',
    title: 'Join the conversation',
    description:
      'Complete your booking securely via Razorpay. You will immediately receive a Google Meet link and confirmation by email.',
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
