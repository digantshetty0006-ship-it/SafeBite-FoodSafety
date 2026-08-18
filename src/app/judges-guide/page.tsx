import Link from "next/link";
import {
  ShieldCheck,
  Gauge,
  BarChart3,
  PieChart,
  Map,
  Activity,
  Scale,
  Link2,
  Timer,
  CircleDot,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLang } from "@/lib/lang";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { LocaleProvider } from "@/components/locale-provider";

const TIER_COLORS: Record<string, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_LEVELS = [
  { key: "low", name: "Low risk", range: "≤ 25 — compliant", rating: "≥ 3.8 ★" },
  { key: "moderate", name: "Moderate risk", range: "26–50 — watch", rating: "2.5–3.7 ★" },
  { key: "high", name: "High risk", range: "51–75 — act", rating: "1.3–2.4 ★" },
  { key: "critical", name: "Critical risk", range: "76–100 — urgent", rating: "< 1.3 ★" },
] as const;

interface ChartEntry {
  icon: React.ElementType;
  name: string;
  where: string;
  what: string;
  how: string;
  why: string;
}

const CHARTS: ChartEntry[] = [
  {
    icon: Activity,
    name: "Inspection activity & violations (12 months)",
    where: "Officer → Analytics, first card",
    what: "An area chart of inspections completed per month (green) with a red line of violations logged per month.",
    how: "Read the gap between the two lines. The green area is how much enforcement actually happened; the red line is how much non-compliance was found.",
    why: "Shows whether enforcement effort is growing and whether violations are being found — the classic 'are we checking, and are we finding' view. A wide gap in the right direction means more inspections with fewer violations: prevention working.",
  },
  {
    icon: BarChart3,
    name: "Complaints by business category",
    where: "Officer → Analytics, second card",
    what: "A bar chart counting open-to-all complaints grouped by business type (restaurant, street vendor, meat/poultry, bakery…).",
    how: "Taller bar = that business type generates the most complaints from citizens.",
    why: "Tells regulators where citizens are actually feeling the problem. If street vendors dominate, focus street-vendor drives; if meat/poultry dominates, focus cold-chain audits.",
  },
  {
    icon: Gauge,
    name: "Average risk by district",
    where: "Officer → Analytics, third card",
    what: "A bar chart of the mean risk score (0–100) of all registered businesses in each district, bars coloured green → red by severity.",
    how: "The bar height is the average score; the colour is the same number on a red-amber-green scale (red ≥ 75, orange ≥ 51, amber ≥ 26, green below).",
    why: "One glance tells you which districts need more officers and more inspections. Red bars = resource priority for the FDA.",
  },
  {
    icon: PieChart,
    name: "Risk level distribution",
    where: "Officer → Analytics, fourth card",
    what: "A donut chart of how many businesses fall into each risk level — Low (green, ≤25), Moderate (amber, ≤50), High (orange, ≤75), Critical (red, >75).",
    how: "Each slice is a share of the entire registered population. Critical is the dangerous tail.",
    why: "Justifies targeted enforcement: a regulator can say 'only 8% of businesses are Critical — we audit those first' instead of inspecting everything equally.",
  },
  {
    icon: Layers,
    name: "Violation severity by district",
    where: "Officer → Analytics, full-width card",
    what: "A stacked bar chart of all violations found per district, split into Low / Medium / High / Critical severity.",
    how: "Each bar is one district; the coloured segments stack up to the total number of violations found there.",
    why: "Severity, not just count, drives penalties and shutdowns under the FSS Act. A district with few but Critical violations needs urgent action; one with many Low violations needs education and re-inspection.",
  },
  {
    icon: Link2,
    name: "Suspected outbreak networks",
    where: "Officer → Analytics, bottom section",
    what: "Cards that group businesses sharing a common signal — the same supplier, or the same violation type in the same place and time window (geo patterns). Each card shows a confidence percentage and the shared findings.",
    how: "Click the All / Shared supplier / Geo clusters tabs. Each card lists the linked businesses — click any business to open its file.",
    why: "Outbreaks rarely start in one kitchen. If five restaurants in one lane all failed the same check in the same week, they probably share a supplier — act on the supplier, not just the five outlets. Note: this is a prototype heuristic for the demo, not ML.",
  },
  {
    icon: Map,
    name: "District heat map",
    where: "Officer → Map (also linked from the dashboard)",
    what: "A live map of Maharashtra with every registered business as a marker, coloured green → red by risk score, plus district averages.",
    how: "Use the search box to find a business or district; click a marker for its risk score, level and last inspection.",
    why: "Spatial pattern finding: risk clusters near market areas, ports or borders are visible immediately, and officers can plan field routes from the map.",
  },
  {
    icon: Timer,
    name: "SLA countdown & auto-escalation",
    where: "Citizen → My complaints",
    what: "Every complaint carries a 7-day service-level agreement. The countdown is shown to the citizen; if the officer doesn't act in time, the complaint auto-escalates to the next level.",
    how: "File a complaint, then watch the SLA clock on the citizen's 'My complaints' page next to the status.",
    why: "This is the trust feature: citizens can see the commitment and the consequence. It mirrors the FSSAI grievance-flow principle that unresolved complaints must escalate.",
  },
  {
    icon: Scale,
    name: "Risk score — the number behind everything",
    where: "Everywhere — dashboard, map, business file",
    what: "A deterministic 0–100 score per business (higher = riskier) built from five weighted factors: violations 40%, complaints 25%, inspection timeliness 15%, document compliance 10%, category baseline 10%.",
    how: "Open any business file — the score includes 'why' explainers for every factor, so a Critical-level score is never a black box.",
    why: "Explainable scoring is the core of the pitch: regulators can justify every action in front of a court, auditor, or the public, because each point of the score is traced to evidence.",
  },
];

