import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Reherse AI Interview Coach',
  description: 'Start free. Reherse Pro unlocks unlimited AI mock interviews, voice scoring, and detailed answer feedback. No commitment required.',
  alternates: {
    canonical: 'https://reherse.dev/pricing',
  },
  openGraph: {
    title: 'Pricing — Reherse AI Interview Coach',
    description: 'Start free. Upgrade to Pro for unlimited AI mock interviews and voice feedback.',
    url: 'https://reherse.dev/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Reherse AI Interview Coach',
    description: 'Start free. Upgrade to Pro for unlimited AI mock interviews and voice feedback.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
