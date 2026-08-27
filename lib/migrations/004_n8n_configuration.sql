-- Phase 2/3 Migration: n8n Configuration and Panel-to-n8n Bridge Settings

CREATE TABLE IF NOT EXISTS public.n8n_configuration (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  base_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:5678',
  webhook_validate_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:5678/webhook/admin/channel/validate',
  webhook_inbound_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:5678/webhook/inbound/messages',
  api_key TEXT,
  webhook_verify_token VARCHAR(255) DEFAULT 'meta_crm_verify_token_2026',
  ssl_reject_unauthorized BOOLEAN DEFAULT TRUE,
  timeout_ms INTEGER DEFAULT 5000,
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMPTZ,
  last_status VARCHAR(32) DEFAULT 'unknown', -- healthy, unreachable, degraded, testing
  last_latency_ms INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO public.n8n_configuration (
  id, base_url, webhook_validate_url, webhook_inbound_url, webhook_verify_token,
  timeout_ms, is_active, last_status, created_at, updated_at
) VALUES (
  'default', 'http://localhost:5678', 'http://localhost:5678/webhook/admin/channel/validate',
  'http://localhost:5678/webhook/inbound/messages', 'meta_crm_verify_token_2026',
  5000, true, 'healthy', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_n8n_config_status ON public.n8n_configuration(last_status);
