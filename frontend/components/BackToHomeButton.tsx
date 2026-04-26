'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function BackToHomeButton() {
  const { isSignedIn } = useAuth();

  return (
    <Link
      href={isSignedIn ? "/dashboard" : "/"}
      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
    >
      ← Back to {isSignedIn ? "Dashboard" : "Home"}
    </Link>
  );
}
