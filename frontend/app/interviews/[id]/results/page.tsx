"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { api } from "@/lib/api";
import LoadingMessages from "@/components/LoadingMessages";
import { useBilling } from "@/lib/useBilling";
import UpgradeModal from "@/components/UpgradeModal";
import Logo from "@/components/Logo";

interface IdealAnswer {
  ideal_answer: string;
  key_points: string[];
  structure: { opening: string; body: string; closing: string };
  why_this_works: string;
}

interface SpeakingAnalysis {
  words_per_minute: number | null;
  total_words: number;
  filler_words: { [key: string]: number };
  total_filler_count: number;
  filler_percentage: number;
  speaking_pace_feedback: string;
  filler_word_feedback: string;
}

interface Evaluation {
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  weaknesses?: string[];
  key_points_covered?: string[];
  speaking_analysis?: SpeakingAnalysis;
}

interface QuestionResult {
  question_id: number;
  question_number?: number;
  question_text: string;
  question_type: string;
  question_category?: string;
  user_answer?: string;
  answer_transcript?: string;
  score: number | null;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  has_evaluation?: boolean;
  evaluation?: Evaluation;
}

interface InterviewResults {
  interview_id: number;
  total_questions: number;
  evaluated_answers: number;
  overall_score: number | null;
  results: QuestionResult[];
  [key: string]: unknown;
}

const scoreColor = (score: number) =>
  score >= 8 ? "#4ade80" : score >= 6 ? "#d4a35a" : "#f87171";

const formatType = (t: string) =>
  t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const filled = (score / 10) * circ;
  const color = scoreColor(score);
  const cx = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.23, fontWeight: 900, color, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: size * 0.1, color: "#7a6f62", marginTop: "1px" }}>/10</span>
      </div>
    </div>
  );
}

