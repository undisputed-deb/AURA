'use client';

import Link from 'next/link';

interface GuideCardProps {
  slug: string;
  category: string;
  title: string;
  description: string;
  readTime: string;
}

export default function GuideCard({ slug, category, title, description, readTime }: GuideCardProps) {
  return (
    <Link href={`/guides/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="glass group rounded-2xl h-full"
        style={{ padding: '24px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(212,163,90,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
      >
        <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.20)', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: '#d4a35a', marginBottom: '14px' }}>
          {category}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f0e8d8', marginBottom: '10px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {title}
        </h3>
        <p style={{ color: '#7a6f62', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#7a6f62' }}>{readTime}</span>
          <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1" style={{ color: '#d4a35a', fontWeight: 600 }}>
            Read guide
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
