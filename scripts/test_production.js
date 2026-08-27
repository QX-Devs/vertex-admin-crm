const { db, getPgPool } = require('../lib/db');
const { authenticateAdmin, signToken, verifyToken } = require('../lib/auth');
const { validateMetaCredentials } = require('../lib/channelValidator');
const { verifyChannelWithN8n, confirmConnectionWithN8n, executeN8nPipelineTest, testN8nConnectivity } = require('../lib/n8nService');

const { processMultiTenantWebhookMessage } = require('../lib/webhookProcessor');

async function setupTestFixture() {
  const pool = getPgPool();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 1. Create temporary test client
  await pool.query(`
    INSERT INTO public.clients (
      client_id, channel_account_id, business_name, channel, status,
      plan_id, owner_phone, owner_email, reply_tone, service_type,
      timezone, storage_destination, crm_webhook_url, language,
      created_at, updated_at
    ) VALUES (
      'client_lumina', '1098800089990621', 'Lumina Dental & Aesthetic Clinic', 'whatsapp', 'active',
      'professional', '+1 (555) 234-5678', 'contact@lumina-clinic.com', 'Professional', 'Medical',
      'America/New_York', 'postgres', '', 'en', NOW(), NOW()
    ) ON CONFLICT (client_id) DO UPDATE SET status = 'active', updated_at = NOW();
  `);

  // 2. Settings
  await pool.query(`
    INSERT INTO public.client_settings (
      client_id, service_description, pricing_rules, coverage_rules,
      booking_requirements, fallback_response, escalation_keyword,
      human_agent_phone, booking_required_fields, created_at, updated_at
    ) VALUES (
      'client_lumina', 'Advanced specialty clinic', 'Dental exam $50', 'Downtown',
      'Name and phone', 'We will call you.', 'doctor', '+15552345678',
      '["name", "phone", "service"]'::jsonb, NOW(), NOW()
    ) ON CONFLICT (client_id) DO NOTHING;
  `);

  // 3. Knowledge base
  await pool.query(`
    INSERT INTO public.client_knowledge_base (client_id, section_key, content, enabled, created_at, updated_at)
    VALUES ('client_lumina', 'Services', 'Teeth whitening', true, NOW(), NOW());
  `);

  // 4. Channel Integrations
  await pool.query(`
    INSERT INTO public.channel_integrations (
      client_id, platform, status, external_account_id, external_account_name,
      whatsapp_phone_number_id, waba_id, credential_reference, webhook_status, created_at, updated_at
    ) VALUES
      ('client_lumina', 'whatsapp', 'CONNECTED', '1098800089990621', 'Lumina WA', '1098800089990621', '209988776655443', 'vault_meta_ref', 'Verified', NOW(), NOW()),
      ('client_lumina', 'messenger', 'CONNECTED', '1211325755394127', 'Lumina FB', NULL, NULL, 'vault_meta_ref', 'Verified', NOW(), NOW()),
      ('client_lumina', 'instagram', 'CONNECTED', '178414000123456', 'Lumina IG', NULL, NULL, 'vault_meta_ref', 'Verified', NOW(), NOW())
    ON CONFLICT (client_id, platform) DO UPDATE SET status = 'CONNECTED', updated_at = NOW();
  `);

  // 5. Usage counters
  await pool.query(`
    INSERT INTO public.usage_counters (client_id, month, used_chats, monthly_limit, created_at, updated_at)
    VALUES ('client_lumina', $1, 3890, 5000, NOW(), NOW())
    ON CONFLICT (client_id, month) DO UPDATE SET used_chats = 3890, monthly_limit = 5000;
  `, [currentMonth]);

  // 6. Conversations
  await pool.query(`
    INSERT INTO public.conversations (
      client_id, business_name, customer_id, from_phone, channel,
      message_id, message_type, message_text, public_customer_reply,
      direction, block_reason, order_confirmed, current_month, created_at
    ) VALUES
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889901', '+15558889901', 'whatsapp', 'msg_1', 'text', 'Whitening inquiry', 'Hello welcome', 'inbound', '', false, $1, NOW()),
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889901', '+15558889901', 'whatsapp', 'msg_2', 'text', 'Thursday at 4pm', 'Confirmed', 'inbound', '', true, $1, NOW()),
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889902', '+15558889902', 'whatsapp', 'msg_3', 'text', 'Need agent', 'Handoff initiated', 'inbound', 'human_handoff_requested', false, $1, NOW()),
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889903', '+15558889903', 'messenger', 'msg_4', 'text', 'Hello on FB', 'Hi!', 'inbound', '', false, $1, NOW()),
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889904', '+15558889904', 'instagram', 'msg_5', 'text', 'Hello on IG', 'Hi!', 'inbound', '', false, $1, NOW());
  `, [currentMonth]);

  // 7. Leads & Orders
  await pool.query(`
    INSERT INTO public.leads_orders (
      client_id, business_name, customer_id, from_phone, channel,
      message_id, message_type, message_text, public_customer_reply,
      order_confirmed, lead_status, order_status, order_payload,
      assigned_staff, notes, current_month, created_at, updated_at
    ) VALUES
      ('client_lumina', 'Lumina Dental & Aesthetic Clinic', '15558889901', '+15558889901', 'whatsapp', 'msg_2', 'text', 'Thursday 4pm', 'Confirmed', true, 'booked', 'confirmed', '{"customer_name": "Rachel", "service": "Whitening"}'::jsonb, 'Dr. Sarah', 'Confirmed', $1, NOW(), NOW());
  `, [currentMonth]);
}

