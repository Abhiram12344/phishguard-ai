import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-border/50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>PhishGuard AI — Intelligent Phishing Detection</span>
        </div>
        <div>© {new Date().getFullYear()} PhishGuard. Built for safer browsing.</div>
      </div>
    </footer>
  );
}
