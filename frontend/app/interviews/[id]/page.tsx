'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

interface Question {
  question_number: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  category: string;
  expected_topics: string[];
}

interface InterviewData {
  id: number;
  status: string;
  job_description: string;
  created_at: string;
  target_company?: string;
  questions: Question[];
  jd_analysis?: {
    job_title?: string;
    company?: string;
    required_skills?: string[];
    experience_level?: string;
    [key: string]: unknown;
  };
}

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isReady, getToken } = useClerkAuth();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getInterview(parseInt(params.id as string), token);
      setInterview(data);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interview');
    } finally {
      setLoading(false);
    }
  }, [params.id, getToken]);

  useEffect(() => {
    if (!isReady) return;

    const cachedData = sessionStorage.getItem(`interview_${params.id}`);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      setInterview(data);
      setQuestions(data.questions || []);
      setLoading(false);
    } else {
      fetchInterview();
    }
  }, [isReady, params.id, fetchInterview]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300';
      case 'hard': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      default: return 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'technical': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      case 'behavioral': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
      case 'situational': return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300';
      default: return 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-700 dark:text-red-300 mb-4">{error || 'Interview not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-800">
      {/* Neutral slate theme background */}
      <div className="fixed inset-0 z-0 bg-slate-100 dark:bg-slate-800">
        {/* Subtle colored accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/50 dark:bg-slate-700/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-200/40 dark:bg-slate-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push('/dashboard')}>
              <Logo />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Interview Questions
              </h1>
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                interview.status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                interview.status === 'in_progress' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' :
                interview.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
                'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}>
                {interview.status === 'in_progress' ? 'In Progress' : interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
              </span>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {interview.jd_analysis?.job_title || 'Interview'} - {questions.length} Questions
            </p>
          </div>

          {interview.status === 'pending' && (
            <button
              onClick={() => router.push(`/interviews/${params.id}/live`)}
              className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Interview
            </button>
          )}

          {interview.status === 'in_progress' && (
            <button
              onClick={() => router.push(`/interviews/${params.id}/live`)}
              className="px-8 py-4 bg-green-600 dark:bg-green-500 text-white rounded-xl font-semibold hover:bg-green-700 dark:hover:bg-green-600 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Continue Interview
            </button>
          )}

          {interview.status === 'completed' && (
            <button
              onClick={() => router.push(`/interviews/${params.id}/results`)}
              className="px-8 py-4 bg-purple-600 dark:bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Results
            </button>
          )}
        </div>

        {/* Job Analysis / Resume Analysis */}
        <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {interview.job_description ? 'Job Analysis' : 'Resume Analysis'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {interview.jd_analysis?.job_title && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Position</p>
                <p className="text-slate-900 dark:text-white font-medium">{interview.jd_analysis.job_title}</p>
              </div>
            )}
            {interview.jd_analysis?.experience_level && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Experience Level</p>
                <p className="text-slate-900 dark:text-white font-medium capitalize">{String(interview.jd_analysis.experience_level)}</p>
              </div>
            )}
            {interview.jd_analysis?.required_skills && interview.jd_analysis.required_skills.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {interview.jd_analysis.required_skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.question_number} className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 dark:bg-blue-400 rounded-xl flex items-center justify-center">
                  <span className="text-white dark:text-slate-900 font-bold text-lg">{question.question_number}</span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-3 py-1 border text-xs font-semibold rounded-full ${getTypeColor(question.question_type)}`}>
                      {question.question_type}
                    </span>
                    <span className={`px-3 py-1 border text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                      {question.category}
                    </span>
                  </div>

                  <p className="text-slate-900 dark:text-white text-lg mb-4 leading-relaxed">
                    {question.question_text}
                  </p>

                  {question.expected_topics && question.expected_topics.length > 0 && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Expected Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {question.expected_topics.map((topic: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/interviews/new')}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition"
          >
            Create Another Interview
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
