'use client';

import { useRouter } from 'next/navigation';

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 max-w-md w-full text-center border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          No worries
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You&apos;re still on the free plan. You can upgrade anytime from your dashboard when you&apos;re ready.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
