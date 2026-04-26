import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Question {
  question_id: number;
  question_text: string;
  question_number: number;
  total_questions: number;
  context: unknown;
}

interface InterviewState {
  isConnected: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  currentQuestion: Question | null;
  questionAudio: string | null;
  transcript: string | null;
  error: string | null;
  isTranscribing: boolean;
  isProcessingAnswer: boolean;
  totalQuestions: number;
  currentQuestionNumber: number;
  welcomeMessage: string | null;
  welcomeAudio: string | null;
  showWelcome: boolean;
}

export function useInterview(interviewId: number, userId: string, token: string) {
  const [state, setState] = useState<InterviewState>({
    isConnected: false,
    isStarted: false,
    isCompleted: false,
    currentQuestion: null,
    questionAudio: null,
    transcript: null,
    error: null,
    isTranscribing: false,
    isProcessingAnswer: false,
    totalQuestions: 0,
    currentQuestionNumber: 0,
    welcomeMessage: null,
    welcomeAudio: null,
    showWelcome: false,
  });

  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !userId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const socket = io(WS_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,  // Increased from 5 to 10
      timeout: 20000,  // 20 second connection timeout
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      setState((prev) => {
        const newState = { ...prev, isConnected: true, error: prev.error?.includes("Connection") ? null : prev.error };

        if (prev.isStarted && !prev.isCompleted && prev.currentQuestion) {
          // Give socket a moment to fully establish before emitting
          setTimeout(() => {
            socket.emit("start_interview", {
              interview_id: interviewId,
              user_id: userId,
            });
          }, 100);
        }

        return newState;
      });
    });

    socket.on("disconnect", (reason) => {
      setState((prev) => {
        // Only show error if it's not a normal disconnect or client-initiated
        const shouldShowError = reason !== "io client disconnect" && reason !== "io server disconnect";
        return {
          ...prev,
          isConnected: false,
          error: shouldShowError && prev.isStarted && !prev.isCompleted
            ? "Connection lost. Attempting to reconnect..."
            : prev.error,
        };
      });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: "Unable to connect to server. Please check your internet connection.",
      }));
    });

    socket.on("connected", (_data) => {});

    // Interview event handlers
    socket.on("interview_started", (data) => {
      setState((prev) => ({
        ...prev,
        isStarted: true,
        totalQuestions: data.total_questions,
        currentQuestionNumber: 1,
      }));
    });

    socket.on("welcome_message", (data) => {
      setState((prev) => ({
        ...prev,
        welcomeMessage: data.message,
        showWelcome: true,
      }));
    });

    socket.on("welcome_audio", (data) => {
      setState((prev) => ({
        ...prev,
        welcomeAudio: data.audio_data,
      }));
    });

    socket.on("question", (data: Question) => {
      setState((prev) => ({
        ...prev,
        currentQuestion: data,
        currentQuestionNumber: data.question_number,
        questionAudio: null,
        transcript: null,
        isProcessingAnswer: false,
      }));
    });

    socket.on("question_audio", (data) => {
      setState((prev) => ({
        ...prev,
        questionAudio: data.audio_data,
      }));
    });

    socket.on("transcribing", () => {
      setState((prev) => ({
        ...prev,
        isTranscribing: true,
      }));
    });

    socket.on("transcript_ready", (data) => {
      setState((prev) => ({
        ...prev,
        transcript: data.transcript,
        isTranscribing: false,
      }));
    });

    socket.on("processing_answer", () => {
      setState((prev) => ({ ...prev, isProcessingAnswer: true }));
    });

    socket.on("followup_question", (data) => {
      const cleanFollowupText = data.followup_text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();

      setState((prev) => ({
        ...prev,
        currentQuestion: {
          ...prev.currentQuestion!,
          question_text: cleanFollowupText,
        },
        questionAudio: null,
        transcript: null,
        isProcessingAnswer: false,
      }));
    });

    socket.on("interview_completed", (_data) => {
      setState((prev) => ({
        ...prev,
        isCompleted: true,
        isStarted: false,
      }));
    });

    socket.on("error", (data) => {
      console.error("Interview error:", data.message);
      setState((prev) => ({
        ...prev,
        error: data.message,
        isTranscribing: false,
      }));
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, userId, interviewId]);

  // Start interview
  const startInterview = useCallback(() => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit("start_interview", {
        interview_id: interviewId,
        user_id: userId,
      });
    }
  }, [interviewId, userId, state.isConnected]);

  // Begin questions after welcome message
  const beginQuestions = useCallback(() => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit("begin_questions", {
        interview_id: interviewId,
      });
      setState((prev) => ({
        ...prev,
        showWelcome: false,
      }));
    }
  }, [interviewId, state.isConnected]);

  // Submit answer audio
  const submitAnswer = useCallback(
    (audioBlob: Blob) => {
      if (!socketRef.current || !state.currentQuestion) {
        console.error("Cannot submit answer: socket or question not available");
        setState((prev) => ({
          ...prev,
          error: "Connection lost. Please check your internet connection and try again.",
        }));
        return;
      }

      // Check socket connection status
      if (!socketRef.current.connected) {
        console.error("Socket not connected when trying to submit answer");
        setState((prev) => ({
          ...prev,
          error: "Connection lost. Please wait for reconnection and try again.",
        }));
        return;
      }

      // Validate audio blob size (max 10MB to prevent issues)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (audioBlob.size > maxSize) {
        console.error("Audio file too large:", audioBlob.size);
        setState((prev) => ({
          ...prev,
          error: "Recording is too large. Please record a shorter answer.",
        }));
        return;
      }

      if (audioBlob.size < 100) {
        console.error("Audio file too small:", audioBlob.size);
        setState((prev) => ({
          ...prev,
          error: "Recording failed. Please try again.",
        }));
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();

      reader.onerror = () => {
        console.error("FileReader error");
        setState((prev) => ({
          ...prev,
          error: "Failed to process recording. Please try again.",
        }));
      };

      reader.onloadend = () => {
        try {
          // Double-check socket is still connected
          if (!socketRef.current || !socketRef.current.connected) {
            console.error("Socket disconnected during file read");
            setState((prev) => ({
              ...prev,
              error: "Connection lost while processing. Please try recording again.",
            }));
            return;
          }

          const base64data = reader.result as string;
          if (!base64data) {
            console.error("FileReader result is empty");
            setState((prev) => ({
              ...prev,
              error: "Failed to process recording. Please try again.",
            }));
            return;
          }

          // Remove the data:audio/webm;base64, prefix
          const base64Audio = base64data.split(",")[1];

          if (!base64Audio) {
            console.error("Base64 conversion failed");
            setState((prev) => ({
              ...prev,
              error: "Failed to process recording. Please try again.",
            }));
            return;
          }

          socketRef.current!.emit("submit_answer", {
            question_id: state.currentQuestion!.question_id,
            audio_data: base64Audio,
            format: "webm",
          });
        } catch (err) {
          console.error("Error processing audio:", err);
          setState((prev) => ({
            ...prev,
            error: "Failed to submit answer. Please try again.",
          }));
        }
      };

      reader.readAsDataURL(audioBlob);
    },
    [state.currentQuestion]
  );

  // Confirm answer and move to next question
  const confirmAnswer = useCallback(
    (transcript: string) => {
      if (!socketRef.current || !state.currentQuestion) return;

      socketRef.current.emit("confirm_answer", {
        question_id: state.currentQuestion.question_id,
        transcript: transcript,
      });

      setState((prev) => ({
        ...prev,
        transcript: null,
        isProcessingAnswer: true,
      }));
    },
    [state.currentQuestion]
  );

  // Skip current question
  const skipQuestion = useCallback(() => {
    if (!socketRef.current || !state.currentQuestion) return;

    socketRef.current.emit("skip_question", {
      question_id: state.currentQuestion.question_id,
    });

    // Reset transcript when skipping
    setState((prev) => ({
      ...prev,
      transcript: null,
    }));
  }, [state.currentQuestion]);

  // End interview early
  const endInterview = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("end_interview", {});
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: null,
    }));
  }, []);

  return {
    ...state,
    startInterview,
    beginQuestions,
    submitAnswer,
    confirmAnswer,
    skipQuestion,
    endInterview,
    resetTranscript,
  };
}
