CREATE TABLE public.waitlist (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  confirmed     boolean NOT NULL DEFAULT false,
  confirm_token uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  confirmed_at  timestamptz,
  ip_address    text,
  user_agent    text
);

CREATE INDEX idx_waitlist_confirm_token ON public.waitlist (confirm_token) WHERE confirm_token IS NOT NULL;
CREATE INDEX idx_waitlist_confirmed ON public.waitlist (confirmed, created_at DESC);

-- Enable RLS with NO policies = deny all for anon/authenticated.
-- The edge function uses the service role key to bypass RLS.
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
