
DROP POLICY IF EXISTS "Anyone can insert scans" ON public.scans;
-- No INSERT policy: service-role bypasses RLS in the server function.
