'use client';

import { useRouter } from 'next/navigation';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { GlassButton } from '@/components/ui/glass-button';
import { SolarSystem } from '@/components/ui/solar-system';
import { RemotionPlayerWrapper } from '@/components/remotion/PlayerWrapper';
import {
  Mic, FileText, Zap, Building2, Star, TrendingUp,
  ChevronRight, Check, ArrowRight
} from 'lucide-react';

// ─── SplitWords: word-by-word reveal ─────────────────────────────────────────
function SplitWords({ text, style, className, baseDelay = 0 }: {
  text: string; style?: React.CSSProperties; className?: string; baseDelay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <span ref={ref} className={className} style={{ ...style, display: 'inline' }}>
      {text.split(' ').map((word, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', marginRight: '0.28em' }}>
          <motion.span
            initial={{ y: '110%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 0.55, delay: baseDelay + i * 0.07, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ─── CountUp: animated number ────────────────────────────────────────────────
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const ctrl = animate(count, to, { duration: 1.6, ease: 'easeOut' });
    const unsub = rounded.on('change', v => setDisplay(v));
    return () => { ctrl.stop(); unsub(); };
  }, [isInView]);
  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Bento micro-visuals ──────────────────────────────────────────────────────

// Waveform — deterministic heights, no random()
const WAVE_PAIRS: [number, number][] = [
  [16,44],[28,58],[44,22],[36,62],[52,30],[40,66],
  [24,50],[50,18],[42,58],[30,48],[58,26],[38,60],
  [22,46],[46,24],[34,54],[18,42],
];
function BentoWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 64, padding: '0 4px' }}>
      {WAVE_PAIRS.map(([lo, hi], i) => (
        <motion.div
          key={i}
          animate={{ height: [lo, hi, lo] }}
          transition={{ duration: 1.1 + i * 0.07, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 }}
          style={{ width: 5, borderRadius: 3, background: `rgba(212,163,90,${0.35 + 0.65 * (hi / 100)})`, flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

// Skills chips — stagger in, then loop
const SKILL_LIST = ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'Figma'];
function BentoSkills() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {SKILL_LIST.map((s, i) => (
        <motion.div
          key={s}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: i * 0.09 }}
          style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'rgba(212,163,90,0.10)', border: '1px solid rgba(212,163,90,0.22)',
            color: '#d4a35a',
          }}
        >
          {s}
        </motion.div>
      ))}
    </div>
  );
}

// Score ring
function BentoScore() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const circ = 2 * Math.PI * 44;
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg width={100} height={100} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
          <motion.circle
            cx={50} cy={50} r={44} fill="none" stroke="#d4a35a" strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: circ - 0.92 * circ } : {}}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#d4a35a', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>92</span>
          <span style={{ color: 'rgba(240,232,216,0.4)', fontSize: 10 }}>/100</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['Clarity', 'Depth', 'Confidence'].map((l, i) => (
          <div key={l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'rgba(240,232,216,0.5)', fontSize: 11 }}>{l}</span>
              <span style={{ color: '#d4a35a', fontSize: 11, fontWeight: 700 }}>{[94, 89, 93][i]}</span>
            </div>
            <div style={{ width: 100, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${[94, 89, 93][i]}%` } : {}}
                transition={{ duration: 1, delay: 0.5 + i * 0.12, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: '#d4a35a' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Company chips cycling
const TECH_COS = ['Google', 'Meta', 'Amazon', 'Stripe', 'Netflix', 'Apple', 'Notion', 'Figma'];
function BentoCompanies() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {TECH_COS.map((co, i) => (
        <motion.div
          key={co}
          initial={{ y: 12, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
          style={{
            padding: '4px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(240,232,216,0.65)',
          }}
        >
          {co}
        </motion.div>
      ))}
    </div>
  );
}

// S-T-A-R letter cycler
const STAR_LABELS = [
  { l: 'S', full: 'Situation' },
  { l: 'T', full: 'Task'      },
  { l: 'A', full: 'Action'    },
  { l: 'R', full: 'Result'    },
];
function BentoSTAR() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % 4), 750);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {STAR_LABELS.map(({ l, full }, i) => (
        <motion.div
          key={l}
          animate={{ scale: active === i ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          style={{
            flex: 1, borderRadius: 12, padding: '10px 6px', textAlign: 'center',
            background: active === i ? 'rgba(212,163,90,0.15)' : 'rgba(255,255,255,0.04)',
            border: active === i ? '1px solid rgba(212,163,90,0.35)' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ color: active === i ? '#d4a35a' : 'rgba(240,232,216,0.4)', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{l}</div>
          <div style={{ color: active === i ? 'rgba(240,232,216,0.7)' : 'rgba(240,232,216,0.25)', fontSize: 9, marginTop: 4 }}>{full}</div>
        </motion.div>
      ))}
    </div>
  );
}

// Progress bar chart
const PROG_SCORES = [58, 65, 70, 74, 79, 84, 92];
function BentoChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 64 }}>
      {PROG_SCORES.map((s, i) => {
        const isLast = i === PROG_SCORES.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <motion.div
              initial={{ height: 0 }}
              animate={inView ? { height: `${s}%` } : {}}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
              style={{
                width: '100%', borderRadius: '3px 3px 0 0', minHeight: 3,
                background: isLast ? '#d4a35a' : `rgba(212,163,90,${0.2 + 0.45 * (s / 100)})`,
                border: isLast ? '1px solid rgba(212,163,90,0.5)' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── How It Works micro-visuals ──────────────────────────────────────────────

function StepUploadVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 10,
      }}>
        <FileText size={16} style={{ color: '#d4a35a', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'rgba(240,232,216,0.6)', flex: 1 }}>resume.pdf</span>
        <span style={{ fontSize: 10, color: '#d4a35a', fontWeight: 600 }}>✓</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: '100%' } : {}}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #d4a35a, #f0c878)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(122,111,98,0.6)' }}>Analyzing skills…</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.4 }}
          style={{ fontSize: 10, color: '#d4a35a', fontWeight: 600 }}
        >
          Done
        </motion.span>
      </div>
    </div>
  );
}

const JOB_ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Lead'];
function StepRoleVisual() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(p => (p + 1) % JOB_ROLES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        style={{
          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.28)',
          color: '#d4a35a',
        }}
      >
        {JOB_ROLES[idx]}
      </motion.div>
      <div style={{ display: 'flex', gap: 5 }}>
        {JOB_ROLES.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i === idx ? '#d4a35a' : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}

function StepScoreVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const circ = 2 * Math.PI * 32;
  return (
    <div ref={ref} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <svg width={72} height={72} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={36} cy={36} r={32} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
          <motion.circle
            cx={36} cy={36} r={32} fill="none" stroke="#d4a35a" strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: circ - 0.91 * circ } : {}}
            transition={{ duration: 1.3, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#d4a35a', fontSize: 16, fontWeight: 800 }}>91</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {['Clarity', 'Confidence', 'Depth'].map((label, i) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: 'rgba(240,232,216,0.45)' }}>{label}</span>
              <span style={{ fontSize: 10, color: '#d4a35a', fontWeight: 700 }}>{[95, 88, 91][i]}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${[95, 88, 91][i]}%` } : {}}
                transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: '#d4a35a' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── structured data for SEO ────────────────────────────────────────────────
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Aura',
  applicationCategory: 'EducationalApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'AI-powered voice interview coach for job interview preparation',
  operatingSystem: 'Web',
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '150' },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Aura',
  url: 'https://aura.dev',
};

