-- HAVEN OS DATABASE SCHEMA (v1.4)
-- Consolidated for Phase 7: The Producer

-- ==========================================
-- 0. VECTOR EXTENSION (Semantic Search)
-- ==========================================

-- Enable pgvector extension (idempotent)
create extension if not exists vector;

-- ==========================================
-- 0.1 CONTENT CALENDAR (Phase 6)
-- ==========================================

-- Add scheduled_at column (idempotent)
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'assets' 
        and column_name = 'scheduled_at'
    ) then
        alter table public.assets add column scheduled_at timestamptz;
    end if;
end $$;

-- Add publication_status column (idempotent)
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'assets' 
        and column_name = 'publication_status'
    ) then
        alter table public.assets add column publication_status text default 'draft' 
            check (publication_status in ('draft', 'scheduled', 'published'));
    end if;
end $$;

-- ==========================================
-- 0.2 WORKFLOW TEMPLATES (Phase 7)
-- ==========================================

-- Workflow templates table for project management
CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    description text,
    stages jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz DEFAULT now()
);

-- RLS Policy for workflow_templates
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own templates" ON public.workflow_templates;
CREATE POLICY "Users can manage their own templates" ON public.workflow_templates 
    FOR ALL USING (auth.uid() = user_id);

-- Add embedding column to assets table (idempotent)
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'assets' 
        and column_name = 'embedding'
    ) then
        alter table public.assets add column embedding vector(768);
    end if;
end $$;

-- Create vector similarity index (idempotent)
do $$
begin
    if not exists (
        select 1 from pg_indexes 
        where schemaname = 'public' 
        and tablename = 'assets' 
        and indexname = 'assets_embedding_idx'
    ) then
        create index assets_embedding_idx on public.assets 
        using ivfflat (embedding vector_cosine_ops) with (lists = 100);
    end if;
exception
    when others then
        -- Index creation may fail if not enough rows, that's ok
        raise notice 'Index creation skipped: %', SQLERRM;
end $$;

-- Vector similarity search function (idempotent)
create or replace function match_assets(
    query_embedding vector(768),
    match_threshold float default 0.3,
    match_count int default 20,
    user_id_filter uuid default null
)
returns table (
    id uuid,
    type text,
    filename text,
    public_url text,
    storage_path text,
    metadata jsonb,
    created_at timestamptz,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select 
        a.id,
        a.type,
        a.filename,
        a.public_url,
        a.storage_path,
        a.metadata,
        a.created_at,
        1 - (a.embedding <=> query_embedding) as similarity
    from public.assets a
    where 
        a.embedding is not null
        and a.user_id = user_id_filter
        and 1 - (a.embedding <=> query_embedding) > match_threshold
    order by a.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- ==========================================
-- 1. STORAGE CONFIGURATION
-- ==========================================

-- Create Storage Bucket 'vault' (If not exists)
insert into storage.buckets (id, name, public) 
values ('vault', 'vault', true)
on conflict (id) do nothing;

-- Policy: Authenticated users can upload to their own folder (user_id/filename)
drop policy if exists "Users can upload own files" on storage.objects;
create policy "Users can upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vault' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can view files in their own folder
drop policy if exists "Users can view own files" on storage.objects;
create policy "Users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vault' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- 2. TABLES
-- ==========================================

-- A. Assets Table (Permanent categorized files)
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null,
  storage_path text, -- Nullable for 'note' type
  public_url text,   -- Nullable for 'note' type
  filename text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Idempotent check constraint for assets type
do $$ 
begin
    alter table public.assets drop constraint if exists assets_type_check;
    alter table public.assets add constraint assets_type_check check (type in ('image', 'video', 'document', 'link', 'note'));
exception
    when others then null;
end $$;

-- B. Staging Items Table (Staging Funnel / Chat UI)
create table if not exists public.staging_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('text', 'link', 'file')) not null,
  content text, 
  asset_id uuid references public.assets(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  is_categorized boolean default false,
  categorized_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lifecycle_state text default 'fresh' check (lifecycle_state in ('fresh', 'aging', 'archived')),
  archived_at timestamp with time zone,
  last_interacted_at timestamp with time zone default timezone('utc'::text, now())
);

-- C. Archived Items Table (Phase 4: The Curator)
create table if not exists public.archived_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_staging_id uuid,
  type text check (type in ('text', 'link', 'file')) not null,
  content text,
  asset_id uuid references public.assets(id) on delete cascade,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

alter table public.assets enable row level security;
alter table public.staging_items enable row level security;
alter table public.archived_items enable row level security;

-- Assets Policies
drop policy if exists "Users can view own assets" on public.assets;
create policy "Users can view own assets" on public.assets for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own assets" on public.assets;
create policy "Users can insert own assets" on public.assets for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own assets" on public.assets;
create policy "Users can delete own assets" on public.assets for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can update own assets" on public.assets;
create policy "Users can update own assets" on public.assets for update to authenticated using (auth.uid() = user_id);

-- Staging Items Policies
drop policy if exists "Users can view own staging items" on public.staging_items;
create policy "Users can view own staging items" on public.staging_items for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own staging items" on public.staging_items;
create policy "Users can insert own staging items" on public.staging_items for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own staging items" on public.staging_items;
create policy "Users can update own staging items" on public.staging_items for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own staging items" on public.staging_items;
create policy "Users can delete own staging items" on public.staging_items for delete to authenticated using (auth.uid() = user_id);

-- Archived Items Policies
drop policy if exists "Users can view own archived items" on public.archived_items;
create policy "Users can view own archived items" on public.archived_items for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own archived items" on public.archived_items;
create policy "Users can insert own archived items" on public.archived_items for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own archived items" on public.archived_items;
create policy "Users can update own archived items" on public.archived_items for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can delete own archived items" on public.archived_items;
create policy "Users can delete own archived items" on public.archived_items for delete to authenticated using (auth.uid() = user_id);
