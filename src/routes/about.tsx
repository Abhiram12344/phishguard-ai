import { createFileRoute } from "@tanstack/react-router";
import { Brain, Globe, Lock, ShieldCheck, Database, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — PhishGuard AI" },
      { name: "description", content: "How PhishGuard AI detects phishing using URL features, SSL checks, domain age, and AI reasoning." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          About <span className="text-primary glow-text">PhishGuard AI</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          A modern, AI-augmented phishing detector. We combine deterministic technical signals
          with a reasoning model so you understand <em>why</em> a URL is risky — not just a black-box score.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card icon={<Globe className="h-5 w-5" />} title="URL feature extraction">
          We parse the URL and inspect length, dot count, subdomain depth, suspicious characters
          (@, %, _, -), raw IP hosts, brand-impersonation keywords, suspicious TLDs, punycode,
          and known URL shorteners.
        </Card>
        <Card icon={<Lock className="h-5 w-5" />} title="SSL & reachability">
          We attempt a live HTTPS request to validate the TLS handshake, follow redirects, capture
          the final destination, and report the HTTP status.
        </Card>
        <Card icon={<Database className="h-5 w-5" />} title="Domain intelligence">
          We query the public RDAP registry to determine the registration date and age. Newly
          registered domains are a strong phishing signal.
        </Card>
        <Card icon={<Brain className="h-5 w-5" />} title="AI verdict">
          A reasoning model (via the Lovable AI Gateway) summarizes the technical signals into a
          plain-English explanation and three actionable security tips.
        </Card>
        <Card icon={<ShieldCheck className="h-5 w-5" />} title="Weighted risk score">
          Every signal contributes a weight — positive for risk, negative for trust. We sum and
          clamp to 0–100, then map to <strong>Safe</strong>, <strong>Suspicious</strong>, or <strong>Phishing</strong>.
        </Card>
        <Card icon={<Sparkles className="h-5 w-5" />} title="Privacy-first">
          We only store the URL you scanned plus the analysis. No accounts required, no tracking.
        </Card>
      </div>

      <div className="glass rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-semibold">Built with the modern web stack</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          React 19 · TanStack Start · TypeScript · Tailwind CSS v4 · Lovable Cloud · Lovable AI Gateway
        </p>
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
