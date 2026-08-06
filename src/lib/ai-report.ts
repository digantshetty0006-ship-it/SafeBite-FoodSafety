import { calculateRiskScore, scoreToTier } from "./risk";

export interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  notes?: string;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { key: "hygiene", label: "General hygiene & cleanliness", passed: true },
  { key: "storage_temperature", label: "Storage temperature control", passed: true },
  { key: "licensing", label: "Valid FSSAI license displayed", passed: true },
  { key: "pest_control", label: "Pest control measures in place", passed: true },
  { key: "expiry_dates", label: "No expired / stale stock", passed: true },
  { key: "staff_hygiene", label: "Staff hygiene (gloves, headgear)", passed: true },
  { key: "food_handling", label: "Safe food handling & separation", passed: true },
  { key: "water_quality", label: "Potable water supply", passed: true },
  { key: "waste_management", label: "Waste management & disposal", passed: true },
  { key: "allergen_management", label: "Allergen labeling & management", passed: true },
];

const FIELD_TO_VIOLATION: Record<string, string> = {
  hygiene: "hygiene",
  storage_temperature: "temperature",
  licensing: "licensing",
  pest_control: "pest_control",
  expiry_dates: "expired_stock",
  staff_hygiene: "hygiene",
  food_handling: "food_handling",
  water_quality: "water_quality",
  waste_management: "hygiene",
  allergen_management: "labeling",
};

export interface AiReport {
  summary: string;
  riskDelta: number;
  suggestedViolations: { type: string; severity: string; description: string }[];
  tone: "positive" | "warning" | "critical";
  checklistScore: string;
}

function severityFromFailedCount(failed: number): string {
  if (failed >= 5) return "critical";
  if (failed >= 3) return "high";
  if (failed >= 1) return "medium";
  return "low";
}

function severityForField(key: string): string {
  if (["storage_temperature", "expiry_dates", "pest_control"].includes(key)) return "high";
  if (["hygiene", "licensing", "food_handling", "water_quality"].includes(key)) return "medium";
  return "low";
}

/**
 * Deterministic "AI" report generator. Turns a completed checklist + notes +
 * current risk context into a structured summary and a recommended score delta.
 * Fully rule-based and auditable — not a black box.
 */
export function generateAiReport(params: {
  businessName: string;
  currentScore: number;
  checklist: ChecklistItem[];
  notes?: string;
}): AiReport {
  const { businessName, currentScore, checklist, notes } = params;
  const failed = checklist.filter((c) => !c.passed);
  const passedCount = checklist.length - failed.length;
  const pct = checklist.length ? Math.round((passedCount / checklist.length) * 100) : 0;
  const failedLabels = failed.map((f) => f.label.toLowerCase());

  const maxDelta = 100 - currentScore;
  let riskDelta = 0;

  for (const f of failed) {
    if (f.key === "storage_temperature") riskDelta += 8;
    else if (f.key === "expiry_dates") riskDelta += 7;
    else if (f.key === "pest_control") riskDelta += 6;
    else if (f.key === "licensing") riskDelta += 6;
    else riskDelta += 3;
  }
  if (failed.length >= 5) riskDelta += 5;

  const suggestedViolations = failed.map((f) => ({
    type: FIELD_TO_VIOLATION[f.key] ?? "hygiene",
    severity: severityForField(f.key),
    description: `${f.label} — failed during inspection.`,
  }));

  let summary: string;
  let tone: AiReport["tone"];
  if (failed.length === 0) {
    tone = "positive";
    summary = `${businessName} passed all ${checklist.length} checklist items (100%). No violations identified. Overall risk is expected to hold or decline on the next scoring cycle.`;
  } else if (failed.length <= 2) {
    tone = "warning";
    summary = `${businessName} passed ${passedCount}/${checklist.length} items (${pct}%). Minor gaps were found in ${failedLabels.join(", ")}. Recommended risk delta +${riskDelta}. No critical findings.`;
  } else {
    tone = "critical";
    summary = `${businessName} failed ${failed.length}/${checklist.length} checklist items (${pct}%). Significant gaps in ${failedLabels.join(
      ", "
    )}. Recommended risk delta +${riskDelta} — escalate to a priority re-inspection and log ${suggestedViolations.length} violation(s).`;
  }

  if (notes) summary += ` Officer notes: "${notes}".`;

  return {
    summary,
    riskDelta: Math.min(riskDelta, maxDelta),
    suggestedViolations,
    tone,
    checklistScore: `${pct}%`,
  };
}

