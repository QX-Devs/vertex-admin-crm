const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Update Load Client From Postgres
const nodeLoadClient = wf.nodes.find(n => n.name === 'Load Client From Postgres');
if (nodeLoadClient) {
  nodeLoadClient.parameters.query = `select 
  c.*,
  ci.id as integration_id,
  ci.platform as integration_platform,
  ci.status as integration_status,
  ci.external_account_id as integration_account_id,
  ci.external_account_name as integration_account_name,
  ci.facebook_page_id,
  ci.instagram_account_id,
  ci.whatsapp_phone_number_id,
  ci.waba_id,
  ci.credential_reference
from public.clients c
left join public.channel_integrations ci 
  on ci.client_id = c.client_id 
  and (ci.external_account_id = $1 or ci.whatsapp_phone_number_id = $1 or ci.facebook_page_id = $1 or ci.instagram_account_id = $1)
where c.channel_account_id = $1
   or ci.external_account_id = $1
   or ci.whatsapp_phone_number_id = $1
   or ci.facebook_page_id = $1
   or ci.instagram_account_id = $1
limit 1;`;
  nodeLoadClient.parameters.options = {
    queryReplacement: '={{ [$json.channel_business_id || $json.phone_number_id || $json.business_id] }}'
  };
}

// 2. Update Normalize Client Lookup
const nodeNormLookup = wf.nodes.find(n => n.name === 'Normalize Client Lookup');
if (nodeNormLookup) {
  nodeNormLookup.parameters.jsCode = `const source = $('Production Readiness Guard').first().json;
const responses = items.map(item => item.json || {});
const safeText = value => String(value || '').replace(/[\\r\\n\\t]+/g, ' ').replace(/\\s{2,}/g, ' ').trim().slice(0, 500);
const extractFailure = response => {
  if (!response || Array.isArray(response)) return null;
  const nestedError = response.error && typeof response.error === 'object' ? response.error : {};
  const message = safeText(
    nestedError.message ||
    response.errorMessage ||
    response.error_message ||
    (typeof response.error === 'string' ? response.error : '') ||
    (response.success === false ? response.message : '')
  );
  if (!message) return null;
  return {
    message,
    code: safeText(nestedError.code || response.code || ''),
    hint: safeText(nestedError.hint || response.hint || '')
  };
};
const failures = responses.map(extractFailure).filter(Boolean);
if (failures.length) {
  const failure = failures[0];
  return [{ json: {
    ...source,
    client_found: false,
    client_status: 'lookup_failed',
    postgres_request_failed: true,
    postgres_failed_node: 'Load Client From Postgres',
    postgres_error_message: failure.message,
    postgres_error_code: failure.code,
    postgres_error_hint: failure.hint,
    postgres_response_keys: Object.keys(responses[0] || {}).slice(0, 20),
    blocked_message: 'النظام غير متاح مؤقتًا. حاول مرة ثانية بعد قليل.',
    block_reason: 'postgres_request_failed'
  } }];
}
const rows = [];
for (const response of responses) {
  if (Array.isArray(response)) rows.push(...response);
  else if (Array.isArray(response?.rows)) rows.push(...response.rows);
  else if (Array.isArray(response?.data)) rows.push(...response.data);
  else if (response?.client_id) rows.push(response);
}
const lookupKey = source.channel_business_id || source.phone_number_id || source.business_id || '';
if (rows.length < 1) {
  return [{ json: {
    ...source,
    client_found: false,
    client_match_method: 'none',
    client_lookup_key: lookupKey,
    client_status: 'not_found',
    blocked_message: 'هذا الرقم أو المعرف غير مربوط بأي عميل في النظام.',
    block_reason: 'client_not_found'
  } }];
}
const client = rows[0];
const active = client.status === 'active';
const matchMethod = client.channel === 'whatsapp' ? 'phone_number_id' : 'channel_account_id';
return [{ json: {
  ...source,
  client_found: true,
  client_match_method: matchMethod,
  client_lookup_key: lookupKey,
  client_id: client.client_id || '',
  client,
  channel: client.channel || 'whatsapp',
  business_name: client.business_name || '',
  client_status: client.status || '',
  plan_id: client.plan_id || '',
  owner_phone: client.owner_phone || '',
  reply_tone: client.reply_tone || '',
  service_type: client.service_type || '',
  timezone: client.timezone || 'Asia/Amman',
  storage_destination: client.storage_destination || '',
  crm_webhook_url: client.crm_webhook_url || '',
  client_language: client.language || 'ar-JO',
  integration_id: client.integration_id || '',
  integration_status: client.integration_status || 'CONNECTED',
  external_account_id: client.integration_account_id || client.channel_account_id || '',
  whatsapp_phone_number_id: client.whatsapp_phone_number_id || client.channel_account_id || '',
  facebook_page_id: client.facebook_page_id || client.channel_account_id || '',
  instagram_account_id: client.instagram_account_id || client.channel_account_id || '',
  waba_id: client.waba_id || '',
  credential_reference: client.credential_reference || '',
  ...(active ? {} : { blocked_message: 'الحساب غير فعال حالياً. يرجى التواصل مع الإدارة.', block_reason: 'client_not_active' })
} }];`;
}

