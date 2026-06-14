-- Private `field-edition` Storage bucket — the entitlement plane's byte store
-- (license-workflow-v1.md §2). v1 holds the issued license files; later the
-- Q4_K_M weights move here off HuggingFace (the moat goes hard). NEVER public:
-- access is service-role only (the stripe-webhook signs short-lived download
-- URLs), the same deny-all posture as book-files + fe_entitlements.
--
-- storage.objects keeps RLS on with no policies for this bucket → anon/auth get
-- nothing; the service-role edge functions bypass RLS and createSignedUrl()
-- issues tokenized URLs that need no auth to download. Mirrors how book-files
-- already works.
insert into storage.buckets (id, name, public)
values ('field-edition', 'field-edition', false)
on conflict (id) do nothing;
