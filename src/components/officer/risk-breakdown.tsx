"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { RiskBreakdown } from "@/lib/risk";
import { cn } from "@/lib/utils";

const FACTOR_LABELS: Record<string, string> = {
  violations: "Violation history",
  complaints: "Complaint frequency",
  inspectionTimeliness: "Time since last inspection",
  documents: "Document compliance",
  category: "Category baseline",
};

export function RiskBreakdownCard({ breakdown }: { breakdown: RiskBreakdown }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(breakdown.factors).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm">
                <span>{FACTOR_LABELS[key] ?? key}</span>
                <span className="font-mono tabular-nums">
                  {value} / {breakdown.max[key as keyof typeof breakdown.max]}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${(value / (breakdown.max[key as keyof typeof breakdown.max] || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-medium">Total risk score</span>
            <span className="font-mono text-lg font-bold tabular-nums">{breakdown.score} / 100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Why this score?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.explainers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contributing factors found.</p>
          ) : (
            <ul className="space-y-2">
              {breakdown.explainers.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      i === 0 ? "bg-primary" : "bg-muted-foreground/50"
                    )}
                  />
                  {e}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Scores come from a transparent weighted model: violations 40% · complaints 25% · inspection timeliness 15% ·
            documents 10% · category 10%. Every point is auditable by a regulator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
