-- ===================================================================
-- Agent tracking schema (Phase 1 - theo memory 2026-08-05)
-- Tao 3 bang + view + RLS policies cho Agent V6 (mavis, minh, lan, ha, vy, mimin-help)
-- Loi hien tai: GET /rest/v1/agent_usage_logs 404 (chua co bang)
-- Ngay: 2026-08-06
-- Apply: Paste vao Supabase Dashboard > SQL Editor > Run
-- ===================================================================

-- 1. Bang agent_usage_logs: moi LLM call
CREATE TABLE IF NOT EXISTS public.agent_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,                         -- 'mavis', 'minh', 'lan', 'ha', 'vy', 'mimin-help'
  user_id TEXT,                                    -- user email hoac id
  latency_ms INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  is_error BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  model TEXT,                                      -- 'gpt-4o-mini', 'claude-haiku', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_agent_id ON public.agent_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_created_at ON public.agent_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_user_id ON public.agent_usage_logs(user_id);

-- 2. Bang agent_execution_logs: moi user message -> agent response
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT NOT NULL,                      -- unique id cho moi execution
  agent_id TEXT NOT NULL,
  user_id TEXT,
  user_message TEXT,
  agent_response TEXT,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',                   -- 'success', 'error', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agent_id ON public.agent_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_user_id ON public.agent_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON public.agent_execution_logs(created_at);

-- 3. Bang agent_tool_logs: moi tool call chi tiet
CREATE TABLE IF NOT EXISTS public.agent_tool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT,
  agent_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,                         -- 'createLenhCat', 'updateCongDoan', etc.
  tool_args JSONB DEFAULT '{}'::jsonb,
  tool_result JSONB,
  is_error BOOLEAN DEFAULT false,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_logs_agent_id ON public.agent_tool_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_logs_tool_name ON public.agent_tool_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_agent_tool_logs_created_at ON public.agent_tool_logs(created_at);

-- 4. View: thong ke theo ngay (90 ngay gan nhat)
CREATE OR REPLACE VIEW public.agent_daily_stats AS
SELECT
  agent_id,
  DATE(created_at) AS day,
  COUNT(*) AS calls,
  SUM(cost_usd) AS total_cost,
  AVG(latency_ms)::INTEGER AS avg_latency,
  SUM(CASE WHEN is_error THEN 1 ELSE 0 END) AS errors
FROM public.agent_usage_logs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY agent_id, DATE(created_at);

-- 5. RLS policies: Users view own + Admins view all + Service role insert
ALTER TABLE public.agent_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_logs ENABLE ROW LEVEL SECURITY;

-- 5a. GRANT table-level privileges (can co ca GRANT va POLICY moi query duoc)
GRANT SELECT ON public.agent_usage_logs      TO anon, authenticated;
GRANT SELECT ON public.agent_execution_logs  TO anon, authenticated;
GRANT SELECT ON public.agent_tool_logs       TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agent_usage_logs     TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.agent_execution_logs TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.agent_tool_logs      TO service_role;

-- Drop existing policies neu co (truong hop apply nhieu lan)
DROP POLICY IF EXISTS "Users view own usage" ON public.agent_usage_logs;
DROP POLICY IF EXISTS "Admins view all usage" ON public.agent_usage_logs;
DROP POLICY IF EXISTS "Service role insert usage" ON public.agent_usage_logs;
DROP POLICY IF EXISTS "Anon read usage for tracking" ON public.agent_usage_logs;

DROP POLICY IF EXISTS "Users view own executions" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Admins view all executions" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "Service role insert executions" ON public.agent_execution_logs;

DROP POLICY IF EXISTS "Users view own tools" ON public.agent_tool_logs;
DROP POLICY IF EXISTS "Admins view all tools" ON public.agent_tool_logs;
DROP POLICY IF EXISTS "Service role insert tools" ON public.agent_tool_logs;

-- Policies: cho phep anon/public doc (de /agents page hien thi thong ke)
CREATE POLICY "Anon read usage for tracking" ON public.agent_usage_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins view all usage" ON public.agent_usage_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Service role insert (cho backend/scripts)
CREATE POLICY "Service role insert usage" ON public.agent_usage_logs
  FOR INSERT TO service_role WITH CHECK (true);

-- Same cho 2 bang kia
CREATE POLICY "Anon read executions" ON public.agent_execution_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role insert executions" ON public.agent_execution_logs
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Anon read tools" ON public.agent_tool_logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role insert tools" ON public.agent_tool_logs
  FOR INSERT TO service_role WITH CHECK (true);

-- ===================================================================
-- Verify: chay check-agents.cjs, 3 bang phai status 200
-- ===================================================================
