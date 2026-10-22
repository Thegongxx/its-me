-- Private by design: unpublishing a record also prevents anonymous image reads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('project-media','project-media',false,6291456,array['image/webp'])
on conflict(id) do update set public=false, file_size_limit=6291456, allowed_mime_types=array['image/webp'];

create policy published_media_read on storage.objects for select to anon, authenticated using (
  bucket_id='project-media' and exists (
    select 1 from public.entries e where e.id::text=split_part(name,'/',1) and e.status='published'
  )
);
create policy admin_media_read on storage.objects for select to authenticated using (bucket_id='project-media' and (select public.is_admin()));
create policy admin_media_upload on storage.objects for insert to authenticated with check (
  bucket_id='project-media' and (select public.is_admin()) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  and exists(select 1 from public.entries e where e.id::text=split_part(name,'/',1))
);
create policy admin_media_delete on storage.objects for delete to authenticated using (bucket_id='project-media' and (select public.is_admin()));
