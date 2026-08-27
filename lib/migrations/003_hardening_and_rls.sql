-- Phase 6 Migration: Security Hardening, Row-Level Security (RLS), and Performance Indexes

-- 1. Enable Row-Level Security (RLS) across all tables
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.channel_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- 2. Privileged Service Role Policies (Server-Side privileged access only, NO direct public access)
DO $$
BEGIN
  -- Service role full access policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_plans') THEN
    CREATE POLICY service_role_all_plans ON public.plans FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_clients') THEN
    CREATE POLICY service_role_all_clients ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_integrations') THEN
    CREATE POLICY service_role_all_integrations ON public.channel_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_conversations') THEN
    CREATE POLICY service_role_all_conversations ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_leads_orders') THEN
    CREATE POLICY service_role_all_leads_orders ON public.leads_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_audit_logs') THEN
    CREATE POLICY service_role_all_audit_logs ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_admin_users') THEN
    CREATE POLICY service_role_all_admin_users ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Additional Multi-Tenant Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ci_ext_account ON public.channel_integrations(external_account_id);
CREATE INDEX IF NOT EXISTS idx_ci_phone_number ON public.channel_integrations(whatsapp_phone_number_id);
CREATE INDEX IF NOT EXISTS idx_ci_page_id ON public.channel_integrations(facebook_page_id);
CREATE INDEX IF NOT EXISTS idx_ci_ig_account ON public.channel_integrations(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_ci_client_platform ON public.channel_integrations(client_id, platform);

CREATE INDEX IF NOT EXISTS idx_conv_client_created ON public.conversations(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_customer ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_status ON public.leads_orders(client_id, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_confirmed ON public.leads_orders(order_confirmed) WHERE order_confirmed = true;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.admin_notifications(is_read, created_at DESC);

-- 4. Idempotency Cleanup Helper Function (cleans keys older than 7 days)
DROP FUNCTION IF EXISTS public.cleanup_expired_idempotency_keys CASCADE;
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
