import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Gauge, BarChart3, PieChart, Activity, Layers, Link2, Map, Timer, FileSearch } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

export function AnalyticsGuide({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);

  const GUIDE: { icon: React.ElementType; title: string; one: string }[] = [
    { icon: Activity, title: t("an.inspectionActivity"), one: t("an.activityHint") },
    { icon: BarChart3, title: t("an.complaintsByCategory"), one: t("an.g2") },
    { icon: Gauge, title: t("an.avgRiskByDistrict"), one: t("an.g3") },
    { icon: PieChart, title: t("an.riskLevelDist"), one: t("an.g4") },
    { icon: Layers, title: t("an.severityByDistrict"), one: t("an.g5") },
    { icon: Link2, title: t("an.networksTitle"), one: t("an.g6") },
    { icon: Map, title: t("an.g7t"), one: t("an.g7") },
    { icon: Timer, title: t("an.g8t"), one: t("an.g8") },
  ];

  const SUPPLIER_STORY = [
    { step: "1", title: t("an.s1t"), body: t("an.s1b") },
    { step: "2", title: t("an.s2t"), body: t("an.s2b") },
    { step: "3", title: t("an.s3t"), body: t("an.s3b") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">{t("an.howToRead")}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GUIDE.map((g) => (
          <Card key={g.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <g.icon className="h-4 w-4 shrink-0 text-primary" /> {g.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">{g.one}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-300 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSearch className="h-5 w-5 text-emerald-600" /> {t("an.storyTitle")}
          </CardTitle>
          <CardDescription>
            {t("an.storyDesc")}
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
            <Badge variant="outline">{t("an.prototypeHonesty")}</Badge>
            {t("an.honesty")}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Scale className="h-4 w-4" />
        {t("an.walkthrough")}{" "}
        <a href="/judges-guide" className="font-medium text-primary hover:underline">
          {t("an.judgesGuide")}
        </a>
      </div>
    </div>
  );
}