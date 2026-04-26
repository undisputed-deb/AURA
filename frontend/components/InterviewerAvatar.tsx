'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface InterviewerAvatarProps {
  state: 'idle' | 'talking' | 'listening';
  audioPlaying?: boolean;
}

export default function InterviewerAvatar({ state, audioPlaying = false }: InterviewerAvatarProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        let url = '';

        switch (state) {
          case 'talking':
            // Professional avatar talking animation
            url = 'https://lottie.host/eac3e4d4-9f09-4f85-b85f-db60a4dcdab6/X1yd8Xu1VD.json';
            break;
          case 'listening':
            // Professional avatar listening/nodding animation
            url = 'https://lottie.host/041b3c44-e2c5-4e4a-8f42-c9b2ffe5e50d/zs0gAo6I3I.json';
            break;
          case 'idle':
          default:
            // Professional avatar idle/breathing animation
            url = 'https://lottie.host/041b3c44-e2c5-4e4a-8f42-c9b2ffe5e50d/zs0gAo6I3I.json';
            break;
        }

        const response = await fetch(url);

        // Check if response is OK and content-type is JSON
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          // Silently fail and use fallback
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAnimationData(data);
        setLoading(false);
      } catch {
        // Silently fail and use fallback avatar
        setLoading(false);
      }
    };

    loadAnimation();
  }, [state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse">
          <div className="w-64 h-64 bg-white/10 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!animationData) {
    // Fallback to simple avatar
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className={`w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${
            audioPlaying ? 'animate-pulse' : ''
          }`}>
            <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>

          {/* Listening indicator */}
          {state === 'listening' && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-1 items-end">
                <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Talking indicator */}
          {state === 'talking' && audioPlaying && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-1 items-end">
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                <div className="w-1 h-5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* State label */}
        <div className="mt-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <p className="text-white text-sm font-medium">
            {state === 'talking' && '💬 Asking question...'}
            {state === 'listening' && '👂 Listening...'}
            {state === 'idle' && '⏸️ Ready'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="relative w-80 h-80">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          className="w-full h-full"
        />

        {/* Audio indicator overlay */}
        {audioPlaying && state === 'talking' && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-4">
            <div className="flex gap-1 items-end px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full">
              <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1 h-5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* State label */}
      <div className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
        <p className="text-white text-sm font-medium">
          {state === 'talking' && '💬 Asking question...'}
          {state === 'listening' && '👂 Listening to your answer...'}
          {state === 'idle' && '⏸️ Ready'}
        </p>
      </div>
    </div>
  );
}
