'use client';

import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion';

// ─── Design tokens (all inline — Tailwind is not available in Remotion) ───────
const BG        = '#1a1822';
const BG_RAISED = '#201e2b';
const AMBER     = '#d4a35a';
const AMBER_DIM = 'rgba(212,163,90,0.12)';
const AMBER_BDR = 'rgba(212,163,90,0.28)';
const CREAM     = '#f0e8d8';
const MUTED     = 'rgba(240,232,216,0.42)';
const GLASS     = 'rgba(255,255,255,0.055)';
const GLASS_BDR = '1px solid rgba(255,255,255,0.10)';
const GREEN     = '#34d399';
const BLUE      = '#60a5fa';
const VIOLET    = '#a78bfa';
const RED       = '#f87171';

const FONTS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// ─── Shared helpers ────────────────────────────────────────────────────────────
function card(extra: React.CSSProperties = {}): React.CSSProperties {
  return { background: GLASS, border: GLASS_BDR, borderRadius: 16, ...extra };
}
function tag(color: string, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: color + '18', color, border: `1px solid ${color}30`, ...extra,
  };
}
function bar(progress: number, color: string): React.CSSProperties {
  return { height: '100%', borderRadius: 3, background: color, width: `${progress}%` };
}
function barTrack(extra: React.CSSProperties = {}): React.CSSProperties {
  return { height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', ...extra };
}
function fadeIn(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
function slideIn(frame: number, start: number): number {
  return interpolate(frame, [start, start + 14], [-18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}

// ─── SLIDE 1: Upload Resume ────────────────────────────────────────────────────
function SlideResume({ frame }: { frame: number }) {
  const skills = ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'Redux'];
  const scanW = interpolate(frame, [0, 38], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Upload zone */}
      <div style={{ ...card({ padding: 28 }), flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div style={{ width: 70, height: 82, background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontSize: 30 }}>📄</span>
          <span style={{ fontSize: 10, color: AMBER, fontWeight: 700, letterSpacing: '0.04em' }}>PDF</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: CREAM, fontSize: 14, fontWeight: 600 }}>John_Smith_Resume.pdf</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>2.4 MB · Uploaded</div>
        </div>
        <div style={{ width: '85%' }}>
          <div style={{ ...barTrack({ marginBottom: 6 }) }}>
            <div style={bar(scanW, AMBER)} />
          </div>
          <div style={{ color: MUTED, fontSize: 12, textAlign: 'center' }}>
            {frame < 32 ? 'Scanning resume...' : '✓ Analysis complete'}
          </div>
        </div>
      </div>

      {/* Extracted info */}
      <div style={{ ...card({ padding: 26 }), flex: 1.3, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ color: AMBER, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Extracted from Resume</div>
          <div style={{ color: CREAM, fontSize: 18, fontWeight: 800 }}>John Smith</div>
          <div style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>Senior Frontend Developer · 5 yrs exp.</div>
        </div>

        <div>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>Skills Detected</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {skills.map((s, i) => (
              <div key={s} style={{ ...tag(AMBER), opacity: fadeIn(frame, i * 5 + 8, i * 5 + 18) }}>{s}</div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>Work History</div>
          {[
            { role: 'Sr. Frontend Dev', co: 'TechCorp Inc.', yr: '2022–Present' },
            { role: 'Frontend Dev', co: 'StartupXYZ', yr: '2019–2022' },
          ].map((e, i) => (
            <div key={i} style={{ opacity: fadeIn(frame, 28 + i * 8, 38 + i * 8), marginBottom: 10 }}>
              <div style={{ color: CREAM, fontSize: 13, fontWeight: 600 }}>{e.role}</div>
              <div style={{ color: MUTED, fontSize: 12 }}>{e.co} · {e.yr}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 2: Paste Job Description ───────────────────────────────────────────
function SlideJobDesc({ frame }: { frame: number }) {
  const jd = "We're looking for a Senior Frontend Engineer to join our team. You'll build and maintain customer-facing products using React, TypeScript, and modern web technologies. You'll collaborate with design and backend teams to deliver exceptional user experiences at scale.";
  const visible = Math.floor(interpolate(frame, [5, 46], [0, jd.length], { extrapolateRight: 'clamp' }));
  const matchPct = Math.round(interpolate(frame, [20, 46], [0, 87], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const reqs = [
    { t: 'React / TypeScript', ok: true },
    { t: 'Performance Optimization', ok: true },
    { t: '5+ Years Experience', ok: true },
    { t: 'System Design', ok: false },
  ];

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* JD card */}
      <div style={{ ...card({ padding: 26 }), flex: 1.4, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💼</div>
          <div>
            <div style={{ color: CREAM, fontSize: 15, fontWeight: 700 }}>Senior Frontend Engineer</div>
            <div style={{ color: AMBER, fontSize: 12 }}>Stripe · San Francisco, CA</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, flex: 1 }}>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Job Description</div>
          <div style={{ color: 'rgba(240,232,216,0.78)', fontSize: 13, lineHeight: 1.75 }}>
            {jd.slice(0, visible)}
            {visible < jd.length && <span style={{ opacity: 0.4 }}>|</span>}
          </div>
        </div>
      </div>

      {/* Match panel */}
      <div style={{ ...card({ padding: 26 }), flex: 1, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: MUTED, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resume Match</div>
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: AMBER_DIM, border: `2px solid ${AMBER_BDR}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: AMBER, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{matchPct}%</div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>match</div>
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Requirements</div>
          {reqs.map((r, i) => (
            <div key={i} style={{ opacity: fadeIn(frame, 24 + i * 5, 34 + i * 5), display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: r.ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: r.ok ? GREEN : RED }}>
                {r.ok ? '✓' : '○'}
              </div>
              <span style={{ color: r.ok ? 'rgba(240,232,216,0.82)' : MUTED, fontSize: 12 }}>{r.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 3: Questions Generated ─────────────────────────────────────────────
function SlideQuestions({ frame }: { frame: number }) {
  const questions = [
    { cat: 'Technical', color: BLUE,   t: 'How would you optimize React rendering performance in a large, data-intensive application?' },
    { cat: 'Behavioral', color: AMBER, t: "Describe a time you significantly improved a product's frontend performance." },
    { cat: 'Technical', color: BLUE,   t: 'Explain your approach to state management with complex TypeScript components.' },
    { cat: 'System Design', color: VIOLET, t: 'How would you architect a real-time data dashboard for millions of users?' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ ...card({ padding: '14px 20px' }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ color: CREAM, fontSize: 18, fontWeight: 800 }}>12 Questions Generated</div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Senior Frontend Engineer · Stripe</div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {[['5 Technical', BLUE], ['4 Behavioral', AMBER], ['3 System Design', VIOLET]].map(([l, c]) => (
            <div key={l} style={tag(c as string)}>{l}</div>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {questions.map((q, i) => (
          <div key={i} style={{ ...card({ padding: '12px 18px' }), display: 'flex', alignItems: 'flex-start', gap: 14, opacity: fadeIn(frame, i * 9 + 5, i * 9 + 18), transform: `translateX(${slideIn(frame, i * 9 + 5)}px)` }}>
            <div style={tag(q.color, { flexShrink: 0 })}>{q.cat}</div>
            <div style={{ color: 'rgba(240,232,216,0.82)', fontSize: 13, lineHeight: 1.55, flex: 1 }}>{q.t}</div>
            <div style={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>Q{i + 1}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, borderRadius: 12, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ color: MUTED, fontSize: 12 }}>8 more questions ready · Tap to begin</div>
        <div style={{ color: AMBER, fontSize: 13, fontWeight: 700 }}>Start Interview →</div>
      </div>
    </div>
  );
}

// ─── SLIDE 4: Live Interview ───────────────────────────────────────────────────
function SlideInterview({ frame }: { frame: number }) {
  const BARS = 30;
  const words = ['In', 'my', 'previous', 'role', 'at', 'TechCorp,', 'I', 'identified', 'a', 'critical', 'rendering', 'bottleneck', 'affecting', 'load', 'time...'];
  const visible = Math.floor(interpolate(frame, [8, 50], [0, words.length], { extrapolateRight: 'clamp' }));
  const secs = Math.floor(interpolate(frame, [0, 60], [34, 58]));
  const recOn = frame % 30 < 18;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Question */}
      <div style={{ ...card({ padding: '16px 22px' }), flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={tag(BLUE)}>Technical</div>
            <div style={{ color: MUTED, fontSize: 12 }}>Question 2 of 12</div>
          </div>
          <div style={{ color: AMBER, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>0:{secs}</div>
        </div>
        <div style={{ color: CREAM, fontSize: 14, lineHeight: 1.65, fontWeight: 500 }}>
          "How would you optimize React rendering performance in a large, data-intensive application?"
        </div>
      </div>

      {/* Waveform */}
      <div style={{ ...card({ padding: '16px 22px', border: `1px solid rgba(220,50,50,0.22)` }), flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: recOn ? 1 : 0.25 }} />
          <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Recording in progress</span>
          <div style={{ marginLeft: 'auto', ...tag(GREEN) }}>● Live</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 52 }}>
          {Array.from({ length: BARS }).map((_, i) => {
            const h = 4 + 46 * Math.abs(Math.sin(frame * 0.38 + i * 0.85));
            return <div key={i} style={{ width: 4, height: h, borderRadius: 2, background: `rgba(212,163,90,${0.3 + 0.7 * Math.abs(Math.sin(frame * 0.22 + i * 0.5))})` }} />;
          })}
        </div>
      </div>

      {/* Transcription */}
      <div style={{ ...card({ padding: '14px 20px' }), flex: 1 }}>
        <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9 }}>Live Transcription</div>
        <div style={{ color: 'rgba(240,232,216,0.85)', fontSize: 14, lineHeight: 1.75 }}>
          {words.slice(0, visible).join(' ')}
          {visible < words.length && visible > 0 && <span style={{ opacity: 0.4, marginLeft: 2 }}>|</span>}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 5: Score Results ────────────────────────────────────────────────────
function SlideScore({ frame }: { frame: number }) {
  const circ = 2 * Math.PI * 58;
  const pct = interpolate(frame, [5, 40], [0, 87], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scoreNum = Math.round(pct);
  const metrics = [
    { l: 'Clarity',     s: 91, c: GREEN  },
    { l: 'Depth',       s: 84, c: BLUE   },
    { l: 'Confidence',  s: 88, c: AMBER  },
    { l: 'Relevance',   s: 85, c: VIOLET },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', gap: 20 }}>
      {/* Score circle */}
      <div style={{ ...card({ padding: 28 }), flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div style={{ color: MUTED, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Score</div>
        <div style={{ position: 'relative', width: 136, height: 136 }}>
          <svg width={136} height={136} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
            <circle cx={68} cy={68} r={58} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
            <circle cx={68} cy={68} r={58} fill="none" stroke={AMBER} strokeWidth={9} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: AMBER, fontSize: 38, fontWeight: 900, lineHeight: 1 }}>{scoreNum}</div>
            <div style={{ color: MUTED, fontSize: 12 }}>/100</div>
          </div>
        </div>
        <div style={{ ...tag(GREEN, { padding: '6px 20px', fontSize: 13 }), opacity: fadeIn(frame, 36, 46) }}>
          ✓ Great Performance
        </div>
        <div style={{ ...card({ padding: '12px 16px', width: '100%', boxSizing: 'border-box' }), opacity: fadeIn(frame, 42, 52) }}>
          <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>AI Feedback</div>
          <div style={{ color: 'rgba(240,232,216,0.78)', fontSize: 12, lineHeight: 1.6 }}>
            Strong technical depth. Add specific metrics to strengthen your examples.
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ ...card({ padding: 26 }), flex: 1.2, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ color: CREAM, fontSize: 16, fontWeight: 800 }}>Score Breakdown</div>
        {metrics.map((m, i) => {
          const w = interpolate(frame, [10 + i * 6, 28 + i * 6], [0, m.s], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={m.l} style={{ opacity: fadeIn(frame, 8 + i * 6, 18 + i * 6) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: MUTED, fontSize: 13 }}>{m.l}</span>
                <span style={{ color: m.c, fontSize: 13, fontWeight: 700 }}>{Math.round(w)}</span>
              </div>
              <div style={barTrack()}>
                <div style={bar(w, m.c)} />
              </div>
            </div>
          );
        })}

        {/* Per-question mini scores */}
        <div style={{ opacity: fadeIn(frame, 38, 50) }}>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Question Scores</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[92, 88, 85, 90, 78, 83].map((s, i) => (
              <div key={i} style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, borderRadius: 10, padding: '5px 10px', color: AMBER, fontSize: 12, fontWeight: 700 }}>
                Q{i + 1}: {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 6: Speaking Analysis ────────────────────────────────────────────────
function SlideSpeaking({ frame }: { frame: number }) {
  const wpm = Math.round(interpolate(frame, [5, 36], [0, 142], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const conf = interpolate(frame, [10, 38], [0, 78], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fillers = [
    { w: '"um"',      n: 3, c: RED },
    { w: '"like"',    n: 2, c: '#fb923c' },
    { w: '"you know"',n: 1, c: AMBER },
  ];
  const waveData = [18,38,60,80,76,92,88,62,72,87,94,80,66,56,72,82,92,86,72,56,46,66,82,76,62,40,28,18];

  return (
    <div style={{ height: '100%', display: 'flex', gap: 14 }}>
      {/* Left metrics */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* WPM */}
        <div style={{ ...card({ padding: '16px 20px' }), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Speaking Pace</div>
            <div style={{ color: CREAM, fontSize: 30, fontWeight: 900, marginTop: 4 }}>
              {wpm} <span style={{ fontSize: 13, color: MUTED, fontWeight: 400 }}>WPM</span>
            </div>
          </div>
          <div style={tag(GREEN, { padding: '5px 13px', fontSize: 12 })}>Good</div>
        </div>

        {/* Confidence */}
        <div style={{ ...card({ padding: '16px 20px' }) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
            <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Confidence</div>
            <div style={{ color: AMBER, fontSize: 13, fontWeight: 700 }}>{Math.round(conf)}%</div>
          </div>
          <div style={barTrack()}>
            <div style={bar(conf, AMBER)} />
          </div>
        </div>

        {/* Filler words */}
        <div style={{ ...card({ padding: '16px 20px' }), flex: 1 }}>
          <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Filler Words Detected</div>
          {fillers.map((f, i) => (
            <div key={i} style={{ opacity: fadeIn(frame, 18 + i * 9, 28 + i * 9), display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <div style={{ color: 'rgba(240,232,216,0.78)', fontSize: 13 }}>{f.w}</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: f.n }).map((_, j) => (
                  <div key={j} style={{ width: 22, height: 22, borderRadius: '50%', background: f.c + '18', border: `1px solid ${f.c}35`, color: f.c, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{j + 1}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice pattern */}
      <div style={{ ...card({ padding: '18px 20px' }), flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Pattern</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, minHeight: 0 }}>
          {waveData.map((h, i) => {
            const isPeak = i > 7 && i < 21;
            return (
              <div key={i} style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                height: `${h}%`, minHeight: 3,
                background: `rgba(212,163,90,${isPeak ? 0.45 + 0.55 * (h / 100) : 0.15 + 0.25 * (h / 100)})`,
                opacity: fadeIn(frame, i + 5, i + 16),
              }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}>
          <div style={{ color: MUTED, fontSize: 11 }}>0s</div>
          <div style={{ color: AMBER, fontSize: 11, fontWeight: 600 }}>Peak confidence</div>
          <div style={{ color: MUTED, fontSize: 11 }}>54s</div>
        </div>

        {/* Tip */}
        <div style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, borderRadius: 11, padding: '12px 14px', opacity: fadeIn(frame, 42, 52) }}>
          <div style={{ color: AMBER, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💡 Improvement Tip</div>
          <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.5 }}>Reducing filler words could boost your perceived confidence by ~15%</div>
        </div>

        {/* Pause analysis */}
        <div style={{ ...card({ padding: '12px 14px', background: 'rgba(255,255,255,0.03)' }), opacity: fadeIn(frame, 32, 44) }}>
          <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pause Distribution</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ l: 'Short', v: 12, c: GREEN }, { l: 'Medium', v: 5, c: AMBER }, { l: 'Long', v: 2, c: RED }].map(p => (
              <div key={p.l} style={{ flex: 1, background: p.c + '12', border: `1px solid ${p.c}25`, borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                <div style={{ color: p.c, fontSize: 16, fontWeight: 800 }}>{p.v}</div>
                <div style={{ color: MUTED, fontSize: 10 }}>{p.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE 7: Analytics ────────────────────────────────────────────────────────
function SlideAnalytics({ frame }: { frame: number }) {
  const sessions = [62, 68, 71, 74, 78, 82, 87];
  const labels   = ['S1','S2','S3','S4','S5','S6','S7'];
  const stats    = [
    { l: 'Sessions',   v: '7',   u: 'total' },
    { l: 'Avg Score',  v: '74',  u: '/100'  },
    { l: 'Best Score', v: '87',  u: '/100'  },
    { l: 'Streak',     v: '5',   u: 'days'  },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat row */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        {stats.map((s, i) => (
          <div key={s.l} style={{ ...card({ padding: '14px 16px' }), flex: 1, opacity: fadeIn(frame, i * 6 + 3, i * 6 + 15) }}>
            <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
            <div style={{ marginTop: 5 }}>
              <span style={{ color: AMBER, fontSize: 26, fontWeight: 900 }}>{s.v}</span>
              <span style={{ color: MUTED, fontSize: 12, marginLeft: 3 }}>{s.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ ...card({ padding: '18px 22px' }), flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ color: CREAM, fontSize: 16, fontWeight: 800 }}>Score Progress</div>
          <div style={{ ...tag(GREEN, { padding: '5px 14px', fontSize: 12 }), opacity: fadeIn(frame, 30, 42) }}>↑ +25 pts over 7 sessions</div>
        </div>

        <div style={{ display: 'flex', gap: 10, flex: 1, alignItems: 'flex-end', minHeight: 0 }}>
          {sessions.map((s, i) => {
            const isLast = i === sessions.length - 1;
            const animH  = interpolate(frame, [i * 5 + 8, i * 5 + 24], [0, s], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ color: isLast ? AMBER : MUTED, fontSize: 11, fontWeight: isLast ? 800 : 400 }}>{s}</div>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0', minHeight: 4,
                  height: `${animH}%`,
                  background: isLast ? AMBER : `rgba(212,163,90,${0.18 + 0.35 * (s / 100)})`,
                  border: isLast ? `1px solid ${AMBER_BDR}` : 'none',
                }} />
                <div style={{ color: MUTED, fontSize: 11 }}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight bar */}
      <div style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BDR}`, borderRadius: 13, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, opacity: fadeIn(frame, 44, 54) }}>
        <div style={{ color: MUTED, fontSize: 13 }}>🎯 You're improving faster than 78% of users</div>
        <div style={{ color: AMBER, fontSize: 13, fontWeight: 700 }}>Keep going →</div>
      </div>
    </div>
  );
}

// ─── STEP LABELS ──────────────────────────────────────────────────────────────
const STEPS = [
  'Upload Resume',
  'Job Description',
  'AI Questions',
  'Live Interview',
  'Score Results',
  'Speaking Analysis',
  'Analytics',
];

// ─── ROOT COMPOSITION ─────────────────────────────────────────────────────────
export const InterviewComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const FRAMES_PER_SLIDE = 60;
  const slideIndex = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), STEPS.length - 1);
  const sf = frame % FRAMES_PER_SLIDE; // frame within current slide

  const sp = spring({ frame: Math.min(sf, 28), fps, config: { stiffness: 110, damping: 16 } });
  const ty      = interpolate(sp, [0, 1], [28, 0]);
  const sc      = interpolate(sp, [0, 1], [0.96, 1]);
  const opacity = interpolate(sf, [0, 10, 48, 60], [0, 1, 1, 0]);

  const slides = [
    <SlideResume     frame={sf} />,
    <SlideJobDesc    frame={sf} />,
    <SlideQuestions  frame={sf} />,
    <SlideInterview  frame={sf} />,
    <SlideScore      frame={sf} />,
    <SlideSpeaking   frame={sf} />,
    <SlideAnalytics  frame={sf} />,
  ];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONTS }}>
      {/* Dot grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Step indicator dots */}
      <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === slideIndex ? 22 : 7, height: 7, borderRadius: 4,
            background: i === slideIndex ? AMBER : 'rgba(255,255,255,0.15)',
            transition: 'width 0.2s',
          }} />
        ))}
      </div>

      {/* Step label */}
      <div style={{
        position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
        color: AMBER, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', opacity: fadeIn(sf, 0, 12), whiteSpace: 'nowrap',
      }}>
        Step {slideIndex + 1} of {STEPS.length} · {STEPS[slideIndex]}
      </div>

      {/* Slide content */}
      <div style={{
        position: 'absolute', top: 68, left: 44, right: 44, bottom: 28,
        transform: `translateY(${ty}px) scale(${sc})`,
        opacity,
        transformOrigin: 'center center',
      }}>
        {slides[slideIndex]}
      </div>
    </AbsoluteFill>
  );
};
