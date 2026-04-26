'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 max-w-md w-full text-center border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          You&apos;re now on Pro!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Unlimited interviews, Company Prep, Ideal Answers — everything is unlocked. Go crush your next interview.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="ml-1">Redirecting to dashboard...</span>
        </div>
      </div>
    </div>
  );
}
