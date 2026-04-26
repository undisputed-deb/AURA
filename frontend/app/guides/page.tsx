import { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';
import BackToHomeButton from '@/components/BackToHomeButton';
import GuideCard from '@/components/GuideCard';

export const metadata: Metadata = {
  title: 'Interview Preparation Guides | Reherse',
  description: 'Expert guides on behavioral interviews, technical prep, resume optimization, and interview strategies to help you ace your next job interview.',
  keywords: [
    'interview preparation',
    'interview guides',
    'behavioral interview tips',
    'technical interview prep',
    'resume tips',
    'interview strategies',
    'job interview help',
    'career advice'
  ],
  openGraph: {
    title: 'Interview Preparation Guides | Reherse',
    description: 'Expert guides to help you ace your next job interview',
    type: 'website',
  },
  alternates: {
    canonical: '/guides',
  },
};

export default async function GuidesPage() {
  const guides = await getAllGuides();

  return (
    <main style={{ minHeight: '100vh', background: '#1a1822', color: '#f0e8d8' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212,163,90,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(212,163,90,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section style={{ padding: '80px 24px 48px' }}>
          <div className="max-w-7xl mx-auto text-center">
            <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(212,163,90,0.10)', border: '1px solid rgba(212,163,90,0.25)', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#d4a35a', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '24px' }}>
              Free Resources
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f0e8d8', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Interview Preparation Guides
            </h1>
            <p style={{ color: '#7a6f62', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              Expert strategies, tips, and techniques to help you ace behavioral interviews,
              technical assessments, and land your dream job.
            </p>
            <BackToHomeButton />
          </div>
        </section>

        {/* Guides Grid */}
        <section style={{ padding: '0 24px 80px' }}>
          <div className="max-w-7xl mx-auto">
            {guides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <p style={{ color: '#7a6f62', fontSize: '18px' }}>Guides coming soon! Check back later.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.slug}
                    slug={guide.slug}
                    category={guide.category}
                    title={guide.title}
                    description={guide.description}
                    readTime={guide.readTime}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '0 24px 80px' }}>
          <div className="max-w-4xl mx-auto">
            <div className="glass-amber rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(212,163,90,0.20)' }}>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#f0e8d8', marginBottom: '12px' }}>
                Ready to Practice?
              </h2>
              <p style={{ color: '#7a6f62', fontSize: '16px', marginBottom: '32px' }}>
                Turn these strategies into skills with Reherse&apos;s AI-powered interview coach
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/sign-up"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', background: 'rgba(212,163,90,0.15)', border: '1px solid rgba(212,163,90,0.35)', borderRadius: '12px', color: '#d4a35a', fontWeight: 700, fontSize: '15px', textDecoration: 'none', backdropFilter: 'blur(16px)', transition: 'background 0.15s' }}
                >
                  Start Free Practice →
                </Link>
                <Link
                  href="/"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#f0e8d8', fontWeight: 700, fontSize: '15px', textDecoration: 'none', backdropFilter: 'blur(16px)', transition: 'background 0.15s' }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
