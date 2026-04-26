'use client';

import { SignIn } from '@clerk/nextjs';
import Logo from '@/components/Logo';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-slate-100 dark:bg-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/50 dark:bg-slate-700/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-200/40 dark:bg-slate-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => window.location.href = '/'}>
            <Logo />
          </button>
        </div>

        {/* Clerk Sign In Component */}
        <SignIn
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