/** Human-readable suggestion strings for a business owner, derived from violations. */
export function generateOwnerSuggestions(opts: {
  businessName: string;
  violations: { type: string; severity: string }[];
  currentTier: string;
  expiredDocs: number;
}): { title: string; body: string; impact: string; priority: string }[] {
  const { businessName, violations, currentTier, expiredDocs } = opts;
  const byType = new Map<string, number>();
  for (const v of violations) byType.set(v.type, (byType.get(v.type) ?? 0) + 1);
  const suggestions: { title: string; body: string; impact: string; priority: string }[] = [];

  if ((byType.get("temperature") ?? 0) >= 2) {
    suggestions.push({
      title: "Track refrigeration temperatures digitally",
      body: `Your last ${byType.get("temperature")} inspections flagged inconsistent refrigeration temperatures. Consider installing a digital temperature logger that alerts staff before food spoils.`,
      impact: "Can meaningfully lower your risk score over the next cycle.",
      priority: "high",
    });
  }
  if (byType.get("expired_stock")) {
    suggestions.push({
      title: "Add first-in-first-out stock rotation",
      body: "Expired stock was found during inspection. Use a FIFO rotation system and check expiry dates on delivery so old stock is always used first.",
      impact: "Prevents repeat 'expired stock' violations.",
      priority: "high",
    });
  }
  if (byType.get("pest_control")) {
    suggestions.push({
      title: "Tighten pest control schedule",
      body: "Pest control was flagged. Book monthly professional pest control, seal gaps around pipes and doors, and keep a written log officers can review.",
      impact: "Addresses a repeat high-severity finding.",
      priority: "high",
    });
  }
  if (byType.get("hygiene")) {
    suggestions.push({
      title: "Refresh staff hygiene training",
      body: "Hygiene and sanitation were flagged. Run a short staff refresher on glove use, hand-washing, and surface sanitising, and post a cleaning checklist.",
      impact: "Improves your inspection checklist score.",
      priority: "medium",
    });
  }
  if (byType.get("licensing") || expiredDocs > 0) {
    suggestions.push({
      title: "Renew your compliance documents",
      body: expiredDocs > 0
        ? `You have ${expiredDocs} expired document(s) on file. Renew your FSSAI license / certificates before the next inspection.`
        : "Licensing was flagged. Make sure your current FSSAI license is displayed and matches your registration details.",
      impact: "Documents factor directly into your risk score.",
      priority: "high",
    });
  }
  if (byType.get("food_handling") || byType.get("water_quality") || byType.get("labeling")) {
    suggestions.push({
      title: "Review food handling and labeling practices",
      body: "Review separation of raw and cooked food, potable water supply, and allergen labeling. These are common, easily-fixed checklist items.",
      impact: "Adds points back on your next inspection.",
      priority: "medium",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: `Keep up the good work, ${businessName}`,
      body: "No repeated violations were detected in your history. Maintain current practices and keep documents renewed to protect your grade.",
      impact: `Current tier: ${currentTier}.`,
      priority: "low",
    });
  }
  return suggestions;
}

export interface ComplaintDraft {
  type: string;
  severity: string;
  body: string;
}

/**
 * Deterministic "AI" complaint drafter. Turns free-form Marathi/Hindi/English
 * descriptions into a structured, point-wise complaint — mirroring the FDA's
 * "describe → AI structures it → officer acts" flow. Rule-based and auditable.
 */
export function draftComplaint(text: string, businessName?: string): ComplaintDraft {
  const t = text.toLowerCase();
  const concerns: { type: string; severity: string }[] = [];
  if (/(poison|ill|vomit|diarrhea|sick|stomach|fever|dizzy|nausea|bhand|bad)/.test(t))
    concerns.push({ type: "Suspected food poisoning / illness", severity: "critical" });
  if (/(expired|expiry|rotten|stale|mould|mold|rancid|off|old stock)/.test(t))
    concerns.push({ type: "Expired or stale food", severity: "high" });
  if (/(adulter|foreign object|insect|bug|hair|stone|glass|plastic|rat|rodent)/.test(t))
    concerns.push({ type: "Adulteration / foreign object", severity: "high" });
  if (/(hygiene|dirty|filthy|unclean|sanitation|waste|pest|cockroach|unhygienic)/.test(t))
    concerns.push({ type: "Poor hygiene / sanitation", severity: "medium" });
  if (/(label|misbrand|date|fssai|license|licence|fake|counterfeit)/.test(t))
    concerns.push({ type: "Misbranding / licensing issue", severity: "medium" });
  if (/(price|overcharge|weight|short|quantity|bill|charge|extra)/.test(t))
    concerns.push({ type: "Pricing / quantity issue", severity: "low" });
  if (concerns.length === 0) concerns.push({ type: "General food safety concern", severity: "medium" });

  const primary = concerns[0];
  const summary = text.trim().replace(/\s+/g, " ");
  const lines = [
    `Complaint type: ${primary.type}`,
    `Severity: ${primary.severity.toUpperCase()}`,
    businessName ? `Business: ${businessName}` : null,
    `What happened: ${summary}`,
    concerns.length > 1 ? `Additional concerns: ${concerns.slice(1).map((c) => c.type).join(", ")}` : null,
    "Requested action: Food Safety Officer inspection and appropriate action under the Food Safety and Standards Act, 2006.",
  ];
  return { type: primary.type, severity: primary.severity, body: lines.filter(Boolean).join("\n") };
}

export { scoreToTier };
