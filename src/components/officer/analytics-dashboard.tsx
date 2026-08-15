"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Link2 } from "lucide-react";
import Link from "next/link";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import type { OutbreakCluster } from "@/lib/network";

const TIER_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#f59e0b",
  C: "#f97316",
  D: "#ef4444",
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export interface AnalyticsData {
  monthlyActivity: { month: string; inspections: number; violations: number }[];
  complaintsByCategory: { category: string; count: number }[];
  riskByDistrict: { district: string; avg: number; count: number }[];
  tierDistribution: { name: string; value: number }[];
  severityByDistrict: { district: string; low: number; medium: number; high: number; critical: number }[];
  networks: OutbreakCluster[];
  businessNames: Record<string, string>;
  topRisky: { id: string; name: string; score: number; district: string }[];
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [networkTab, setNetworkTab] = useState<string>("all");

  const filteredNetworks = useMemo(
    () => (networkTab === "all" ? data.networks : data.networks.filter((n) => n.type === networkTab)),
    [data.networks, networkTab]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Inspection activity & violations (12 months)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Green area = inspections completed · red line = violations found. A widening gap to the right means
              enforcement is working.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.monthlyActivity}>
                <defs>
                  <linearGradient id="insp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="inspections" name="Inspections" stroke="#10b981" fill="url(#insp)" />
                <Line type="monotone" dataKey="violations" name="Violations" stroke="#ef4444" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Complaints by business category</CardTitle>
            <p className="text-xs text-muted-foreground">
              Where citizens are actually feeling the problem — taller bar = that business type draws the most complaints.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.complaintsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" fontSize={10} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Complaints" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Average risk by district</CardTitle>
            <p className="text-xs text-muted-foreground">
              Mean 0–100 risk score per district, coloured red ≥ 75 · orange ≥ 51 · amber ≥ 26 · green below. Red =
              where officers are needed first.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.riskByDistrict}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="district" fontSize={10} />
                <YAxis fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avg" name="Avg risk" radius={[4, 4, 0, 0]}>
                  {data.riskByDistrict.map((d) => (
                    <Cell key={d.district} fill={d.avg >= 75 ? "#ef4444" : d.avg >= 51 ? "#f97316" : d.avg >= 26 ? "#f59e0b" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Risk tier distribution</CardTitle>
            <p className="text-xs text-muted-foreground">
              Share of all businesses per tier — A ≤ 25 · B 26–50 · C 51–75 · D 76–100. The C+D slices are the audit
              priority.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.tierDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {data.tierDistribution.map((entry) => (
                    <Cell key={entry.name} fill={TIER_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Severity by district */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Violation severity by district</CardTitle>
          <p className="text-xs text-muted-foreground">
            Every violation found, stacked by severity — grey Low · amber Medium · orange High · red Critical. Few
            critical violations beat many low ones for urgency.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.severityByDistrict}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="district" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="low" stackId="a" name="Low" fill={SEVERITY_COLOR.low} />
              <Bar dataKey="medium" stackId="a" name="Medium" fill={SEVERITY_COLOR.medium} />
              <Bar dataKey="high" stackId="a" name="High" fill={SEVERITY_COLOR.high} />
              <Bar dataKey="critical" stackId="a" name="Critical" fill={SEVERITY_COLOR.critical} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network detection */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Link2 className="h-5 w-5 text-primary" /> Suspected outbreak networks
            </h2>
            <p className="text-sm text-muted-foreground">
              PROTOTYPE HEURISTIC — groups businesses by shared supplier and geographic + temporal clustering of similar
              violations. Not real ML.
            </p>
          </div>
          <Tabs value={networkTab} onValueChange={setNetworkTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="supplier">Shared supplier</TabsTrigger>
              <TabsTrigger value="geo_pattern">Geo clusters</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredNetworks.length === 0 ? (
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No networks detected</p>
              <p className="text-sm text-muted-foreground">Try the supplier filter or inspect the data more closely.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredNetworks.map((n) => (
              <Card key={n.key} className="border-amber-200 dark:border-amber-900">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{n.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {n.businesses.length} businesses · confidence {(n.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {n.type === "supplier" ? "Supplier" : "Geo pattern"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {n.businesses.map((id) => (
                      <Link key={id} href={`/officer/business/${id}`}>
                        <Badge variant="secondary" className="hover:bg-accent">
                          {data.businessNames[id] ?? "Business"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                  {n.violations.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground">Shared findings</p>
                      {n.violations.slice(0, 6).map((v, i) => (
                        <p key={i} className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR[v.severity] }} />
                          <span className="capitalize">{v.type.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">· {data.businessNames[v.businessId]}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
