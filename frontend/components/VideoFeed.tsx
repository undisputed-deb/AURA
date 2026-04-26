'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoFeedProps {
  isVisible?: boolean;
}

export default function VideoFeed({ isVisible = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isHidden, setIsHidden] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const startCamera = async () => {
    try {
      setIsRequesting(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);
      setIsRequesting(false);
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied');
      setIsRequesting(false);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleShowCamera = async () => {
    setIsHidden(false);
    if (!stream) {
      await startCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop camera when component becomes invisible
  useEffect(() => {
    if (!isVisible && stream) {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, stream]);

  // Assign stream to video element when both are available
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!isVisible) {
    return null;
  }

  // Show permission request button
  if (!hasPermission && !error) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={startCamera}
          disabled={isRequesting}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 disabled:scale-100 text-sm sm:text-base min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {isRequesting ? 'Requesting...' : 'Enable Camera'}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-48 h-36 sm:w-64 sm:h-48 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl flex items-center justify-center z-50">
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth={2} />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isHidden) {
    return (
      <button
        onClick={handleShowCamera}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition z-50 min-w-[44px] min-h-[44px]"
        title="Show camera"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-48 h-36 sm:w-64 sm:h-48 bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50 group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={() => {
              stopCamera();
              setIsHidden(true);
            }}
            className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Hide camera"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-xs text-white">
        You
      </div>
    </div>
  );
}
