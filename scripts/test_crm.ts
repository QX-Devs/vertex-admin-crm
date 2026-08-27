import { db } from '../lib/db';
import { authenticateAdmin, signToken, verifyToken } from '../lib/auth';

async function runTests() {
  console.log('====================================================');
  console.log('      PHASE 1: ADMIN CRM VERIFICATION SUITE         ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // Test 1: Admin Authentication & Role Security
    console.log('--- 1. Admin Authentication & Role Security ---');
    const validAdmin = await authenticateAdmin('admin@example.com', 'Admin@123456');
    assert(validAdmin !== null, 'Valid superadmin credentials authenticated');
    assert(validAdmin?.role === 'superadmin', 'Superadmin role correctly resolved');

    const invalidAuth = await authenticateAdmin('admin@example.com', 'WrongPassword');
    assert(invalidAuth === null, 'Invalid password correctly rejected');

    const token = await signToken({
      userId: validAdmin!.id,
      email: validAdmin!.email,
      name: validAdmin!.name,
      role: validAdmin!.role
    });
    assert(typeof token === 'string' && token.length > 20, 'JWT token successfully generated');

    const verified = await verifyToken(token);
    assert(verified?.email === 'admin@example.com', 'JWT session token verified server-side');

    // Test 2: Clients Management & Aggregation
    console.log('\n--- 2. Clients Management & Aggregation ---');
    const clients = await db.getClients();
    assert(Array.isArray(clients) && clients.length >= 5, `Fetched ${clients.length} clients`);
    const lumina = clients.find(c => c.client_id === 'client_lumina');
    assert(lumina !== undefined, 'Lumina Clinic client resolved');
    assert(typeof lumina?.used_chats === 'number', 'Client usage calculation joined dynamically');
    assert(typeof lumina?.leads_count === 'number', 'Client leads count joined dynamically');
    assert(lumina?.whatsapp_status === 'CONNECTED', 'WhatsApp channel status resolved');

    // Test 3: Client Details Deep Hierarchy
    console.log('\n--- 3. Client Details Deep Hierarchy ---');
    const clientDetail = await db.getClientById('client_lumina');
    assert(clientDetail !== null, 'Client details retrieved');
    assert(clientDetail.settings !== null, 'Client settings retrieved');
    assert(Array.isArray(clientDetail.knowledgeBase), 'Client knowledge base retrieved');
    assert(Array.isArray(clientDetail.integrations), 'Client channel integrations retrieved');
    assert(Array.isArray(clientDetail.conversations), 'Scoped conversations retrieved');
    assert(Array.isArray(clientDetail.leads), 'Scoped leads retrieved');

    // Security Check: Ensure secrets are redacted
    const hasSecret = clientDetail.integrations.some((i: any) => i.credential_reference !== undefined);
    assert(!hasSecret, 'Security Rule 5: Raw credential_reference is stripped from client responses');

    // Test 4: Centralized Conversations
    console.log('\n--- 4. Centralized Conversations ---');
    const allConvs = await db.getConversations();
    assert(allConvs.length >= 5, `Retrieved ${allConvs.length} centralized conversations`);
    const filteredConvs = await db.getConversations({ clientId: 'client_lumina' });
    assert(filteredConvs.every(c => c.client_id === 'client_lumina'), 'Conversation filtering by client works');

    // Test 5: Leads & State Transitions
    console.log('\n--- 5. Leads Pipeline & Staff Assignment ---');
    const leads = await db.getLeads();
    assert(leads.length >= 4, `Retrieved ${leads.length} leads`);
    const leadToUpdate = leads[0];
    const updateResult = await db.updateLead(leadToUpdate.id, {
      lead_status: 'contacted',
      assigned_staff: 'Staff_Test_1',
      notes: 'Automated test note'
    });
    assert(updateResult?.lead.lead_status === 'contacted', 'Lead status successfully updated');
    assert(updateResult?.lead.assigned_staff === 'Staff_Test_1', 'Lead staff assignment saved');

    // Test 6: Orders / Bookings
    console.log('\n--- 6. Confirmed Orders & Bookings ---');
    const orders = await db.getLeads({ confirmedOnly: true });
    assert(orders.length >= 2, `Retrieved ${orders.length} confirmed orders`);
    assert(orders.every(o => o.order_confirmed === true), 'All order records are verified confirmed');

    // Test 7: Plans Management & Active Client Protection
    console.log('\n--- 7. Plans Administration & Protection Guard ---');
    const plans = await db.getPlans();
    assert(plans.length >= 3, `Retrieved ${plans.length} plans`);

    let deletionBlocked = false;
    try {
      // Professional plan is assigned to active client Lumina
      await db.deletePlan('professional');
    } catch (e) {
      deletionBlocked = true;
    }
    assert(deletionBlocked, 'Safety Guard: Deletion of plan assigned to active client is blocked');

    // Test 8: Dashboard Platform & Usage Stats
    console.log('\n--- 8. Dashboard Analytics & Health Engine ---');
    const dashboard = await db.getDashboardStats();
    assert(dashboard.platform.totalClients >= 5, 'Platform stats calculated');
    assert(dashboard.usage.totalMonthlyMessages > 0, 'Total monthly messages aggregated');
    assert(Array.isArray(dashboard.alerts) && dashboard.alerts.length > 0, 'Live operational alerts detected');
    assert(Array.isArray(dashboard.recentActivity), 'Recent activity feed generated');

    // Test 9: Immutable Audit Logging
    console.log('\n--- 9. Immutable Audit Logging ---');
    const newAudit = await db.addAuditLog({
      admin_user_id: validAdmin!.id,
      admin_email: validAdmin!.email,
      action: 'test_validation_run',
      entity: 'system',
      entity_id: 'phase1_validation',
      before_state: { status: 'running' },
      after_state: { status: 'completed' },
      result: 'success',
      ip_address: '127.0.0.1',
      user_agent: 'TestRunner/1.0'
    });
    assert(newAudit.id.startsWith('aud_'), 'Audit log recorded with generated ID');
    const logs = await db.getAuditLogs();
    assert(logs.some(l => l.action === 'test_validation_run'), 'Audit log retrieved in log history');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
