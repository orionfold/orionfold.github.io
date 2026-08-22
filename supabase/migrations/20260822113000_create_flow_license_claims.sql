-- fe_license_claims — the bridge between a completed Flow Pro checkout and the
-- licence the Mac app ends up holding.
--
-- WHY THIS TABLE EXISTS. Before it, a Flow licence reached a buyer as a .json
-- file attached to an email, which they imported by hand. As the FIRST thing a
-- paying customer does, that is a poor experience and an obvious drop-off point.
-- This table lets the app collect the licence itself.
--
-- TWO PATHS READ FROM IT, and the ordering is the design:
--   FLOOR  the app polls flow-license-refresh with the checkout session id.
--          Always works, including a phone checkout or a browser that blocks
--          app handoffs.
--   FAST   the success page offers a deep link carrying a claim, and the app is
--          licensed on arrival.
-- The fast path sits on top of the floor, so a failed deep link costs nothing:
-- the app is already polling.
--
-- ONLY A DIGEST IS STORED, never the claim itself. A stolen dump therefore
-- yields nothing redeemable. The raw claim exists only in the success URL, is
-- single use, is bound to one checkout session, and expires in minutes.
create table if not exists public.fe_license_claims (
  id uuid primary key default gen_random_uuid(),

  -- SHA-256 of the claim, hex. Unique because a claim names exactly one
  -- purchase, and a collision would mean handing one buyer another's licence.
  claim_digest text not null unique,

  -- The checkout this claim belongs to. Unique so a session cannot accumulate
  -- claims, and indexed because the polling floor looks up by exactly this.
  stripe_session_id text not null unique,

  -- Which SKU was bought. Kept for support and for reconciling against the
  -- catalog without a Stripe round trip.
  lookup_key text not null,

  -- Set by the webhook once the licence row exists. Null means "checkout started
  -- but no licence yet", which is the state the app polls through.
  license_id text,

  -- Set when the claim is redeemed. NON-NULL MEANS SPENT: the redeeming query
  -- checks this, so a replayed deep link gets nothing.
  redeemed_at timestamptz,

  -- Hard expiry, written at mint time. Checked on redemption rather than
  -- trusted from the caller. Fifteen minutes by default, chosen so a Stripe
  -- webhook RETRY after a transient failure still lands inside the window; a
  -- sixty second window would turn a recoverable delay into a buyer holding a
  -- receipt and no licence.
  expires_at timestamptz not null,

  created_at timestamptz not null default now()
);

-- The polling floor's lookup. The unique constraint already indexes
-- stripe_session_id; this covers the webhook's write path, which resolves a
-- claim from the digest it carried through Stripe metadata.
create index if not exists fe_license_claims_digest_idx
  on public.fe_license_claims (claim_digest);

-- Sweeping expired, unredeemed claims is a maintenance concern, and this index
-- is what makes that sweep cheap.
create index if not exists fe_license_claims_expiry_idx
  on public.fe_license_claims (expires_at)
  where redeemed_at is null;

-- RLS ON WITH NO POLICIES. Every reader and writer of this table is an edge
-- function using the service role, which bypasses RLS. No browser and no signed
-- in user has any business reading it, and a table of purchase identifiers is
-- exactly the kind of thing that must not become world readable by omission.
alter table public.fe_license_claims enable row level security;

comment on table public.fe_license_claims is
  'Bridges a completed Flow Pro checkout to the issued licence. Stores only a digest of the single-use, short-lived, session-bound claim. Service role only.';
