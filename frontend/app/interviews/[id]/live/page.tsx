"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import AudioRecorder from "@/components/AudioRecorder";
import VideoFeed from "@/components/VideoFeed";
import InterviewerAvatar from "@/components/InterviewerAvatar";
import { useInterview } from "@/lib/useInterview";
import { api } from "@/lib/api";

export default function LiveInterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const interviewId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [hasStarted, setHasStarted] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [token, setToken] = useState<string>("");
  const [interviewQuestionCount, setInterviewQuestionCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get token when auth is ready
  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        const tkn = await getToken();
        if (tkn) setToken(tkn);
      }
    };
    fetchToken();
  }, [isSignedIn, getToken]);

  // Fetch interview details to get question count
  useEffect(() => {
    const fetchInterviewDetails = async () => {
      if (!token) return;
      try {
        const data = await api.getInterview(interviewId, token);
        setInterviewQuestionCount(data.questions?.length || 0);
      } catch (err) {
        console.error('Failed to fetch interview details:', err);
      }
    };
    fetchInterviewDetails();
  }, [interviewId, token]);

  const {
    isConnected,
    isStarted,
    isCompleted,
    currentQuestion,
    questionAudio,
    transcript,
    error,
    isTranscribing,
    isProcessingAnswer,
    totalQuestions,
    currentQuestionNumber,
    welcomeMessage,
    welcomeAudio,
    showWelcome,
    startInterview,
    beginQuestions,
    submitAnswer,
    confirmAnswer,
    skipQuestion,
    endInterview,
    resetTranscript,
  } = useInterview(interviewId, user?.id || "", token);

  // Update edited transcript when new transcript arrives
  useEffect(() => {
    if (transcript) {
      setEditedTranscript(transcript);
    }
  }, [transcript]);

  // Auto-play welcome audio
  useEffect(() => {
    if (welcomeAudio && showWelcome) {
      // Convert base64 to blob
      const byteCharacters = atob(welcomeAudio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onpause = () => setIsAudioPlaying(false);

      audio.play().catch(err => {
        console.error('Error playing welcome audio:', err);
        setIsAudioPlaying(false);
      });

      return () => {
        audio.pause();
        URL.revokeObjectURL(url);
        setIsAudioPlaying(false);
      };
    }
  }, [welcomeAudio, showWelcome]);

  // Auto-play question audio in background
  useEffect(() => {
    if (questionAudio) {
      // Convert base64 to blob
      const byteCharacters = atob(questionAudio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onpause = () => setIsAudioPlaying(false);

      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsAudioPlaying(false);
      });

      return () => {
        audio.pause();
        URL.revokeObjectURL(url);
        setIsAudioPlaying(false);
      };
    }
  }, [questionAudio]);

  // Redirect if completed
  useEffect(() => {
    if (isCompleted) {
      setTimeout(() => {
        router.push(`/interviews/${interviewId}/results`);
      }, 3000);
    }
  }, [isCompleted, interviewId, router]);

  // Handle start interview
  const handleStart = () => {
    setHasStarted(true);
    startInterview();
  };

  // Handle recording complete
  const handleRecordingComplete = (audioBlob: Blob) => {
    submitAnswer(audioBlob);
  };

  // Handle confirm and next
  const handleConfirmAndNext = () => {
    confirmAnswer(editedTranscript);
    setEditedTranscript("");
  };

  // Handle skip question
  const handleSkipQuestion = () => {
    if (confirm("Are you sure you want to skip this question? You won't be able to come back to it.")) {
      skipQuestion();
    }
  };

  // Handle end early
  const handleEndEarly = () => {
    if (confirm("Are you sure you want to end the interview early?")) {
      endInterview();
    }
  };

  // Determine interviewer avatar state
  const getAvatarState = (): 'idle' | 'talking' | 'listening' => {
    if (isRecording) return 'listening';
    if (isAudioPlaying) return 'talking';
    return 'idle';
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Live Interview
              </h1>
              {isConnected && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                  Connected
                </div>
              )}
              {!isConnected && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full" />
                  Disconnected
                </div>
              )}
            </div>

            {isStarted && (
              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {currentQuestionNumber}/{totalQuestions}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Questions</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isStarted && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Start Screen */}
        {!hasStarted && !isCompleted && (
          <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Start?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 max-w-md mx-auto px-4 sm:px-0">
              Make sure you&apos;re in a quiet environment with a working microphone.
              You&apos;ll be asked {interviewQuestionCount} {interviewQuestionCount === 1 ? 'question' : 'questions'}.
            </p>
            <button
              onClick={handleStart}
              disabled={!isConnected}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base sm:text-lg transition-all transform hover:scale-105 min-h-[44px]"
            >
              {isConnected ? "Start Interview" : "Connecting..."}
            </button>
          </div>
        )}

        {/* Welcome Screen */}
        {isStarted && showWelcome && !isCompleted && (
          <div className="space-y-6 sm:space-y-8">
            {/* Interviewer Avatar */}
            <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
              <InterviewerAvatar
                state={isAudioPlaying ? 'talking' : 'idle'}
                audioPlaying={isAudioPlaying}
              />
            </div>

            {/* Welcome Message */}
            <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">👋</div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome!
                </h2>
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto px-4 sm:px-0">
                  {welcomeMessage}
                </p>
                {isAudioPlaying && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span>Interviewer is speaking...</span>
                  </div>
                )}
                <button
                  onClick={beginQuestions}
                  disabled={isAudioPlaying}
                  className="mt-6 sm:mt-8 px-6 py-3 sm:px-10 sm:py-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base sm:text-lg transition-all transform hover:scale-105 min-h-[44px]"
                >
                  {isAudioPlaying ? "Please wait..." : "I'm Ready, Let's Begin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview In Progress */}
        {isStarted && currentQuestion && !isCompleted && !showWelcome && (
          <div className="space-y-6 sm:space-y-8">
            {/* Interviewer Avatar */}
            <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
              <InterviewerAvatar
                state={getAvatarState()}
                audioPlaying={isAudioPlaying}
              />
            </div>

            {/* Question Display */}
            <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base sm:text-lg">
                    {currentQuestionNumber}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">
                    {currentQuestion.question_text}
                  </h2>
                  {isAudioPlaying && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                      <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      <span>Interviewer is speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recording Section */}
            {!transcript && !isTranscribing && (
              <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6 text-center">
                  Record Your Answer
                </h3>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDuration={300}
                  onRecordingStateChange={setIsRecording}
                />
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSkipQuestion}
                    disabled={isRecording}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip this question
                  </button>
                </div>
              </div>
            )}

            {/* Transcribing State */}
            {isTranscribing && (
              <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
                <div className="text-3xl sm:text-4xl mb-4">⏳</div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Transcribing...
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Please wait while we transcribe your answer
                </p>
              </div>
            )}

            {/* Processing Answer State — shown after confirm while AI decides on follow-up */}
            {isProcessingAnswer && !transcript && !isTranscribing && (
              <div
                className="glass rounded-2xl p-8 sm:p-12 text-center"
                style={{ border: '1px solid rgba(212,163,90,0.18)' }}
              >
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#d4a35a' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(212,163,90,0.30)', borderTopColor: '#d4a35a', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>Analyzing your answer…</span>
                </div>
              </div>
            )}

            {/* Transcript Review */}
            {transcript && !isTranscribing && (
              <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Review Your Answer
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  You can edit your transcript if needed
                </p>

                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full h-32 sm:h-40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <button
                    onClick={() => {
                      setEditedTranscript("");
                      resetTranscript();
                    }}
                    className="flex-1 px-6 py-3 bg-slate-600 dark:bg-slate-500 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg font-semibold transition-all min-h-[44px]"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={handleConfirmAndNext}
                    className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 min-h-[44px]"
                  >
                    Confirm & Next Question
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={handleSkipQuestion}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm underline"
                  >
                    Skip this question
                  </button>
                </div>
              </div>
            )}

            {/* End Interview Button */}
            <div className="text-center">
              <button
                onClick={handleEndEarly}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
              >
                End Interview Early
              </button>
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {isCompleted && (
          <div className="bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Interview Complete!
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 px-4 sm:px-0">
              Great job! We&apos;re processing your responses and generating feedback.
              You&apos;ll be redirected to the results page shortly.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* User Video Feed */}
      {isStarted && !isCompleted && <VideoFeed isVisible={true} />}
    </div>
  );
}
