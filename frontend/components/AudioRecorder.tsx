"use client";

import React, { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export default function AudioRecorder({
  onRecordingComplete,
  maxDuration = 300,
  onRecordingStateChange,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else {
          mimeType = "";
        }
      }

      const mediaRecorder = new MediaRecorder(stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        if (audioBlob.size < 100) {
          alert("Recording failed. Please try again.");
          setIsRecording(false);
          setRecordingTime(0);
          setHasRecorded(false);
          audioChunksRef.current = [];
          streamRef.current?.getTracks().forEach((track) => track.stop());
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setHasRecorded(true);

        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      // Request data every 100ms for better reliability
      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setHasRecorded(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to record your answer.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    }
  };

  // Reset recording
  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingTime(0);
    setHasRecorded(false);
    audioChunksRef.current = [];
  };

  // Submit recording
  const submitRecording = () => {
    if (audioChunksRef.current.length === 0) {
      alert("No recording found. Please record your answer first.");
      resetRecording();
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || "audio/webm",
    });

    if (audioBlob.size < 100) {
      alert("Recording failed or too short. Please try again.");
      resetRecording();
      return;
    }

    onRecordingComplete(audioBlob);
  };

  useEffect(() => {
    onRecordingStateChange?.(isRecording && !isPaused);
  }, [isRecording, isPaused, onRecordingStateChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioURL]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Timer Display */}
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
          {formatTime(recordingTime)}
        </div>
        <div className="text-xs sm:text-sm text-gray-400">
          {isRecording
            ? isPaused
              ? "Paused"
              : "Recording..."
            : hasRecorded
            ? "Recording Complete"
            : "Ready to Record"}
        </div>
      </div>

      {/* Waveform Visualization (Simple) */}
      {isRecording && !isPaused && (
        <div className="flex items-center justify-center gap-1 h-12 sm:h-16">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-500 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 60 + 10}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Audio Playback */}
      {hasRecorded && audioURL && (
        <div className="bg-slate-800/50 rounded-lg p-4">
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {!isRecording && !hasRecorded && (
          <button
            onClick={startRecording}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 min-h-[44px] text-sm sm:text-base"
          >
            <div className="w-4 h-4 bg-white rounded-full" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="px-5 sm:px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full font-semibold transition-all min-h-[44px] text-sm sm:text-base"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="px-5 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all min-h-[44px] text-sm sm:text-base"
              >
                Resume
              </button>
            )}

            <button
              onClick={stopRecording}
              className="px-5 sm:px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all min-h-[44px] text-sm sm:text-base"
            >
              <div className="w-3 h-3 bg-white" />
              Stop
            </button>
          </>
        )}

        {hasRecorded && (
          <>
            <button
              onClick={resetRecording}
              className="px-5 sm:px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold transition-all min-h-[44px] text-sm sm:text-base"
            >
              Re-record
            </button>

            <button
              onClick={submitRecording}
              className="px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 min-h-[44px] text-sm sm:text-base"
            >
              Submit Answer
            </button>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 text-center">
        Maximum duration: {formatTime(maxDuration)}
      </div>
    </div>
  );
}
