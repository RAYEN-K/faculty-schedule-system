'use client';

import { useId, type ReactNode } from 'react';
import { AlertTriangle, Sparkles, type LucideIcon } from 'lucide-react';

type AiRecommendation = 'Approve' | 'Reject' | 'Pending' | string | null | undefined;

interface AiRecommendationBadgeProps {
  recommendation?: AiRecommendation;
  confidenceScore?: number | null;
  reason?: string | null;
}

type Tone = 'approve' | 'reject' | 'pending';

interface ToneTheme {
  badge: string;
  icon: LucideIcon;
  iconClass: string;
  tooltip: string;
  arrow: string;
  label: (confidence: string | null) => string;
}

function formatConfidence(score?: number | null): string | null {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return null;
  }
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${Math.min(100, Math.max(0, pct))}%`;
}

function resolveTone(value: string): Tone {
  if (value === 'Approve') return 'approve';
  if (value === 'Reject') return 'reject';
  return 'pending';
}

const TONE_THEMES: Record<Tone, ToneTheme> = {
  approve: {
    badge:
      'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm shadow-emerald-100/70',
    icon: Sparkles,
    iconClass: 'text-emerald-500',
    tooltip: 'border-emerald-400/30 bg-emerald-950 text-emerald-50',
    arrow: 'bg-emerald-950',
    label: (confidence) =>
      `AI Suggests Approve${confidence ? ` · ${confidence}` : ''}`,
  },
  reject: {
    badge: 'bg-rose-100 text-rose-800 border-rose-500/50 shadow-sm shadow-rose-100/80',
    icon: AlertTriangle,
    iconClass: 'text-rose-500',
    tooltip: 'border-rose-400/30 bg-rose-950 text-rose-50',
    arrow: 'bg-rose-950',
    label: (confidence) =>
      `AI Suggests Reject${confidence ? ` · ${confidence}` : ''}`,
  },
  pending: {
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: Sparkles,
    iconClass: 'text-slate-400',
    tooltip: 'border-slate-500/40 bg-slate-800 text-slate-50',
    arrow: 'bg-slate-800',
    label: () => 'AI Suggestion Pending',
  },
};

function ReasonTooltip({
  text,
  toneClass,
  arrowClass,
  children,
}: {
  text: string;
  toneClass: string;
  arrowClass: string;
  children: ReactNode;
}) {
  const tooltipId = useId();

  return (
    <span className="group/tooltip relative inline-flex max-w-full">
      <span
        tabIndex={0}
        aria-describedby={tooltipId}
        className="inline-flex max-w-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2"
      >
        {children}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border px-3 py-2 text-left text-[11px] leading-relaxed shadow-xl opacity-0 scale-95 transition duration-150 ease-out group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100 ${toneClass}`}
      >
        <span
          aria-hidden
          className={`absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 ${arrowClass}`}
        />
        <span className="relative block font-semibold tracking-wide uppercase text-[9px] opacity-70 mb-1">
          AI rationale
        </span>
        <span className="relative block">{text}</span>
      </span>
    </span>
  );
}

export function AiRecommendationBadge({
  recommendation,
  confidenceScore,
  reason,
}: AiRecommendationBadgeProps) {
  const value = recommendation?.trim() || 'Pending';
  const confidence = formatConfidence(confidenceScore);
  const theme = TONE_THEMES[resolveTone(value)];
  const Icon = theme.icon;
  const label = theme.label(confidence);
  const tooltipText = reason?.trim() || null;

  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badge}`}
    >
      <Icon className={`h-3 w-3 shrink-0 ${theme.iconClass}`} aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );

  if (!tooltipText) {
    return badge;
  }

  return (
    <ReasonTooltip text={tooltipText} toneClass={theme.tooltip} arrowClass={theme.arrow}>
      {badge}
    </ReasonTooltip>
  );
}
