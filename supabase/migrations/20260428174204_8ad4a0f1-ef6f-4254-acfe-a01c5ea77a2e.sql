
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  domain text,
  verdict text NOT NULL CHECK (verdict IN ('safe','suspicious','phishing')),
  risk_score int NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ssl_valid boolean,
  ssl_issuer text,
  ssl_expires_at timestamptz,
  https boolean,
  domain_age_days int,
  ip_resolved text,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scans_created_at_idx ON public.scans (created_at DESC);
CREATE INDEX scans_verdict_idx ON public.scans (verdict);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scans"
  ON public.scans FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scans"
  ON public.scans FOR INSERT
  WITH CHECK (true);
