import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ScanInput = z.object({
  url: z.string().trim().min(4).max(2048),
});

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
  "rebrand.ly", "cutt.ly", "shorte.st", "adf.ly", "bl.ink", "lnkd.in", "rb.gy",
]);

const BRAND_KEYWORDS = [
  "paypal", "apple", "amazon", "amaz0n", "microsoft", "micros0ft", "google",
  "facebook", "instagram", "netflix", "bank", "secure", "login", "verify",
  "account", "update", "wallet", "signin", "support",
];

const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "country", "work",
  "rest", "fit", "loan", "men", "icu",
]);

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function isIpHost(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[?[0-9a-f:]+\]?$/i.test(host) && host.includes(":");
}

function getRegistrableDomain(host: string): string {
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

type Reason = { label: string; severity: "info" | "warn" | "danger"; weight: number };

function analyzeUrlFeatures(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  const host = parsed.hostname.toLowerCase();
  const fullUrl = parsed.toString();
  const reasons: Reason[] = [];

  const length = fullUrl.length;
  const dots = (host.match(/\./g) || []).length;
  const subdomains = Math.max(0, host.split(".").length - 2);
  const hasAt = fullUrl.includes("@");
  const hasDash = host.includes("-");
  const hasPercent = fullUrl.includes("%");
  const hasUnderscore = host.includes("_");
  const ipHost = isIpHost(host);
  const tld = host.split(".").pop() || "";
  const isShort = SHORTENERS.has(host);
  const https = parsed.protocol === "https:";
  const punycode = host.includes("xn--");
  const portPresent = !!parsed.port;
  const lowered = fullUrl.toLowerCase();
  const brandHits = BRAND_KEYWORDS.filter((k) => lowered.includes(k));
  const registrable = getRegistrableDomain(host);

  if (length > 75) reasons.push({ label: `URL is unusually long (${length} chars)`, severity: "warn", weight: 8 });
  if (dots >= 4) reasons.push({ label: `Many dots in hostname (${dots})`, severity: "warn", weight: 8 });
  if (subdomains >= 3) reasons.push({ label: `Excessive subdomains (${subdomains})`, severity: "warn", weight: 10 });
  if (hasAt) reasons.push({ label: "URL contains '@' (credential trick)", severity: "danger", weight: 25 });
  if (hasDash) reasons.push({ label: "Hyphen in hostname", severity: "info", weight: 4 });
  if (hasPercent) reasons.push({ label: "Percent-encoded characters in URL", severity: "warn", weight: 6 });
  if (hasUnderscore) reasons.push({ label: "Underscore in hostname (non-standard)", severity: "warn", weight: 5 });
  if (ipHost) reasons.push({ label: "Uses raw IP address instead of domain", severity: "danger", weight: 25 });
  if (isShort) reasons.push({ label: `Shortened URL (${host}) — destination is hidden`, severity: "warn", weight: 12 });
  if (!https) reasons.push({ label: "No HTTPS — traffic is not encrypted", severity: "danger", weight: 20 });
  if (SUSPICIOUS_TLDS.has(tld)) reasons.push({ label: `Suspicious TLD .${tld}`, severity: "warn", weight: 12 });
  if (punycode) reasons.push({ label: "Punycode hostname (possible homograph attack)", severity: "danger", weight: 20 });
  if (portPresent) reasons.push({ label: `Non-standard port :${parsed.port}`, severity: "warn", weight: 6 });
  if (brandHits.length > 0) {
    reasons.push({
      label: `Brand keyword in URL (${brandHits.join(", ")}) — verify it is the official domain`,
      severity: "warn",
      weight: 14,
    });
  }

  return {
    parsed,
    host,
    registrable,
    https,
    features: { length, dots, subdomains, hasAt, hasDash, hasPercent, hasUnderscore, ipHost, isShort, https, tld, punycode, portPresent, brandHits },
    reasons,
  };
}

async function fetchSslAndReachability(url: URL) {
  const result: {
    reachable: boolean;
    status: number | null;
    finalUrl: string | null;
    redirected: boolean;
    ssl_valid: boolean | null;
    ssl_issuer: string | null;
    ssl_expires_at: string | null;
    error: string | null;
  } = {
    reachable: false,
    status: null,
    finalUrl: null,
    redirected: false,
    ssl_valid: null,
    ssl_issuer: null,
    ssl_expires_at: null,
    error: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "PhishGuard-AI/1.0 (+scanner)" },
    });
    clearTimeout(timeout);
    result.reachable = true;
    result.status = res.status;
    result.finalUrl = res.url;
    result.redirected = res.redirected;
    if (res.url.startsWith("https://")) {
      // If fetch succeeded over https without throwing, the cert was accepted by the runtime.
      result.ssl_valid = true;
    } else {
      result.ssl_valid = false;
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    if (url.protocol === "https:") result.ssl_valid = false;
  }

  return result;
}

async function fetchDomainAge(domain: string): Promise<{ created: string | null; ageDays: number | null; source: string | null }> {
  // Use a free RDAP endpoint (no auth needed). Works for most TLDs.
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    clearTimeout(t);
    if (!res.ok) return { created: null, ageDays: null, source: null };
    const data: any = await res.json();
    const events: any[] = data.events || [];
    const reg = events.find((e) => e.eventAction === "registration");
    if (!reg?.eventDate) return { created: null, ageDays: null, source: "rdap" };
    const created = new Date(reg.eventDate);
    const ageDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
    return { created: created.toISOString(), ageDays, source: "rdap" };
  } catch {
    return { created: null, ageDays: null, source: null };
  }
}

