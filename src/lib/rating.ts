export type RiskBand = "low" | "moderate" | "high" | "critical";

export const RISK_BAND_ORDER: RiskBand[] = ["low", "moderate", "high", "critical"];

export function riskToRating(riskScore: number | null | undefined): number | null {
  if (riskScore === null || riskScore === undefined || Number.isNaN(riskScore)) return null;
  const clamped = Math.min(100, Math.max(0, riskScore));
  return Math.round((5 - (clamped / 100) * 5) * 10) / 10;
}

export function ratingToPercent(rating: number | null | undefined): number {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return 0;
  return (Math.min(5, Math.max(0, rating)) / 5) * 100;
}

export function riskBand(riskScore: number | null | undefined): RiskBand | null {
  if (riskScore === null || riskScore === undefined || Number.isNaN(riskScore)) return null;
  if (riskScore <= 25) return "low";
  if (riskScore <= 50) return "moderate";
  if (riskScore <= 75) return "high";
  return "critical";
}

export function bandOfRating(rating: number | null): RiskBand | null {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return null;
  if (rating >= 3.75) return "low";
  if (rating >= 2.5) return "moderate";
  if (rating >= 1.25) return "high";
  return "critical";
}

export function formatRating(rating: number | null): string {
  return rating === null ? "–" : rating.toFixed(1);
}
