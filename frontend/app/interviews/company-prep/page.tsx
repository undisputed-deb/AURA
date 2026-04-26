'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import { useBilling } from '@/lib/useBilling';
import UpgradeModal from '@/components/UpgradeModal';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/glass-button';

interface ParsedData {
  name?: string;
  [key: string]: unknown;
}

interface Resume {
  id: number;
  parsed_data: ParsedData;
  created_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#f0e8d8',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

export default function CompanyPrepPage() {
  const router = useRouter();
  const { isReady, getToken } = useClerkAuth();
  const { billing, isPremium, loading: billingLoading } = useBilling();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const maxQuestions = isPremium ? 15 : 5;

  const [formData, setFormData] = useState({
    resume_id: '',
    target_company: '',
    target_role: '',
    num_questions: 5
  });

  useEffect(() => {
    if (isReady) fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getResumes(token);
      setResumes(data.resumes || []);
      if (data.resumes && data.resumes.length > 0) {
        setFormData(prev => ({ ...prev, resume_id: data.resumes[0].id.toString() }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume_id) { setError('Please select a resume'); return; }
    if (!formData.target_company.trim()) { setError('Please enter a target company'); return; }
    if (!formData.target_role.trim()) { setError('Please enter a target role'); return; }

    try {
      setCreating(true);
      setError('');
      const token = await getToken();
      if (!token) return;
      const response = await api.createInterview(
        {
          resume_id: parseInt(formData.resume_id),
          job_description: `Company-specific prep for ${formData.target_role} at ${formData.target_company}`,
          num_questions: formData.num_questions,
          target_company: formData.target_company,
          target_role: formData.target_role
        },
        token
      );
      sessionStorage.setItem(`interview_${response.id}`, JSON.stringify(response));
      router.push(`/interviews/${response.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading || billingLoading || !billing) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid rgba(212,163,90,0.3)', borderTopColor: '#d4a35a', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#7a6f62', fontSize: '14px' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!isPremium) {
    return <UpgradeModal reason="company_prep" onClose={() => router.push('/dashboard')} />;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822' }}>
      {showUpgradeModal && <UpgradeModal reason="company_prep" onClose={() => setShowUpgradeModal(false)} />}

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '40px' }}>🎯</span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f0e8d8' }}>Company-Specific Prep</h1>
          </div>
          <p style={{ color: '#7a6f62', fontSize: '16px', marginBottom: '40px' }}>
            Get interview questions tailored to a specific company by researching recent experiences from Glassdoor, Reddit, and more
          </p>
        </motion.div>

        {resumes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
            className="glass rounded-2xl p-12"
            style={{ textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px', color: '#7a6f62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '8px' }}>No Resumes Found</h3>
            <p style={{ color: '#7a6f62', fontSize: '14px', marginBottom: '24px' }}>You need to upload a resume before creating an interview.</p>
            <GlassButton variant="amber" size="md" onClick={() => router.push('/resumes')}>Upload Resume</GlassButton>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
            className="glass rounded-2xl p-8"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Resume Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f0e8d8', marginBottom: '8px' }}>Select Resume</label>
                <select
                  value={formData.resume_id}
                  onChange={(e) => setFormData({ ...formData, resume_id: e.target.value })}
                  style={{ ...inputStyle }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#d4a35a')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  required
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id} style={{ background: '#1a1822', color: '#f0e8d8' }}>
                      {resume.parsed_data?.name || `Resume ${resume.id}`} · {new Date(resume.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Company & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f0e8d8', marginBottom: '8px' }}>Target Company *</label>
                  <input
                    type="text"
                    value={formData.target_company}
                    onChange={(e) => setFormData({ ...formData, target_company: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#d4a35a')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    placeholder="e.g., Google, Amazon, Meta"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f0e8d8', marginBottom: '8px' }}>Target Role *</label>
                  <input
                    type="text"
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    style={{ ...inputStyle }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#d4a35a')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    placeholder="e.g., Software Engineer, PM"
                    required
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="glass-amber rounded-xl p-4" style={{ border: '1px solid rgba(212,163,90,0.15)' }}>
                <p style={{ fontSize: '13px', color: '#f0e8d8', lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: '#d4a35a' }}>🌐 Real Questions from the Web</span>
                  <br />
                  We&apos;ll search Reddit, LeetCode, and other sources for actual interview questions from <strong>{formData.target_company || 'your target company'}</strong> and generate questions based on real interview experiences.
                </p>
              </div>

              {/* Number of Questions */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f0e8d8', marginBottom: '8px' }}>
                  Number of Questions: {formData.num_questions}
                </label>
                <input
                  type="range"
                  min="1"
                  max={maxQuestions}
                  value={Math.min(formData.num_questions, maxQuestions)}
                  onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#d4a35a' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7a6f62', marginTop: '4px' }}>
                  <span>1 question</span>
                  <span>{maxQuestions} questions</span>
                </div>
              </div>

              <GlassButton variant="amber" size="md" onClick={() => {}} className="w-full justify-center" type="submit" disabled={creating}>
                {creating ? 'Researching & Generating Questions...' : 'Generate Company-Specific Questions'}
              </GlassButton>
            </div>
          </motion.form>
        )}
      </div>
    </main>
  );
}