async function aiVerdict(payload: any): Promise<{ summary: string; tips: string[] } | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are PhishGuard AI, a cybersecurity analyst. Given technical signals about a URL, return a concise plain-English summary (2-3 sentences) and 3 actionable security tips for the user. Do NOT invent facts beyond the signals provided.",
          },
          { role: "user", content: `Signals JSON:\n${JSON.stringify(payload).slice(0, 3500)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report",
              description: "Return phishing analysis summary and tips.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  tips: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
                },
                required: ["summary", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data: any = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    return { summary: String(parsed.summary || ""), tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [] };
  } catch {
    return null;
  }
}

export const scanUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ScanInput.parse(data))
  .handler(async ({ data }) => {
    const { parsed, host, registrable, https, features, reasons } = analyzeUrlFeatures(data.url);

    // Prefer https for live checks if user typed bare domain
    const checkUrl = new URL(parsed.toString());
    if (!/^https?:/.test(parsed.protocol)) checkUrl.protocol = "https:";

    const [ssl, domainInfo] = await Promise.all([
      fetchSslAndReachability(parsed),
      fetchDomainAge(registrable),
    ]);

    const allReasons = [...reasons];

    if (ssl.error && parsed.protocol === "https:") {
      allReasons.push({ label: `SSL/connection issue: ${ssl.error}`, severity: "danger", weight: 18 });
    }
    if (ssl.status && ssl.status >= 400) {
      allReasons.push({ label: `Server returned HTTP ${ssl.status}`, severity: "warn", weight: 6 });
    }
    if (ssl.redirected && ssl.finalUrl) {
      try {
        const finalHost = new URL(ssl.finalUrl).hostname;
        if (getRegistrableDomain(finalHost) !== registrable) {
          allReasons.push({
            label: `Redirects to a different domain (${finalHost})`,
            severity: "warn",
            weight: 12,
          });
        }
      } catch { /* ignore */ }
    }

    if (domainInfo.ageDays !== null) {
      if (domainInfo.ageDays < 30) allReasons.push({ label: `Very new domain (${domainInfo.ageDays} days old)`, severity: "danger", weight: 22 });
      else if (domainInfo.ageDays < 180) allReasons.push({ label: `Recently registered domain (${domainInfo.ageDays} days)`, severity: "warn", weight: 12 });
      else allReasons.push({ label: `Established domain (${Math.round(domainInfo.ageDays / 365)} years old)`, severity: "info", weight: -10 });
    } else {
      allReasons.push({ label: "Domain registration data unavailable", severity: "info", weight: 4 });
    }

    if (https && ssl.ssl_valid) {
      allReasons.push({ label: "HTTPS connection succeeded with valid certificate", severity: "info", weight: -8 });
    }

    // Score
    let score = allReasons.reduce((s, r) => s + r.weight, 0);
    score = Math.max(0, Math.min(100, score));

    let verdict: "safe" | "suspicious" | "phishing";
    if (score >= 60) verdict = "phishing";
    else if (score >= 30) verdict = "suspicious";
    else verdict = "safe";

    const aiPayload = {
      url: parsed.toString(),
      host,
      registrable,
      verdict,
      risk_score: score,
      features,
      ssl,
      domain: domainInfo,
      reasons: allReasons.map((r) => r.label),
    };

    const ai = await aiVerdict(aiPayload);

    const insert = {
      url: parsed.toString(),
      domain: registrable,
      verdict,
      risk_score: score,
      reasons: allReasons,
      ssl_valid: ssl.ssl_valid,
      ssl_issuer: ssl.ssl_issuer,
      ssl_expires_at: ssl.ssl_expires_at,
      https,
      domain_age_days: domainInfo.ageDays,
      ip_resolved: null,
      analysis: { features, ssl, domain: domainInfo, finalUrl: ssl.finalUrl },
      ai_summary: ai?.summary || null,
    };

    const { data: row, error } = await supabaseAdmin
      .from("scans")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("scan insert error", error);
    }

    return {
      id: row?.id || null,
      url: parsed.toString(),
      domain: registrable,
      verdict,
      risk_score: score,
      reasons: allReasons,
      ssl,
      domain_info: domainInfo,
      features,
      ai_summary: ai?.summary || null,
      ai_tips: ai?.tips || null,
      created_at: row?.created_at || new Date().toISOString(),
    };
  });

export const listScans = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("scans")
    .select("id,url,domain,verdict,risk_score,https,domain_age_days,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listScans error", error);
    return { scans: [] };
  }
  return { scans: data || [] };
});

export const scanStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("scans")
    .select("verdict,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return { total: 0, safe: 0, suspicious: 0, phishing: 0, byDay: [] as { day: string; count: number }[] };
  const counts = { total: data.length, safe: 0, suspicious: 0, phishing: 0 };
  const dayMap = new Map<string, number>();
  for (const r of data) {
    counts[r.verdict as "safe" | "suspicious" | "phishing"]++;
    const day = r.created_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }
  const byDay = Array.from(dayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-14)
    .map(([day, count]) => ({ day, count }));
  return { ...counts, byDay };
});
