export type AiReasonType = 'Medical' | 'Personal' | 'Research';

export interface AiPredictPayload {
  working_days_count: number;
  has_schedule_conflict: 0 | 1;
  institutional_event_conflict: 0 | 1;
  previous_requests_count: number;
  department_coverage: number;
  reason_type: AiReasonType;
}

export interface AiPredictResult {
  recommendation: 'Approve' | 'Reject' | 'Pending';
  confidence_score: number | null;
  reason: string | null;
}

export const AI_FALLBACK: AiPredictResult = {
  recommendation: 'Pending',
  confidence_score: null,
  reason: 'AI analysis is pending; the intelligence service was unavailable.',
};
