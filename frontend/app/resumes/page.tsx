'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import Modal from '@/components/Modal';
import LoadingMessages from '@/components/LoadingMessages';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/glass-button';

interface Resume {
  id: number;
  file_url: string;
  parsed_data: {
    name?: string;
    email?: string;
    technical_skills?: string[];
    languages?: string[];
    [key: string]: unknown;
  };
  created_at: string;
}

export default function ResumesPage() {
  const router = useRouter();
  const { isReady, getToken } = useClerkAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: true,
  });

  useEffect(() => {
    if (!isReady) return;
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getResumes(token);
      setResumes(data.resumes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setError('');
      const token = await getToken();
      if (!token) return;
      await api.uploadResume(selectedFile, token);
      setSelectedFile(null);
      fetchResumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId: number) => {
    setModalState({
      isOpen: true,
      type: 'warning',
      title: 'Delete Resume',
      message: 'Are you sure you want to delete this resume?\n\nWARNING: This will also delete all interviews created with this resume.',
      showCancel: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const result = await api.deleteResume(resumeId, token);
          setModalState({
            isOpen: true,
            type: 'success',
            title: 'Resume Deleted',
            message: result.deleted_interviews > 0
              ? `Resume deleted successfully.\n\n${result.deleted_interviews} associated interview(s) were also deleted.`
              : 'Resume deleted successfully.',
            showCancel: false,
          });
          fetchResumes();
        } catch (err) {
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Delete Failed',
            message: err instanceof Error ? err.message : 'Failed to delete resume. Please try again.',
            showCancel: false,
          });
        }
      },
    });
  };

  if (uploading) {
    return <LoadingMessages interval={1500} type="resume-upload" />;
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#1a1822' }}>
        <nav className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Logo />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div style={{ height: '44px', width: '240px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '16px' }} className="animate-pulse" />
          <div style={{ height: '24px', width: '360px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '48px' }} className="animate-pulse" />
          <div className="glass rounded-2xl p-8 mb-6">
            <div style={{ height: '32px', width: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '24px' }} className="animate-pulse" />
            <div style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} className="animate-pulse" />
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(212,163,90,0.12)', borderRadius: '12px' }} className="animate-pulse" />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '20px', width: '160px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '8px' }} className="animate-pulse" />
                  <div style={{ height: '14px', width: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} className="animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

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

      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '8px' }}>My Resumes</h1>
          <p style={{ color: '#7a6f62', fontSize: '16px', marginBottom: '40px' }}>Upload and manage your resumes with AI-powered parsing</p>
        </motion.div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
          className="glass rounded-2xl p-8 mb-6"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0e8d8', marginBottom: '20px' }}>Upload New Resume</h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#d4a35a' : 'rgba(212,163,90,0.25)'}`,
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              transition: 'all 0.2s',
              background: dragActive ? 'rgba(212,163,90,0.06)' : 'rgba(255,255,255,0.02)',
              cursor: 'default',
            }}
          >
            {!selectedFile ? (
              <div>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '24px', height: '24px', color: '#d4a35a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p style={{ color: '#f0e8d8', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Drop your resume here or click to browse</p>
                <p style={{ color: '#7a6f62', fontSize: '13px', marginBottom: '20px' }}>PDF only, max 10MB</p>
                <GlassButton variant="amber" size="sm" onClick={() => fileInputRef.current?.click()} className="inline-flex">
                  Choose File
                </GlassButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(212,163,90,0.06)', border: '1px solid rgba(212,163,90,0.15)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#d4a35a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: '#f0e8d8', fontWeight: 600, fontSize: '14px' }}>{selectedFile.name}</p>
                    <p style={{ color: '#7a6f62', fontSize: '12px' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <GlassButton variant="amber" size="sm" onClick={handleUpload}>Upload</GlassButton>
                  <button
                    onClick={() => setSelectedFile(null)}
                    style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: '#7a6f62', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resumes List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.16 }}
          className="glass rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8' }}>Your Resumes ({resumes.length})</h2>
          </div>

          {resumes.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '24px', height: '24px', color: '#7a6f62' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{ color: '#7a6f62', fontSize: '14px' }}>No resumes uploaded yet.</p>
              <p style={{ color: '#7a6f62', fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>Upload your first resume above!</p>
            </div>
          ) : (
            <div>
              {resumes.map((resume, idx) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                  style={{ padding: '20px 24px', borderBottom: idx < resumes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: '16px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flexShrink: 0, width: '52px', height: '52px', background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.20)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '24px', height: '24px', color: '#d4a35a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f0e8d8', marginBottom: '2px' }}>
                      {resume.parsed_data?.name || 'Resume'}
                    </h3>
                    <p style={{ color: '#7a6f62', fontSize: '13px', marginBottom: '8px' }}>
                      {resume.parsed_data?.email || 'No email'} · Uploaded {new Date(resume.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {resume.parsed_data?.technical_skills && Array.isArray(resume.parsed_data.technical_skills) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {resume.parsed_data.technical_skills.slice(0, 6).map((skill: string, i: number) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.18)', color: '#d4a35a', fontSize: '11px', borderRadius: '999px' }}>
                            {skill}
                          </span>
                        ))}
                        {resume.parsed_data.technical_skills.length > 6 && (
                          <span style={{ fontSize: '11px', color: '#7a6f62', padding: '2px 0' }}>+{resume.parsed_data.technical_skills.length - 6} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <a
                      href={resume.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', color: '#f0e8d8', fontSize: '13px', fontWeight: 600, textDecoration: 'none', textAlign: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
                    >
                      View PDF
                    </a>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showCancel={modalState.showCancel}
      />
    </main>
  );
}
