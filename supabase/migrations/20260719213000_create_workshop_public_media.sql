-- Public, immutable workshop previews and captions.
-- Paid lesson access remains private and token-gated through workshop-files.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'workshop-public',
  'workshop-public',
  true,
  52428800,
  array['video/mp4', 'text/vtt', 'text/markdown', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
