-- Allow administrator-uploaded PDF documents in the public site-media bucket.
-- Apply this migration in the Supabase SQL Editor or through the project's migration workflow.
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/avif',
      'application/pdf'
    ]
where id = 'site-media';
