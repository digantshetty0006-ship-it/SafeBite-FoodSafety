import type { Business, Complaint, Document, Inspection, Violation } from "@prisma/client";

export type BusinessWithRelations = Business & {
  inspections?: (Inspection & { violations?: Violation[] })[];
  complaints?: Complaint[];
  documents?: Document[];
};

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
};

const CATEGORY_BASELINE: Record<string, number> = {
  street_vendor: 9,
  meat_poultry: 8,
  restaurant: 6,
  catering: 6,
  manufacturer: 5,
  bakery: 4,
  warehouse: 4,
  packaged_retail: 3,
};

const WEIGHTS = {
  violations: 40,
  complaints: 25,
  inspectionTimeliness: 15,
  documents: 10,
  category: 10,
} as const;

export interface RiskBreakdown {
  score: number;
  tier: string;
  factors: {
    violations: number;
    complaints: number;
    inspectionTimeliness: number;
    documents: number;
    category: number;
  };
  max: typeof WEIGHTS;
  explainers: string[];
}

/** Decay factor: older violations count for less over a 12 month window. */
function recencyDecay(date: Date, now = new Date()): number {
  const months = (now.getTime() - date.getTime()) / (30.44 * 24 * 3600 * 1000);
  if (months <= 0) return 1;
  return Math.max(0, Math.pow(0.95, months));
}

export function scoreToTier(score: number): string {
  if (score <= 25) return "A";
  if (score <= 50) return "B";
  if (score <= 75) return "C";
  return "D";
}

function factorViolations(inspections: (Inspection & { violations?: Violation[] })[] | undefined, explainers: string[]): number {
  if (!inspections || inspections.length === 0) {
    explainers.push("No inspection history on record.");
    return 0;
  }
  let total = 0;
  const now = new Date();
  let weightSum = 0;
  const byType = new Map<string, { weight: number; severity: string; count: number }>();

  for (const insp of inspections) {
    for (const v of insp.violations ?? []) {
      const w = (SEVERITY_WEIGHT[v.severity] ?? 3) * recencyDecay(insp.completedAt ?? insp.scheduledAt, now);
      total += w;
      weightSum += w;
      const cur = byType.get(v.type) ?? { weight: 0, severity: v.severity, count: 0 };
      cur.weight += w;
      cur.count += 1;
      byType.set(v.type, cur);
    }
  }
  total = Math.min(total, WEIGHTS.violations);
  if (total > 0) {
    const worst = [...byType.entries()].sort((a, b) => b[1].weight - a[1].weight)[0];
    const pct = Math.round((total / WEIGHTS.violations) * 100);
    explainers.push(
      `${worst[1].count}x "${worst[0]}" violation${worst[1].count > 1 ? "s" : ""} (${worst[1].severity}) contributing ~${pct}% of the risk budget.`
    );
    if (weightSum > WEIGHTS.violations) {
      explainers.push("Violation load exceeds the cap for this factor.");
    }
  } else {
    explainers.push("No violations logged across inspections.");
  }
  return Math.round(total * 10) / 10;
}

function factorComplaints(complaints: Complaint[] | undefined, explainers: string[]): number {
  if (!complaints || complaints.length === 0) {
    explainers.push("No citizen complaints filed.");
    return 0;
  }
  const now = new Date();
  const windowMs = 90 * 24 * 3600 * 1000;
  const recent = complaints.filter((c) => now.getTime() - c.createdAt.getTime() <= windowMs);
  if (recent.length === 0) {
    explainers.push("No complaints in the last 90 days.");
    return 0;
  }
  const substantiated = recent.filter((c) => c.status !== "submitted").length;
  const unsubstantiated = recent.length - substantiated;
  let total = unsubstantiated * 4 + substantiated * 7;
  total = Math.min(total, WEIGHTS.complaints);
  explainers.push(
    `${recent.length} complaint${recent.length > 1 ? "s" : ""} in the last 90 days (${substantiated} substantiated / in review, ${unsubstantiated} new).`
  );
  return Math.round(total * 10) / 10;
}

function factorInspectionTimeliness(
  inspections: (Inspection & { violations?: Violation[] })[] | undefined,
  scheduledInspections: Inspection[] | undefined,
  explainers: string[]
): number {
  const now = new Date();
  const completed = inspections?.filter((i) => i.status === "completed") ?? [];
  const lastCompleted = completed
    .map((i) => i.completedAt ?? i.scheduledAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!lastCompleted) {
    explainers.push("Business has never been inspected — highest timeliness risk.");
    return WEIGHTS.inspectionTimeliness;
  }
  const months = (now.getTime() - lastCompleted.getTime()) / (30.44 * 24 * 3600 * 1000);
  let pts = Math.max(0, months - 6) * 2.5;
  pts = Math.min(pts, WEIGHTS.inspectionTimeliness);
  if (pts > 0) {
    explainers.push(`Last inspection ${months.toFixed(1)} months ago (target: within 6 months).`);
  } else {
    explainers.push("Inspected within the last 6 months.");
  }

  const hasUpcoming = (scheduledInspections ?? []).some((i) => i.status === "scheduled" && i.scheduledAt > now);
  if (hasUpcoming) {
    pts = Math.max(0, pts - 4);
    explainers.push("A follow-up inspection is already scheduled.");
  }
  return Math.round(pts * 10) / 10;
}

function factorDocuments(documents: Document[] | undefined, explainers: string[]): number {
  if (!documents || documents.length === 0) {
    explainers.push("No compliance documents on file.");
    return 4;
  }
  const now = new Date();
  const expired = documents.filter((d) => d.expiresAt && d.expiresAt < now);
  let pts = expired.length * 4;
  pts = Math.min(pts, WEIGHTS.documents);
  if (expired.length > 0) {
    explainers.push(`${expired.length} expired document${expired.length > 1 ? "s" : ""} (license / certificate).`);
  } else {
    explainers.push("All compliance documents are valid.");
  }
  return Math.round(pts * 10) / 10;
}

function factorCategory(category: string, explainers: string[]): number {
  const base = CATEGORY_BASELINE[category] ?? 5;
  const reasons: Record<string, string> = {
    street_vendor: "Street vending carries a high baseline handling risk.",
    meat_poultry: "Raw meat handling starts with elevated baseline risk.",
    restaurant: "Restaurants have moderate baseline handling risk.",
  };
  if (reasons[category]) explainers.push(reasons[category]);
  return base;
}

export interface RiskInput extends Partial<Business> {
  inspections?: (Inspection & { violations?: Violation[] })[];
  complaints?: Complaint[];
  documents?: Document[];
}

/**
 * Deterministic, explainable risk score 0-100 (higher = riskier).
 * Weighted factors: violations 40%, complaints 25%, inspection timeliness 15%,
 * document compliance 10%, category baseline 10%.
 */
export function calculateRiskScore(business: RiskInput): RiskBreakdown {
  const explainers: string[] = [];
  const factors = {
    violations: factorViolations(business.inspections, explainers),
    complaints: factorComplaints(business.complaints, explainers),
    inspectionTimeliness: factorInspectionTimeliness(
      business.inspections,
      business.inspections as Inspection[] | undefined,
      explainers
    ),
    documents: factorDocuments(business.documents, explainers),
    category: factorCategory(business.category ?? "restaurant", explainers),
  };
  const score = Math.round(
    factors.violations + factors.complaints + factors.inspectionTimeliness + factors.documents + factors.category
  );
  return {
    score: Math.min(100, Math.max(0, score)),
    tier: scoreToTier(score),
    factors,
    max: WEIGHTS,
    explainers,
  };
}
