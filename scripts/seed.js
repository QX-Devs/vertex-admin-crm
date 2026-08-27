const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

function parseEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  }
  return env;
}

const env = parseEnv();
const pool = new Pool({
  host: env.host || env.POSTGRES_HOST,
  port: parseInt(env.port || env.POSTGRES_PORT || '5432', 10),
  database: env.database || env.POSTGRES_DB || 'postgres',
  user: env.user || env.POSTGRES_USER || 'postgres',
  password: env.password || env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('=== Seeding Supabase PostgreSQL with Admin Panel Data ===');
    await client.query('BEGIN');

    // Clear existing table contents
    await client.query(`
      TRUNCATE TABLE 
        public.audit_logs,
        public.admin_notifications,
        public.leads_orders,
        public.conversations,
        public.usage_counters,
        public.idempotency_keys,
        public.channel_integrations,
        public.client_knowledge_base,
        public.client_settings,
        public.clients,
        public.plans,
        public.admin_users
      CASCADE;
    `);

    // 1. Admin Users
    console.log('Seeding Admin Users...');
    const passwordHash = bcrypt.hashSync('Admin@123456', 10);
    const adminUsers = [
      { id: 'a1b2c3d4-0001-4000-8000-000000000001', email: 'admin@example.com', name: 'Super Administrator', role: 'superadmin' },
      { id: 'a1b2c3d4-0002-4000-8000-000000000002', email: 'manager@example.com', name: 'Operations Manager', role: 'admin' },
      { id: 'a1b2c3d4-0003-4000-8000-000000000003', email: 'agent@example.com', name: 'Support Agent', role: 'operator' },
    ];

    for (const u of adminUsers) {
      await client.query(
        `INSERT INTO public.admin_users (id, email, password_hash, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name`,
        [u.id, u.email, passwordHash, u.name, u.role]
      );
    }

    // 2. Plans
    console.log('Seeding Plans...');
    const plans = [
      {
        plan_id: 'starter',
        name: 'Starter Tier',
        monthly_chat_limit: 1000,
        allowed_channels: JSON.stringify(['whatsapp']),
        allowed_message_types: JSON.stringify(['text', 'button', 'interactive']),
        enabled_modules: JSON.stringify(['ai', 'leads']),
        lead_fields: JSON.stringify(['name', 'phone', 'service']),
        ai_level: 'Basic',
        memory_level: 'Window',
        order_capture: false,
        human_handoff: true,
        storage_level: 'postgres',
        crm_enabled: true,
        is_active: true
      },
      {
        plan_id: 'professional',
        name: 'Professional Tier',
        monthly_chat_limit: 5000,
        allowed_channels: JSON.stringify(['whatsapp', 'messenger', 'instagram']),
        allowed_message_types: JSON.stringify(['text', 'image', 'audio', 'document', 'location', 'button', 'interactive']),
        enabled_modules: JSON.stringify(['ai', 'leads', 'orders', 'knowledge_base']),
        lead_fields: JSON.stringify(['name', 'phone', 'service', 'area', 'notes']),
        ai_level: 'Advanced',
        memory_level: 'Window',
        order_capture: true,
        human_handoff: true,
        storage_level: 'postgres',
        crm_enabled: true,
        is_active: true
      },
      {
        plan_id: 'enterprise',
        name: 'Enterprise VIP Tier',
        monthly_chat_limit: 25000,
        allowed_channels: JSON.stringify(['whatsapp', 'messenger', 'instagram']),
        allowed_message_types: JSON.stringify(['text', 'image', 'audio', 'video', 'document', 'location', 'button', 'interactive']),
        enabled_modules: JSON.stringify(['ai', 'leads', 'orders', 'knowledge_base', 'custom_webhook', 'analytics']),
        lead_fields: JSON.stringify(['name', 'phone', 'service', 'area', 'address', 'booking_date', 'notes']),
        ai_level: 'Custom',
        memory_level: 'Vector',
        order_capture: true,
        human_handoff: true,
        storage_level: 'postgres',
        crm_enabled: true,
        is_active: true
      }
    ];

    for (const p of plans) {
      await client.query(
        `INSERT INTO public.plans (
          plan_id, name, monthly_chat_limit, allowed_channels, allowed_message_types,
          enabled_modules, lead_fields, ai_level, memory_level, order_capture,
          human_handoff, storage_level, crm_enabled, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days')
        ON CONFLICT (plan_id) DO UPDATE SET
          name = EXCLUDED.name,
          monthly_chat_limit = EXCLUDED.monthly_chat_limit,
          allowed_channels = EXCLUDED.allowed_channels,
          allowed_message_types = EXCLUDED.allowed_message_types,
          enabled_modules = EXCLUDED.enabled_modules,
          lead_fields = EXCLUDED.lead_fields,
          ai_level = EXCLUDED.ai_level,
          memory_level = EXCLUDED.memory_level,
          order_capture = EXCLUDED.order_capture,
          human_handoff = EXCLUDED.human_handoff,
          storage_level = EXCLUDED.storage_level,
          crm_enabled = EXCLUDED.crm_enabled,
          is_active = EXCLUDED.is_active`,
        [
          p.plan_id, p.name, p.monthly_chat_limit, p.allowed_channels, p.allowed_message_types,
          p.enabled_modules, p.lead_fields, p.ai_level, p.memory_level, p.order_capture,
          p.human_handoff, p.storage_level, p.crm_enabled, p.is_active
        ]
      );
    }

    // 3. Clients
    console.log('Seeding Clients...');
    const clients = [
      {
        client_id: 'client_lumina',
        channel_account_id: '1098800089990621',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        channel: 'whatsapp',
        status: 'active',
        plan_id: 'professional',
        owner_phone: '+1 (555) 234-5678',
        owner_email: 'contact@lumina-clinic.com',
        reply_tone: 'Professional, warm, highly accurate',
        service_type: 'Medical consultations and appointments',
        timezone: 'America/New_York',
        storage_destination: 'postgres',
        crm_webhook_url: 'https://api.lumina-clinic.com/webhooks/leads',
        language: 'en'
      },
      {
        client_id: 'client_zest',
        channel_account_id: '1098800089990622',
        business_name: 'Zest Gourmet Bistro & Lounge',
        channel: 'whatsapp',
        status: 'active',
        plan_id: 'starter',
        owner_phone: '+1 (555) 345-6789',
        owner_email: 'info@zestgourmet.com',
        reply_tone: 'Energetic, welcoming, fast',
        service_type: 'Table reservations and dining',
        timezone: 'America/New_York',
        storage_destination: 'postgres',
        crm_webhook_url: '',
        language: 'en'
      },
      {
        client_id: 'client_nexus',
        channel_account_id: '1098800089990623',
        business_name: 'Nexus Cloud Technologies',
        channel: 'whatsapp',
        status: 'active',
        plan_id: 'enterprise',
        owner_phone: '+1 (555) 456-7890',
        owner_email: 'hello@nexustech.io',
        reply_tone: 'Technical, consultative, executive',
        service_type: 'Software development & AI solutions',
        timezone: 'America/New_York',
        storage_destination: 'postgres',
        crm_webhook_url: 'https://nexustech.io/api/crm/events',
        language: 'en'
      },
      {
        client_id: 'client_aura',
        channel_account_id: '1098800089990624',
        business_name: 'Aura Wellness & Spa Retreat',
        channel: 'instagram',
        status: 'paused',
        plan_id: 'professional',
        owner_phone: '+1 (555) 567-8901',
        owner_email: 'bookings@auraspa.com',
        reply_tone: 'Calm, refined, serene',
        service_type: 'Spa therapies and skincare',
        timezone: 'America/New_York',
        storage_destination: 'postgres',
        crm_webhook_url: '',
        language: 'en'
      },
      {
        client_id: 'client_prime',
        channel_account_id: '1098800089990625',
        business_name: 'Prime Real Estate Group',
        channel: 'messenger',
        status: 'suspended',
        plan_id: 'enterprise',
        owner_phone: '+1 (555) 678-9012',
        owner_email: 'sales@primerealestate.com',
        reply_tone: 'Commercial, direct',
        service_type: 'Real estate advisory and sales',
        timezone: 'America/New_York',
        storage_destination: 'postgres',
        crm_webhook_url: '',
        language: 'en'
      }
    ];

    for (const c of clients) {
      await client.query(
        `INSERT INTO public.clients (
          client_id, channel_account_id, business_name, channel, status,
          plan_id, owner_phone, owner_email, reply_tone, service_type,
          timezone, storage_destination, crm_webhook_url, language,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day')
        ON CONFLICT (client_id) DO UPDATE SET
          channel_account_id = EXCLUDED.channel_account_id,
          business_name = EXCLUDED.business_name,
          channel = EXCLUDED.channel,
          status = EXCLUDED.status,
          plan_id = EXCLUDED.plan_id,
          owner_phone = EXCLUDED.owner_phone,
          owner_email = EXCLUDED.owner_email,
          reply_tone = EXCLUDED.reply_tone,
          service_type = EXCLUDED.service_type,
          timezone = EXCLUDED.timezone,
          storage_destination = EXCLUDED.storage_destination,
          crm_webhook_url = EXCLUDED.crm_webhook_url,
          language = EXCLUDED.language,
          updated_at = NOW()`,
        [
          c.client_id, c.channel_account_id, c.business_name, c.channel, c.status,
          c.plan_id, c.owner_phone, c.owner_email, c.reply_tone, c.service_type,
          c.timezone, c.storage_destination, c.crm_webhook_url, c.language
        ]
      );
    }

    // 4. Client Settings
    console.log('Seeding Client Settings...');
    const settings = [
      {
        client_id: 'client_lumina',
        service_description: 'Advanced specialty clinic for cosmetic dentistry, dental implants, and laser skin treatments.',
        pricing_rules: 'Initial dental examination $50. Laser teeth whitening packages start from $180.',
        coverage_rules: 'Downtown Center, Monday to Saturday 9:00 AM - 7:00 PM.',
        booking_requirements: 'Full name, phone number, requested treatment, and preferred time.',
        fallback_response: 'Hello! Your inquiry has been routed to our receptionist desk and we will contact you shortly.',
        escalation_keyword: 'doctor',
        human_agent_phone: '+1 (555) 234-5678',
        booking_required_fields: JSON.stringify(['name', 'phone', 'service', 'booking_date'])
      },
      {
        client_id: 'client_zest',
        service_description: 'Upscale bistro offering handcrafted dining, artisanal coffee, and fresh Italian cuisine.',
        pricing_rules: 'Lunch special $25 per person. Evening tasting menu $45.',
        coverage_rules: 'West End district. Takeout & delivery available across the metro area.',
        booking_requirements: 'Party size, date, preferred seating (indoor/patio), and dietary notes.',
        fallback_response: 'Welcome to Zest! Please hold while we connect you to our floor manager.',
        escalation_keyword: 'manager',
        human_agent_phone: '+1 (555) 345-6789',
        booking_required_fields: JSON.stringify(['name', 'phone', 'service', 'notes'])
      },
      {
        client_id: 'client_nexus',
        service_description: 'Enterprise AI and full-stack software development firm specializing in conversational pipelines.',
        pricing_rules: 'Initial architectural discovery session is complimentary. Projects scoped on milestones.',
        coverage_rules: 'Global remote delivery across North America, EMEA, and APAC.',
        booking_requirements: 'Company name, project scope, email, and target timeline.',
        fallback_response: 'Welcome to Nexus! A solutions architect will reach out via email to schedule your discovery call.',
        escalation_keyword: 'engineer',
        human_agent_phone: '+1 (555) 456-7890',
        booking_required_fields: JSON.stringify(['name', 'phone', 'service', 'area', 'notes'])
      }
    ];

    for (const s of settings) {
      await client.query(
        `INSERT INTO public.client_settings (
          client_id, service_description, pricing_rules, coverage_rules,
          booking_requirements, fallback_response, escalation_keyword,
          human_agent_phone, booking_required_fields, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '30 days', NOW())
        ON CONFLICT (client_id) DO UPDATE SET
          service_description = EXCLUDED.service_description,
          pricing_rules = EXCLUDED.pricing_rules,
          coverage_rules = EXCLUDED.coverage_rules,
          booking_requirements = EXCLUDED.booking_requirements,
          fallback_response = EXCLUDED.fallback_response,
          escalation_keyword = EXCLUDED.escalation_keyword,
          human_agent_phone = EXCLUDED.human_agent_phone,
          booking_required_fields = EXCLUDED.booking_required_fields,
          updated_at = NOW()`,
        [
          s.client_id, s.service_description, s.pricing_rules, s.coverage_rules,
          s.booking_requirements, s.fallback_response, s.escalation_keyword,
          s.human_agent_phone, s.booking_required_fields
        ]
      );
    }

    // 5. Knowledge Base
    console.log('Seeding Client Knowledge Base...');
    const kb = [
      {
        client_id: 'client_lumina',
        section_key: 'Available Services',
        content: 'Laser teeth whitening, instant dental implants, porcelain veneers, and microscopic endodontics.',
        enabled: true
      },
      {
        client_id: 'client_lumina',
        section_key: 'Operating Hours',
        content: 'Monday - Saturday: 9:00 AM - 7:00 PM. Sunday: Closed.',
        enabled: true
      },
      {
        client_id: 'client_zest',
        section_key: 'Coffee & Drinks Menu',
        content: 'Specialty single-origin coffee from Ethiopia and Colombia brewed via V60, Aeropress, and espresso bar.',
        enabled: true
      }
    ];

    for (const item of kb) {
      await client.query(
        `INSERT INTO public.client_knowledge_base (client_id, section_key, content, enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '20 days', NOW())`,
        [item.client_id, item.section_key, item.content, item.enabled]
      );
    }

    // 6. Channel Integrations
    console.log('Seeding Channel Integrations...');
    const integrations = [
      {
        id: 'c1b2c3d4-0001-4000-8000-000000000001',
        client_id: 'client_lumina',
        platform: 'whatsapp',
        status: 'CONNECTED',
        external_account_id: '1098800089990621',
        external_account_name: 'Lumina Clinic WhatsApp Official',
        facebook_page_id: null,
        instagram_account_id: null,
        whatsapp_phone_number_id: '1098800089990621',
        waba_id: 'waba_998877665544',
        credential_reference: 'vault:secret:lumina_wa_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({ quality_rating: 'GREEN', display_phone: '+1 (555) 234-5678' })
      },
      {
        id: 'c1b2c3d4-0002-4000-8000-000000000002',
        client_id: 'client_lumina',
        platform: 'messenger',
        status: 'CONNECTED',
        external_account_id: '1211325755394127',
        external_account_name: 'Lumina Dental & Aesthetic Center',
        facebook_page_id: '1211325755394127',
        instagram_account_id: null,
        whatsapp_phone_number_id: null,
        waba_id: null,
        credential_reference: 'vault:secret:lumina_fb_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({})
      },
      {
        id: 'c1b2c3d4-0003-4000-8000-000000000003',
        client_id: 'client_lumina',
        platform: 'instagram',
        status: 'CONNECTED',
        external_account_id: '178414000123456',
        external_account_name: '@lumina_clinic_official',
        facebook_page_id: '1211325755394127',
        instagram_account_id: '178414000123456',
        whatsapp_phone_number_id: null,
        waba_id: null,
        credential_reference: 'vault:secret:lumina_ig_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({})
      },
      {
        id: 'c1b2c3d4-0004-4000-8000-000000000004',
        client_id: 'client_zest',
        platform: 'whatsapp',
        status: 'CONNECTED',
        external_account_id: '1098800089990622',
        external_account_name: 'Zest Restaurant Official',
        facebook_page_id: null,
        instagram_account_id: null,
        whatsapp_phone_number_id: '1098800089990622',
        waba_id: 'waba_112233445566',
        credential_reference: 'vault:secret:zest_wa_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({ quality_rating: 'GREEN', display_phone: '+1 (555) 345-6789' })
      },
      {
        id: 'c1b2c3d4-0005-4000-8000-000000000005',
        client_id: 'client_nexus',
        platform: 'messenger',
        status: 'CONNECTED',
        external_account_id: 'page_987654321',
        external_account_name: 'Nexus Cloud Technologies Page',
        facebook_page_id: 'page_987654321',
        instagram_account_id: null,
        whatsapp_phone_number_id: null,
        waba_id: null,
        credential_reference: 'vault:secret:nexus_fb_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({ page_category: 'Information Technology' })
      },
      {
        id: 'c1b2c3d4-0006-4000-8000-000000000006',
        client_id: 'client_nexus',
        platform: 'instagram',
        status: 'CONNECTED',
        external_account_id: 'ig_17841400987654',
        external_account_name: '@nexustech.official',
        facebook_page_id: 'page_987654321',
        instagram_account_id: 'ig_17841400987654',
        whatsapp_phone_number_id: null,
        waba_id: null,
        credential_reference: 'vault:secret:nexus_ig_token',
        webhook_status: 'verified_active',
        metadata: JSON.stringify({ followers_count: 14200 })
      },
      {
        id: 'c1b2c3d4-0007-4000-8000-000000000007',
        client_id: 'client_aura',
        platform: 'instagram',
        status: 'EXPIRED',
        external_account_id: 'ig_17841400123456',
        external_account_name: '@auraspa.retreat',
        facebook_page_id: 'page_123456789',
        instagram_account_id: 'ig_17841400123456',
        whatsapp_phone_number_id: null,
        waba_id: null,
        credential_reference: 'vault:secret:aura_ig_token',
        webhook_status: 'error_auth_expired',
        metadata: JSON.stringify({})
      },
      {
        id: 'c1b2c3d4-0008-4000-8000-000000000008',
        client_id: 'client_prime',
        platform: 'whatsapp',
        status: 'DISCONNECTED',
        external_account_id: '1098800089990625',
        external_account_name: 'Prime Properties WhatsApp',
        facebook_page_id: null,
        instagram_account_id: null,
        whatsapp_phone_number_id: '1098800089990625',
        waba_id: 'waba_554433221100',
        credential_reference: '',
        webhook_status: 'inactive',
        metadata: JSON.stringify({})
      }
    ];

    for (const intg of integrations) {
      await client.query(
        `INSERT INTO public.channel_integrations (
          id, client_id, platform, status, external_account_id,
          external_account_name, facebook_page_id, instagram_account_id,
          whatsapp_phone_number_id, waba_id, credential_reference,
          webhook_status, last_validated_at, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - INTERVAL '1 hour', $13, NOW() - INTERVAL '30 days', NOW())
        ON CONFLICT (client_id, platform) DO UPDATE SET
          status = EXCLUDED.status,
          external_account_id = EXCLUDED.external_account_id,
          external_account_name = EXCLUDED.external_account_name,
          facebook_page_id = EXCLUDED.facebook_page_id,
          instagram_account_id = EXCLUDED.instagram_account_id,
          whatsapp_phone_number_id = EXCLUDED.whatsapp_phone_number_id,
          waba_id = EXCLUDED.waba_id,
          credential_reference = EXCLUDED.credential_reference,
          webhook_status = EXCLUDED.webhook_status,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()`,
        [
          intg.id, intg.client_id, intg.platform, intg.status, intg.external_account_id,
          intg.external_account_name, intg.facebook_page_id, intg.instagram_account_id,
          intg.whatsapp_phone_number_id, intg.waba_id, intg.credential_reference,
          intg.webhook_status, intg.metadata
        ]
      );
    }

    // 7. Usage Counters
    console.log('Seeding Usage Counters...');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usages = [
      { client_id: 'client_lumina', month: currentMonth, used_chats: 3890, monthly_limit: 5000 },
      { client_id: 'client_zest', month: currentMonth, used_chats: 920, monthly_limit: 1000 },
      { client_id: 'client_nexus', month: currentMonth, used_chats: 8450, monthly_limit: 25000 },
      { client_id: 'client_aura', month: currentMonth, used_chats: 410, monthly_limit: 5000 },
      { client_id: 'client_prime', month: currentMonth, used_chats: 25400, monthly_limit: 25000 },
    ];

    for (const u of usages) {
      await client.query(
        `INSERT INTO public.usage_counters (client_id, month, used_chats, monthly_limit, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '15 days', NOW())
         ON CONFLICT (client_id, month) DO UPDATE SET
          used_chats = EXCLUDED.used_chats,
          monthly_limit = EXCLUDED.monthly_limit,
          updated_at = NOW()`,
        [u.client_id, u.month, u.used_chats, u.monthly_limit]
      );
    }

    // 8. Conversations
    console.log('Seeding Conversations...');
    const conversations = [
      {
        client_id: 'client_lumina',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        customer_id: '15558889901',
        from_phone: '+15558889901',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3ODg4ODg5OTAxdW==',
        message_type: 'text',
        message_text: 'Hi, I would like to inquire about laser teeth whitening appointment slots',
        public_customer_reply: 'Hello and welcome to Lumina Clinic! Our laser teeth whitening packages start from $180 including a free consultation and full checkup. Would you prefer a morning or afternoon appointment?',
        direction: 'inbound',
        block_reason: '',
        order_confirmed: false,
        current_month: currentMonth
      },
      {
        client_id: 'client_lumina',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        customer_id: '15558889901',
        from_phone: '+15558889901',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3ODg4ODg5OTAydW==',
        message_type: 'text',
        message_text: 'Next Thursday at 4:00 PM works great for Rachel Green',
        public_customer_reply: 'Your appointment is confirmed for Thursday at 4:00 PM with Dr. Sarah for Rachel Green. We look forward to seeing you!',
        direction: 'inbound',
        block_reason: '',
        order_confirmed: true,
        current_month: currentMonth
      },
      {
        client_id: 'client_zest',
        business_name: 'Zest Gourmet Bistro & Lounge',
        customer_id: '15559991122',
        from_phone: '+15559991122',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3OTk5OTkxMTIxdW==',
        message_type: 'text',
        message_text: 'Good evening, can we reserve a table for 5 people tonight at 8:30 PM?',
        public_customer_reply: 'Good evening and welcome! We would be delighted to host you. We have a great patio table available. Could you provide a name for the reservation?',
        direction: 'inbound',
        block_reason: '',
        order_confirmed: false,
        current_month: currentMonth
      },
      {
        client_id: 'client_zest',
        business_name: 'Zest Gourmet Bistro & Lounge',
        customer_id: '15559991122',
        from_phone: '+15559991122',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3OTk5OTkxMTIydW==',
        message_type: 'text',
        message_text: 'Yes under Michael Scott, thank you so much!',
        public_customer_reply: 'Thank you Michael! Table for 5 tonight at 8:30 PM is confirmed under Michael Scott. See you soon!',
        direction: 'inbound',
        block_reason: '',
        order_confirmed: true,
        current_month: currentMonth
      },
      {
        client_id: 'client_nexus',
        business_name: 'Nexus Cloud Technologies',
        customer_id: 'ig_usr_55667788',
        from_phone: '+15550123456',
        channel: 'instagram',
        message_id: 'mid.IG_msg_11223344',
        message_type: 'text',
        message_text: 'Hi, we are looking to build a custom AI chatbot for our logistics platform in Dubai.',
        public_customer_reply: 'Hello! Thank you for reaching out to Nexus Tech Solutions. We specialize in enterprise AI pipelines and multi-agent systems. Could you share your contact phone/email so our enterprise architecture team can schedule a discovery session?',
        direction: 'inbound',
        block_reason: '',
        order_confirmed: false,
        current_month: currentMonth
      },
      {
        client_id: 'client_prime',
        business_name: 'Prime Real Estate Group',
        customer_id: 'fb_usr_998811',
        from_phone: '',
        channel: 'messenger',
        message_id: 'mid.FB_msg_778899',
        message_type: 'text',
        message_text: 'Hi, I would like information regarding the luxury penthouses available for sale',
        public_customer_reply: 'Service temporarily unavailable due to account maintenance.',
        direction: 'inbound',
        block_reason: 'client_suspended',
        order_confirmed: false,
        current_month: currentMonth
      }
    ];

    for (const cv of conversations) {
      await client.query(
        `INSERT INTO public.conversations (
          client_id, business_name, customer_id, from_phone, channel,
          message_id, message_type, message_text, public_customer_reply,
          direction, block_reason, order_confirmed, current_month, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() - INTERVAL '15 minutes')`,
        [
          cv.client_id, cv.business_name, cv.customer_id, cv.from_phone, cv.channel,
          cv.message_id, cv.message_type, cv.message_text, cv.public_customer_reply,
          cv.direction, cv.block_reason, cv.order_confirmed, cv.current_month
        ]
      );
    }

    // 9. Leads & Orders
    console.log('Seeding Leads & Orders...');
    const leadsOrders = [
      {
        client_id: 'client_lumina',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        customer_id: '15558889901',
        from_phone: '+15558889901',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3ODg4ODg5OTAydW==',
        message_type: 'text',
        message_text: 'Next Thursday at 4:00 PM works great for Rachel Green',
        public_customer_reply: 'Your appointment is confirmed for Thursday at 4:00 PM.',
        order_confirmed: true,
        lead_status: 'booked',
        order_status: 'confirmed',
        order_payload: JSON.stringify({
          customer_name: 'Rachel Green',
          phone: '+15558889901',
          service: 'Laser Whitening & Dental Exam',
          area: 'Downtown Medical Center',
          booking_date: '2026-08-27',
          booking_time: '16:00',
          amount: 180,
          notes: 'Patient requested Dr. Sarah'
        }),
        assigned_staff: 'Dr. Sarah',
        notes: 'Booking confirmed and directions sent via WhatsApp',
        current_month: currentMonth
      },
      {
        client_id: 'client_zest',
        business_name: 'Zest Gourmet Bistro & Lounge',
        customer_id: '15559991122',
        from_phone: '+15559991122',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3OTk5OTkxMTIydW==',
        message_type: 'text',
        message_text: 'Yes under Michael Scott, thank you so much!',
        public_customer_reply: 'Table for 5 tonight at 8:30 PM is confirmed.',
        order_confirmed: true,
        lead_status: 'booked',
        order_status: 'confirmed',
        order_payload: JSON.stringify({
          customer_name: 'Michael Scott',
          phone: '+15559991122',
          service: 'Patio Table for 5',
          area: 'West End District',
          booking_date: '2026-08-26',
          booking_time: '20:30',
          amount: 0,
          notes: 'Outdoor patio table - Birthday setup'
        }),
        assigned_staff: 'Alex - Floor Manager',
        notes: 'Assigned Table 14 on the terrace',
        current_month: currentMonth
      },
      {
        client_id: 'client_nexus',
        business_name: 'Nexus Cloud Technologies',
        customer_id: 'ig_usr_55667788',
        from_phone: '+15550123456',
        channel: 'instagram',
        message_id: 'mid.IG_msg_11223344',
        message_type: 'text',
        message_text: 'Hi, we are looking to build a custom AI chatbot for our logistics platform in Dubai.',
        public_customer_reply: 'Could you share your contact phone/email so our team can schedule a discovery session?',
        order_confirmed: false,
        lead_status: 'qualified',
        order_status: 'pending',
        order_payload: JSON.stringify({
          customer_name: 'Kareem Mansour',
          phone: '+15550123456',
          service: 'Enterprise AI Logistics System',
          area: 'Dubai, UAE',
          notes: 'Budget > $15k, target Q4 launch'
        }),
        assigned_staff: 'Eng. Omar',
        notes: 'Scheduled initial Zoom discovery session for Thursday 2 PM',
        current_month: currentMonth
      },
      {
        client_id: 'client_lumina',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        customer_id: '15557771122',
        from_phone: '+15557771122',
        channel: 'whatsapp',
        message_id: 'wamid.HBgNNjI3NzcxMTIyMzN1==',
        message_type: 'text',
        message_text: 'I would like to ask about porcelain veneers and treatment duration',
        public_customer_reply: 'Hello! Porcelain veneers start from $350 per tooth with complete digital smile design.',
        order_confirmed: false,
        lead_status: 'contacted',
        order_status: 'pending',
        order_payload: JSON.stringify({
          customer_name: 'Diana Prince',
          phone: '+15557771122',
          service: 'Veneers Consultation',
          area: 'Uptown'
        }),
        assigned_staff: 'Main Desk',
        notes: 'Customer requested a follow-up call tomorrow morning',
        current_month: currentMonth
      }
    ];

    for (const lo of leadsOrders) {
      await client.query(
        `INSERT INTO public.leads_orders (
          client_id, business_name, customer_id, from_phone, channel,
          message_id, message_type, message_text, public_customer_reply,
          order_confirmed, lead_status, order_status, order_payload,
          assigned_staff, notes, current_month, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW() - INTERVAL '15 minutes', NOW())`,
        [
          lo.client_id, lo.business_name, lo.customer_id, lo.from_phone, lo.channel,
          lo.message_id, lo.message_type, lo.message_text, lo.public_customer_reply,
          lo.order_confirmed, lo.lead_status, lo.order_status, lo.order_payload,
          lo.assigned_staff, lo.notes, lo.current_month
        ]
      );
    }

    // 10. Admin Notifications
    console.log('Seeding Admin Notifications...');
    const notifications = [
      {
        client_id: 'client_lumina',
        business_name: 'Lumina Dental & Aesthetic Clinic',
        owner_phone: '+1 (555) 234-5678',
        event_type: 'confirmed_order',
        block_reason: '',
        lead_status: 'booked',
        order_confirmed: true,
        customer_id: '15558889901',
        from_phone: '+15558889901',
        summary: 'Confirmed Booking: Rachel Green - Laser Whitening & Dental Exam (2026-08-27 16:00)',
        payload: JSON.stringify({ amount: 180, service: 'Laser Whitening & Dental Exam' }),
        is_read: false
      },
      {
        client_id: 'client_aura',
        business_name: 'Aura Wellness & Spa Retreat',
        owner_phone: '+1 (555) 567-8901',
        event_type: 'channel_auth_expired',
        block_reason: 'token_expired',
        lead_status: '',
        order_confirmed: false,
        customer_id: '',
        from_phone: '',
        summary: 'Security Alert: Instagram Access Token expired for Aura Wellness & Spa. Reconnect required.',
        payload: JSON.stringify({ platform: 'instagram', last_error: 'OAuthAccessTokenException' }),
        is_read: false
      },
      {
        client_id: 'client_prime',
        business_name: 'Prime Real Estate Group',
        owner_phone: '+1 (555) 678-9012',
        event_type: 'quota_exceeded',
        block_reason: 'quota_limit_exceeded',
        lead_status: '',
        order_confirmed: false,
        customer_id: '',
        from_phone: '',
        summary: 'Quota Exceeded: Client used 25,400 messages exceeding 25,000 allocated plan limit.',
        payload: JSON.stringify({ used: 25400, limit: 25000, percentage: 101.6 }),
        is_read: true
      }
    ];

    for (const notif of notifications) {
      await client.query(
        `INSERT INTO public.admin_notifications (
          client_id, business_name, owner_phone, event_type, block_reason,
          lead_status, order_confirmed, customer_id, from_phone, summary,
          payload, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - INTERVAL '1 hour')`,
        [
          notif.client_id, notif.business_name, notif.owner_phone, notif.event_type,
          notif.block_reason, notif.lead_status, notif.order_confirmed, notif.customer_id,
          notif.from_phone, notif.summary, notif.payload, notif.is_read
        ]
      );
    }

    // 11. Audit Logs
    console.log('Seeding Audit Logs...');
    const auditLogs = [
      {
        id: 'e1b2c3d4-0001-4000-8000-000000000001',
        admin_user_id: 'a1b2c3d4-0001-4000-8000-000000000001',
        admin_email: 'admin@example.com',
        action: 'client_created',
        entity: 'client',
        entity_id: 'client_nexus',
        before_state: null,
        after_state: JSON.stringify({ business_name: 'Nexus Cloud Technologies', plan_id: 'enterprise', status: 'active' }),
        result: 'success',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
      },
      {
        id: 'e1b2c3d4-0002-4000-8000-000000000002',
        admin_user_id: 'a1b2c3d4-0002-4000-8000-000000000002',
        admin_email: 'manager@example.com',
        action: 'client_status_changed',
        entity: 'client',
        entity_id: 'client_aura',
        before_state: JSON.stringify({ status: 'active' }),
        after_state: JSON.stringify({ status: 'paused', reason: 'Temporary maintenance' }),
        result: 'success',
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      {
        id: 'e1b2c3d4-0003-4000-8000-000000000003',
        admin_user_id: 'a1b2c3d4-0001-4000-8000-000000000001',
        admin_email: 'admin@example.com',
        action: 'plan_updated',
        entity: 'plan',
        entity_id: 'professional',
        before_state: JSON.stringify({ monthly_chat_limit: 4000 }),
        after_state: JSON.stringify({ monthly_chat_limit: 5000 }),
        result: 'success',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
      }
    ];

    for (const a of auditLogs) {
      await client.query(
        `INSERT INTO public.audit_logs (
          id, admin_user_id, admin_email, action, entity,
          entity_id, before_state, after_state, result,
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '2 days')`,
        [
          a.id, a.admin_user_id, a.admin_email, a.action, a.entity,
          a.entity_id, a.before_state, a.after_state, a.result,
          a.ip_address, a.user_agent
        ]
      );
    }

    await client.query('COMMIT');
    console.log('\n=== All Admin Panel Data Successfully Seeded into Supabase! ===');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
