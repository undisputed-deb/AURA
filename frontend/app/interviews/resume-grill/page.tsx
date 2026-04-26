'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import LoadingMessages from '@/components/LoadingMessages';
import { useBilling } from '@/lib/useBilling';
import UpgradeModal from '@/components/UpgradeModal';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/glass-button';
import Logo from '@/components/Logo';

interface Resume {
  id: number;
  file_url: string;
  created_at: string;
  parsed_data: {
    name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export default function ResumeGrillPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { billing, isPremium, loading: billingLoading } = useBilling();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const maxQuestions = isPremium ? 10 : 5;

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResumes = async () => {
    try {
      const token = await getToken();
      if (!token) { setResumes([]); setLoading(false); return; }
      const data = await api.getResumes(token);
      setResumes(data.resumes || []);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrill = async () => {
    if (!selectedResume) return;
    setCreating(true);
    try {
      const token = await getToken();
      if (!token) { setCreating(false); return; }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/resume-grill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ resume_id: selectedResume, num_questions: numQuestions })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail;
        if (typeof detail === 'object' && detail !== null && detail.upgrade_required) { setCreating(false); return; }
        throw new Error(typeof detail === 'string' ? detail : 'Failed to create resume grill');
      }
      const interview = await response.json();
      router.push(`/interviews/${interview.id}`);
    } catch (error) {
      console.error('Failed to create resume grill:', error);
      alert(error instanceof Error ? error.message : 'Failed to create resume grill. Please try again.');
      setCreating(false);
    }
  };

  if (billingLoading || !billing) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid rgba(212,163,90,0.3)', borderTopColor: '#d4a35a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!isPremium) {
    return <UpgradeModal reason="resume_grill" onClose={() => router.push('/dashboard')} />;
  }

  if (creating) return <LoadingMessages interval={1500} type="resume-grill" />;

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/dashboard')}>
            <Logo />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a6f62', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="glass rounded-2xl p-8"
          style={{ border: '1px solid rgba(212,163,90,0.12)' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>
              🔥
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f0e8d8', marginBottom: '6px' }}>Resume Grill</h1>
              <p style={{ color: '#7a6f62', fontSize: '15px', lineHeight: 1.5 }}>
                Think you know your resume? Let&apos;s see if you can explain everything you wrote.
              </p>
              <p style={{ color: '#d4a35a', fontSize: '13px', marginTop: '6px' }}>
                This interview tests your deep knowledge of the technologies, projects, and achievements on your resume.
              </p>
            </div>
          </div>

          {/* Resume Selection */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#f0e8d8', marginBottom: '12px' }}>
              Select a resume to get grilled on:
            </label>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '64px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} className="animate-pulse" />
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: '#7a6f62', fontSize: '14px', marginBottom: '16px' }}>No resumes found. Upload one first!</p>
                <GlassButton variant="amber" size="md" onClick={() => router.push('/resumes')}>Upload Resume</GlassButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setSelectedResume(resume.id)}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '12px', border: selectedResume === resume.id ? '1px solid rgba(212,163,90,0.40)' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedResume === resume.id ? 'rgba(212,163,90,0.08)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (selectedResume !== resume.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (selectedResume !== resume.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ color: '#f0e8d8', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                          {resume.parsed_data?.name || 'Resume'}
                        </p>
                        <p style={{ color: '#7a6f62', fontSize: '12px' }}>
                          Uploaded {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedResume === resume.id && (
                        <div style={{ width: '22px', height: '22px', background: '#d4a35a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ width: '12px', height: '12px', color: '#0d0a08' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Number of Questions Slider */}
          {resumes.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#f0e8d8', marginBottom: '10px' }}>
                Number of Questions: {numQuestions}
              </label>
              <input
                type="range"
                min="1"
                max={maxQuestions}
                value={Math.min(numQuestions, maxQuestions)}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#d4a35a' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7a6f62', marginTop: '4px' }}>
                <span>1 question</span>
                <span>{maxQuestions} questions</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          {resumes.length > 0 && (
            <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <GlassButton
                variant="amber"
                size="md"
                onClick={handleStartGrill}
                className="w-full justify-center"
                disabled={!selectedResume || creating}
              >
                {creating ? 'Generating Questions...' : 'Get Grilled 🔥'}
              </GlassButton>
              <p style={{ textAlign: 'center', color: '#7a6f62', fontSize: '12px', marginTop: '10px' }}>
                This will generate {numQuestions} tough {numQuestions === 1 ? 'question' : 'questions'} about your resume
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
