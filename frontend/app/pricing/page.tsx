'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBilling } from '@/lib/useBilling';
import Logo from '@/components/Logo';

const FREE_FEATURES = [
  { text: '2 lifetime interviews', included: true },
  { text: 'Up to 5 questions per interview', included: true },
  { text: 'Standard interview mode', included: true },
  { text: 'AI scoring & feedback', included: true },
  { text: 'Analytics & progress tracking', included: true },
  { text: 'Unlimited resume uploads', included: true },
  { text: 'Resume Grill', included: false },
  { text: 'Company-Specific Prep', included: false },
  { text: 'Ideal Answer examples', included: false },
  { text: 'Up to 15 questions per interview', included: false },
];

const PRO_FEATURES = [
  { text: 'Unlimited interviews', included: true },
  { text: 'Up to 15 questions per interview', included: true },
  { text: 'Standard interview mode', included: true },
  { text: 'AI scoring & feedback', included: true },
  { text: 'Analytics & progress tracking', included: true },
  { text: 'Unlimited resume uploads', included: true },
  { text: 'Resume Grill', included: true },
  { text: 'Company-Specific Prep', included: true },
  { text: 'Ideal Answer examples', included: true },
];

export default function PricingPage() {
  const router = useRouter();
  const { isPremium, upgrade, loading } = useBilling();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await upgrade(billingCycle);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-800">
      <div className="fixed inset-0 z-0 bg-slate-100 dark:bg-slate-800">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 dark:bg-slate-700/20 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/')}>
            <Logo />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Simple pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Start free. Upgrade when you need more practice before the real thing.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-8 p-1 bg-slate-200 dark:bg-slate-700 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Annual
              <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">$0</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">forever</p>
            </div>

            <button
              onClick={() => router.push('/sign-up')}
              className="w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition mb-8"
            >
              Get started free
            </button>

            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  {f.included ? (
                    <span className="text-green-500 flex-shrink-0">✓</span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 flex-shrink-0">✗</span>
                  )}
                  <span className={f.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-blue-600 border border-blue-500 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl" />

            <div className="relative mb-6">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Pro</p>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">Most popular</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-white">
                  {billingCycle === 'annual' ? '$8' : '$12'}
                </span>
                <span className="text-blue-200 mb-2">/month</span>
              </div>
              {billingCycle === 'annual' ? (
                <p className="text-blue-200 text-sm mt-1">$96 billed annually</p>
              ) : (
                <p className="text-blue-200 text-sm mt-1">billed monthly</p>
              )}
            </div>

            {!loading && (
              isPremium ? (
                <div className="relative w-full py-3 bg-white/20 text-white rounded-xl font-semibold text-sm text-center mb-8">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="relative w-full py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-70 mb-8"
                >
                  {upgrading ? 'Redirecting...' : 'Upgrade to Pro →'}
                </button>
              )
            )}

            <ul className="relative space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <span className="text-white flex-shrink-0">✓</span>
                  <span className="text-white">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-400 mt-10">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </main>
  );
}
