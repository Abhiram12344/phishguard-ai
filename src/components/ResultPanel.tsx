import { ShieldCheck, AlertTriangle, ShieldAlert, Globe, Lock, Calendar, Sparkles, ExternalLink } from "lucide-react";

export type Reason = { label: string; severity: "info" | "warn" | "danger"; weight: number };

export type ScanResult = {
  id: string | null;
  url: string;
  domain: string;
  verdict: "safe" | "suspicious" | "phishing";
  risk_score: number;
  reasons: Reason[];
  ssl: { ssl_valid: boolean | null; status: number | null; finalUrl: string | null; redirected: boolean; error: string | null };
  domain_info: { ageDays: number | null; created: string | null };
  features: Record<string, unknown>;
  ai_summary: string | null;
  ai_tips: string[] | null;
  created_at: string;
};

const verdictMeta = {
  safe: { label: "Safe", color: "safe", icon: ShieldCheck, glow: "shadow-[0_0_40px_-8px_oklch(0.78_0.18_150/0.6)]" },
  suspicious: { label: "Suspicious", color: "suspicious", icon: AlertTriangle, glow: "shadow-[0_0_40px_-8px_oklch(0.82_0.17_85/0.6)]" },
  phishing: { label: "Phishing", color: "phishing", icon: ShieldAlert, glow: "shadow-[0_0_40px_-8px_oklch(0.66_0.24_25/0.7)]" },
} as const;

function severityClass(s: Reason["severity"]) {
  if (s === "danger") return "border-phishing/40 bg-phishing/10 text-phishing";
  if (s === "warn") return "border-suspicious/40 bg-suspicious/10 text-suspicious";
  return "border-safe/30 bg-safe/10 text-safe";
}

export function ResultPanel({ result }: { result: ScanResult }) {
  const meta = verdictMeta[result.verdict];
  const Icon = meta.icon;
  const colorVar = `var(--color-${meta.color})`;

  return (
    <div className="animate-float-up space-y-6">
      {/* Verdict header */}
      <div className={`glass rounded-3xl p-6 md:p-8 ${meta.glow}`}>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${colorVar}22`, color: colorVar, boxShadow: `0 0 30px -8px ${colorVar}` }}
            >
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Verdict</div>
              <div className="text-3xl font-bold" style={{ color: colorVar }}>
                {meta.label}
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                {result.url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Risk meter */}
          <div className="w-full md:w-72">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Risk Score</span>
              <span className="font-mono text-2xl font-bold" style={{ color: colorVar }}>
                {result.risk_score}
                <span className="text-sm text-muted-foreground">/100</span>
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${result.risk_score}%`,
                  background: `linear-gradient(90deg, var(--color-safe), var(--color-suspicious), var(--color-phishing))`,
                  boxShadow: `0 0 16px ${colorVar}`,
                }}
              />
            </div>
          </div>
        </div>

        {result.ai_summary && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground/90">{result.ai_summary}</p>
          </div>
        )}
      </div>

      {/* Indicators grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          icon={<Lock className="h-4 w-4" />}
          label="SSL / HTTPS"
          value={result.ssl.ssl_valid ? "Valid" : result.ssl.ssl_valid === false ? "Invalid" : "Unknown"}
          tone={result.ssl.ssl_valid ? "safe" : result.ssl.ssl_valid === false ? "phishing" : "muted"}
          sub={result.ssl.status ? `HTTP ${result.ssl.status}` : result.ssl.error || "—"}
        />
        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Domain age"
          value={result.domain_info.ageDays !== null ? `${result.domain_info.ageDays} days` : "Unknown"}
          tone={
            result.domain_info.ageDays === null
              ? "muted"
              : result.domain_info.ageDays < 30
                ? "phishing"
                : result.domain_info.ageDays < 180
                  ? "suspicious"
                  : "safe"
          }
          sub={result.domain_info.created ? new Date(result.domain_info.created).toLocaleDateString() : "—"}
        />
        <InfoCard
          icon={<Globe className="h-4 w-4" />}
          label="Domain"
          value={result.domain}
          tone="muted"
          sub={result.ssl.redirected ? `→ ${result.ssl.finalUrl}` : "No redirect"}
        />
      </div>

      {/* Reasons */}
      <div className="glass rounded-3xl p-6">
        <h3 className="mb-4 text-lg font-semibold">Detected indicators</h3>
        <div className="space-y-2">
          {result.reasons.map((r, i) => (
            <div
              key={i}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${severityClass(r.severity)}`}
            >
              <span>{r.label}</span>
              <span className="font-mono text-xs opacity-75">
                {r.weight > 0 ? `+${r.weight}` : r.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {result.ai_tips && result.ai_tips.length > 0 && (
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Security tips
          </h3>
          <ul className="space-y-2">
            {result.ai_tips.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-right text-xs text-muted-foreground">
        Scanned {new Date(result.created_at).toLocaleString()}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "safe" | "suspicious" | "phishing" | "muted";
}) {
  const color =
    tone === "safe" ? "var(--color-safe)" : tone === "suspicious" ? "var(--color-suspicious)" : tone === "phishing" ? "var(--color-phishing)" : "var(--color-muted-foreground)";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 truncate font-display text-xl font-semibold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