// 3. Update Respond to User (WhatsApp)
const nodeRespondWA = wf.nodes.find(n => n.name === 'Respond to User');
if (nodeRespondWA) {
  nodeRespondWA.parameters.phoneNumberId = '={{ $json.whatsapp_phone_number_id || $json.phone_number_id || $json.channel_account_id || $json.business_id }}';
}

// 4. Update Prepare Meta Reply
const nodePrepMeta = wf.nodes.find(n => n.name === 'Prepare Meta Reply');
if (nodePrepMeta) {
  nodePrepMeta.parameters.jsCode = `// Prepare Meta Reply -- Dynamic Per-Client Credential Resolution
//
// Meta Graph API Endpoint for Page Messaging:
//   POST https://graph.facebook.com/v21.0/{FACEBOOK_PAGE_ID}/messages?access_token=...

const tryNode = name => { try { return $(name).first().json || {}; } catch(e) { return {}; } };
const cleanup    = tryNode('Cleanup Before Response');
const postproc   = tryNode('Postprocess AI Output');
const normmsg    = tryNode('Normalize Messenger Message');
const norminst   = tryNode('Normalize Instagram Message');
const normlook   = tryNode('Normalize Client Lookup');
const runtimecfg = tryNode('Prepare Client Runtime Config');

const customerId =
  cleanup.customer_id    || cleanup.from    ||
  postproc.customer_id   || postproc.from   ||
  normmsg.customer_id    || normmsg.from    ||
  norminst.customer_id   || norminst.from   ||
  normlook.customer_id   || normlook.from   || '';

const platform = (
  cleanup.platform   || postproc.platform ||
  normmsg.platform   || norminst.platform ||
  normlook.platform  || ''
).toLowerCase();

const clientRow = normlook.client || runtimecfg.client || cleanup.client || postproc.client || {};

const pageToken =
  clientRow.meta_page_access_token ||
  clientRow.page_access_token      ||
  clientRow.access_token           ||
  clientRow.meta_token             ||
  clientRow.instagram_access_token ||
  normlook.meta_page_access_token   ||
  runtimecfg.meta_page_access_token ||
  cleanup.meta_page_access_token    || '';

// Dynamically resolve target Facebook Page ID from client & channel integration
let pageId =
  clientRow.facebook_page_id ||
  clientRow.meta_page_id     ||
  clientRow.external_account_id ||
  normlook.facebook_page_id ||
  normlook.external_account_id ||
  cleanup.page_id ||
  cleanup.facebook_page_id || '';

const finalReply = cleanup.final_reply || postproc.final_reply || postproc.public_customer_reply || '';

const baseUrl = 'https://graph.facebook.com/v21.0/' + (pageId || 'me') + '/messages';
const metaUrl = pageToken ? baseUrl + '?access_token=' + encodeURIComponent(pageToken) : baseUrl;

return [{ json: {
  meta_recipient_id:     customerId,
  meta_page_id:          pageId,
  meta_platform:         platform,
  meta_page_token_found: Boolean(pageToken),
  meta_reply_text:       finalReply,
  meta_url:              metaUrl,
  meta_json_body: {
    recipient:      { id: customerId },
    message:        { text: finalReply },
    messaging_type: 'RESPONSE'
  }
} }];`;
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('Successfully updated workflow.json for Phase 3 dynamic credential resolution!');
