
# Infi Project - Core Framework Documentation

... (giữ nguyên các phần trên) ...

### Full Schema: Tạo bảng Tracked Channels hoàn chỉnh
```sql
create table if not exists public.tracked_channels (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  custom_url text,
  thumbnail_url text,
  subscriber_count text,
  view_count text,
  video_count text,
  published_at timestamptz,
  uploads_playlist_id text,
  history jsonb default '[]'::jsonb,
  newest_video jsonb,
  oldest_video jsonb,
  status text default 'active',
  added_at timestamptz default now(),
  last_refreshed_at timestamptz,
  -- Trạng thái Monetized và Engagement
  monetization_status text default 'not_monetized',
  engagement_status text default 'good'
);
alter table public.tracked_channels enable row level security;
create policy "Users can manage own channels" on tracked_channels for all using (auth.uid() = user_id);
```

... (giữ nguyên phần còn lại) ...
