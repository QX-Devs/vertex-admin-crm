import { db } from './db';
import { ChannelType } from './types';

export interface NormalizedWebhookMessage {
  platform: ChannelType;
  externalAccountId: string;
  customerId: string;
  fromPhone?: string;
  messageId: string;
  messageText: string;
  messageType: string;
  timestamp: string;
  mediaUrl?: string;
  rawEvent?: any;
}

export interface WebhookProcessingResult {
  status: 'routed' | 'client_not_found' | 'client_inactive' | 'ignored_echo' | 'invalid_payload';
  clientId?: string;
  integrationId?: string;
  businessName?: string;
  error?: string;
}

/**
 * Phase 4 Multi-Tenancy Router:
 * Dynamically resolves incoming webhook events strictly by:
 * platform + external_account_id -> client_id + integration_id
 * Never relies on a single hardcoded client or global token.
 */
export async function processMultiTenantWebhookMessage(
  msg: NormalizedWebhookMessage
): Promise<WebhookProcessingResult> {
  const { platform, externalAccountId, customerId, messageId, messageText, messageType } = msg;

  if (!externalAccountId) {
    return { status: 'invalid_payload', error: 'Missing external account identifier in webhook payload.' };
  }

  // 1. Query client and channel integration by externalAccountId and platform
  const clientIntegrations = await db.getIntegrations();
  const matchedIntegration = clientIntegrations.find(
    i => (
      i.platform === platform &&
      (
        i.external_account_id === externalAccountId ||
        i.whatsapp_phone_number_id === externalAccountId ||
        i.facebook_page_id === externalAccountId ||
        i.instagram_account_id === externalAccountId
      )
    )
  );

  let targetClientId = matchedIntegration?.client_id;

  // Fallback check against clients table directly
  if (!targetClientId) {
    const clients = await db.getClients();
    const client = clients.find(c => c.channel_account_id === externalAccountId && c.channel === platform);
    if (client) {
      targetClientId = client.client_id;
    }
  }

  if (!targetClientId) {
    console.warn(`[MultiTenantWebhook] No registered tenant found for platform='${platform}' and externalAccountId='${externalAccountId}'`);
    return {
      status: 'client_not_found',
      error: `No registered client found for ${platform} identifier: ${externalAccountId}`
    };
  }

  const client = await db.getClientById(targetClientId);
  if (!client) {
    return { status: 'client_not_found', error: `Client ${targetClientId} not found in database.` };
  }

  if (client.status !== 'active') {
    return {
      status: 'client_inactive',
      clientId: client.client_id,
      businessName: client.business_name,
      error: `Client ${client.client_id} is currently ${client.status}. Message routing halted.`
    };
  }

  // Record incoming conversation into the multi-tenant database
  await db.query(
    `INSERT INTO public.conversations (client_id, customer_id, from_phone, channel, message_id, message_type, message_text, direction, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      client.client_id,
      customerId,
      msg.fromPhone || customerId,
      platform,
      messageId,
      messageType,
      messageText,
      'inbound',
      new Date().toISOString()
    ]
  );

  return {
    status: 'routed',
    clientId: client.client_id,
    integrationId: matchedIntegration?.id,
    businessName: client.business_name
  };
}
