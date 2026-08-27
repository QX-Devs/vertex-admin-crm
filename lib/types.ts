export type ClientStatus = 'active' | 'paused' | 'suspended' | 'pending_setup' | 'configuration_error';

export type ChannelType = 'whatsapp' | 'messenger' | 'instagram';

export interface Plan {
  plan_id: string;
  name: string;
  monthly_chat_limit: number;
  allowed_channels: string[];
  allowed_message_types: string[];
  enabled_modules: string[];
  lead_fields: string[];
  ai_level: 'None' | 'Basic' | 'Advanced' | 'Custom';
  memory_level: 'None' | 'Window' | 'Summary' | 'Vector';
  order_capture: boolean;
  human_handoff: boolean;
  storage_level: 'postgres' | 'sheets' | 'crm' | 'webhook';
  crm_enabled: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  client_id: string;
  business_name: string;
  channel_account_id: string;
  channel: ChannelType;
  status: ClientStatus;
  plan_id: string;
  owner_phone: string;
  owner_email?: string;
  reply_tone?: string;
  service_type?: string;
  timezone: string;
  storage_destination?: string;
  crm_webhook_url?: string;
  language: string;
  created_at: string;
  updated_at: string;
  // Computed & Joined fields for CRM UI
  plan_name?: string;
  monthly_limit?: number;
  used_chats?: number;
  usage_percentage?: number;
  leads_count?: number;
  orders_count?: number;
  conversations_count?: number;
  last_activity?: string;
  whatsapp_status?: string;
  facebook_status?: string;
  instagram_status?: string;
}