// ─── constants ───────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Mic,        title: 'Voice Practice',     desc: 'Practice answering Qs out loud with a live voice simulation. Real-time transcription helps you polish answers.' },
  { Icon: FileText,   title: 'Resume Analysis',    desc: 'AI extracts your skills and experience to generate hyper-personalised interview questions.' },
  { Icon: Zap,        title: 'Instant Feedback',   desc: 'Get AI-powered analysis with strengths, gaps, and specific improvement tips after each answer.' },
  { Icon: Building2,  title: 'Company Prep',       desc: 'Questions customized for the company\'s culture and specific interview format. Command the conversation every time.' },
  { Icon: Star,       title: 'STAR Method',        desc: 'Pro coaching to master your behavioral flow. Structuring answers with the standard, proven STAR framework.' },
  { Icon: TrendingUp, title: 'Progress Tracking',  desc: 'Track your improvement across sessions with detailed analytics and performance trends.' },
];

const STEPS = [
  { n: '01', title: 'Upload Your Resume', desc: 'Our AI reads your resume to understand your unique background, skills, and experience.' },
  { n: '02', title: 'Pick Role & Company', desc: "Add the job description you're targeting. We generate questions that match the role perfectly." },
  { n: '03', title: 'Practice & Score', desc: 'Answer with your voice, get instant AI feedback, and track your progress over time.' },
];

