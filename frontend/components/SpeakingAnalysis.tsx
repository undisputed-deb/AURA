interface SpeakingAnalysis {
  words_per_minute: number | null;
  total_words: number;
  filler_words: { [key: string]: number };
  total_filler_count: number;
  filler_percentage: number;
  speaking_pace_feedback: string;
  filler_word_feedback: string;
}

interface SpeakingAnalysisCardProps {
  analysis: SpeakingAnalysis;
}

export default function SpeakingAnalysisCard({ analysis }: SpeakingAnalysisCardProps) {
  const getWPMBadgeColor = (wpm: number | null) => {
    if (!wpm) return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
    if (wpm >= 120 && wpm <= 150) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (wpm < 100 || wpm > 180) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
  };

  const getFillerBadgeColor = (percentage: number) => {
    if (percentage < 5) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (percentage < 10) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎤</span>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Speaking Analysis</h4>
      </div>

      <div className="space-y-4">
        {/* WPM Section */}
        {analysis.words_per_minute !== null && analysis.words_per_minute !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Speaking Pace</span>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getWPMBadgeColor(analysis.words_per_minute)}`}>
                {analysis.words_per_minute} WPM
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{analysis.speaking_pace_feedback}</p>
          </div>
        )}

        {/* Filler Words Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filler Words</span>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getFillerBadgeColor(analysis.filler_percentage)}`}>
              {analysis.filler_percentage}% ({analysis.total_filler_count} {analysis.total_filler_count === 1 ? 'instance' : 'instances'})
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{analysis.filler_word_feedback}</p>

          {/* Top Fillers */}
          {Object.keys(analysis.filler_words).length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Most Common:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(analysis.filler_words)
                  .slice(0, 5)
                  .map(([word, count]) => (
                    <span
                      key={word}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                    >
                      &ldquo;{word}&rdquo; ({count}×)
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-600 pt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>Total words: {analysis.total_words}</span>
          <span>•</span>
          <span>Optimal pace: 120-150 WPM</span>
          <span>•</span>
          <span>Target filler rate: &lt;5%</span>
        </div>
      </div>
    </div>
  );
}
