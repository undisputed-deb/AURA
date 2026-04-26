'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { GlassButton } from '@/components/ui/glass-button';
import { SkeletonInterview } from '@/components/Skeleton';

interface Interview {
  id: number;
  resume_id: number;
  interview_type: string;
  job_description: string | null;
  jd_analysis: {
    job_title?: string;
    company?: string;
    required_skills?: string[];
    [key: string]: unknown;
  } | null;
  status: string;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
  resume?: {
    id: number;
    parsed_data: {
      name?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  };
}

export default function InterviewsPage() {
  const router = useRouter();
  const { isReady, getToken } = useClerkAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState<'standard' | 'resume_grill'>('standard');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (isReady) {
      fetchInterviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getInterviews(token);
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (interviewId: number) => {
    setInterviewToDelete(interviewId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!interviewToDelete) return;

    try {
      const token = await getToken();
      if (!token) return;
      await api.deleteInterview(interviewToDelete, token);
      setDeleteModalOpen(false);
      setInterviewToDelete(null);
      fetchInterviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setInterviewToDelete(null);
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.25)', color: '#d4a35a' };
      case 'in_progress':
        return { background: 'rgba(212,163,90,0.14)', border: '1px solid rgba(212,163,90,0.35)', color: '#f0c878' };
      case 'completed':
        return { background: 'rgba(212,163,90,0.20)', border: '1px solid rgba(212,163,90,0.45)', color: '#f0e8d8' };
      default:
        return { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#7a6f62' };
    }
  };

  // Filter and sort interviews
  const filteredAndSortedInterviews = interviews
    .filter(interview => {
      // Tab filter - filter by interview type
      const interviewType = interview.interview_type?.toLowerCase() || 'standard';
      if (activeTab === 'standard' && interviewType !== 'standard') {
        return false;
      }
      if (activeTab === 'resume_grill' && interviewType !== 'resume_grill') {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && interview.status.toLowerCase() !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const jobTitle = interview.jd_analysis?.job_title?.toLowerCase() || '';
        const company = interview.jd_analysis?.company?.toLowerCase() || '';
        const description = interview.job_description?.toLowerCase() || '';

        return jobTitle.includes(query) ||
               company.includes(query) ||
               description.includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'score-high':
          return (b.overall_score || 0) - (a.overall_score || 0);
        case 'score-low':
          return (a.overall_score || 0) - (b.overall_score || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822' }}>
        <nav className="sticky top-0 z-50 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Logo />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div style={{ height: '40px', width: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '12px', animation: 'pulse 2s infinite' }} />
          <div style={{ height: '20px', width: '300px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginBottom: '40px', animation: 'pulse 2s infinite' }} />
          <div className="glass rounded-2xl overflow-hidden">
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ height: '28px', width: '160px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', animation: 'pulse 2s infinite' }} />
            </div>
            {[1, 2, 3].map((i) => <SkeletonInterview key={i} />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822', color: '#f0e8d8' }}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212,163,90,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/dashboard')}>
            <Logo />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ color: '#7a6f62', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '8px' }}>
              My Interviews
            </h1>
            <p style={{ color: '#7a6f62', fontSize: '15px' }}>
              View and manage your interview sessions
            </p>
          </div>
          <GlassButton variant="amber" size="md" onClick={() => router.push('/interviews/new')}>
            + New Interview
          </GlassButton>
        </motion.div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        {interviews.length > 0 && (
          <div className="glass rounded-2xl p-2 mb-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => { setActiveTab('standard'); setSearchQuery(''); setStatusFilter('all'); }}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', minHeight: '44px',
                background: activeTab === 'standard' ? 'rgba(212,163,90,0.18)' : 'transparent',
                color: activeTab === 'standard' ? '#f0e8d8' : '#7a6f62',
                boxShadow: activeTab === 'standard' ? '0 0 0 1px rgba(212,163,90,0.35)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Standard Interviews
                <span style={{ marginLeft: '6px', padding: '1px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#7a6f62' }}>
                  {interviews.filter(i => (i.interview_type?.toLowerCase() || 'standard') === 'standard').length}
                </span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('resume_grill'); setSearchQuery(''); setStatusFilter('all'); }}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', minHeight: '44px',
                background: activeTab === 'resume_grill' ? 'rgba(212,163,90,0.18)' : 'transparent',
                color: activeTab === 'resume_grill' ? '#f0e8d8' : '#7a6f62',
                boxShadow: activeTab === 'resume_grill' ? '0 0 0 1px rgba(212,163,90,0.35)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                Resume Grills
                <span style={{ marginLeft: '6px', padding: '1px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#7a6f62' }}>
                  {interviews.filter(i => i.interview_type?.toLowerCase() === 'resume_grill').length}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Search and Filters */}
        {interviews.length > 0 && (
          <div className="glass rounded-2xl p-5 mb-6">
            <div className="relative mb-4">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7a6f62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by job title, company, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', color: '#f0e8d8', fontSize: '14px', outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,163,90,0.40)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a6f62', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    border: statusFilter === f ? '1px solid rgba(212,163,90,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    background: statusFilter === f ? 'rgba(212,163,90,0.12)' : 'rgba(255,255,255,0.03)',
                    color: statusFilter === f ? '#d4a35a' : '#7a6f62',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0e8d8', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="recent" style={{ background: '#1a1822' }}>Most Recent</option>
                <option value="oldest" style={{ background: '#1a1822' }}>Oldest First</option>
                <option value="score-high" style={{ background: '#1a1822' }}>Highest Score</option>
                <option value="score-low" style={{ background: '#1a1822' }}>Lowest Score</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'all') && (
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#7a6f62' }}>
                Showing {filteredAndSortedInterviews.length} of {interviews.length} interviews
              </p>
            )}
          </div>
        )}

        {/* Interviews List */}
        <div className="glass rounded-2xl overflow-hidden">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f0e8d8' }}>
              {searchQuery || statusFilter !== 'all' ? 'Filtered' : 'All'} Interviews ({filteredAndSortedInterviews.length})
            </h2>
          </div>

          {interviews.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(212,163,90,0.10)', border: '1px solid rgba(212,163,90,0.22)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a35a' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <p style={{ color: '#f0e8d8', fontWeight: 600, marginBottom: '6px' }}>No interviews yet</p>
              <p style={{ color: '#7a6f62', fontSize: '13px', marginBottom: '24px' }}>Create your first interview to get started!</p>
              <GlassButton variant="amber" size="sm" onClick={() => router.push('/interviews/new')}>Create Interview</GlassButton>
            </div>
          ) : filteredAndSortedInterviews.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ color: '#f0e8d8', fontWeight: 600, marginBottom: '6px' }}>No matches</p>
              <p style={{ color: '#7a6f62', fontSize: '13px', marginBottom: '20px' }}>Try adjusting your search or filters.</p>
              <GlassButton variant="neutral" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>Clear Filters</GlassButton>
            </div>
          ) : (
            <div>
              {filteredAndSortedInterviews.map((interview, idx) => {
                const isResumeGrill = interview.interview_type?.toLowerCase() === 'resume_grill';
                return (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.35 }}
                    style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div style={{
                        flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isResumeGrill ? 'rgba(212,163,90,0.15)' : 'rgba(255,255,255,0.06)',
                        border: isResumeGrill ? '1px solid rgba(212,163,90,0.30)' : '1px solid rgba(255,255,255,0.10)',
                        color: isResumeGrill ? '#d4a35a' : '#7a6f62',
                      }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isResumeGrill
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          }
                        </svg>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f0e8d8', marginBottom: '2px' }}>
                              {isResumeGrill
                                ? `Resume Grill${interview.resume?.parsed_data?.name ? ` — ${interview.resume.parsed_data.name}` : ''}`
                                : (interview.jd_analysis?.job_title || 'Interview')
                              }
                            </h3>
                            {interview.jd_analysis?.company && (
                              <p style={{ fontSize: '13px', color: '#d4a35a', fontWeight: 500 }}>{interview.jd_analysis.company}</p>
                            )}
                          </div>
                          <span style={{ ...getStatusStyle(interview.status), padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, flexShrink: 0, textTransform: 'capitalize' }}>
                            {interview.status.replace('_', ' ')}
                          </span>
                        </div>

                        {interview.job_description && !isResumeGrill && (
                          <p style={{ color: '#7a6f62', fontSize: '13px', marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {interview.job_description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#7a6f62', marginBottom: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(interview.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          {interview.overall_score !== null && interview.overall_score !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d4a35a', fontWeight: 600 }}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                              {interview.overall_score}/10
                            </span>
                          )}
                        </div>

                        {interview.jd_analysis?.required_skills && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {interview.jd_analysis.required_skills.slice(0, 5).map((skill: string, idx: number) => (
                              <span key={idx} style={{ padding: '2px 8px', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.18)', color: '#d4a35a', fontSize: '11px', borderRadius: '999px' }}>
                                {skill}
                              </span>
                            ))}
                            {interview.jd_analysis.required_skills.length > 5 && (
                              <span style={{ fontSize: '11px', color: '#7a6f62', padding: '2px 0' }}>+{interview.jd_analysis.required_skills.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {interview.status.toLowerCase() === 'completed' ? (
                          <button
                            onClick={() => router.push(`/interviews/${interview.id}/results`)}
                            style={{ padding: '8px 14px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.28)', borderRadius: '10px', color: '#d4a35a', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,163,90,0.20)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,163,90,0.12)')}
                          >
                            View Results
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/interviews/${interview.id}`)}
                            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: '#f0e8d8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          >
                            View Details
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(interview.id)}
                          style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="glass rounded-2xl max-w-md w-full overflow-hidden"
            style={{ border: '1px solid rgba(239,68,68,0.20)' }}
          >
            <div className="p-6" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: '20px', height: '20px', color: '#fca5a5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f0e8d8' }}>Delete Interview</h3>
                  <p style={{ fontSize: '12px', color: '#7a6f62', marginTop: '2px' }}>This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p style={{ fontSize: '14px', color: '#7a6f62', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete this interview? All questions, answers, and results will be lost forever.
              </p>
            </div>

            <div className="p-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px' }}>
              <button
                onClick={cancelDelete}
                style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: '#f0e8d8', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, padding: '10px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: '10px', color: '#fca5a5', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
              >
                Delete Forever
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
