'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBilling } from '@/lib/useBilling';
import { GlassButton } from '@/components/ui/glass-button';

type UpgradeReason = 'interview_limit' | 'company_prep' | 'resume_grill' | 'ideal_answer' | 'analytics' | 'more_questions';

interface UpgradeModalProps {
  reason: UpgradeReason;
  onClose?: () => void;
}

const REASON_CONTENT: Record<UpgradeReason, { title: string; description: string }> = {
  interview_limit: {
    title: "You've used all 2 free interviews",
    description: "Upgrade to Pro for unlimited interviews and keep your prep going before the real thing.",
  },
  company_prep: {
    title: "Company Prep is a Pro feature",
    description: "Get real interview questions sourced from Reddit, Glassdoor, and more for your target company.",
  },
  resume_grill: {
    title: "Resume Grill is a Pro feature",
    description: "Get grilled on every claim in your resume so no interviewer can catch you off guard.",
  },
  ideal_answer: {
    title: "Ideal Answers are a Pro feature",
    description: "See an example of a perfect answer for each question to know exactly what you should have said.",
  },
  analytics: {
    title: "Full Analytics is a Pro feature",
    description: "Track your improvement over time, see your weakest categories, and get AI-generated insights.",
  },
  more_questions: {
    title: "More questions require Pro",
    description: "Free plan supports up to 5 questions per interview. Upgrade to Pro for up to 15.",
  },
};

export default function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const { upgrade } = useBilling();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const content = REASON_CONTENT[reason];

  const handleUpgrade = async () => {
    setLoading(true);
    await upgrade(billingCycle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative glass rounded-2xl p-6 sm:p-8 max-w-md w-full"
        style={{ border: '1px solid rgba(212,163,90,0.20)' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', color: '#7a6f62', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
          >
            ✕
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚡</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>{content.title}</h2>
          <p style={{ color: '#7a6f62', fontSize: '14px', lineHeight: 1.5 }}>{content.description}</p>
        </div>

        {/* Feature list */}
        <div
          className="glass-sm rounded-xl p-4 mb-6"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#7a6f62', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Pro includes
          </p>
          {[
            'Unlimited interviews',
            'Up to 15 questions per interview',
            'Resume Grill',
            'Company Prep with real questions',
            'Ideal answer examples',
          ].map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#f0e8d8', marginBottom: '8px' }}>
              <span style={{ color: '#d4a35a', fontWeight: 700 }}>✓</span>
              {feature}
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div
          className="rounded-xl overflow-hidden mb-4 flex"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600,
              background: billingCycle === 'monthly' ? '#d4a35a' : 'transparent',
              color: billingCycle === 'monthly' ? '#0d0a08' : '#7a6f62',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            $12/month
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600,
              background: billingCycle === 'annual' ? '#d4a35a' : 'transparent',
              color: billingCycle === 'annual' ? '#0d0a08' : '#7a6f62',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            $8/mo <span style={{ fontSize: '11px', opacity: 0.8 }}>($96/yr)</span>
          </button>
        </div>

        <GlassButton
          variant="amber"
          size="md"
          onClick={handleUpgrade}
          className="w-full justify-center"
        >
          {loading ? 'Redirecting...' : 'Get unlimited practice before your interview →'}
        </GlassButton>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#7a6f62', marginTop: '12px' }}>
          Cancel anytime. No hidden fees.
        </p>
      </motion.div>
    </div>
  );
}
