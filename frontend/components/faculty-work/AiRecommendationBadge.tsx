'use client';

type AiRecommendation = 'Approve' | 'Reject' | 'Pending' | string | null | undefined;

interface AiRecommendationBadgeProps {
  recommendation?: AiRecommendation;
  confidenceScore?: number | null;
  reason?: string | null;
}

function formatConfidence(score?: number | null): string | null {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return null;
  }
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${Math.min(100, Math.max(0, pct))}%`;
}

export function AiRecommendationBadge({
  recommendation,
  confidenceScore,
  reason,
}: AiRecommendationBadgeProps) {
  const value = recommendation?.trim() || 'Pending';
  const confidence = formatConfidence(confidenceScore);

  const styles =
    value === 'Approve'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : value === 'Reject'
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-slate-50 text-slate-600 border-slate-200';

  const label =
    value === 'Approve'
      ? `AI Suggests Approve${confidence ? ` (${confidence})` : ''}`
      : value === 'Reject'
        ? `AI Suggests Reject${confidence ? ` (${confidence})` : ''}`
        : 'AI Suggestion Pending';

  return (
    <span className="inline-flex flex-col items-start gap-0.5 max-w-xs">
      <span
        title={reason || label}
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles}`}
      >
        {label}
      </span>
      {reason ? (
        <span className="text-[10px] leading-snug text-slate-500">{reason}</span>
      ) : null}
    </span>
  );
}
