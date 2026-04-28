import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ScanSearch, Brain, Lock, Globe, Activity, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhishGuard AI — Detect phishing sites instantly" },
      {
        name: "description",
        content:
          "PhishGuard AI uses URL analysis, SSL checks, domain intelligence, and AI to flag phishing websites in seconds.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="pt-6 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          AI-powered phishing scanner
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Detect{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            phishing websites
          </span>
          <br /> before they steal your data.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Paste any URL and PhishGuard AI runs deep technical checks — URL features, SSL
          validity, domain age, and an AI verdict — in seconds.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/scanner"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground shadow-[0_0_30px_-8px_oklch(0.82_0.16_195/0.7)] transition hover:opacity-90"
          >
            <ScanSearch className="h-5 w-5" /> Scan URL Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-6 py-3 font-medium text-foreground hover:bg-secondary"
          >
            <Activity className="h-4 w-4" /> View dashboard
          </Link>
        </div>

        {/* Floating mock card */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="glass animate-pulse-glow rounded-3xl p-6 text-left">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-phishing/20 text-phishing">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Live scan</div>
                <div className="font-mono text-sm">http://amaz0n-secure-login.xyz</div>
              </div>
              <div className="rounded-full bg-phishing/20 px-3 py-1 text-xs font-semibold text-phishing">
                PHISHING · 94
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Indicator label="No HTTPS" tone="phishing" />
              <Indicator label="Brand keyword" tone="suspicious" />
              <Indicator label="New domain" tone="phishing" />
              <Indicator label="Suspicious TLD" tone="suspicious" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built like a real <span className="text-primary glow-text">security tool</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every scan combines deterministic signals with an AI risk assessment.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Feature
            icon={<Globe className="h-5 w-5" />}
            title="URL intelligence"
            text="Length, subdomains, IP hosts, special chars, brand impersonation, suspicious TLDs."
          />
          <Feature
            icon={<Lock className="h-5 w-5" />}
            title="SSL & reachability"
            text="HTTPS enforcement, certificate validity, redirects, response status."
          />
          <Feature
            icon={<Brain className="h-5 w-5" />}
            title="AI verdict"
            text="A reasoning model summarizes signals into a plain-English risk verdict and tips."
          />
        </div>
      </section>
    </div>
  );
}

function Indicator({ label, tone }: { label: string; tone: "safe" | "suspicious" | "phishing" }) {
  const color = tone === "safe" ? "var(--color-safe)" : tone === "suspicious" ? "var(--color-suspicious)" : "var(--color-phishing)";
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs"
      style={{ borderColor: `${color}55`, color, background: `${color}15` }}
    >
      {label}
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="glass group rounded-3xl p-6 transition hover:border-primary/40">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
