// Try different logo designs by importing the one you like into Logo.tsx

// Option 1: Infinity Loop - Represents continuous practice/rehearsal
export function LogoInfinity({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-md animate-pulse"></div>

          {/* Main container */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-6 shadow-lg shadow-purple-500/40">
            <svg
              className="w-7 h-7 text-white transition-transform duration-500 group-hover:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              {/* Infinity symbol */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 12c2.5-2.5 5-2.5 7 0s2 5 0 7-4.5 2-7 0c-2.5 2.5-5 2.5-7 0s-2-5 0-7 4.5-2 7 0z"
              />
            </svg>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 2: Waveform/Audio - Modern audio visualization
export function LogoWaveform({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Animated glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl blur-md animate-pulse"></div>

          {/* Main container */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-lg shadow-purple-500/40 overflow-hidden">
            <div className="flex items-center justify-center gap-0.5">
              {/* Animated waveform bars */}
              <div className="w-1 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite] h-4 opacity-90"></div>
              <div className="w-1 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite_0.1s] h-6 opacity-90"></div>
              <div className="w-1 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s] h-3 opacity-90"></div>
              <div className="w-1 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite_0.3s] h-7 opacity-90"></div>
              <div className="w-1 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s] h-4 opacity-90"></div>
            </div>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 3: Quote/Speech Bubble - Interview conversation
export function LogoQuote({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-md animate-pulse"></div>

          {/* Main container */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 shadow-lg shadow-purple-500/40">
            <svg
              className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Chat bubble with quotation marks */}
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-3H7V9h10v2zm0-3H7V6h10v2z" opacity="0.3"/>
              <path d="M8 9h2v2H8zm0-3h2v2H8zm6 0h2v2h-2zm-6 6h8v2H8z"/>
            </svg>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 4: Play/Repeat Button - Practice & replay
export function LogoPlay({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin" style={{ animationDuration: '3s' }}></div>

          {/* Glow effect */}
          <div className="absolute inset-1 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-full blur-sm"></div>

          {/* Main container */}
          <div className="absolute inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-purple-500/40">
            <svg
              className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110 ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Play icon */}
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 5: Brain/AI - AI-powered coaching
export function LogoBrain({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Pulsing glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-md animate-pulse"></div>

          {/* Main container */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-lg shadow-purple-500/40">
            <svg
              className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              {/* Brain/AI neural network icon */}
              <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
              <circle cx="7" cy="7" r="2"/>
              <circle cx="17" cy="7" r="2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
              <line x1="9" y1="8" x2="11" y2="10" strokeLinecap="round"/>
              <line x1="15" y1="8" x2="13" y2="10" strokeLinecap="round"/>
              <line x1="9" y1="16" x2="11" y2="14" strokeLinecap="round"/>
              <line x1="15" y1="16" x2="13" y2="14" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 6: Target/Bullseye - Hitting your goals
export function LogoTarget({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping"></div>

          {/* Middle ring */}
          <div className="absolute inset-1 rounded-full border-2 border-purple-500/20"></div>

          {/* Main container */}
          <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125 shadow-lg shadow-purple-500/50">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}

// Option 7: Hexagon Tech - Modern tech feel
export function LogoHex({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative w-12 h-12">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-md animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>

          {/* Main hexagon */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-12 shadow-lg shadow-purple-500/40" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="text-white font-bold text-xl">R</span>
          </div>

          {/* Active indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        Reherse
      </span>
    </div>
  );
}
