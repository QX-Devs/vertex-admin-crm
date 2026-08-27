-- Phase 3 Migration: Supabase Database Configuration & Monitoring Table

CREATE TABLE IF NOT EXISTS public.supabase_configuration (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  host VARCHAR(255) NOT NULL DEFAULT 'db.jgjlmpequqqcnberangs.supabase.co',
  port INTEGER NOT NULL DEFAULT 5432,
  database VARCHAR(255) NOT NULL DEFAULT 'postgres',
  user_name VARCHAR(255) NOT NULL DEFAULT 'postgres',
  password_hash TEXT,
  database_url TEXT,
  supabase_url VARCHAR(255) DEFAULT 'https://jgjlmpequqqcnberangs.supabase.co',
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  ssl_mode VARCHAR(32) DEFAULT 'require',
  pool_max INTEGER DEFAULT 20,
  idle_timeout_ms INTEGER DEFAULT 30000,
  connection_timeout_ms INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT TRUE,
  last_status VARCHAR(32) DEFAULT 'healthy',
  last_latency_ms INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO public.supabase_configuration (
  id, host, port, database, user_name, ssl_mode, pool_max, is_active, last_status, created_at, updated_at
) VALUES (
  'default', 'db.jgjlmpequqqcnberangs.supabase.co', 5432, 'postgres', 'postgres', 'require', 20, true, 'healthy', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_supabase_config_status ON public.supabase_configuration(last_status);
