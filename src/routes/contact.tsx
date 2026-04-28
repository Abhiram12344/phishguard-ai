import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, MessageSquare, User, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 chars").max(2000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — PhishGuard AI" },
      { name: "description", content: "Get in touch with the PhishGuard AI team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Thanks! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    }, 600);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <Toaster />
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Get in <span className="text-primary glow-text">touch</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Questions, partnerships, or false-positive reports — we'd love to hear from you.
        </p>
      </div>

      <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6 md:p-8">
        <Field icon={<User className="h-4 w-4" />} label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ada Lovelace"
            className="w-full bg-transparent py-2 outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field icon={<Mail className="h-4 w-4" />} label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-transparent py-2 outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field icon={<MessageSquare className="h-4 w-4" />} label="Message">
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Your message…"
            rows={5}
            className="w-full resize-none bg-transparent py-2 outline-none placeholder:text-muted-foreground/60"
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send message
        </button>
      </form>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="rounded-xl bg-background/40 px-4">{children}</div>
    </label>
  );
}
