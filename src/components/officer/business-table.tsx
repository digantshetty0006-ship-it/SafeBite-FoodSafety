"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskScoreBar, RiskBadge } from "@/components/risk-badge";
import { categoryLabel, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BusinessRow {
  id: string;
  name: string;
  category: string;
  district: string;
  riskScore: number;
  riskTier: string;
  licenseNumber: string;
  lastInspection: Date | string | null;
  openComplaints: number;
  supplier?: string | null;
}

type SortKey = "riskScore" | "name" | "district" | "category" | "lastInspection" | "openComplaints";

export function BusinessTable({
  businesses,
  districts,
  categories,
}: {
  businesses: BusinessRow[];
  districts: string[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = businesses.filter((b) => {
      if (district !== "all" && b.district !== district) return false;
      if (category !== "all" && b.category !== category) return false;
      if (tier !== "all" && b.riskTier !== tier) return false;
      if (term && !b.name.toLowerCase().includes(term) && !b.licenseNumber.toLowerCase().includes(term)) return false;
      return true;
    });
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "riskScore") cmp = a.riskScore - b.riskScore;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "district") cmp = a.district.localeCompare(b.district);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "openComplaints") cmp = a.openComplaints - b.openComplaints;
      else {
        const da = a.lastInspection ? new Date(a.lastInspection).getTime() : 0;
        const db2 = b.lastInspection ? new Date(b.lastInspection).getTime() : 0;
        cmp = da - db2;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [businesses, q, district, category, tier, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "riskScore" ? "desc" : "asc");
    }
  };

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <button onClick={() => toggleSort(k)} className={cn("flex items-center gap-1 hover:text-foreground", className)}>
      {label}
      {sortKey === k ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>All registered businesses</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or license…"
              className="w-56 pl-8"
            />
          </div>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Risk tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {["A", "B", "C", "D"].map((t) => (
                <SelectItem key={t} value={t}>
                  Tier {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader label="Business" k="name" />
              </TableHead>
              <TableHead>
                <SortHeader label="Risk score" k="riskScore" />
              </TableHead>
              <TableHead>
                <SortHeader label="District" k="district" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortHeader label="Category" k="category" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortHeader label="Last inspection" k="lastInspection" />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="Open complaints" k="openComplaints" />
              </TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No businesses match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow
                  key={b.id}
                  onClick={() => router.push(`/officer/business/${b.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/officer/business/${b.id}`);
                    }
                  }}
                  tabIndex={0}
                  className="group cursor-pointer"
                >
                  <TableCell>
                    <Link
                      href={`/officer/business/${b.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate group-hover:underline">{b.name}</span>
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{b.licenseNumber}</p>
                  </TableCell>
                  <TableCell className="min-w-32">
                    <RiskScoreBar score={b.riskScore} />
                  </TableCell>
                  <TableCell>{b.district}</TableCell>
                  <TableCell className="hidden md:table-cell">{categoryLabel(b.category)}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(b.lastInspection)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.openComplaints > 0 ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {b.openComplaints}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <RiskBadge score={b.riskScore} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          {filtered.length} of {businesses.length} businesses · Scores recomputed by the explainable risk model
        </p>
      </CardContent>
    </Card>
  );
}
