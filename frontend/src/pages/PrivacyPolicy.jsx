import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../services/api';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchPolicy() {
      try {
        const res = await api.getPolicy('privacy_policy');
        if (isMounted && res.success) {
          setPolicy(res.policy);
        }
      } catch (err) {
        console.error('Failed to load policy:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPolicy();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <Navbar />
      <main className="policy-page">
        <div className="container-narrow">
          <Link to="/" className="booking-header-back">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="policy-card">
            <div className="policy-header">
              <h1 className="policy-title">
                {policy?.title || 'Privacy Policy'}
              </h1>
              <div className="policy-meta">
                Last updated:{' '}
                {policy?.lastUpdated
                  ? new Date(policy.lastUpdated).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'October 2026'}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <p>Loading privacy policy details...</p>
              </div>
            ) : (
              <div className="policy-body" style={{ whiteSpace: 'pre-line' }}>
                {policy?.content}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
