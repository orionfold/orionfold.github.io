-- The operator-approved long-form workshop showcase master is approximately
-- 120 MiB. Keep the public bucket limited to the accepted media types while
-- allowing that immutable source master to be served without recompression.
update storage.buckets
set
  public = true,
  file_size_limit = 157286400,
  allowed_mime_types = array['video/mp4', 'text/vtt', 'text/markdown', 'image/png']
where id = 'workshop-public';
