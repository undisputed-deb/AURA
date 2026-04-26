'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  variant?: 'amber' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const sizeClasses = {
  sm:  'px-4 py-2 text-sm rounded-xl',
  md:  'px-6 py-3 text-base rounded-2xl',
  lg:  'px-8 py-4 text-lg rounded-2xl',
};

export function GlassButton({
  children,
  variant = 'neutral',
  size = 'md',
  onClick,
  className,
  type = 'button',
  disabled = false,
}: GlassButtonProps) {
  const isAmber = variant === 'amber';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        sizeClasses[size],
        className
      )}
      style={{
        background: isAmber ? 'rgba(212,163,90,0.12)' : 'rgba(255,255,255,0.06)',
        border: isAmber ? '1px solid rgba(212,163,90,0.30)' : '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#f0e8d8',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = isAmber ? 'rgba(212,163,90,0.20)' : 'rgba(255,255,255,0.10)';
        el.style.boxShadow = isAmber
          ? '0 0 24px rgba(212,163,90,0.25), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 4px 16px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = isAmber ? 'rgba(212,163,90,0.12)' : 'rgba(255,255,255,0.06)';
        el.style.boxShadow = 'none';
      }}
    >
      {children}
    </motion.button>
  );
}