function QuestionCard({
  result, index, isPremium, idealAnswer, loadingIdeal, onFetchIdeal, onUpgrade,
}: {
  result: QuestionResult; index: number; isPremium: boolean;
  idealAnswer?: IdealAnswer; loadingIdeal: boolean;
  onFetchIdeal: () => void; onUpgrade: () => void;
}) {
  const score = result.score;
  const accentColor = score != null ? scoreColor(score) : "rgba(255,255,255,0.15)";
  const hasStrengths = (result.evaluation?.strengths?.length ?? 0) > 0;
  const hasWeaknesses = (result.evaluation?.weaknesses?.length ?? 0) > 0;
  const hasImprovements = (result.evaluation?.improvements?.length ?? 0) > 0;
  const speaking = result.evaluation?.speaking_analysis;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: "16px",
      overflow: "hidden",
    }}>
      {/* Question header */}
      <div style={{ padding: "22px 26px 20px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <span style={{
          minWidth: "36px", height: "36px", borderRadius: "8px",
          background: `${accentColor}18`, border: `1px solid ${accentColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 800, color: accentColor, flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "#f0e8d8", lineHeight: 1.5, marginBottom: "10px" }}>
            {result.question_text}
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ padding: "3px 12px", background: "rgba(212,163,90,0.08)", border: "1px solid rgba(212,163,90,0.18)", borderRadius: "999px", fontSize: "13px", fontWeight: 600, color: "#d4a35a" }}>
              {formatType(result.question_type)}
            </span>
            {result.question_category && (
              <span style={{ padding: "3px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", fontSize: "13px", color: "#7a6f62" }}>
                {result.question_category}
              </span>
            )}
          </div>
        </div>

        {score != null && (
          <div style={{
            padding: "8px 16px", borderRadius: "10px",
            background: `${accentColor}12`, border: `1px solid ${accentColor}35`,
            textAlign: "center", flexShrink: 0,
          }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: accentColor, lineHeight: 1 }}>{score.toFixed(1)}</div>
            <div style={{ fontSize: "12px", color: accentColor, opacity: 0.7 }}>/10</div>
          </div>
        )}

        {result.has_evaluation === false && (
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid rgba(212,163,90,0.35)", borderTopColor: "#d4a35a", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "0 26px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Your answer */}
        {result.answer_transcript && (
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#7a6f62", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "8px" }}>Your Answer</p>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {result.answer_transcript.split(/(\[Follow-up:[^\]]+\])/).map((part, i) => {
                const followUp = part.match(/^\[Follow-up:\s*([\s\S]*)\]$/);
                if (followUp) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "rgba(212,163,90,0.07)", border: "1px solid rgba(212,163,90,0.18)", borderRadius: "8px", padding: "10px 12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#d4a35a", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, marginTop: "1px" }}>Follow-up</span>
                      <span style={{ fontSize: "14px", color: "#d4a35a", lineHeight: 1.6 }}>{followUp[1]}</span>
                    </div>
                  );
                }
                const trimmed = part.trim();
                return trimmed ? (
                  <p key={i} style={{ fontSize: "15px", color: "#c4bdb3", lineHeight: 1.75, margin: 0 }}>{trimmed}</p>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {result.evaluation?.feedback && (
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#7a6f62", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "8px" }}>Feedback</p>
            <p style={{ fontSize: "15px", color: "#f0e8d8", lineHeight: 1.75 }}>{result.evaluation.feedback}</p>
          </div>
        )}

        {/* Strengths + Weaknesses */}
        {(hasStrengths || hasWeaknesses) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {hasStrengths && (
              <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.14)", borderRadius: "12px", padding: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "12px" }}>Strengths</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.evaluation!.strengths!.map((s, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#e2f5e9", lineHeight: 1.6 }}>
                      <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasWeaknesses && (
              <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.14)", borderRadius: "12px", padding: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "12px" }}>To Improve</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.evaluation!.weaknesses!.map((w, i) => (
                    <li key={i} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#fde8e8", lineHeight: 1.6 }}>
                      <span style={{ color: "#f87171", flexShrink: 0 }}>✗</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {hasImprovements && (
          <div style={{ background: "rgba(212,163,90,0.04)", border: "1px solid rgba(212,163,90,0.14)", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#d4a35a", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "12px" }}>Suggestions</p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.evaluation!.improvements!.map((imp, i) => (
                <li key={i} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f5e9d5", lineHeight: 1.6 }}>
                  <span style={{ color: "#d4a35a", flexShrink: 0 }}>→</span>{imp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Speaking stats */}
        {speaking && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", paddingTop: "2px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#7a6f62", textTransform: "uppercase", letterSpacing: "0.10em" }}>Speaking</span>
            {speaking.words_per_minute != null && (
              <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "999px", fontSize: "13px", color: "#c4bdb3" }}>
                🎙 {speaking.words_per_minute} WPM
              </span>
            )}
            <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "999px", fontSize: "13px", color: "#c4bdb3" }}>
              Fillers: {speaking.filler_percentage}%
            </span>
            {Object.entries(speaking.filler_words).slice(0, 3).map(([word, count]) => (
              <span key={word} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "999px", fontSize: "13px", color: "#7a6f62" }}>
                &ldquo;{word}&rdquo; ×{count}
              </span>
            ))}
          </div>
        )}

        {/* Ideal answer */}
        {result.has_evaluation && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "18px" }}>
            {!idealAnswer ? (
              <button
                onClick={() => isPremium ? onFetchIdeal() : onUpgrade()}
                disabled={loadingIdeal}
                style={{ width: "100%", padding: "13px 18px", background: "rgba(212,163,90,0.08)", border: "1px solid rgba(212,163,90,0.22)", borderRadius: "10px", color: "#d4a35a", fontSize: "15px", fontWeight: 600, cursor: loadingIdeal ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: loadingIdeal ? 0.6 : 1, transition: "background 0.15s" }}
                onMouseEnter={e => { if (!loadingIdeal) (e.currentTarget as HTMLElement).style.background = "rgba(212,163,90,0.14)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(212,163,90,0.08)"}
              >
                {loadingIdeal ? (
                  <><div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(212,163,90,0.35)", borderTopColor: "#d4a35a", animation: "spin 0.8s linear infinite" }} />Generating…</>
                ) : isPremium ? (
                  <>✨ Show Ideal Answer</>
                ) : (
                  <>🔒 Show Ideal Answer <span style={{ fontSize: "12px", background: "rgba(212,163,90,0.14)", padding: "2px 8px", borderRadius: "999px" }}>Pro</span></>
                )}
              </button>
            ) : (
              <div style={{ background: "rgba(212,163,90,0.05)", border: "1px solid rgba(212,163,90,0.16)", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <span>✨</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#d4a35a" }}>Ideal Answer</span>
                </div>
                <p style={{ fontSize: "15px", color: "#f0e8d8", lineHeight: 1.8, marginBottom: "16px" }}>{idealAnswer.ideal_answer}</p>

                {idealAnswer.key_points?.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#d4a35a", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "10px" }}>Key Points</p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {idealAnswer.key_points.map((pt, i) => (
                        <li key={i} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "#f0e8d8", lineHeight: 1.6 }}>
                          <span style={{ color: "#d4a35a", flexShrink: 0 }}>•</span>{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {idealAnswer.why_this_works && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px 14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "6px" }}>Why It Works</p>
                    <p style={{ fontSize: "14px", color: "#7a6f62", lineHeight: 1.6 }}>{idealAnswer.why_this_works}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result.has_evaluation === false && (
          <div style={{ textAlign: "center", padding: "16px", color: "#7a6f62", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(212,163,90,0.35)", borderTopColor: "#d4a35a", animation: "spin 0.8s linear infinite" }} />
            Evaluating your answer…
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const interviewId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { isReady, getToken } = useClerkAuth();
  const { isPremium } = useBilling();
  const [results, setResults] = useState<InterviewResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idealAnswers, setIdealAnswers] = useState<{ [key: number]: IdealAnswer }>({});
  const [loadingIdeal, setLoadingIdeal] = useState<{ [key: number]: boolean }>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (isReady) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, interviewId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await api.getInterviewResults(interviewId, token);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchIdealAnswer = async (questionId: number) => {
    if (idealAnswers[questionId] || loadingIdeal[questionId]) return;
    try {
      setLoadingIdeal(prev => ({ ...prev, [questionId]: true }));
      const token = await getToken();
      if (!token) return;
      const data = await api.getIdealAnswer(questionId, token);
      setIdealAnswers(prev => ({ ...prev, [questionId]: data.ideal_answer }));
    } catch (err) {
      console.error("Failed to fetch ideal answer:", err);
    } finally {
      setLoadingIdeal(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) return <LoadingMessages interval={1500} />;

  if (error || !results) {
    return (
      <main style={{ minHeight: "100vh", background: "#1a1822", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#fca5a5", marginBottom: "16px", fontSize: "15px" }}>{error || "Results not found"}</p>
          <button onClick={() => router.push("/interviews")} style={{ padding: "10px 20px", background: "rgba(212,163,90,0.12)", border: "1px solid rgba(212,163,90,0.28)", borderRadius: "10px", color: "#d4a35a", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
            Back to Interviews
          </button>
        </div>
      </main>
    );
  }

  const isEvaluated = results.evaluated_answers === results.total_questions;

  const getCategoryBreakdown = () => {
    const categories: { [key: string]: { scores: number[]; count: number } } = {};
    results.results.forEach((r) => {
      if (r.score != null) {
        const cat = r.question_type || "general";
        if (!categories[cat]) categories[cat] = { scores: [], count: 0 };
        categories[cat].scores.push(r.score);
        categories[cat].count++;
      }
    });
    return Object.entries(categories).map(([category, data]) => ({
      category,
      average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count,
    }));
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <main style={{ minHeight: "100vh", background: "#1a1822", color: "#f0e8d8" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {showUpgradeModal && <UpgradeModal reason="ideal_answer" onClose={() => setShowUpgradeModal(false)} />}

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push("/dashboard")}><Logo /></button>
          <button
            onClick={() => router.push("/interviews")}
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "#7a6f62", fontSize: "15px", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f0e8d8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#7a6f62")}
          >
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Interviews
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* In-progress banner */}
        {!isEvaluated && (
          <div style={{ background: "rgba(212,163,90,0.07)", border: "1px solid rgba(212,163,90,0.20)", borderRadius: "12px", padding: "13px 18px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#d4a35a" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(212,163,90,0.4)", borderTopColor: "#d4a35a", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            Evaluation in progress — {results.evaluated_answers}/{results.total_questions} answers scored
          </div>
        )}

        {/* Hero */}
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch", marginBottom: "32px", flexWrap: "wrap" }}>
          {results.overall_score != null && (
            <div className="glass rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "28px 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", minWidth: "160px" }}>
              <ScoreRing score={results.overall_score} size={120} />
              <p style={{ fontSize: "13px", color: "#7a6f62", fontWeight: 500 }}>Overall Score</p>
            </div>
          )}

          {categoryBreakdown.length > 0 && (
            <div className="glass rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "24px 28px", flex: 1, minWidth: "240px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#7a6f62", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "16px" }}>By Category</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {categoryBreakdown.map((cat, i) => {
                  const color = scoreColor(cat.average);
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "14px", color: "#f0e8d8", fontWeight: 500 }}>{formatType(cat.category)}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color }}>{cat.average.toFixed(1)}</span>
                      </div>
                      <div style={{ height: "5px", background: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${(cat.average / 10) * 100}%`, height: "100%", background: color, borderRadius: "3px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
            <div>
              <p style={{ fontSize: "32px", fontWeight: 900, color: "#f0e8d8", lineHeight: 1 }}>{results.evaluated_answers}</p>
              <p style={{ fontSize: "13px", color: "#7a6f62", marginTop: "5px" }}>of {results.total_questions} evaluated</p>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${(results.evaluated_answers / results.total_questions) * 100}%`, height: "100%", background: "#d4a35a", borderRadius: "2px" }} />
            </div>
          </div>
        </div>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#f0e8d8" }}>Question Breakdown</h2>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "13px", color: "#7a6f62" }}>{results.total_questions} questions</span>
        </div>

        {/* Question cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
          {results.results.map((result, idx) => (
            <QuestionCard
              key={result.question_id}
              result={result}
              index={idx}
              isPremium={isPremium}
              idealAnswer={idealAnswers[result.question_id]}
              loadingIdeal={!!loadingIdeal[result.question_id]}
              onFetchIdeal={() => fetchIdealAnswer(result.question_id)}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          ))}
        </div>

        {/* Action row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", paddingBottom: "64px" }}>
          {[
            { label: "Practice Again", icon: "🎯", primary: true, onClick: () => router.push("/interviews/new") },
            { label: "View Analytics", icon: "📊", primary: true, onClick: () => router.push("/analytics") },
            { label: "All Interviews", icon: null, primary: false, onClick: () => router.push("/interviews") },
            { label: "Dashboard", icon: null, primary: false, onClick: () => router.push("/dashboard") },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              style={{ padding: "11px 24px", background: btn.primary ? "rgba(212,163,90,0.10)" : "rgba(255,255,255,0.04)", border: btn.primary ? "1px solid rgba(212,163,90,0.28)" : "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", color: btn.primary ? "#d4a35a" : "#7a6f62", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.15s, color 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f0e8d8"; (e.currentTarget as HTMLElement).style.background = btn.primary ? "rgba(212,163,90,0.16)" : "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = btn.primary ? "#d4a35a" : "#7a6f62"; (e.currentTarget as HTMLElement).style.background = btn.primary ? "rgba(212,163,90,0.10)" : "rgba(255,255,255,0.04)"; }}
            >
              {btn.icon && <span>{btn.icon}</span>}{btn.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
