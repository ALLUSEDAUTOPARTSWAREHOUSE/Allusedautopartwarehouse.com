CREATE TABLE IF NOT EXISTS public.admin_commands (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('staff.create','staff.role.change','development.plan')),
  status TEXT NOT NULL CHECK (status IN ('pending_approval','planned','completed','denied','expired','stale','failed')),
  actor_email TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  preview JSONB NOT NULL CHECK (jsonb_typeof(preview) = 'object'),
  target_id TEXT,
  target_fingerprint TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by TEXT
);
CREATE INDEX IF NOT EXISTS admin_commands_actor_idx ON public.admin_commands (actor_email,created_at DESC);
CREATE TABLE IF NOT EXISTS public.admin_command_events (
  id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL REFERENCES public.admin_commands(id),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_command_events_command_idx ON public.admin_command_events (command_id,created_at);
-- Matches lib/staff-auth.ts. Role changes increment this version atomically.
CREATE TABLE IF NOT EXISTS public.staff_credentials (
  staff_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  session_version INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
