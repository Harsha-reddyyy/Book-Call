import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the 1-on-1 call take place?',
    a: 'We connect online on Google Meet. As soon as you complete the ₹299 booking, your Google Meet link is shown on screen and sent to your email with a 30-minute reminder before the call. You can join directly from your phone or laptop.',
  },
  {
    q: 'What language will we speak in?',
    a: 'We will speak in simple, clear everyday English. No difficult words or confusing jargon. You can ask your questions freely and comfortably!',
  },
  {
    q: 'How should I prepare before our call?',
    a: 'Just write down what you want to achieve or the specific questions you have. If you want me to review your YouTube channel, Instagram account, or a video draft, keep the links ready so we can look at them together.',
  },
  {
    q: 'What if I am a complete beginner with 0 followers?',
    a: 'Everyone starts at zero! I started my channel on Dec 28, 2025 with zero subscribers too. We will talk about how to choose your niche, which AI tools to use without wasting money, and how to get your first 1,000 subscribers.',
  },
  {
    q: 'How do I pay?',
    a: 'Payments are 100% secure via Razorpay. You can pay using UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, or NetBanking.',
  },
  {
    q: 'Can I reschedule if I get busy?',
    a: 'Yes, you can reschedule for free up to 6 hours before our call by replying to your confirmation email.',
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
