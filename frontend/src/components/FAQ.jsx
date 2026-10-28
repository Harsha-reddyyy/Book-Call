import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the consultation call take place?',
    a: 'We connect online via Google Meet. As soon as your booking and ₹299 Early Bird payment are confirmed, a calendar event with a unique Google Meet link is automatically created and sent to your email. You can join directly from your browser or mobile phone without downloading extra software.',
  },
  {
    q: 'How should I prepare before the call?',
    a: 'When booking, write down what you want to achieve or the specific doubts you have. If you want feedback on a YouTube video, Short, or script draft, make sure you have the links or files ready to share at the start of our session so we can dive right in.',
  },
  {
    q: 'Can I reschedule if something comes up?',
    a: 'Yes. You can reschedule your call free of charge up to 6 hours before the scheduled start time by emailing with your booking reference. Please check the Cancellation & Refund Policy for full details.',
  },
  {
    q: 'What if I am a complete beginner with zero followers?',
    a: 'That is completely fine! Everyone starts at the beginning. We can talk about how to select your niche, set up your basic workflow, choose tools without spending unnecessary money, and take your first steps with confidence.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Payments are securely processed via Razorpay. You can pay using UPI (Google Pay, PhonePe, Paytm, etc.), credit and debit cards, or NetBanking.',
  },
  {
    q: 'Can the session be recorded?',
    a: 'If you want to record the meeting for your personal reference so you can re-watch our discussion later, just let me know at the beginning of the call. I am happy to accommodate as long as it is for your private use.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="section-faq">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Questions & Answers</div>
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-subtitle">
            Everything you need to know about booking, attending, and making the
            most of your consultation call.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-trigger"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={20} className="faq-icon" />
                </button>
                {isOpen && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
