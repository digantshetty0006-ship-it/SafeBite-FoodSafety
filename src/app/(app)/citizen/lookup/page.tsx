import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LookupResults } from "@/components/citizen/lookup-results";

export default async function CitizenLookupPage() {
  await requireRole("citizen");

  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      district: true,
      category: true,
      address: true,
      riskScore: true,
      riskTier: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Safety Lookup</h1>
        <p className="text-sm text-muted-foreground">
          Search registered food businesses and view their public safety grade. Grades hide the exact score to keep the
          system fair — A is best, D needs attention.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find a business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, district, or category…" className="pl-8" />
          </div>
        </CardContent>
      </Card>

      <LookupResults businesses={businesses} />
    </div>
  );
}
