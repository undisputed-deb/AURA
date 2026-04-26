export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-10 h-10">
          {/* Neon glow pulse */}
          <div
            className="absolute inset-0 rounded-xl animate-pulse"
            style={{ background: 'rgba(0,255,136,0.18)', filter: 'blur(8px)' }}
          />
          {/* Main container */}
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.40)',
              boxShadow: '0 0 16px rgba(0,255,136,0.25)',
            }}
          >
            {/* Aura "A" monogram with circuit lines */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#00ff88' }}
            >
              {/* Stylised hexagon / neural node icon */}
              <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" />
              <circle cx="12" cy="12" r="2.5" fill="rgba(0,255,136,0.4)" stroke="none" />
              <line x1="12" y1="9.5" x2="12" y2="2" />
              <line x1="14.2" y1="13.2" x2="20" y2="17" />
              <line x1="9.8" y1="13.2" x2="4" y2="17" />
            </svg>
          </div>
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-orbitron), "Share Tech Mono", monospace',
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#f0e8d8',
          textShadow: '0 0 12px rgba(0,255,136,0.35)',
        }}
      >
        AURA
      </span>
    </div>
  );
}