export interface ClientSettings {
  id?: string;
  client_id: string;
  service_description?: string;
  pricing_rules?: string;
  coverage_rules?: string;
  booking_requirements?: string;
  fallback_response?: string;
  escalation_keyword?: string;
  human_agent_phone?: string;
  booking_required_fields?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ClientKnowledgeBase {
  id?: string;
  client_id: string;
  section_key: string;
  content: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string | number;
  client_id: string;
  business_name?: string;
  customer_id: string;
  from_phone?: string;
  channel?: ChannelType;
  message_id?: string;
  message_type?: string;
  message_text?: string;
  public_customer_reply?: string;
  direction?: 'inbound' | 'outbound';
  block_reason?: string;
  order_confirmed?: boolean;
  current_month?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'waiting'
  | 'booked'
  | 'converted'
  | 'lost'
  | 'closed';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface LeadOrder {
  id: string | number;
  client_id: string;
  business_name?: string;
  customer_id: string;
  from_phone?: string;
  channel?: ChannelType;
  message_id?: string;
  message_type?: string;
  message_text?: string;
  public_customer_reply?: string;
  order_confirmed: boolean;
  lead_status: LeadStatus;
  order_status?: OrderStatus;
  order_payload?: {
    customer_name?: string;
    phone?: string;
    service?: string;
    area?: string;
    address?: string;
    booking_date?: string;
    booking_time?: string;
    notes?: string;
    amount?: number;
    [key: string]: any;
  };
  assigned_staff?: string;
  notes?: string;
  current_month?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminNotification {
  id: string | number;
  client_id: string;
  business_name?: string;
  owner_phone?: string;
  event_type: string;
  block_reason?: string;
  lead_status?: string;
  order_confirmed?: boolean;
  customer_id?: string;
  from_phone?: string;
  summary: string;
  payload?: Record<string, any>;
  is_read?: boolean;
  created_at: string;
}

export type IntegrationStatus =
  | 'NOT_CONNECTED'
  | 'VALIDATING'
  | 'CONNECTED'
  | 'INVALID_CREDENTIALS'
  | 'EXPIRED'
  | 'WEBHOOK_ERROR'
  | 'PERMISSION_ERROR'
  | 'API_ERROR'
  | 'DISCONNECTED';

export interface ChannelIntegration {
  id: string;
  client_id: string;
  platform: ChannelType;
  status: IntegrationStatus;
  external_account_id?: string;
  external_account_name?: string;
  facebook_page_id?: string;
  instagram_account_id?: string;
  whatsapp_phone_number_id?: string;
  waba_id?: string;
  credential_reference?: string; // Secure Vault / Server reference, NEVER raw token
  webhook_status?: string;
  last_validated_at?: string;
  token_expires_at?: string;
  last_error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_user_id?: string;
  admin_email: string;
  action: string;
  entity: string;
  entity_id: string;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  result: 'success' | 'failure' | 'warning';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'operator';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  platform: {
    totalClients: number;
    activeClients: number;
    pausedClients: number;
    suspendedClients: number;
    totalConversations: number;
    conversationsToday: number;
    conversationsThisWeek: number;
    conversationsThisMonth: number;
    totalLeads: number;
    leadsToday: number;
    leadsThisWeek: number;
    confirmedOrders: number;
    openHumanHandoffs: number;
    failedIntegrations: number;
    connectedWhatsApp: number;
    connectedFacebook: number;
    connectedInstagram: number;
  };
  usage: {
    totalMonthlyMessages: number;
    usageByClient: Array<{ clientId: string; businessName: string; used: number; limit: number; percentage: number }>;
    usageByChannel: Array<{ channel: string; count: number }>;
    usageByPlan: Array<{ planId: string; planName: string; used: number }>;
    highestUsageClients: Array<{ clientId: string; businessName: string; used: number; limit: number; percentage: number }>;
    clientsNearLimit: Array<{ clientId: string; businessName: string; used: number; limit: number; percentage: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    category: string;
    title: string;
    message: string;
    clientId?: string;
    timestamp: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'conversation' | 'lead' | 'order' | 'audit' | 'error';
    title: string;
    subtitle: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export interface N8nConfig {
  id: string;
  base_url: string;
  webhook_validate_url: string;
  webhook_inbound_url: string;
  api_key?: string; // Masked or stripped in public responses
  has_api_key?: boolean;
  webhook_verify_token: string;
  ssl_reject_unauthorized: boolean;
  timeout_ms: number;
  is_active: boolean;
  last_connected_at?: string;
  last_status: 'healthy' | 'unreachable' | 'degraded' | 'testing' | 'unknown';
  last_latency_ms: number;
  last_error?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface N8nNodeCheck {
  node_name: string;
  node_type: string;
  status: 'VERIFIED' | 'READY' | 'WARNING';
  message: string;
}

export interface N8nVerificationResult {
  success: boolean;
  n8n_confirmed: boolean;
  n8n_status: 'CONFIRMED' | 'VERIFIED' | 'FAILED';
  n8n_confirmation_id: string;
  n8n_workflow_name: string;
  n8n_execution_id?: string;
  n8n_latency_ms: number;
  n8n_endpoint: string;
  n8n_mode: 'live_n8n_webhook' | 'n8n_workflow_engine';
  nodes_verified: N8nNodeCheck[];
  routing_resolution: {
    client_id: string;
    business_name: string;
    platform: string;
    external_account_id: string;
    plan_id: string;
    monthly_limit: number;
    matched_method: string;
    is_active: boolean;
  };
  webhook_pipeline: {
    endpoint: string;
    ready: boolean;
    verify_token_configured: boolean;
  };
  message: string;
  confirmed_at: string;
}

export interface N8nPipelineTestResult {
  success: boolean;
  n8n_confirmed: boolean;
  execution_id: string;
  total_duration_ms: number;
  client_id: string;
  business_name: string;
  platform: ChannelType;
  input_message: string;
  output_reply: string;
  pipeline_trace: Array<{
    step: number;
    node_name: string;
    status: 'success' | 'warning' | 'skipped';
    duration_ms: number;
    summary: string;
    data?: any;
  }>;
  confirmed_at: string;
}

export interface N8nConnectivityTestResult {
  reachable: boolean;
  status: 'healthy' | 'unreachable' | 'degraded';
  latency_ms: number;
  base_url: string;
  webhook_validate_url: string;
  webhook_inbound_url: string;
  api_key_configured: boolean;
  response_code?: number;
  server_header?: string;
  error?: string;
  message: string;
  timestamp: string;
  workflow_nodes: Array<{ name: string; type: string; role: string; status: 'active' | 'ready' }>;
}

export const WORKFLOW_CORE_NODES = [
  { name: 'WhatsApp Trigger', type: 'n8n-nodes-base.whatsAppTrigger', role: 'Inbound Multi-Tenant Webhook', status: 'active' as const },
  { name: 'Messenger Trigger', type: 'n8n-nodes-base.facebookTrigger', role: 'Page Messaging Webhook', status: 'active' as const },
  { name: 'Instagram Meta Webhook Events', type: 'n8n-nodes-base.webhook', role: 'Instagram Direct Ingestion', status: 'active' as const },
  { name: 'Normalize Incoming Message', type: 'n8n-nodes-base.code', role: 'Standardized Payload Extraction', status: 'active' as const },
  { name: 'Production Readiness Guard', type: 'n8n-nodes-base.code', role: 'Postgres Connectivity Shield', status: 'active' as const },
  { name: 'Load Client From Postgres', type: 'n8n-nodes-base.postgres', role: 'Dynamic Client Tenant Matcher', status: 'active' as const },
  { name: 'Normalize Client Lookup', type: 'n8n-nodes-base.code', role: 'Tenant Status & Routing Rule', status: 'active' as const },
  { name: 'Load Plan From Postgres', type: 'n8n-nodes-base.postgres', role: 'Quota & Limits Resolver', status: 'active' as const },
  { name: 'Load Client Settings From Postgres', type: 'n8n-nodes-base.postgres', role: 'Business Knowledge & Tone', status: 'active' as const },
  { name: 'AI Execution & Postprocess', type: 'n8n-nodes-base.code', role: 'Custom AI Response Synthesis', status: 'active' as const },
  { name: 'Prepare Meta Reply', type: 'n8n-nodes-base.code', role: 'Per-Client Token Resolution', status: 'active' as const },
  { name: 'Respond to User', type: 'n8n-nodes-base.whatsApp', role: 'Outbound Dispatch Bridge', status: 'active' as const }
];

export interface SupabaseConfig {
  id: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  has_password?: boolean;
  database_url?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  supabase_service_role_key?: string;
  has_service_role_key?: boolean;
  ssl_mode: string;
  pool_max: number;
  idle_timeout_ms: number;
  connection_timeout_ms: number;
  is_active: boolean;
  last_status: 'healthy' | 'degraded' | 'error' | 'testing' | 'unknown';
  last_latency_ms: number;
  last_error?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseTableInfo {
  table_name: string;
  table_type: string;
  row_count: number;
  size_bytes?: number;
  size_formatted?: string;
  column_count: number;
  has_primary_key: boolean;
  category: string;
  description: string;
}

export interface DatabaseHealthResult {
  status: 'healthy' | 'degraded' | 'error';
  latency_ms: number;
  server_time: string;
  postgres_version: string;
  database_name: string;
  host: string;
  port: number;
  user: string;
  ssl_enabled: boolean;
  active_connections?: number;
  max_connections?: number;
  total_tables: number;
  total_rows: number;
  error?: string;
  message: string;
  timestamp: string;
}

export interface SchemaIntegrityReport {
  overall_status: 'passed' | 'warning' | 'failed';
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  checks: Array<{
    name: string;
    target: string;
    status: 'pass' | 'fail' | 'warn';
    details: string;
  }>;
  applied_migrations: Array<{
    version: string;
    name: string;
    status: 'applied' | 'pending';
    description: string;
  }>;
  timestamp: string;
}




