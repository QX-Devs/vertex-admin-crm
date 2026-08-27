-- Phase 1 Migration: Initial Schema for Production CRM and Automation
CREATE TABLE IF NOT EXISTS public.plans (
  plan_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  monthly_chat_limit INTEGER NOT NULL DEFAULT 1000,
  allowed_channels JSONB NOT NULL DEFAULT '["whatsapp"]'::jsonb,
  allowed_message_types JSONB NOT NULL DEFAULT '["text"]'::jsonb,
  enabled_modules JSONB NOT NULL DEFAULT '["ai", "leads"]'::jsonb,
  lead_fields JSONB NOT NULL DEFAULT '["name", "phone", "service"]'::jsonb,
  ai_level VARCHAR(32) NOT NULL DEFAULT 'Basic',
  memory_level VARCHAR(32) NOT NULL DEFAULT 'Window',
  order_capture BOOLEAN NOT NULL DEFAULT true,
  human_handoff BOOLEAN NOT NULL DEFAULT true,
  storage_level VARCHAR(32) NOT NULL DEFAULT 'postgres',
  crm_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
  client_id VARCHAR(64) PRIMARY KEY,
  channel_account_id VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'whatsapp',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  plan_id VARCHAR(64) REFERENCES public.plans(plan_id) ON UPDATE CASCADE,
  owner_phone VARCHAR(64) NOT NULL DEFAULT '',
  owner_email VARCHAR(255) DEFAULT '',
  reply_tone VARCHAR(128) DEFAULT 'Professional and friendly',
  service_type VARCHAR(128) DEFAULT 'General',
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  storage_destination VARCHAR(64) DEFAULT 'postgres',
  crm_webhook_url TEXT DEFAULT '',
  language VARCHAR(16) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_channel_account_id ON public.clients(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON public.clients(plan_id);

CREATE TABLE IF NOT EXISTS public.client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(64) UNIQUE REFERENCES public.clients(client_id) ON DELETE CASCADE,
  service_description TEXT DEFAULT '',
  pricing_rules TEXT DEFAULT '',
  coverage_rules TEXT DEFAULT '',
  booking_requirements TEXT DEFAULT '',
  fallback_response TEXT DEFAULT 'Hello! Your inquiry has been forwarded to our team and we will reach out shortly.',
  escalation_keyword VARCHAR(64) DEFAULT 'help',
  human_agent_phone VARCHAR(64) DEFAULT '',
  booking_required_fields JSONB DEFAULT '["name", "phone", "service"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.client_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(64) REFERENCES public.clients(client_id) ON DELETE CASCADE,
  section_key VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ckb_client_key ON public.client_knowledge_base(client_id, section_key);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id BIGSERIAL PRIMARY KEY,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  client_id VARCHAR(64),
  message_id VARCHAR(255),
  customer_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON public.idempotency_keys(idempotency_key);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
  month VARCHAR(16) NOT NULL,
  used_chats INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_client_month UNIQUE (client_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_client_month ON public.usage_counters(client_id, month);

CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  business_name VARCHAR(255),
  customer_id VARCHAR(255) NOT NULL,
  from_phone VARCHAR(64),
  channel VARCHAR(32) DEFAULT 'whatsapp',
  message_id VARCHAR(255),
  message_type VARCHAR(32) DEFAULT 'text',
  message_text TEXT,
  public_customer_reply TEXT,
  direction VARCHAR(16) DEFAULT 'inbound',
  block_reason VARCHAR(128) DEFAULT '',
  order_confirmed BOOLEAN DEFAULT false,
  current_month VARCHAR(16),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_date ON public.conversations(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_month ON public.conversations(current_month);

CREATE TABLE IF NOT EXISTS public.leads_orders (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  business_name VARCHAR(255),
  customer_id VARCHAR(255) NOT NULL,
  from_phone VARCHAR(64),
  channel VARCHAR(32) DEFAULT 'whatsapp',
  message_id VARCHAR(255),
  message_type VARCHAR(32) DEFAULT 'text',
  message_text TEXT,
  public_customer_reply TEXT,
  order_confirmed BOOLEAN DEFAULT false,
  lead_status VARCHAR(32) DEFAULT 'new',
  order_status VARCHAR(32) DEFAULT 'pending',
  order_payload JSONB DEFAULT '{}'::jsonb,
  assigned_staff VARCHAR(128) DEFAULT '',
  notes TEXT DEFAULT '',
  current_month VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_client ON public.leads_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads_orders(lead_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.leads_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_leads_confirmed ON public.leads_orders(order_confirmed);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(64),
  business_name VARCHAR(255),
  owner_phone VARCHAR(64),
  event_type VARCHAR(64) NOT NULL,
  block_reason VARCHAR(128) DEFAULT '',
  lead_status VARCHAR(64) DEFAULT '',
  order_confirmed BOOLEAN DEFAULT false,
  customer_id VARCHAR(255),
  from_phone VARCHAR(64),
  summary TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_client ON public.admin_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.admin_notifications(is_read);

-- Chat Usage Functions required by n8n
DROP FUNCTION IF EXISTS public.check_chat_usage(text, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.check_chat_usage CASCADE;
CREATE OR REPLACE FUNCTION public.check_chat_usage(
  p_client_id text,
  p_customer_id text,
  p_month text,
  p_limit integer
)
RETURNS TABLE (
  client_id text,
  month text,
  used_chats integer,
  monthly_limit integer,
  allowed boolean,
  usage_percentage numeric
) AS $$
DECLARE
  v_used integer := 0;
  v_limit integer := COALESCE(p_limit, 1000);
BEGIN
  SELECT uc.used_chats, uc.monthly_limit
  INTO v_used, v_limit
  FROM public.usage_counters uc
  WHERE uc.client_id = p_client_id AND uc.month = p_month;

  IF NOT FOUND THEN
    INSERT INTO public.usage_counters (client_id, month, used_chats, monthly_limit)
    VALUES (p_client_id, p_month, 0, v_limit)
    ON CONFLICT (client_id, month) DO NOTHING;
    v_used := 0;
  END IF;

  RETURN QUERY SELECT
    p_client_id,
    p_month,
    v_used,
    v_limit,
    (v_used < v_limit) AS allowed,
    ROUND((v_used::numeric / GREATEST(v_limit, 1)::numeric) * 100, 2) AS usage_percentage;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.register_chat_usage(text, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.register_chat_usage CASCADE;
CREATE OR REPLACE FUNCTION public.register_chat_usage(
  p_client_id text,
  p_customer_id text,
  p_month text,
  p_limit integer
)
RETURNS TABLE (
  client_id text,
  month text,
  used_chats integer,
  monthly_limit integer,
  allowed boolean,
  usage_percentage numeric
) AS $$
DECLARE
  v_used integer := 0;
  v_limit integer := COALESCE(p_limit, 1000);
BEGIN
  INSERT INTO public.usage_counters (client_id, month, used_chats, monthly_limit)
  VALUES (p_client_id, p_month, 1, v_limit)
  ON CONFLICT (client_id, month) DO UPDATE
  SET used_chats = usage_counters.used_chats + 1,
      updated_at = NOW()
  RETURNING usage_counters.used_chats, usage_counters.monthly_limit
  INTO v_used, v_limit;

  RETURN QUERY SELECT
    p_client_id,
    p_month,
    v_used,
    v_limit,
    (v_used <= v_limit) AS allowed,
    ROUND((v_used::numeric / GREATEST(v_limit, 1)::numeric) * 100, 2) AS usage_percentage;
END;
$$ LANGUAGE plpgsql;
