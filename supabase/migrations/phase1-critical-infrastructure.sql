-- ===================================================
-- Phase 1: Critical Infrastructure Tables
-- Tables: email_queue, email_logs, ai_responses,
--         workflows, performance_metrics, credentials
-- ===================================================

-- ===================================================
-- Helpers
-- ===================================================

-- Auto-updated timestamp function
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

-- ===================================================
-- 1. Email Queue
-- ===================================================
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  message_id text,
  from_addr text,
  to_addrs text[] default '{}',
  cc_addrs text[] default '{}',
  bcc_addrs text[] default '{}',
  subject text,
  body_text text,
  body_html text,
  status text not null default 'queued'
    check (status in ('queued','processing','succeeded','failed','dead-letter')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  next_attempt_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_email_queue_status_next
  on public.email_queue (status, next_attempt_at nulls first);

create index if not exists ix_email_queue_client
  on public.email_queue (client_id, status);

drop trigger if exists trg_email_queue_touch on public.email_queue;
create trigger trg_email_queue_touch
before update on public.email_queue
for each row execute function public.touch_updated_at();

alter table public.email_queue enable row level security;
create policy email_queue_tenant_isolation
on public.email_queue
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='email_queue'
  ) then raise exception '❌ email_queue missing';
  end if;
  raise notice '✅ email_queue validated';
end$$;

-- ===================================================
-- 2. Email Logs
-- ===================================================
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  email_queue_id uuid not null references public.email_queue(id) on delete cascade,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ix_email_logs_email
  on public.email_logs (email_queue_id, event_at);

create index if not exists ix_email_logs_client
  on public.email_logs (client_id, event_at desc);

alter table public.email_logs enable row level security;
create policy email_logs_tenant_isolation
on public.email_logs
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='email_logs'
  ) then raise exception '❌ email_logs missing';
  end if;
  raise notice '✅ email_logs validated';
end$$;

-- ===================================================
-- 3. AI Responses
-- ===================================================
create table if not exists public.ai_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  source_email_id uuid references public.email_queue(id) on delete set null,
  model text not null,
  prompt_hash text,
  prompt_tokens int,
  completion_tokens int,
  response_text text,
  latency_ms int,
  quality_score numeric(4,2),
  created_by text not null default 'ai'
    check (created_by in ('ai','human')),
  created_at timestamptz not null default now()
);

create index if not exists ix_ai_responses_client
  on public.ai_responses (client_id, created_at desc);

create index if not exists ix_ai_responses_email
  on public.ai_responses (source_email_id);

create index if not exists ix_ai_responses_prompt
  on public.ai_responses (prompt_hash);

alter table public.ai_responses enable row level security;
create policy ai_responses_tenant_isolation
on public.ai_responses
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='ai_responses'
  ) then raise exception '❌ ai_responses missing';
  end if;
  raise notice '✅ ai_responses validated';
end$$;

-- ===================================================
-- 4. Workflows
-- ===================================================
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active','paused','archived')),
  n8n_workflow_id text,
  version int not null default 1,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, name)
);

create index if not exists ix_workflows_client
  on public.workflows (client_id, status);

create index if not exists ix_workflows_updated
  on public.workflows (client_id, updated_at desc);

drop trigger if exists trg_workflows_touch on public.workflows;
create trigger trg_workflows_touch
before update on public.workflows
for each row execute function public.touch_updated_at();

alter table public.workflows enable row level security;
create policy workflows_tenant_isolation
on public.workflows
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='workflows'
  ) then raise exception '❌ workflows missing';
  end if;
  raise notice '✅ workflows validated';
end$$;

-- ===================================================
-- 5. Performance Metrics
-- ===================================================
create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null,
  metric_name text not null,
  metric_value numeric not null,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Create unique index for upsert operations (PostgreSQL doesn't allow expressions in table-level UNIQUE constraints)
create unique index if not exists ix_perf_metrics_unique_upsert
  on public.performance_metrics (client_id, metric_date, metric_name, (dimensions->>'workflow'));

create index if not exists ix_perf_metrics_client_date
  on public.performance_metrics (client_id, metric_date desc);

create index if not exists ix_perf_metrics_metric
  on public.performance_metrics (metric_name, metric_date desc);

alter table public.performance_metrics enable row level security;
create policy perf_metrics_tenant_isolation
on public.performance_metrics
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='performance_metrics'
  ) then raise exception '❌ performance_metrics missing';
  end if;
  raise notice '✅ performance_metrics validated';
end$$;

-- ===================================================
-- 6. Credentials (lookup table + main table)
-- ===================================================
create table if not exists public.credential_providers (
  provider text primary key
);

insert into public.credential_providers (provider)
values ('gmail'), ('outlook'), ('n8n'), ('other')
on conflict do nothing;

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  provider text not null references public.credential_providers(provider),
  credential_name text not null,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  encrypted_value bytea,
  key_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, provider, credential_name)
);

create index if not exists ix_credentials_client
  on public.credentials (client_id);

create index if not exists ix_credentials_provider
  on public.credentials (provider);

create index if not exists ix_credentials_expires
  on public.credentials (expires_at);

drop trigger if exists trg_credentials_touch on public.credentials;
create trigger trg_credentials_touch
before update on public.credentials
for each row execute function public.touch_updated_at();

alter table public.credentials enable row level security;
create policy credentials_tenant_isolation
on public.credentials
using (client_id = auth.uid())
with check (client_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name='credentials'
  ) then raise exception '❌ credentials missing';
  end if;
  raise notice '✅ credentials validated';
end$$;

-- ===================================================
-- Phase 1 Completion Summary
-- ===================================================
do $$
begin
  raise notice '🎉 Phase 1: Critical Infrastructure Tables - COMPLETED';
  raise notice '✅ email_queue - Email processing queue';
  raise notice '✅ email_logs - Per-message processing logs';
  raise notice '✅ ai_responses - AI-generated text and metadata';
  raise notice '✅ workflows - n8n workflow linkage and configuration';
  raise notice '✅ performance_metrics - Time-series metrics for operations';
  raise notice '✅ credentials - Credential metadata and cipher text pointers';
  raise notice '';
  raise notice '🔒 Security: RLS enabled on all tables';
  raise notice '⚡ Performance: Indexes created for common query patterns';
  raise notice '🔗 Relationships: Foreign keys with proper cascade options';
  raise notice '📊 Audit: Auto-updating timestamps with touch_updated_at()';
  raise notice '';
  raise notice '🚀 Ready for Phase 2: Business Logic Tables';
end$$;
