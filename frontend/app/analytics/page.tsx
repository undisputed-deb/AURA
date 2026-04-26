'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

interface AnalyticsData {
  total_interviews: number;
  average_score: number | null;
  improvement_rate: number | null;
  best_category: string | null;
  score_history: Array<{ date: string; score: number; interview_id: number }>;
  category_performance: Array<{ category: string; average_score: number; count: number }>;
  insights: string[];
}

const navStyle = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
} as React.CSSProperties;

const backBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  color: '#7a6f62', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s',
} as React.CSSProperties;

export default function AnalyticsPage() {
  const router = useRouter();
  const { isReady, getToken } = useClerkAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isReady) fetchAnalytics();
  }, [isReady, fetchAnalytics]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822' }}>
        <nav className="glass sticky top-0 z-50" style={navStyle}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Logo />
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div style={{ height: '44px', width: '240px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '12px' }} className="animate-pulse" />
          <div style={{ height: '22px', width: '320px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '48px' }} className="animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1,2,3,4].map(i => <div key={i} className="glass rounded-2xl animate-pulse" style={{ height: '120px' }} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1,2].map(i => <div key={i} className="glass rounded-2xl animate-pulse" style={{ height: '300px' }} />)}
          </div>
        </div>
      </main>
    );
  }

  if (error || !analytics) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fca5a5', marginBottom: '16px', fontSize: '14px' }}>{error || 'Analytics not available'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 20px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.28)', borderRadius: '10px', color: '#d4a35a', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const scoreColor = (score: number) => score >= 8 ? '#4ade80' : score >= 6 ? '#d4a35a' : '#f87171';

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822', color: '#f0e8d8' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50" style={navStyle}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/dashboard')}><Logo /></button>
          <button
            style={backBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
            onClick={() => router.push('/dashboard')}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '8px' }}>
            Your Progress
          </h1>
          <p style={{ color: '#7a6f62', fontSize: '16px' }}>Track your interview performance over time</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: 'Total Interviews', value: analytics.total_interviews,
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            },
            {
              label: 'Average Score',
              value: analytics.average_score ? `${analytics.average_score.toFixed(1)}/10` : 'N/A',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
            },
            {
              label: 'Improvement Rate',
              value: analytics.improvement_rate != null
                ? (analytics.improvement_rate > 0 ? '+' : '') + analytics.improvement_rate.toFixed(1) + '%'
                : 'N/A',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
            },
            {
              label: 'Best Category', value: analytics.best_category ? analytics.best_category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'N/A',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
            },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div style={{ width: '40px', height: '40px', background: 'rgba(212,163,90,0.10)', border: '1px solid rgba(212,163,90,0.22)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a', marginBottom: '14px' }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 800, color: '#f0e8d8', lineHeight: 1.2, marginBottom: '6px', wordBreak: 'break-word' }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#7a6f62', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Score Progress Chart */}
        {analytics.score_history && analytics.score_history.length > 0 && (
          <div className="glass rounded-2xl p-8 mb-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '24px' }}>Score Progress</h2>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
              {[...analytics.score_history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item, idx) => {
                const barHeight = Math.max((item.score / 10) * 168, 10);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      className="group relative w-full rounded-t-lg"
                      style={{ height: `${barHeight}px`, background: 'rgba(255,255,255,0.06)', cursor: 'default' }}
                    >
                      <div
                        style={{ position: 'absolute', inset: 0, borderRadius: '6px 6px 0 0', background: scoreColor(item.score), opacity: 0.7, transition: 'opacity 0.15s' }}
                        className="group-hover:opacity-100"
                      />
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,10,8,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: '#f0e8d8', whiteSpace: 'nowrap' }}>
                        {item.score.toFixed(1)}/10
                      </div>
                    </div>
                    <p style={{ fontSize: '10px', color: '#7a6f62', marginTop: '6px', textAlign: 'center' }}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Performance */}
        {analytics.category_performance && analytics.category_performance.length > 0 && (
          <div className="glass rounded-2xl p-8 mb-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '24px' }}>Category Performance</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analytics.category_performance.map((cat, idx) => {
                const pct = (cat.average_score / 10) * 100;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#f0e8d8', fontSize: '14px', fontWeight: 500 }}>{cat.category}</span>
                      <span style={{ color: scoreColor(cat.average_score), fontSize: '13px', fontWeight: 600 }}>{cat.average_score.toFixed(1)}/10</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: scoreColor(cat.average_score), borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#7a6f62', marginTop: '4px' }}>{cat.count} question{cat.count > 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {analytics.insights && analytics.insights.length > 0 && (
          <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '20px' }}>AI Insights</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analytics.insights.map((insight, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4a35a', marginTop: '6px', flexShrink: 0 }} />
                  <p style={{ color: '#f0e8d8', fontSize: '14px', lineHeight: 1.6 }}>{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {analytics.total_interviews === 0 && (
          <div className="glass rounded-2xl p-12" style={{ textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>No Analytics Yet</h2>
            <p style={{ color: '#7a6f62', fontSize: '14px', marginBottom: '24px' }}>Complete some interviews to see your progress and insights here!</p>
            <button
              onClick={() => router.push('/interviews/new')}
              style={{ padding: '10px 24px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.28)', borderRadius: '10px', color: '#d4a35a', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Start Your First Interview
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
