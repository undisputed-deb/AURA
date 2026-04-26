'use client';

import { motion } from 'framer-motion';
import {
  Mic, FileText, Zap, Building2, Star, MessageSquare,
  TrendingUp, Award, Brain, Target, Clock, BarChart2, LucideIcon
} from 'lucide-react';

interface Node {
  Icon: LucideIcon;
  label: string;
  angle: number;
}

interface Ring {
  diameter: number;
  duration: number;
  nodes: Node[];
}

const RINGS: Ring[] = [
  {
    diameter: 260,
    duration: 8,
    nodes: [
      { Icon: Mic,      label: 'Voice',     angle: 0   },
      { Icon: FileText, label: 'Resume',    angle: 120 },
      { Icon: Zap,      label: 'Feedback',  angle: 240 },
    ],
  },
  {
    diameter: 400,
    duration: 14,
    nodes: [
      { Icon: Building2,     label: 'Company',   angle: 0   },
      { Icon: Star,          label: 'STAR',      angle: 90  },
      { Icon: MessageSquare, label: 'Mock',      angle: 180 },
      { Icon: TrendingUp,    label: 'Progress',  angle: 270 },
    ],
  },
  {
    diameter: 510,
    duration: 22,
    nodes: [
      { Icon: Award,    label: 'Scoring',   angle: 0   },
      { Icon: Brain,    label: 'AI Coach',  angle: 72  },
      { Icon: Target,   label: 'Targeted',  angle: 144 },
      { Icon: Clock,    label: 'Timed',     angle: 216 },
      { Icon: BarChart2,label: 'Analytics', angle: 288 },
    ],
  },
];

function nodePosition(diameter: number, angleDeg: number) {
  const r = diameter / 2;
  const rad = (angleDeg * Math.PI) / 180;
  // Round to avoid floating-point SSR/client mismatch
  const x = Math.round(r * Math.cos(rad) * 100) / 100 - 44;
  const y = Math.round(r * Math.sin(rad) * 100) / 100 - 18;
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
  };
}

export function SolarSystem({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ position: 'relative', width: 560, height: 560, overflow: 'visible' }}
    >
      {/* Subtle ambient glow behind center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(212,163,90,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Orbital rings + nodes */}
      {RINGS.map((ring, ri) => (
        <motion.div
          key={ri}
          style={{
            position: 'absolute',
            width: ring.diameter,
            height: ring.diameter,
            top: '50%',
            left: '50%',
            marginTop: -ring.diameter / 2,
            marginLeft: -ring.diameter / 2,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
        >
          {ring.nodes.map((node, ni) => {
            const pos = nodePosition(ring.diameter, node.angle);
            return (
              <motion.div
                key={ni}
                style={{ position: 'absolute', ...pos }}
                animate={{ rotate: -360 }}
                transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    width: 88,
                    height: 36,
                    boxSizing: 'border-box',
                  }}
                >
                  <node.Icon
                    size={13}
                    style={{ color: '#d4a35a', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'rgba(240,232,216,0.75)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {node.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ))}

      {/* Center stat */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            background: 'rgba(212,163,90,0.07)',
            border: '1px solid rgba(212,163,90,0.30)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, color: '#d4a35a', lineHeight: 1 }}>
            1000+
          </span>
          <span
            style={{
              fontSize: 9,
              color: 'rgba(240,232,216,0.55)',
              textAlign: 'center',
              lineHeight: 1.3,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Interviews<br />Practiced
          </span>
        </div>
      </div>
    </div>
  );
}
