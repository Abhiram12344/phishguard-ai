import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ScanSearch, Loader2, Radar } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { scanUrl } from "@/server/scan.functions";
import { ResultPanel, type ScanResult } from "@/components/ResultPanel";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const search = z.object({ url: z.string().optional() });

export const Route = createFileRoute("/scanner")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "URL Scanner — PhishGuard AI" },
      { name: "description", content: "Paste any URL and get an instant phishing risk verdict." },
    ],
  }),
  component: ScannerPage,
});

function ScannerPage() {
  const navigate = useNavigate();
  const { url: urlParam } = useSearch({ from: "/scanner" });
  const [url, setUrl] = useState(urlParam || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const scan = useServerFn(scanUrl);

  async function runScan(target: string) {
    if (!target.trim()) {
      toast.error("Please enter a URL to scan.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = (await scan({ data: { url: target.trim() } })) as unknown as ScanResult;
      setResult(res);
      navigate({ to: "/scanner", search: { url: target.trim() }, replace: true });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (urlParam && !result && !loading) {
      runScan(urlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      <Toaster />
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          URL <span className="text-primary glow-text">Scanner</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Paste a link to analyze its safety with AI + technical checks.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runScan(url);
        }}
        className="glass relative overflow-hidden rounded-3xl p-3 md:p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-background/40 px-4">
            <Radar className="h-5 w-5 text-primary" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent py-4 font-mono text-sm outline-none placeholder:text-muted-foreground/60 md:text-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 font-semibold text-primary-foreground shadow-[0_0_24px_-6px_oklch(0.82_0.16_195/0.7)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" /> Analyze Website
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
            <div className="animate-scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
        )}
      </form>

      {!result && !loading && (
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          {["https://github.com", "http://amaz0n-secure-login.xyz", "http://192.168.1.1/login"].map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setUrl(ex);
                runScan(ex);
              }}
              className="glass rounded-2xl px-4 py-3 text-left font-mono text-xs text-muted-foreground transition hover:text-foreground"
            >
              Try: {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="glass animate-pulse-glow rounded-3xl p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Running URL feature extraction, SSL probing, domain lookup, and AI analysis…
          </p>
        </div>
      )}

      {result && <ResultPanel result={result} />}
    </div>
  );
}
