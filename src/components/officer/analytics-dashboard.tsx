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
import { tr, type Lang } from "@/lib/i18n";

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

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
} as const;
const CATEGORY_AXIS = { angle: -25, textAnchor: "end", height: 64 } as const;

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

export function AnalyticsDashboard({ data, lang }: { data: AnalyticsData; lang: Lang }) {
  const [networkTab, setNetworkTab] = useState<string>("all");
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const filteredNetworks = useMemo(
    () => (networkTab === "all" ? data.networks : data.networks.filter((n) => n.type === networkTab)),
    [data.networks, networkTab]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">{t("an.inspectionActivity")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("an.activityHint")}
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} interval={0} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="inspections" name={t("an.seriesInspections")} stroke="#10b981" fill="url(#insp)" />
                <Line type="monotone" dataKey="violations" name={t("an.seriesViolations")} stroke="#ef4444" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">{t("an.complaintsByCategory")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("an.complaintsHint")}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.complaintsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" fontSize={10} {...CATEGORY_AXIS} interval={0} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name={t("an.seriesComplaints")} fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">{t("an.avgRiskByDistrict")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("an.avgRiskHint")}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.riskByDistrict}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" fontSize={10} {...CATEGORY_AXIS} interval={0} />
                <YAxis fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_STYLE} />
                <Bar dataKey="avg" name={t("an.seriesAvgRisk")} radius={[4, 4, 0, 0]}>
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
            <CardTitle className="text-base">{t("an.riskTierDist")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("an.tierHint")}
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
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Severity by district */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">{t("an.severityByDistrict")}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("an.severityHint")}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.severityByDistrict}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" fontSize={11} {...CATEGORY_AXIS} interval={0} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="low" stackId="a" name={t("sev.low")} fill={SEVERITY_COLOR.low} />
              <Bar dataKey="medium" stackId="a" name={t("sev.medium")} fill={SEVERITY_COLOR.medium} />
              <Bar dataKey="high" stackId="a" name={t("sev.high")} fill={SEVERITY_COLOR.high} />
              <Bar dataKey="critical" stackId="a" name={t("sev.critical")} fill={SEVERITY_COLOR.critical} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network detection */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Link2 className="h-5 w-5 text-primary" /> {t("an.networksTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("an.networksHint")}
            </p>
          </div>
          <Tabs value={networkTab} onValueChange={setNetworkTab}>
            <TabsList>
              <TabsTrigger value="all">{t("an.all")}</TabsTrigger>
              <TabsTrigger value="supplier">{t("an.supplier")}</TabsTrigger>
              <TabsTrigger value="geo_pattern">{t("an.geo")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{t("an.supplier")}</span> — {t("an.supplierDesc")}
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{t("an.geo")}</span> — {t("an.geoDesc")}
          </div>
        </div>

        {filteredNetworks.length === 0 ? (
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">{t("an.noNetworks")}</p>
              <p className="text-sm text-muted-foreground">{t("an.noPatterns")}</p>
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
                        {t("an.networkSummary", { n: String(n.businesses.length), c: (n.confidence * 100).toFixed(0) })}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {n.type === "supplier" ? t("an.typeSupplier") : t("an.typeGeo")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {n.businesses.map((id) => (
                      <Link key={id} href={`/officer/business/${id}`}>
                        <Badge variant="secondary" className="hover:bg-accent">
                          {data.businessNames[id] ?? t("biz.business")}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                  {n.violations.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground">{t("an.sharedFindings")}</p>
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
