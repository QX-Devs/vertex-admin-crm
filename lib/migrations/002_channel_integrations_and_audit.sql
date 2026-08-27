-- Phase 1 Migration: Channel Integrations, Audit Logs, and Admin Authentication

CREATE TABLE IF NOT EXISTS public.channel_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(64) NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  platform VARCHAR(32) NOT NULL, -- whatsapp, facebook, instagram
  status VARCHAR(64) NOT NULL DEFAULT 'NOT_CONNECTED',
  external_account_id VARCHAR(255),
  external_account_name VARCHAR(255),
  facebook_page_id VARCHAR(255),
  instagram_account_id VARCHAR(255),
  whatsapp_phone_number_id VARCHAR(255),
  waba_id VARCHAR(255),
  credential_reference VARCHAR(255), -- Secure Vault / Secret reference
  webhook_status VARCHAR(64) DEFAULT 'unverified',
  last_validated_at TIMESTAMPTZ,
  token_expires_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_client_platform UNIQUE (client_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_channel_integrations_client ON public.channel_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_channel_integrations_platform ON public.channel_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_channel_integrations_status ON public.channel_integrations(status);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR(64),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(128) NOT NULL,
  entity VARCHAR(64) NOT NULL,
  entity_id VARCHAR(128) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  result VARCHAR(32) NOT NULL DEFAULT 'success',
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin', -- superadmin, admin, operator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
