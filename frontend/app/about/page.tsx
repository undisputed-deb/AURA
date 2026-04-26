import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | Reherse',
  description: 'Learn more about Reherse, the AI-powered interview coaching platform.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            About Reherse
          </h1>
          <p className="text-2xl text-slate-600 dark:text-slate-400 mb-12">
            Coming Soon
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            We&apos;re working on sharing our story with you.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
