insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets','store-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view store assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'store-assets');

create policy "Store managers can upload assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'store-assets'
  and array_length(storage.foldername(name),1) >= 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_store_manager(((storage.foldername(name))[1])::uuid)
);

create policy "Store managers can update assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'store-assets'
  and array_length(storage.foldername(name),1) >= 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_store_manager(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'store-assets'
  and array_length(storage.foldername(name),1) >= 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_store_manager(((storage.foldername(name))[1])::uuid)
);

create policy "Store managers can delete assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'store-assets'
  and array_length(storage.foldername(name),1) >= 1
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_store_manager(((storage.foldername(name))[1])::uuid)
);
