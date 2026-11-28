CREATE TABLE IF NOT EXISTS public.record_activity (
 id uuid PRIMARY KEY,
 actor_id text NOT NULL,
 actor_name text NOT NULL,
 actor_role text NOT NULL,
 record_type text NOT NULL CHECK(record_type IN ('order','quote')),
 record_id text NOT NULL,
 action text NOT NULL,
 outcome text,
 source_status text,
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS record_activity_by_record ON public.record_activity(record_type,record_id,created_at DESC);
CREATE INDEX IF NOT EXISTS record_activity_by_actor ON public.record_activity(actor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS record_activity_by_time ON public.record_activity(created_at DESC);

-- Match the existing assignment schema explicitly. Staff reads never create
-- tables or fall back to a company-wide list when this storage is unavailable.
CREATE TABLE IF NOT EXISTS public.followup_assignments (
 record_type text NOT NULL CHECK(record_type IN ('order','quote')),
 record_id text NOT NULL,
 staff_id text NOT NULL,
 assigned_by_email text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_type,record_id)
);
CREATE INDEX IF NOT EXISTS followup_assignments_by_staff ON public.followup_assignments(staff_id,record_type,record_id);
-- Orders already have a text primary key. Legacy lead IDs are numeric, while
-- assignment references are text; this index supports that join without a scan.
CREATE INDEX IF NOT EXISTS leads_assignment_key ON public.leads ((id::text));
