'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useBilling } from '@/lib/useBilling';
import Logo from '@/components/Logo';
import UpgradeModal from '@/components/UpgradeModal';

interface DashboardStats {
  resumes_uploaded: number;
  interviews_completed: number;
  questions_practiced: number;
  average_score: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeReason, setUpgradeReason] = useState<'resume_grill' | 'company_prep' | null>(null);
  const { billing, isPremium, interviewsRemaining, upgrade, manageSubscription } = useBilling();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const data = await api.getDashboardStats(token);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isLoaded, isSignedIn, router, getToken]);

  if (!isLoaded || !isSignedIn || !user) {
    return null;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822', color: '#f0e8d8' }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212,163,90,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(212,163,90,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Navigation */}
      <nav className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-3 sm:gap-4">
              {billing && (
                isPremium ? (
                  <button
                    onClick={manageSubscription}
                    style={{ padding: '4px 14px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '9999px', color: '#d4a35a', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚡ Pro
                  </button>
                ) : (
                  <button
                    onClick={() => upgrade('monthly')}
                    style={{ padding: '4px 14px', background: 'rgba(212,163,90,0.10)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '9999px', color: '#d4a35a', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Upgrade to Pro
                  </button>
                )
              )}
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

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '8px' }}>
            Welcome back, {user.firstName || 'there'}!
          </h1>
          <p style={{ color: '#7a6f62', fontSize: '16px' }}>
            Ready to practice and ace your next interview?
          </p>
        </div>

        {/* Free tier usage banner */}
        {billing && !isPremium && (
          <div
            className="glass-amber rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ padding: '16px 20px', borderLeft: '3px solid rgba(212,163,90,0.6)' }}
          >
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0e8d8', marginBottom: '2px' }}>
                {interviewsRemaining === 0
                  ? "You've used all your free interviews"
                  : `${interviewsRemaining} free interview${interviewsRemaining === 1 ? '' : 's'} remaining`}
              </p>
              <p style={{ fontSize: '12px', color: '#7a6f62' }}>
                Upgrade to Pro for unlimited interviews, Company Prep, and more.
              </p>
            </div>
            <button
              onClick={() => upgrade('monthly')}
              style={{ flexShrink: 0, padding: '8px 18px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '10px', color: '#d4a35a', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">

          {upgradeReason && (
            <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeReason(null)} />
          )}

          {/* My Resumes */}
          <button
            onClick={() => router.push('/resumes')}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>My Resumes</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Upload and manage your resumes with AI-powered parsing</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              Manage resumes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Create Interview */}
          <button
            onClick={() => router.push('/interviews/new')}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>Create Interview</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Generate AI interview questions based on job description</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              Start interview
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Resume Grill */}
          <button
            onClick={() => { if (!billing) return; isPremium ? router.push('/interviews/resume-grill') : setUpgradeReason('resume_grill'); }}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            {!isPremium && <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '2px 10px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.30)', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: '#d4a35a', letterSpacing: '0.08em' }}>PRO</div>}
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>Resume Grill</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Think you know your resume? Get grilled on what you wrote</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              Get grilled
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Company Prep */}
          <button
            onClick={() => { if (!billing) return; isPremium ? router.push('/interviews/company-prep') : setUpgradeReason('company_prep'); }}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            {!isPremium && <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '2px 10px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.30)', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: '#d4a35a', letterSpacing: '0.08em' }}>PRO</div>}
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>Company Prep</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Practice with real questions from Google, Meta, Amazon and more</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              Start prep
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* My Interviews */}
          <button
            onClick={() => router.push('/interviews')}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>My Interviews</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>View and manage all your interview sessions</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              View interviews
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Analytics */}
          <button
            onClick={() => router.push('/analytics')}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>Analytics</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Track your progress and get AI-powered insights</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              View analytics
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Interview Guides */}
          <button
            onClick={() => router.push('/guides')}
            className="group glass relative overflow-hidden rounded-2xl text-left"
            style={{ padding: 'clamp(20px, 3vw, 32px)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(212,163,90,0.07) 0%, transparent 60%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '20px' }} className="group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>Interview Guides</h3>
            <p style={{ fontSize: '13px', color: '#7a6f62', lineHeight: 1.5, marginBottom: '16px' }}>Expert tips and strategies to ace your interviews</p>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#d4a35a', fontSize: '13px', fontWeight: 600 }}>
              Browse guides
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {[
            { label: 'Resumes Uploaded', value: stats?.resumes_uploaded },
            { label: 'Interviews Completed', value: stats?.interviews_completed },
            { label: 'Questions Practiced', value: stats?.questions_practiced },
            { label: 'Average Score', value: stats?.average_score != null ? `${stats.average_score}/10` : null },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl" style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
              <p style={{ color: '#7a6f62', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{s.label}</p>
              {loading ? (
                <div style={{ height: '32px', width: '56px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} className="animate-pulse" />
              ) : (
                <p style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#f0e8d8', lineHeight: 1 }}>
                  {s.value ?? 0}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
