import { createFileRoute, Link } from "@tanstack/react-router";
import { listScans, scanStats } from "@/server/scan.functions";
import { useState, useMemo } from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, Search, ScanSearch } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PhishGuard AI" },
      { name: "description", content: "Recent phishing scans, statistics, and history." },
    ],
  }),
  loader: async () => {
    const [{ scans }, stats] = await Promise.all([listScans(), scanStats()]);
    return { scans, stats };
  },
  component: DashboardPage,
});

const verdictBadge = {
  safe: { cls: "bg-safe/15 text-safe border-safe/40", Icon: ShieldCheck },
  suspicious: { cls: "bg-suspicious/15 text-suspicious border-suspicious/40", Icon: AlertTriangle },
  phishing: { cls: "bg-phishing/15 text-phishing border-phishing/40", Icon: ShieldAlert },
} as const;

function DashboardPage() {
  const { scans, stats } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "safe" | "suspicious" | "phishing">("all");

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      if (filter !== "all" && s.verdict !== filter) return false;
      if (query && !`${s.url} ${s.domain ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [scans, query, filter]);

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Threat <span className="text-primary glow-text">Dashboard</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Monitor scan activity and detected threats.</p>
        </div>
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          <ScanSearch className="h-4 w-4" /> New scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total scans" value={stats.total} tone="primary" />
        <Stat label="Safe" value={stats.safe} tone="safe" />
        <Stat label="Suspicious" value={stats.suspicious} tone="suspicious" />
        <Stat label="Phishing" value={stats.phishing} tone="phishing" />
      </div>

      {/* Chart */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scans (last 14 days)</h2>
          <span className="text-xs text-muted-foreground">{stats.byDay.length} days with activity</span>
        </div>
        {stats.byDay.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No scans yet — run your first scan.</p>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {stats.byDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-accent/80"
                  style={{ height: `${(d.count / maxDay) * 100}%`, boxShadow: "0 0 16px -4px oklch(0.82 0.16 195 / 0.5)" }}
                  title={`${d.day}: ${d.count}`}
                />
                <div className="font-mono text-[10px] text-muted-foreground">{d.day.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Scan history</h2>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex items-center gap-2 rounded-xl bg-background/40 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search URL or domain"
                className="bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-background/40 p-1">
              {(["all", "safe", "suspicious", "phishing"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No scans match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">URL</th>
                  <th className="pb-3">Verdict</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3 hidden md:table-cell">HTTPS</th>
                  <th className="pb-3 hidden md:table-cell">Age (d)</th>
                  <th className="pb-3 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const v = verdictBadge[s.verdict as keyof typeof verdictBadge];
                  return (
                    <tr key={s.id} className="border-t border-border/40 hover:bg-secondary/30">
                      <td className="max-w-[280px] truncate py-3 pr-3 font-mono text-xs">
                        <Link to="/scanner" search={{ url: s.url }} className="hover:text-primary">
                          {s.url}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${v.cls}`}>
                          <v.Icon className="h-3 w-3" /> {s.verdict}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-mono">{s.risk_score}</td>
                      <td className="py-3 pr-3 hidden md:table-cell">{s.https ? "✓" : "—"}</td>
                      <td className="py-3 pr-3 hidden md:table-cell">{s.domain_age_days ?? "—"}</td>
                      <td className="py-3 text-right text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "primary" | "safe" | "suspicious" | "phishing" }) {
  const color =
    tone === "primary" ? "var(--color-primary)" :
    tone === "safe" ? "var(--color-safe)" :
    tone === "suspicious" ? "var(--color-suspicious)" :
    "var(--color-phishing)";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
