import Link from "next/link";
import {
  ShieldCheck,
  Radar,
  Activity,
  MapPinned,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  Building2,
  Landmark,
  Scale,
  PhoneCall,
  Mic,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Radar,
    title: "Predictive Risk Scoring",
    body: "Every registered business gets a live, explainable 0–100 Food Safety Risk Score computed from violations, complaints, inspection gaps, and document compliance.",
  },
  {
    icon: MapPinned,
    title: "District Heat Maps",
    body: "Colour-coded risk heat maps across Maharashtra districts, drillable into individual business records for field teams.",
  },
  {
    icon: Activity,
    title: "Outbreak Network Detection",
    body: "Rule-based heuristics group businesses by shared suppliers and geographic/temporal violation clusters to flag suspected outbreak networks early.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklist-Based Inspections",
    body: "Food Safety Officers complete FSSAI-style checklists, attach photos, and generate structured AI reports with recommended risk deltas.",
  },
  {
    icon: Megaphone,
    title: "Citizen Reporting",
    body: "Citizens report unsafe food with photos and map pinning, then track their complaint from submission through to resolution.",
  },
  {
    icon: Scale,
    title: "Transparent & Auditable",
    body: "The scoring model is a deterministic weighted function — every point can be explained to a regulator or challenged in public.",
  },
];

const ROLES = [
  {
    icon: Landmark,
    title: "Food Safety Officer",
    desc: "Command center with risk-ranked businesses, heat maps, scheduling and analytics, plus your prioritised inspection queue, checklists, photo evidence and AI reports.",
    href: "/login",
    demo: "officer@demo.in",
  },
  {
    icon: Megaphone,
    title: "Citizen",
    desc: "Report unsafe food, track complaints, and look up nearby business safety grades.",
    href: "/login",
    demo: "citizen@demo.in",
  },
  {
    icon: Building2,
    title: "Business Owner",
    desc: "See your safety grade, manage compliance documents, and get plain-language improvement tips.",
    href: "/login",
    demo: "owner@demo.in",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50">
            <ShieldCheck className="h-3.5 w-3.5" />
            Built for FSSAI & Maharashtra FDA · Prototype
            <span className="text-emerald-50/70">· मराठी · हिंदी · English</span>
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Prevent unsafe food before it reaches people.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">
            SafeBite replaces the reactive <em>Complaint → Inspection → Action</em> pipeline with a predictive{" "}
            <em>Predict Risk → Prioritize → Detect Networks → Prevent Outbreaks</em> model — surfacing the highest-risk
            businesses first, with every score explained.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
              <Link href="/login">
                Enter the Command Center <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="#roles">Explore roles</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-emerald-50/70">
            Demo credentials: officer@demo.in · citizen@demo.in · owner@demo.in — password{" "}
            <code className="rounded bg-white/10 px-1 py-0.5">demo1234</code>
          </p>
        </div>
      </section>

      {/* Tagline strip */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-4">
          {[
            ["2,400+", "businesses under watch"],
            ["40", "districts mapped for risk"],
            ["< 24h", "risk score refresh cycle"],
            ["100%", "explainable scoring"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl border bg-card p-5 text-center">
              <p className="text-3xl font-bold text-primary">{n}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">From reactive to predictive food safety</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            One platform that turns scattered complaints, inspections, lab results, and registration data into a single
            dynamic risk picture.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">A complaint reaches an officer in minutes</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            Three simple steps — modelled on the Maharashtra FDA grievance flow, rebuilt with live tracking, SLA clocks and
            automatic escalation.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Mic,
                step: "01",
                title: "Describe it",
                body: "Type or speak in Marathi, Hindi, or English. Add photos and pin the exact location on the map.",
              },
              {
                icon: Sparkles,
                step: "02",
                title: "AI structures & routes it",
                body: "Our explainable assistant classifies the complaint into points, assigns it to the right Food Safety Officer, and opens a 7-day SLA.",
              },
              {
                icon: UserCheck,
                step: "03",
                title: "Officer acts, you track",
                body: "The officer inspects and acts. You watch the status, the assigned officer, and any auto-escalation — in real time.",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="absolute right-4 top-4 font-mono text-3xl font-bold text-muted-foreground/15">{s.step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">One platform, three roles</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="flex flex-col rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{r.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{r.desc}</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={r.href}>
                    Try demo <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helpline band */}
      <section className="relative overflow-hidden border-t">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Prefer to talk to someone?</h3>
              <p className="text-sm text-emerald-50/80">
                Toll-free helpline <span className="font-semibold">1800-222-365</span> · 24×7, all days · Marathi, Hindi
                and English
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
            <Link href="/login">
              Report an issue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">SafeBite</span>
            <span>· Hackathon prototype</span>
          </div>
          <p>Demo data is mocked. Not a government system.</p>
          <Link href="/judges-guide" className="font-medium text-primary hover:underline">
            Judges' guide to the charts
          </Link>
        </div>
      </footer>
    </div>
  );
}