const FREE_FEATURES = [
  { text: '2 lifetime interviews', on: true },
  { text: 'Up to 5 questions per interview', on: true },
  { text: 'AI scoring & feedback', on: true },
  { text: 'Analytics & progress tracking', on: true },
  { text: 'Unlimited resume uploads', on: true },
  { text: 'Resume Grill', on: false },
  { text: 'Company-Specific Prep', on: false },
  { text: 'Ideal Answer examples', on: false },
];

const PRO_FEATURES = [
  'Unlimited interviews',
  'Up to 15 questions per interview',
  'AI scoring & feedback',
  'Analytics & progress tracking',
  'Unlimited resume uploads',
  'Resume Grill',
  'Company-Specific Prep',
  'Ideal Answer examples',
];

const COMPANIES = ['Google', 'Meta', 'Amazon', 'Netflix', 'Stripe', 'Shopify', 'Airbnb', 'Figma', 'Apple', 'Notion'];

// ─── card tilt hook ──────────────────────────────────────────────────────────
function useTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - r.top)  / r.height - 0.5;
    const y = (e.clientX - r.left) / r.width  - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });
  const style = {
    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: 'transform 0.15s ease',
  };
  return { onMove, onLeave, style };
}

// ─── sub-components ──────────────────────────────────────────────────────────
function FeatureCard({ Icon, title, desc }: typeof FEATURES[0]) {
  const { onMove, onLeave, style } = useTilt();
  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
      className="glass rounded-2xl p-8 flex flex-col gap-4 cursor-default"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
      >
        <Icon size={18} style={{ color: '#d4a35a' }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: '#f0e8d8' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#7a6f62' }}>{desc}</p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'annual'>('monthly');

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  });

  const inView = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      <div style={{ background: '#1a1822', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

        {/* Film grain overlay — fixed, not a gradient, just texture */}
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
            opacity: 0.06,
            mixBlendMode: 'overlay',
          }}
        />

        {/* ── Navbar ────────────────────────────────────────────────────────── */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="sticky top-0 z-50"
          style={{
            background: 'rgba(26,24,34,0.90)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              {[['Features', '#features'], ['Pricing', '#pricing'], ['Guides', '/guides']].map(([label, href]) => (
                <button
                  key={label}
                  onClick={() => href.startsWith('#')
                    ? document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
                    : router.push(href)
                  }
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: '#7a6f62' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f0e8d8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <GlassButton variant="neutral" size="sm" onClick={() => router.push('/sign-in')}>
                Log in
              </GlassButton>
              <GlassButton variant="amber" size="sm" onClick={() => router.push('/sign-up')}>
                Get Started
              </GlassButton>
            </div>
          </div>
        </motion.nav>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-screen grid md:grid-cols-2 items-center px-6 max-w-7xl mx-auto gap-12 py-24 md:py-0"
          style={{ zIndex: 1 }}
        >
          {/* Dot grid — not a gradient, purely structural texture */}
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, transparent 100%)',
            }}
          />
          {/* Left */}
          <div className="flex flex-col gap-8 relative z-10">
            {/* Badge */}
            <motion.div {...fadeUp(0.1)} className="inline-flex w-fit">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(212,163,90,0.08)',
                  border: '1px solid rgba(212,163,90,0.20)',
                  color: '#d4a35a',
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#d4a35a' }}
                />
                AI-Powered Interview Coaching
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.25)}
              className="font-black leading-[1.05] uppercase"
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.8rem)',
                color: '#f0e8d8',
                fontFamily: 'var(--font-orbitron), "Share Tech Mono", monospace',
                letterSpacing: '0.06em',
                textShadow: '0 0 20px rgba(0,255,136,0.15)',
              }}
            >
              Land The Role{' '}
              <br />
              <span
                style={{
                  color: '#00ff88',
                  position: 'relative',
                  display: 'inline-block',
                  textShadow: '0 0 24px rgba(0,255,136,0.5)',
                }}
              >
                You Deserve
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 0,
                    height: 2,
                    background: '#00ff88',
                    borderRadius: 1,
                    opacity: 0.6,
                    boxShadow: '0 0 8px rgba(0,255,136,0.6)',
                  }}
                />
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              {...fadeUp(0.4)}
              className="leading-relaxed max-w-md"
              style={{
                color: '#7a6f62',
                fontFamily: 'var(--font-jetbrains), "Fira Code", monospace',
                fontSize: '0.95rem',
                letterSpacing: '0.03em',
              }}
            >
              Refine your pitch with AI-driven resume interrogation. Harness real-time voice data to{' '}
              <span style={{ color: '#f0e8d8', fontWeight: 600 }}>clarify your value</span>{' '}
              and stand apart.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.55)} className="flex items-center gap-4 flex-wrap">
              <GlassButton variant="amber" size="lg" onClick={() => router.push('/sign-up')}>
                Start Practicing Free
                <ArrowRight size={16} />
              </GlassButton>
              <GlassButton
                variant="neutral"
                size="lg"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Demo
              </GlassButton>
            </motion.div>

            {/* Trust stats */}
            <motion.div {...fadeUp(0.7)} className="flex items-center gap-6 flex-wrap">
              {[
                { val: <><CountUp to={1000} suffix="+" /></>, label: 'Interviews' },
                { val: <><CountUp to={4} suffix="" />.9★</>, label: 'Rating' },
                { val: 'Free', label: 'to Start' },
              ].map(({ val, label }, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 20 }}>|</span>}
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#d4a35a' }}>{val}</div>
                    <div className="text-xs" style={{ color: '#7a6f62' }}>{label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Solar System */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="hidden md:flex items-center justify-center"
          >
            <SolarSystem />
          </motion.div>
        </section>

        {/* ── Marquee ───────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden py-6"
          style={{
            background: '#151420',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            zIndex: 1,
          }}
        >
          <p
            className="text-center text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ color: 'rgba(122,111,98,0.7)' }}
          >
            Used by candidates from
          </p>
          <div
            style={{
              display: 'flex',
              gap: 16,
              animation: 'marquee-scroll 25s linear infinite',
              width: 'max-content',
            }}
          >
            {[...COMPANIES, ...COMPANIES].map((c, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(240,232,216,0.45)',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* ── Video Demo ────────────────────────────────────────────────────── */}
        <section id="demo" className="px-6 py-24 max-w-5xl mx-auto" style={{ zIndex: 1, position: 'relative' }}>
          <motion.div {...inView()} className="text-center mb-12">
            <div
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
              style={{ color: '#d4a35a', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.15)' }}
            >
              See It In Action
            </div>
            <h2
              className="font-bold leading-tight uppercase"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                color: '#f0e8d8',
                fontFamily: 'var(--font-orbitron), monospace',
                letterSpacing: '0.05em',
                textShadow: '0 0 16px rgba(0,255,136,0.12)',
              }}
            >
              <SplitWords text="Last session before" baseDelay={0.1} />
              <br />
              <SplitWords text="the real interview." baseDelay={0.5} style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,0.4)' }} />
            </h2>
          </motion.div>

          <motion.div
            {...inView(0.15)}
            className="rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(212,163,90,0.15)',
              boxShadow: '0 0 60px rgba(212,163,90,0.06)',
            }}
          >
            <RemotionPlayerWrapper />
          </motion.div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section
          id="features"
          className="px-6 py-24"
          style={{
            background: '#201e2b',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', zIndex: 1,
          }}
        >
        <div className="max-w-7xl mx-auto">
          <motion.div {...inView()} className="text-center mb-16">
            <div
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
              style={{ color: '#d4a35a', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.15)' }}
            >
              Features
            </div>
            <h2
              className="font-bold uppercase"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                color: '#f0e8d8',
                fontFamily: 'var(--font-orbitron), monospace',
                letterSpacing: '0.05em',
                textShadow: '0 0 16px rgba(0,255,136,0.12)',
              }}
            >
              <SplitWords text="Everything You Need to Slay" />
            </h2>
            <motion.p
              {...inView(0.3)}
              className="mt-4"
              style={{
                color: '#7a6f62',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: '0.9rem',
                letterSpacing: '0.03em',
              }}
            >
              High-key powerful AI tools that give you a huge advantage for landing roles. Speak with authority and close the deal.
            </motion.p>
          </motion.div>

          {/* Bento grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'auto auto auto',
              gap: 16,
            }}
            className="max-sm:flex max-sm:flex-col"
          >
            {/* 1 — Voice Practice (tall, col 1, rows 1-2) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '1', gridRow: '1 / 3' }}
              className="glass rounded-2xl p-7 flex flex-col gap-5 cursor-default relative overflow-hidden group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
              >
                <Mic size={18} style={{ color: '#d4a35a' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '1rem' }}>Voice Practice</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a6f62', fontFamily: 'var(--font-jetbrains), monospace', fontSize: '0.82rem' }}>
                  Practice answering Qs out loud with a live voice simulation. Real-time transcription helps you polish answers.
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-4">
                <BentoWave />
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: '#d4a35a' }}
                  />
                  <span className="text-xs font-semibold" style={{ color: '#d4a35a' }}>Recording…</span>
                </div>
              </div>
              {/* hover shimmer */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* 2 — Resume Analysis (col 2, row 1) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.08, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '2', gridRow: '1' }}
              className="glass rounded-2xl p-7 flex flex-col gap-4 cursor-default relative overflow-hidden group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
              >
                <FileText size={18} style={{ color: '#d4a35a' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '0.9rem' }}>Resume Analysis</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a6f62' }}>
                  AI extracts your skills to generate hyper-personalised questions.
                </p>
              </div>
              <BentoSkills />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* 3 — Instant Feedback (tall, col 3, rows 1-2) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.16, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '3', gridRow: '1 / 3' }}
              className="glass rounded-2xl p-7 flex flex-col gap-5 cursor-default relative overflow-hidden group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
              >
                <Zap size={18} style={{ color: '#d4a35a' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '1rem' }}>Instant Feedback</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a6f62' }}>
                  AI-powered analysis with strengths, gaps, and specific improvement tips after every answer.
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <BentoScore />
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* 4 — Company Prep (col 2, row 2) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '2', gridRow: '2' }}
              className="glass rounded-2xl p-7 flex flex-col gap-4 cursor-default relative overflow-hidden group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
              >
                <Building2 size={18} style={{ color: '#d4a35a' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '0.9rem' }}>Company Prep</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a6f62', fontFamily: 'var(--font-jetbrains), monospace', fontSize: '0.82rem' }}>
                  Questions customized for the company&apos;s culture and specific interview format. Command the conversation every time.
                </p>
              </div>
              <BentoCompanies />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* 5 — STAR Method (col 1, row 3) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '1', gridRow: '3' }}
              className="glass rounded-2xl p-7 flex flex-col gap-4 cursor-default relative overflow-hidden group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
              >
                <Star size={18} style={{ color: '#d4a35a' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '0.9rem' }}>STAR Method</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a6f62', fontFamily: 'var(--font-jetbrains), monospace', fontSize: '0.82rem' }}>
                  Pro coaching to master your behavioral flow. Structuring answers with the standard, proven STAR framework.
                </p>
              </div>
              <BentoSTAR />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* 6 — Progress Tracking (cols 2-3, row 3) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.28, type: 'spring', stiffness: 100, damping: 18 }}
              style={{ gridColumn: '2 / 4', gridRow: '3' }}
              className="glass rounded-2xl p-7 flex flex-col gap-4 cursor-default relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(212,163,90,0.12)', border: '1px solid rgba(212,163,90,0.25)' }}
                  >
                    <TrendingUp size={18} style={{ color: '#d4a35a' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '0.9rem' }}>Progress Tracking</h3>
                    <p className="text-sm" style={{ color: '#7a6f62' }}>Performance over 7 sessions</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-2xl font-bold" style={{ color: '#d4a35a' }}>+59%</div>
                  <div className="text-xs" style={{ color: '#7a6f62' }}>improvement</div>
                </div>
              </div>
              <BentoChart />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.06) 0%, transparent 70%)' }}
              />
            </motion.div>
          </div>
        </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section className="px-6 py-24" style={{ position: 'relative', zIndex: 1 }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...inView()} className="text-center mb-16">
              <div
                className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
                style={{ color: '#d4a35a', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.15)' }}
              >
                How It Works
              </div>
              <h2
                className="font-bold uppercase"
                style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
                  color: '#f0e8d8',
                  fontFamily: 'var(--font-orbitron), monospace',
                  letterSpacing: '0.05em',
                  textShadow: '0 0 16px rgba(0,255,136,0.12)',
                }}
              >
                <SplitWords text="Get started in 3 steps" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 relative" style={{ perspective: 1200 }}>
              {/* Connecting line between cards */}
              <div
                className="hidden md:block absolute"
                style={{
                  top: 40, left: '18%', right: '18%', height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(212,163,90,0.25) 20%, rgba(212,163,90,0.25) 80%, transparent)',
                  zIndex: 0,
                }}
              />
              {/* Animated dots on the line */}
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  className="hidden md:block absolute"
                  style={{ top: 36, left: i === 0 ? '33.3%' : '66.6%', width: 8, height: 8, zIndex: 1 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4a35a' }} />
                </motion.div>
              ))}

              {STEPS.map((step, i) => {
                const visuals = [<StepUploadVisual key="upload" />, <StepRoleVisual key="role" />, <StepScoreVisual key="score" />];
                return (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 60, rotateX: 12 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ type: 'spring', stiffness: 80, damping: 16, delay: i * 0.15 }}
                    whileHover={{ y: -10, transition: { duration: 0.25, ease: 'easeOut' } }}
                    style={{ transformStyle: 'preserve-3d', zIndex: 2, position: 'relative' }}
                  >
                    <div
                      className="glass rounded-2xl p-8 h-full relative overflow-hidden cursor-default group"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Giant background step number */}
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute', right: -6, top: -16,
                          fontSize: 130, fontWeight: 900, lineHeight: 1,
                          color: 'rgba(212,163,90,0.05)',
                          userSelect: 'none', pointerEvents: 'none',
                          fontFamily: 'var(--font-rubik)',
                        }}
                      >
                        {step.n}
                      </div>

                      {/* Step badge */}
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: i * 0.15 + 0.25 }}
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'rgba(212,163,90,0.12)',
                          border: '1px solid rgba(212,163,90,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 18, position: 'relative', zIndex: 1,
                          fontSize: 13, fontWeight: 700, color: '#d4a35a',
                        }}
                      >
                        {step.n}
                      </motion.div>

                      <h3 className="text-xl font-bold mb-3 relative z-10 uppercase" style={{ color: '#f0e8d8', fontFamily: 'var(--font-orbitron), monospace', letterSpacing: '0.05em', fontSize: '0.95rem' }}>
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed relative z-10" style={{ color: '#7a6f62', fontFamily: 'var(--font-jetbrains), monospace', fontSize: '0.82rem' }}>
                        {step.desc}
                      </p>

                      {/* Per-step micro-visual */}
                      <div className="relative z-10">{visuals[i]}</div>

                      {/* Hover shimmer */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,163,90,0.07) 0%, transparent 65%)' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="px-6 py-24"
          style={{
            background: '#201e2b',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', zIndex: 1,
          }}
        >
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="text-center mb-12">
            <div
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6"
              style={{ color: '#d4a35a', background: 'rgba(212,163,90,0.08)', border: '1px solid rgba(212,163,90,0.15)' }}
            >
              Pricing
            </div>
            <h2
              className="font-bold"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#f0e8d8' }}
            >
              Simple, transparent pricing
            </h2>
          </motion.div>

          {/* Billing toggle */}
          <motion.div {...inView(0.1)} className="flex justify-center mb-10">
            <div
              className="flex p-1 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {(['monthly', 'annual'] as const).map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setPricingCycle(cycle)}
                  className="px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                  style={{
                    background: pricingCycle === cycle ? 'rgba(212,163,90,0.15)' : 'transparent',
                    color: pricingCycle === cycle ? '#d4a35a' : '#7a6f62',
                    border: pricingCycle === cycle ? '1px solid rgba(212,163,90,0.30)' : '1px solid transparent',
                  }}
                >
                  {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                  {cycle === 'annual' && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(212,163,90,0.2)', color: '#d4a35a' }}
                    >
                      Save 33%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div
              {...inView(0.15)}
              className="glass rounded-2xl p-8 flex flex-col"
            >
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#7a6f62' }}>Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold" style={{ color: '#f0e8d8' }}>$0</span>
              </div>
              <p className="text-sm mb-8" style={{ color: '#7a6f62' }}>forever</p>
              <GlassButton variant="neutral" size="md" className="w-full mb-8" onClick={() => router.push('/sign-up')}>
                Get started free
              </GlassButton>
              <ul className="space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    <Check
                      size={14}
                      style={{ color: f.on ? '#d4a35a' : 'rgba(122,111,98,0.3)', flexShrink: 0 }}
                    />
                    <span style={{ color: f.on ? 'rgba(240,232,216,0.8)' : 'rgba(122,111,98,0.4)' }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Pro */}
            <motion.div
              {...inView(0.25)}
              className="glass-amber rounded-2xl p-8 flex flex-col relative overflow-hidden"
              style={{ boxShadow: '0 0 48px rgba(212,163,90,0.10)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#d4a35a' }}>Pro</p>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(212,163,90,0.15)', color: '#d4a35a', border: '1px solid rgba(212,163,90,0.25)' }}
                >
                  Most Popular
                </span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold" style={{ color: '#f0e8d8' }}>
                  {pricingCycle === 'annual' ? '$8' : '$12'}
                </span>
                <span className="mb-2 text-sm" style={{ color: '#7a6f62' }}>/month</span>
              </div>
              <p className="text-sm mb-8" style={{ color: '#7a6f62' }}>
                {pricingCycle === 'annual' ? '$96 billed annually' : 'billed monthly'}
              </p>
              <GlassButton variant="amber" size="md" className="w-full mb-8" onClick={() => router.push('/sign-up')}>
                Get started →
              </GlassButton>
              <ul className="space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check size={14} style={{ color: '#d4a35a', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(240,232,216,0.85)' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.p {...inView(0.3)} className="text-center text-sm mt-8" style={{ color: '#7a6f62' }}>
            Cancel anytime. No hidden fees.
          </motion.p>
        </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 max-w-3xl mx-auto text-center" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            {...inView()}
            className="glass rounded-3xl p-16 relative overflow-hidden"
          >
            {/* Ambient glow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(212,163,90,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div className="relative z-10">
              <h2
                className="font-black mb-5 leading-tight uppercase"
                style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
                  color: '#f0e8d8',
                  fontFamily: 'var(--font-orbitron), monospace',
                  letterSpacing: '0.06em',
                  textShadow: '0 0 24px rgba(0,255,136,0.25)',
                }}
              >
                <SplitWords text="Ready to Conquest Your Dream Job? 🏆" />
              </h2>
              <p
                className="mb-10"
                style={{
                  color: '#7a6f62',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: '0.9rem',
                  letterSpacing: '0.03em',
                }}
              >
                Thousands of job seekers used Aura to conquest their next interview and get hired.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <GlassButton variant="amber" size="lg" onClick={() => router.push('/sign-up')}>
                  Start Practicing Free
                  <ChevronRight size={16} />
                </GlassButton>
                <GlassButton variant="neutral" size="lg" onClick={() => router.push('/pricing')}>
                  View Pricing
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer
          className="px-6 py-16 max-w-7xl mx-auto"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Logo />
              <p className="mt-4 text-sm leading-relaxed" style={{ color: '#7a6f62', fontFamily: 'var(--font-jetbrains), monospace', fontSize: '0.8rem' }}>
                AI-powered interview coaching to help you land your dream job.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-sm mb-5" style={{ color: '#f0e8d8' }}>Product</h3>
              <ul className="space-y-3 text-sm">
                {[
                  ['Practice Interviews', '/interviews/new'],
                  ['Resume Grill', '/interviews/resume-grill'],
                  ['Company Prep', '/interviews/company-prep'],
                  ['Pricing', '/pricing'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <button
                      onClick={() => router.push(href)}
                      className="transition-colors duration-150"
                      style={{ color: '#7a6f62' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#d4a35a')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-sm mb-5" style={{ color: '#f0e8d8' }}>Resources</h3>
              <ul className="space-y-3 text-sm">
                {[
                  ['Interview Guides', '/guides'],
                  ['STAR Method', '/guides/star-method-interview'],
                  ['Behavioral Questions', '/guides/behavioral-interview-questions'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <button
                      onClick={() => router.push(href)}
                      className="transition-colors duration-150"
                      style={{ color: '#7a6f62' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#d4a35a')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-sm mb-5" style={{ color: '#f0e8d8' }}>Company</h3>
              <ul className="space-y-3 text-sm">
                {[
                  ['About', '/about'],
                  ['Privacy Policy', '/privacy'],
                  ['Terms of Service', '/terms'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="transition-colors duration-150"
                      style={{ color: '#7a6f62' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#d4a35a')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#7a6f62')}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-8 text-center text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#7a6f62' }}
          >
            © 2025 Aura. All rights reserved.
          </div>
        </footer>

      </div>
    </>
  );
}