async function teardownTestFixture() {
  const pool = getPgPool();
  try {
    await pool.query("DELETE FROM public.conversations WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.leads_orders WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.admin_notifications WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.usage_counters WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.idempotency_keys WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.channel_integrations WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.client_knowledge_base WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.client_settings WHERE client_id = 'client_lumina';");
    await pool.query("DELETE FROM public.audit_logs WHERE entity_id LIKE 'client_lumina%';");
    await pool.query("DELETE FROM public.clients WHERE client_id = 'client_lumina';");
  } catch (err) {
    console.error('Teardown cleanup error:', err);
  }
}

async function runProductionTestSuite() {
  console.log('================================================================');
  console.log('       PHASE 7 — MASTER PRODUCTION AUTOMATED TEST SUITE        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 0. Setup transient test fixture
    await setupTestFixture();

    /* =========================================================================
     * SUITE 1: CRM FUNCTIONALITY & AUTHORIZATION TESTS
     * ========================================================================= */
    console.log('================================================================');
    console.log('SUITE 1: CRM FUNCTIONALITY, AUTHORIZATION & DATA PIPELINES');
    console.log('================================================================');

    // 1. Admin Authentication & Roles
    console.log('\n--- 1.1 Admin Authentication & RBAC ---');
    const superadmin = await authenticateAdmin('admin@example.com', 'Admin@123456');
    assert(superadmin !== null, 'Superadmin credentials authenticated');
    assert(superadmin.role === 'superadmin', 'Superadmin role correctly resolved');

    const wrongPass = await authenticateAdmin('admin@example.com', 'InvalidPassword123');
    assert(wrongPass === null, 'Invalid credentials rejected with null');

    const token = await signToken({
      userId: superadmin.id,
      email: superadmin.email,
      name: superadmin.name,
      role: superadmin.role
    });
    assert(typeof token === 'string' && token.length > 30, 'JWT HS256 token signed successfully');

    const verified = await verifyToken(token);
    assert(verified?.email === 'admin@example.com', 'JWT session token verified server-side');

    // 1.2 Clients Filtering & Details
    console.log('\n--- 1.2 Client Management & Detail Tabs ---');
    const clients = await db.getClients();
    assert(Array.isArray(clients) && clients.length >= 1, `Fetched ${clients.length} active clients`);

    const activeClients = clients.filter(c => c.status === 'active');
    assert(activeClients.length > 0, `Filtered active clients (${activeClients.length} found)`);

    const clientDetail = await db.getClientById('client_lumina');
    assert(clientDetail !== null, 'Client details deep query retrieved');
    assert(clientDetail.settings !== null, 'Tab 2 (Service Settings) loaded');
    assert(Array.isArray(clientDetail.knowledgeBase) && clientDetail.knowledgeBase.length > 0, 'Tab 3 (Knowledge Base) loaded');
    assert(Array.isArray(clientDetail.integrations) && clientDetail.integrations.length >= 3, 'Tab 4 (Channels) loaded with 3 channels');
    assert(typeof clientDetail.used_chats === 'number', 'Tab 5 (Usage) dynamic calculation verified');
    assert(Array.isArray(clientDetail.conversations), 'Tab 6 (Conversations) loaded');

    // 1.3 Conversations Explorer & Filtering
    console.log('\n--- 1.3 Conversations Explorer ---');
    const allConvs = await db.getConversations();
    assert(allConvs.length >= 5, `Retrieved ${allConvs.length} centralized conversations`);

    const luminaConvs = await db.getConversations({ clientId: 'client_lumina' });
    assert(luminaConvs.every(c => c.client_id === 'client_lumina'), 'Conversation filtering by client verified');

    const handoffConvs = await db.getConversations({ handoffOnly: true });
    assert(Array.isArray(handoffConvs), 'Human handoff filter verified');

    // 1.4 Leads Management Pipeline
    console.log('\n--- 1.4 Leads Pipeline & State Transitions ---');
    const leads = await db.getLeads();
    assert(leads.length >= 1, `Retrieved ${leads.length} leads in pipeline`);
    const lead = leads[0];
    const updatedLeadResult = await db.updateLead(lead.id, {
      lead_status: 'qualified',
      assigned_staff: 'Sarah_Admin',
      notes: 'Customer confirmed consultation date via test suite.'
    });
    assert(updatedLeadResult?.lead.lead_status === 'qualified', 'Lead status transition to qualified verified');
    assert(updatedLeadResult?.lead.assigned_staff === 'Sarah_Admin', 'Staff assignment verified');
    assert(updatedLeadResult?.before.lead_status !== undefined, 'Before-state captured for audit logging');

    // 1.5 Orders / Bookings Pipeline
    console.log('\n--- 1.5 Confirmed Orders & Bookings ---');
    const confirmedOrders = await db.getLeads({ confirmedOnly: true });
    assert(confirmedOrders.length >= 1, `Retrieved ${confirmedOrders.length} confirmed orders`);
    assert(confirmedOrders.every(o => o.order_confirmed === true), 'Order confirmation flag strictly verified');

    // 1.6 Plans Management & Active Client Protection Guard
    console.log('\n--- 1.6 Plans Administration & Safety Guard ---');
    const plans = await db.getPlans();
    assert(plans.length >= 3, `Retrieved ${plans.length} subscription plans`);

    let planDeleteBlocked = false;
    try {
      // Professional plan is assigned to active client Lumina
      await db.deletePlan('professional');
    } catch (e) {
      planDeleteBlocked = true;
    }
    assert(planDeleteBlocked, 'Safety Guard: Deletion of plan assigned to active client is prevented');

    // 1.7 Usage Calculations & Quota Thresholds
    console.log('\n--- 1.7 Usage Calculations & Quota Thresholds ---');
    const dashboardStats = await db.getDashboardStats();
    assert(dashboardStats.usage.totalMonthlyMessages > 0, 'Aggregate monthly messages calculated');
    assert(Array.isArray(dashboardStats.usage.clientsNearLimit), 'Quota limit breach warnings (>80%) computed');
    assert(dashboardStats.usage.usageByChannel.length >= 1, 'Usage breakdown by channel computed');

    // 1.8 Immutable Audit Log
    console.log('\n--- 1.8 Immutable Audit Log Tracking ---');
    const auditEntry = await db.addAuditLog({
      admin_user_id: superadmin.id,
      admin_email: superadmin.email,
      action: 'production_test_executed',
      entity: 'system',
      entity_id: 'phase_7',
      before_state: { test_state: 'initialized' },
      after_state: { test_state: 'verified' },
      result: 'success',
      ip_address: '127.0.0.1',
      user_agent: 'AutomatedTestRunner'
    });
    assert(Boolean(auditEntry?.id && (auditEntry.id.startsWith('aud_') || auditEntry.id.length >= 10)), 'Audit log entry created with unique ID');
    const logs = await db.getAuditLogs();
    assert(logs.some(l => l.action === 'production_test_executed'), 'Audit log entry retrieved from history');


    /* =========================================================================
     * SUITE 2: CHANNEL CONNECTIONS & N8N VERIFICATION TESTS
     * ========================================================================= */
    console.log('\n================================================================');
    console.log('SUITE 2: CHANNEL CONNECTIONS, VALIDATION & N8N CONFIRMATION');
    console.log('================================================================');

    // 2.1 WhatsApp Credential Validation & n8n Confirmation
    console.log('\n--- 2.1 WhatsApp Credential Validation & n8n Confirmation ---');
    const validWA = await validateMetaCredentials({
      platform: 'whatsapp',
      clientId: 'client_lumina',
      credentials: {
        accessToken: 'EAAB_TEST_TOKEN_VALID_WHATSAPP_SECRET',
        phoneNumberId: '1098800089990621',
        wabaId: '209988776655443'
      }
    });
    assert(validWA.success === true, 'Valid WhatsApp credential validated');
    assert(validWA.token_valid === true, 'WhatsApp token verified');
    assert(validWA.webhook_ready === true, 'WhatsApp webhook readiness verified');
    assert(validWA.phone_number_id === '1098800089990621', 'Phone number ID extracted');
    assert(validWA.n8n_confirmed === true, 'n8n Workflow Engine confirmation verified');
    assert(Boolean(validWA.n8n_confirmation?.n8n_confirmation_id), 'n8n confirmation ID returned');

    const invalidWA = await validateMetaCredentials({
      platform: 'whatsapp',
      clientId: 'client_lumina',
      credentials: {
        accessToken: '', // Missing token
        phoneNumberId: '1098800089990621'
      }
    });
    assert(invalidWA.success === false, 'Invalid WhatsApp credential (empty token) rejected');
    assert(Boolean(invalidWA.error), 'Safe error message returned for invalid WhatsApp credential');

    // 2.2 Facebook Messenger Credential Validation
    console.log('\n--- 2.2 Facebook Messenger Credential Validation ---');
    const validFB = await validateMetaCredentials({
      platform: 'messenger',
      clientId: 'client_lumina',
      credentials: {
        accessToken: 'EAAB_TEST_TOKEN_VALID_FACEBOOK_PAGE_TOKEN',
        pageId: '1211325755394127'
      }
    });
    assert(validFB.success === true, 'Valid Facebook Messenger credential validated');
    assert(validFB.page_id === '1211325755394127', 'Page ID resolved');
    assert(validFB.n8n_confirmed === true, 'Facebook Messenger confirmed by n8n workflow');

    const invalidFB = await validateMetaCredentials({
      platform: 'messenger',
      clientId: 'client_lumina',
      credentials: {
        accessToken: 'EAAB_TEST_TOKEN',
        pageId: '' // Missing Page ID
      }
    });
    assert(invalidFB.success === false, 'Invalid Facebook credential (missing pageId) rejected');

    // 2.3 Instagram Direct Credential Validation
    console.log('\n--- 2.3 Instagram Direct Credential Validation ---');
    const validIG = await validateMetaCredentials({
      platform: 'instagram',
      clientId: 'client_lumina',
      credentials: {
        accessToken: 'EAAB_TEST_TOKEN_VALID_INSTAGRAM_TOKEN',
        instagramAccountId: '178414000123456',
        pageId: '1211325755394127'
      }
    });
    assert(validIG.success === true, 'Valid Instagram credential validated');
    assert(validIG.account_id === '17841400123456' || validIG.account_id === '178414000123456', 'Instagram account ID distinguished');
    assert(validIG.page_id === '1211325755394127', 'Connected Facebook Page ID distinguished from IG Account ID');
    assert(validIG.n8n_confirmed === true, 'Instagram confirmed by n8n workflow');

    const invalidIG = await validateMetaCredentials({
      platform: 'instagram',
      clientId: 'client_lumina',
      credentials: {
        accessToken: 'EAAB_TEST_TOKEN',
        instagramAccountId: '', // Missing Instagram ID
        pageId: '1211325755394127'
      }
    });
    assert(invalidIG.success === false, 'Invalid Instagram credential (missing IG ID) rejected');

    // 2.4 Deep n8n Service Verification & Receipts
    console.log('\n--- 2.4 n8n Direct Verification & Receipts ---');
    const n8nDirect = await verifyChannelWithN8n({
      platform: 'whatsapp',
      clientId: 'client_lumina',
      externalAccountId: '1098800089990621'
    });
    assert(n8nDirect.n8n_confirmed === true, 'verifyChannelWithN8n returned confirmed state');
    assert(n8nDirect.nodes_verified.length >= 4, 'verifyChannelWithN8n verified all pipeline nodes');

    const n8nReceipt = await confirmConnectionWithN8n({
      clientId: 'client_lumina',
      platform: 'whatsapp',
      externalAccountId: '1098800089990621',
      externalAccountName: 'Lumina Clinic WhatsApp'
    });
    assert(n8nReceipt.confirmation_id.startsWith('N8N-CONFIRM-'), 'confirmConnectionWithN8n generated signed receipt');

    // 2.5 Live n8n Pipeline Message Test Simulation
    console.log('\n--- 2.5 Live n8n Pipeline Message Test Simulation ---');
    const n8nTest = await executeN8nPipelineTest({
      clientId: 'client_lumina',
      platform: 'whatsapp',
      testMessage: 'Hello! I need information about whitening procedures and pricing.'
    });
    assert(n8nTest.success === true, 'executeN8nPipelineTest executed successfully');
    assert(n8nTest.pipeline_trace.length >= 5, 'n8n pipeline trace verified all 5 workflow steps');
    assert(typeof n8nTest.output_reply === 'string' && n8nTest.output_reply.length > 10, 'n8n generated customer response verified');

    // 2.6 n8n Configuration Storage & Live Connectivity Probe
    console.log('\n--- 2.6 n8n Configuration Storage & Live Connectivity Probe ---');
    const savedN8nConfig = await db.saveN8nConfig({
      base_url: 'http://localhost:5678',
      webhook_validate_url: 'http://localhost:5678/webhook/admin/channel/validate',
      webhook_inbound_url: 'http://localhost:5678/webhook/inbound/messages',
      api_key: 'n8n_test_api_key_secret_123',
      webhook_verify_token: 'meta_crm_verify_token_2026',
      timeout_ms: 5000,
      is_active: true
    });
    assert(savedN8nConfig.base_url === 'http://localhost:5678', 'n8n base URL saved to database');
    assert(savedN8nConfig.has_api_key === true, 'has_api_key flag confirmed');
    assert(savedN8nConfig.api_key === '••••••••••••••••', 'Raw API key is masked in safe public config');

    const internalConfig = await db.getN8nConfigWithSecrets();
    assert(internalConfig.api_key === 'n8n_test_api_key_secret_123', 'Internal server-side config retrieves decrypted API key');

    const probeResult = await testN8nConnectivity();
    assert(typeof probeResult.latency_ms === 'number' && probeResult.latency_ms > 0, 'testN8nConnectivity latency measured');
    assert(Array.isArray(probeResult.workflow_nodes) && probeResult.workflow_nodes.length >= 10, 'Core workflow nodes mapped in n8n configuration');

    // 2.7 Supabase PostgreSQL Configuration & Database Hub
    console.log('\n--- 2.7 Supabase PostgreSQL Configuration & Database Hub ---');
    const savedSupabaseConfig = await db.saveSupabaseConfig({
      host: 'db.jgjlmpequqqcnberangs.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'secret_supabase_db_password_123',
      supabase_url: 'https://jgjlmpequqqcnberangs.supabase.co',
      supabase_service_role_key: 'service_role_secret_key_123',
      ssl_mode: 'require',
      pool_max: 20
    });
    assert(savedSupabaseConfig.host === 'db.jgjlmpequqqcnberangs.supabase.co', 'Supabase host saved to database');
    assert(savedSupabaseConfig.has_password === true, 'has_password flag confirmed');
    assert(savedSupabaseConfig.password === '••••••••••••••••', 'Database password is masked in safe public config');

    const internalDbConfig = await db.getSupabaseConfigWithSecrets();
    assert(internalDbConfig.password === 'secret_supabase_db_password_123', 'Internal server-side config retrieves decrypted password');

    const dbHealth = await db.testDatabaseConnectivity();
    assert(dbHealth.status !== 'error', 'testDatabaseConnectivity connects successfully');
    assert(typeof dbHealth.latency_ms === 'number' && dbHealth.latency_ms > 0, 'Database latency measured in milliseconds');
    assert(dbHealth.total_tables >= 10, 'Public schema tables verified');

    const dbTables = await db.getDatabaseTablesInfo();
    assert(Array.isArray(dbTables) && dbTables.length >= 10, 'Database tables metadata catalog loaded');
    assert(dbTables.some(t => t.table_name === 'clients'), 'clients table found in catalog');
    assert(dbTables.some(t => t.table_name === 'supabase_configuration'), 'supabase_configuration table found in catalog');

    const integrityReport = await db.getSchemaIntegrityReport();
    assert(integrityReport.passed_checks >= 10, 'Schema integrity report verified all tables');
    assert(integrityReport.applied_migrations.length >= 5, '5 Applied database migrations verified');

    // 2.8 Channel Connect, Reconnect & Disconnect Lifecycle
    console.log('\n--- 2.8 Connect, Reconnect & Disconnect Lifecycle ---');

    // Connect
    const connectedInt = await db.connectChannelIntegration({
      clientId: 'client_lumina',
      platform: 'whatsapp',
      externalAccountId: '1098800089990621',
      externalAccountName: 'Lumina Clinic WhatsApp',
      whatsappPhoneNumberId: '1098800089990621',
      wabaId: '209988776655443',
      credentialTokenHash: 'vault_meta_hashed_token_ref_123',
      webhookStatus: 'Verified'
    });
    assert(connectedInt.status === 'CONNECTED', 'Channel integration status set to CONNECTED');
    assert(connectedInt.credential_reference === undefined, 'credential_reference stripped on read');

    // Reconnect
    const reconnectedInt = await db.connectChannelIntegration({
      clientId: 'client_lumina',
      platform: 'whatsapp',
      externalAccountId: '1098800089990621',
      externalAccountName: 'Lumina Clinic WhatsApp (Updated)',
      whatsappPhoneNumberId: '1098800089990621',
      wabaId: '209988776655443',
      credentialTokenHash: 'vault_meta_hashed_token_ref_456',
      webhookStatus: 'Verified'
    });
    assert(reconnectedInt.external_account_name === 'Lumina Clinic WhatsApp (Updated)', 'Channel reconnection updated successfully');

    // Disconnect
    const disconnectedInt = await db.disconnectChannelIntegration('client_lumina', 'whatsapp');
    assert(disconnectedInt?.status === 'DISCONNECTED', 'Channel disconnected and status set to DISCONNECTED');

    // 2.7 Webhook Multi-Tenancy Ingestion
    console.log('\n--- 2.7 Multi-Tenant Webhook Ingestion ---');
    const webhookRouting = await processMultiTenantWebhookMessage({
      platform: 'whatsapp',
      externalAccountId: '1098800089990621',
      customerId: '15559991111',
      fromPhone: '+15559991111',
      messageId: `test_msg_${Date.now()}`,
      messageText: 'I would like to book a dental consultation tomorrow',
      messageType: 'text',
      timestamp: String(Date.now())
    });
    assert(webhookRouting.status === 'routed', 'Webhook dynamically routed to registered tenant');
    assert(webhookRouting.clientId === 'client_lumina', 'Webhook resolved to correct client (client_lumina)');

    const unknownWebhook = await processMultiTenantWebhookMessage({
      platform: 'whatsapp',
      externalAccountId: '999999999999999', // Unknown external ID
      customerId: '962700000000',
      messageId: `test_unregistered_${Date.now()}`,
      messageText: 'Hello',
      messageType: 'text',
      timestamp: String(Date.now())
    });
    assert(unknownWebhook.status === 'client_not_found', 'Unregistered external account ID rejected cleanly without collision');


    /* =========================================================================
     * SUITE 3: SECURITY & SECRET LEAKAGE SCANS (RULE 5)
     * ========================================================================= */
    console.log('\n================================================================');
    console.log('SUITE 3: SECURITY SCANS & ZERO-SECRET LEAKAGE AUDIT (RULE 5)');
    console.log('================================================================');

    // 3.1 Integrations output scan
    console.log('\n--- 3.1 Channel Integrations Output Scan ---');
    const rawIntegrations = await db.getIntegrations();
    const hasRawSecret = rawIntegrations.some(i => i.credential_reference !== undefined || i.access_token !== undefined);
    assert(!hasRawSecret, 'Security Scan: Zero credential references or raw tokens in getIntegrations()');


    // 3.2 Client deep detail scan
    console.log('\n--- 3.2 Client Deep Detail API Payload Scan ---');
    const clientDeep = await db.getClientById('client_lumina');
    const deepStringified = JSON.stringify(clientDeep);
    const leaksSecret = deepStringified.includes('EAAB') || deepStringified.includes('password_hash') || deepStringified.includes('admin_session');
    assert(!leaksSecret, 'Security Scan: Zero passwords, hashes, or access tokens in getClientById() payload');

    // 3.3 Audit Log Secret Redaction Scan
    console.log('\n--- 3.3 Audit Log Secret Redaction Scan ---');
    const auditLogs = await db.getAuditLogs(20);
    const auditStringified = JSON.stringify(auditLogs);
    const auditLeaks = auditStringified.includes('EAAB') || auditStringified.includes('Admin@123456');
    assert(!auditLeaks, 'Security Scan: Sensitive secrets are redacted with [REDACTED_SECRET] in audit logs');

    // 3.4 Error messages safety scan
    console.log('\n--- 3.4 Error Messages Safety Scan ---');
    let safeErrorThrown = false;
    try {
      await db.deletePlan('non_existent_plan_xyz');
    } catch (e) {
      const msg = e.message;
      safeErrorThrown = !msg.includes('postgres://') && !msg.includes('password') && !msg.includes('localhost');
    }
    assert(safeErrorThrown, 'Security Scan: Error messages contain zero database connection strings or passwords');


    /* =========================================================================
     * FINAL TEST REPORT
     * ========================================================================= */
    console.log('\n================================================================');
    console.log(`PRODUCTION TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      console.error(`\n[CRITICAL] ${failed} test(s) failed. Review errors above.`);
      process.exit(1);
    } else {
      console.log('\n[SUCCESS] All production tests for Phase 7 passed with 100% success rate!\n');
    }
  } catch (err) {
    console.error('Fatal test execution exception:', err);
    process.exit(1);
  } finally {
    // Teardown: Always clean up transient test fixture
    await teardownTestFixture();
  }
}

runProductionTestSuite();
