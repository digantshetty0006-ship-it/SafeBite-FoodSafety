import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Gauge, BarChart3, PieChart, Activity, Layers, Link2, Map, Timer, FileSearch } from "lucide-react";

const GUIDE: { icon: React.ElementType; name: string; one: string }[] = [
  { icon: Activity, name: "Inspection activity & violations (12 months)", one: "Green = inspections completed, red line = violations found. A widening gap rightward means enforcement is working." },
  { icon: BarChart3, name: "Complaints by business category", one: "Which business types draw the most citizen complaints — where the public feels the problem." },
  { icon: Gauge, name: "Average risk by district", one: "Mean 0–100 risk per district; red bars = districts that need officers and audits first." },
  { icon: PieChart, name: "Risk tier distribution", one: "Share of businesses in tiers A (≤25) to D (>75). The C+D slices are the audit priority." },
  { icon: Layers, name: "Violation severity by district", one: "Every violation stacked by severity (Low→Critical). Few critical violations beat many low ones for urgency." },
  { icon: Link2, name: "Suspected outbreak networks", one: "Businesses that fail the same way at the same time — usually sharing one upstream cause. Fix the network, fix every outlet in it." },
  { icon: Map, name: "District heat map", one: "Every business on a map, coloured green→red by risk. Spatial clusters jump out at a glance." },
  { icon: Timer, name: "SLA countdown & auto-escalation", one: "Every citizen complaint runs a 7-day SLA with automatic escalation if the officer doesn't act." },
];

const SUPPLIER_STORY = [
  {
    step: "1",
    title: "The link is declared, not guessed",
    body: "Every food business already declares who it buys from. In the real world this comes from the FSSAI registration / licensing process (supply-chain declarations) and from invoices logged during inspections. In this demo, that declaration is part of each business's seeded record — the 'shared supplier' cluster is therefore derived from declared data, exactly as it would be in production.",
  },
  {
    step: "2",
    title: "The system proposes, the officer disposes",
    body: "The heuristic only flags a suspicious pattern: five outlets, same failure, same supplier. It never convicts anyone — the officer opens the linked business files, checks the invoices, and confirms or rejects the link. Confirmed links persist as a supplier network; rejected ones vanish. This human-in-the-loop step is what makes the demo honest and court-defensible.",
  },
  {
    step: "3",
    title: "Why it beats inspecting outlet-by-outlet",
    body: "If the five outlets share a supplier, fixing the five kitchens treats symptoms — the bad batch will hit the next five next week. One audit of the shared supplier, with the batch trace, stops the entire network at once. That is the difference between reactive and predictive food safety.",
  },
];

export function AnalyticsGuide() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">How to read this page</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDE.map((g) => (
          <Card key={g.name}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <g.icon className="h-4 w-4 shrink-0 text-primary" /> {g.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">{g.one}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-300 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSearch className="h-5 w-5 text-emerald-600" /> About the outbreak networks: how do we actually know
            who the supplier is?
          </CardTitle>
          <CardDescription>
            The most honest question to ask about this feature — here is the answer, in three steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SUPPLIER_STORY.map((s) => (
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
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Badge variant="outline">Prototype honesty</Badge>
            The clustering in this demo is a rule-based heuristic — it proposes patterns for an officer to confirm. The
            confidence % measures how much supporting evidence exists, not certainty.
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Scale className="h-4 w-4" />
        Full walkthrough with demo script: <a href="/judges-guide" className="font-medium text-primary hover:underline">the judges' guide</a>
      </div>
    </div>
  );
}