const DEMO_SCRIPT = [
  {
    step: "1",
    title: "Open the dashboard (officer@demo.in / demo1234)",
    body: "Point at the KPIs and the risk levels — 'one glance at the whole state'. Then open the district heat map and search a business.",
  },
  {
    step: "2",
    title: "Show the analytics page",
    body: "Walk through the four charts left to right: activity vs violations, complaints by category, average risk by district, risk level distribution — ending on outbreak networks.",
  },
  {
    step: "3",
    title: "Open one business file",
    body: "Show the risk score breakdown with its explainers — 'the score tells you why, not just what'. Show the complaint photos and inspection history.",
  },
  {
    step: "4",
    title: "File a complaint as a citizen (citizen@demo.in)",
    body: "Use voice or type, pin the location on the map (it resolves to a real address + district), attach a photo, submit. Watch it appear instantly on the officer's queue with the SLA clock.",
  },
  {
    step: "5",
    title: "Close the loop as the officer",
    body: "Take the complaint, schedule an inspection, log violations — and show the business's risk score tick upward as a result.",
  },
];

export default async function JudgesGuidePage() {
  const lang = await getLang();
  return (
    <LocaleProvider lang={lang}>
      <div className="min-h-screen bg-muted/30">
        <PublicHeader lang={lang} />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SafeBite — guide to every chart</h1>
              <p className="text-sm text-muted-foreground">
                A plain-language walkthrough of the demo, written for judges. Every chart, what it shows, how to read it,
                and why it matters.
              </p>
            </div>
          </div>

        <div className="mt-10 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDot className="h-5 w-5 text-primary" /> The one-number idea: the risk score
              </CardTitle>
              <CardDescription>
                Everything in the demo hangs off one explainable number. A 0–100 risk score for every registered business,
                where higher = riskier. It is weighted: violations 40%, complaints 25%, inspection timeliness 15%,
                document compliance 10%, category baseline 10% — and every point is traced to evidence in the business
                file. Citizens see the same number as a 0.0–5.0 SafeBite Rating (every 20-point drop in risk adds 1.0);
                officers keep the full score and breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                {RISK_LEVELS.map((l) => (
                  <div key={l.key} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: TIER_COLORS[l.key] }} />
                    <span className="text-sm font-semibold">{l.name}</span>
                    <span className="text-xs text-muted-foreground">{l.range}</span>
                    <span className="text-xs font-medium text-foreground/70">{l.rating}</span>
                  </div>
                ))}
                <Badge variant="outline" className="ml-auto">
                  High & Critical levels are the enforcement priority
                </Badge>
              </div>
            </CardContent>
          </Card>

          {CHARTS.map((c) => (
            <Card key={c.name}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <c.icon className="h-5 w-5 text-primary" /> {c.name}
                </CardTitle>
                <CardDescription>Where: {c.where}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-foreground">What it shows — </span>
                  {c.what}
                </p>
                <p>
                  <span className="font-medium text-foreground">How to read it — </span>
                  {c.how}
                </p>
                <p>
                  <span className="font-medium text-foreground">Why it matters — </span>
                  {c.why}
                </p>
              </CardContent>
            </Card>
          ))}

          <Card className="border-emerald-300 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-emerald-600" /> Suggested 5-minute demo script
              </CardTitle>
              <CardDescription>Everything is clickable in the live demo — no waiting, no mock screenshots.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_SCRIPT.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-3 pb-4">
            <Link
              href="/login"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Try the live demo
            </Link>
            <Link
              href="/officer/analytics"
              className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Go straight to the analytics page
            </Link>
          </div>
        </div>
        <PublicFooter lang={lang} />
      </div>
    </div>
    </LocaleProvider>
  );
}