-- Heart to Heart 111: Supabase security hardening
-- Run in Supabase SQL Editor

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert readings" ON public.readings;
DROP POLICY IF EXISTS "Anyone can select readings by txid" ON public.readings;

CREATE POLICY "Anyone can insert readings"
  ON public.readings FOR INSERT
  WITH CHECK (true);

REVOKE SELECT ON TABLE public.readings FROM anon;

CREATE OR REPLACE FUNCTION public.get_reading_by_txid(p_txid text)
RETURNS TABLE (
  txid text,
  question text,
  category text,
  trinket text,
  spread integer,
  cards jsonb,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.txid, r.question, r.category, r.trinket, r.spread, r.cards, r.created_at
  FROM public.readings r
  WHERE r.txid = p_txid
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_reading_by_txid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reading_by_txid(text) TO anon;
