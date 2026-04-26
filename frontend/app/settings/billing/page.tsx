'use client';

import { useRouter } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useBilling } from '@/lib/useBilling';
import Logo from '@/components/Logo';
import { useEffect } from 'react';

export default function BillingSettingsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { billing, isPremium, interviewsRemaining, loading, upgrade, manageSubscription } = useBilling();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in');
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || !user) return null;

  const periodEnd = billing?.current_period_end
    ? new Date(billing.current_period_end).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822', color: '#f0e8d8' }}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212,163,90,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(212,163,90,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <nav className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push('/dashboard')}>
              <Logo />
            </button>
            <div className="flex items-center gap-3 sm:gap-4">
              <span style={{ color: '#7a6f62', fontSize: '13px' }} className="hidden sm:block">
                {user.fullName || user.primaryEmailAddress?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-10 h-10' } }}>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Billing"
                    labelIcon={
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    }
                    href="/settings/billing"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a6f62', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '6px' }}>
            Billing
          </h1>
          <p style={{ color: '#7a6f62', fontSize: '15px' }}>
            Manage your plan and subscription.
          </p>
        </div>

        {loading || !billing ? (
          <div className="glass rounded-2xl" style={{ padding: '32px' }}>
            <div style={{ height: '24px', width: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '16px' }} className="animate-pulse" />
            <div style={{ height: '56px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} className="animate-pulse" />
          </div>
        ) : (
          <>
            {/* Plan Card */}
            <div className="glass rounded-2xl" style={{ padding: 'clamp(24px, 3vw, 32px)', marginBottom: '20px', border: '1px solid rgba(212,163,90,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div>
                  <p style={{ color: '#7a6f62', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Current Plan
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f0e8d8' }}>
                      {isPremium ? 'Pro' : 'Free'}
                    </h2>
                    {isPremium && (
                      <span style={{ padding: '3px 10px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '9999px', color: '#d4a35a', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>
                        ⚡ ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isPremium ? (
                <>
                  {periodEnd && (
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '20px' }}>
                      <p style={{ color: '#7a6f62', fontSize: '12px', marginBottom: '4px' }}>Next billing date</p>
                      <p style={{ color: '#f0e8d8', fontSize: '15px', fontWeight: 600 }}>{periodEnd}</p>
                    </div>
                  )}
                  <button
                    onClick={manageSubscription}
                    style={{ width: '100%', padding: '12px 20px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '10px', color: '#d4a35a', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,163,90,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,163,90,0.15)'; }}
                  >
                    Manage Subscription
                  </button>
                  <p style={{ color: '#7a6f62', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
                    Update payment method, view invoices, or cancel your subscription.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '20px' }}>
                    <p style={{ color: '#7a6f62', fontSize: '12px', marginBottom: '4px' }}>Interviews remaining</p>
                    <p style={{ color: '#f0e8d8', fontSize: '15px', fontWeight: 600 }}>
                      {interviewsRemaining ?? 0} of {billing.interviews_limit ?? 2} free
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => upgrade('monthly')}
                      style={{ flex: 1, minWidth: '160px', padding: '12px 20px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '10px', color: '#d4a35a', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,163,90,0.22)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,163,90,0.15)'; }}
                    >
                      Upgrade to Pro →
                    </button>
                    <button
                      onClick={() => router.push('/pricing')}
                      style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#f0e8d8', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      Compare plans
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Usage Card */}
            <div className="glass rounded-2xl" style={{ padding: 'clamp(24px, 3vw, 32px)' }}>
              <p style={{ color: '#7a6f62', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Usage
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#f0e8d8', fontSize: '14px' }}>Interviews completed</span>
                <span style={{ color: '#d4a35a', fontSize: '14px', fontWeight: 700 }}>
                  {billing.interviews_used}
                  {billing.interviews_limit != null && ` / ${billing.interviews_limit}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                <span style={{ color: '#f0e8d8', fontSize: '14px' }}>Plan status</span>
                <span style={{ color: '#d4a35a', fontSize: '14px', fontWeight: 700, textTransform: 'capitalize' }}>
                  {billing.status}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
