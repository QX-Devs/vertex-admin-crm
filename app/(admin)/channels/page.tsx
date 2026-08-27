'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Phone,
  MessageCircle,
  Instagram,
  Copy,
  Check,
  Unplug,
  KeyRound,
  Info,
  Building2,
  Layers,
  Plus,
  X,
  Save,
  ArrowRight,
  Cpu,
  Play,
  Terminal,
  Activity,
  Send,
  Workflow
} from 'lucide-react';

import Link from 'next/link';
import { ChannelType, IntegrationStatus, ChannelIntegration, N8nVerificationResult, N8nPipelineTestResult } from '@/lib/types';
import { ValidationResult } from '@/lib/channelValidator';




export default function ChannelsConnectPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ChannelType>('whatsapp');
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State - WhatsApp
  const [waToken, setWaToken] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waWabaId, setWaWabaId] = useState('');

  // Form State - Facebook Messenger
  const [fbToken, setFbToken] = useState('');
  const [fbPageId, setFbPageId] = useState('');

  // Form State - Instagram Direct
  const [igToken, setIgToken] = useState('');
  const [igAccountId, setIgAccountId] = useState('');
  const [igPageId, setIgPageId] = useState('');

  // Process & Validation States
  const [validating, setValidating] = useState(false);
  const [validationStage, setValidationStage] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // On-demand n8n Re-verification State
  const [verifyingN8n, setVerifyingN8n] = useState(false);
  const [n8nLiveVerification, setN8nLiveVerification] = useState<N8nVerificationResult | null>(null);

  // n8n Pipeline Test Modal State
  const [showN8nTestModal, setShowN8nTestModal] = useState(false);
  const [testingN8n, setTestingN8n] = useState(false);
  const [n8nTestInput, setN8nTestInput] = useState('Hello! What services and pricing do you offer?');
  const [n8nTestResult, setN8nTestResult] = useState<N8nPipelineTestResult | null>(null);
  const [n8nTestError, setN8nTestError] = useState('');

  // Quick Client Creation Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientModalError, setClientModalError] = useState('');
  const [newClient, setNewClient] = useState({
    client_id: '',
    business_name: '',
    channel_account_id: '',
    channel: 'whatsapp',
    plan_id: 'starter',
    owner_phone: '',
    owner_email: '',
    service_type: 'General Services',
    timezone: 'UTC',
    language: 'en'
  });

  const fetchInitialData = async () => {
    try {
      const [cRes, iRes, pRes] = await Promise.all([
        fetch('/api/admin/clients'),
        fetch('/api/admin/channels'),
        fetch('/api/admin/plans')
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData);
        if (cData.length > 0) {
          if (!selectedClientId || !cData.some((c: any) => c.client_id === selectedClientId)) {
            setSelectedClientId(cData[0].client_id);
          }
        } else {
          setSelectedClientId('');
        }
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        setIntegrations(iData);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setPlans(pData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When client or tab changes, reset validation feedback
  useEffect(() => {
    setValidationResult(null);
    setN8nLiveVerification(null);
    setN8nTestResult(null);
    setSuccessMessage('');
    setErrorMessage('');
  }, [selectedClientId, activeTab]);

  const selectedClient = clients.find(c => c.client_id === selectedClientId);
  const currentIntegration = integrations.find(
    i => i.client_id === selectedClientId && i.platform === activeTab
  );

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Quick Client Creation Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    setClientModalError('');

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      setShowAddClientModal(false);
      const createdId = newClient.client_id;
      setNewClient({
        client_id: '',
        business_name: '',
        channel_account_id: '',
        channel: 'whatsapp',
        plan_id: 'starter',
        owner_phone: '',
        owner_email: '',
        service_type: 'General Services',
        timezone: 'UTC',
        language: 'en'
      });

      await fetchInitialData();
      setSelectedClientId(createdId);
      setSuccessMessage(`Client '${newClient.business_name}' created successfully. You can now connect channels below.`);
    } catch (err: any) {
      setClientModalError(err.message || 'An error occurred while creating client');
    } finally {
      setCreatingClient(false);
    }
  };

  // Step 1: Validate Credentials & Confirm with n8n
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Please select or create a target tenant first.');
      return;
    }

    setValidating(true);
    setValidationStage(1);
    setValidationResult(null);
    setErrorMessage('');
    setSuccessMessage('');

    // Stage progression animation
    const stageTimer1 = setTimeout(() => setValidationStage(2), 600);
    const stageTimer2 = setTimeout(() => setValidationStage(3), 1300);
    const stageTimer3 = setTimeout(() => setValidationStage(4), 1900);

    let credentialsPayload: any = {};
    if (activeTab === 'whatsapp') {
      credentialsPayload = {
        accessToken: waToken,
        phoneNumberId: waPhoneNumberId,
        wabaId: waWabaId
      };
    } else if (activeTab === 'messenger') {
      credentialsPayload = {
        accessToken: fbToken,
        pageId: fbPageId
      };
    } else if (activeTab === 'instagram') {
      credentialsPayload = {
        accessToken: igToken,
        instagramAccountId: igAccountId,
        pageId: igPageId
      };
    }

    try {
      const res = await fetch('/api/admin/channels/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: activeTab,
          client_id: selectedClientId,
          credentials: credentialsPayload
        })
      });

      const data: ValidationResult = await res.json();
      setValidationResult(data);

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to validate credentials with Meta or n8n.');
      } else if (data.n8n_confirmed) {
        setSuccessMessage('Meta credentials validated and connection confirmed by n8n Workflow Automation Engine.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error during credential validation.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setValidating(false);
    }
  };

  // Step 2: Save & Activate Connection with n8n Confirmation
  const handleConnect = async () => {
    if (!validationResult || !validationResult.success || !selectedClientId) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    let connectPayload: any = {
      platform: activeTab,
      client_id: selectedClientId,
      external_account_id: validationResult.account_id,
      external_account_name: validationResult.account_name,
      webhook_status: validationResult.webhook_ready ? 'Verified' : 'Pending'
    };

    if (activeTab === 'whatsapp') {
      connectPayload.whatsapp_phone_number_id = validationResult.phone_number_id || waPhoneNumberId;
      connectPayload.waba_id = validationResult.waba_id || waWabaId;
      connectPayload.access_token = waToken;
    } else if (activeTab === 'messenger') {
      connectPayload.facebook_page_id = validationResult.page_id || fbPageId;
      connectPayload.access_token = fbToken;
    } else if (activeTab === 'instagram') {
      connectPayload.instagram_account_id = validationResult.account_id || igAccountId;
      connectPayload.facebook_page_id = validationResult.page_id || igPageId;
      connectPayload.access_token = igToken;
    }

    try {
      const res = await fetch('/api/admin/channels/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save and activate channel.');

      setSuccessMessage(
        data.n8n_receipt
          ? `Channel successfully connected and confirmed by n8n (Receipt: ${data.n8n_receipt.confirmation_id}).`
          : (data.message || 'Channel successfully connected and confirmed.')
      );
      setValidationResult(null);

      // Clear sensitive form inputs after successful activation
      setWaToken('');
      setFbToken('');
      setIgToken('');

      // Refresh integrations list
      await fetchInitialData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while activating channel.');
    } finally {
      setSaving(false);
    }
  };

  // Re-verify Connected Channel with n8n on demand
  const handleVerifyWithN8n = async () => {
    if (!selectedClientId) return;
    setVerifyingN8n(true);
    setErrorMessage('');
    setSuccessMessage('');
    setN8nLiveVerification(null);

    try {
      const res = await fetch('/api/admin/channels/n8n-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          platform: activeTab
        })
      });

      const data: N8nVerificationResult = await res.json();
      if (!res.ok) throw new Error((data as any).error || 'n8n verification request failed');

      setN8nLiveVerification(data);
      if (data.n8n_confirmed) {
        setSuccessMessage(`n8n Confirmed: Multi-tenant routing active for '${selectedClient?.business_name}' (${data.n8n_confirmation_id}).`);
      } else {
        setErrorMessage(data.message || 'n8n verification could not confirm active channel routing.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to communicate with n8n verification service.');
    } finally {
      setVerifyingN8n(false);
    }
  };

  // Execute Live Pipeline Test Message via n8n
  const handleRunN8nTest = async () => {
    if (!selectedClientId) return;
    setTestingN8n(true);
    setN8nTestError('');
    setN8nTestResult(null);

    try {
      const res = await fetch('/api/admin/channels/n8n-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          platform: activeTab,
          test_message: n8nTestInput
        })
      });

      const data: N8nPipelineTestResult = await res.json();
      if (!res.ok) throw new Error((data as any).error || 'n8n pipeline test failed');

      setN8nTestResult(data);
    } catch (err: any) {
      setN8nTestError(err.message || 'Error occurred during n8n test message processing.');
    } finally {
      setTestingN8n(false);
    }
  };

  // Disconnect Channel
  const handleDisconnect = async () => {
    if (!currentIntegration || !selectedClientId) return;
    if (!confirm(`Are you sure you want to disconnect ${activeTab} for '${selectedClient?.business_name}'?`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/channels/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          platform: activeTab
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect channel.');

      setSuccessMessage('Channel successfully disconnected.');
      setN8nLiveVerification(null);
      await fetchInitialData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while disconnecting channel.');
    } finally {
      setSaving(false);
    }
  };

  const webhookBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/${activeTab}` : `/api/webhooks/${activeTab}`;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="Channel Integration & n8n Verification"
        subtitle="Connect, validate, and verify Meta social channels with live confirmation from the n8n automation engine"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Client</span>
            </button>
            <button
              onClick={fetchInitialData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        }
      />

      <main className="p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
        {/* n8n Automation Engine + Vault Security Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Workflow className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>n8n Dynamic Automation Engine</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-[9px] text-emerald-400 font-mono">Live Sync</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Multi-tenant message routing is verified & confirmed by n8n workflow nodes before activation.
                </p>
              </div>
            </div>
            <Link
              href="/n8n-conf"
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-all shrink-0 ml-2"
            >
              <span>Configure</span>
              <ArrowRight className="h-3 w-3 text-emerald-400" />
            </Link>
          </div>


          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Zero-Exposure Server Vault</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Permanent Meta tokens are securely hashed and stored as encrypted vault references.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 hidden sm:inline-block">
              HS256 Guard
            </span>
          </div>
        </div>

        {/* Empty State Banner if no clients exist */}
        {clients.length === 0 && !loading && (
          <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100">No Business Tenants Registered Yet</h4>
              </div>
              <p className="text-xs text-slate-300">
                To connect and verify a WhatsApp, Messenger, or Instagram channel with n8n, create a client tenant profile first.
              </p>
            </div>
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shrink-0 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Client Tenant</span>
            </button>
          </div>
        )}

        {/* Client Selector Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <div>
                <label className="block text-xs font-bold text-slate-200">Select Target Tenant / Business:</label>
                <p className="text-[11px] text-slate-400">Credentials, routing rules, and n8n pipelines are bound to this tenant</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={clients.length === 0}
                className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-w-[260px] disabled:opacity-50 transition-all shadow-sm cursor-pointer"
              >
                {clients.length === 0 ? (
                  <option value="">No clients registered — Create one first</option>
                ) : (
                  clients.map(c => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.business_name} ({c.client_id})
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                title="Add New Client Tenant"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors"
              >
                <Plus className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">New Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>WhatsApp Cloud API</span>
          </button>

          <button
            onClick={() => setActiveTab('messenger')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'messenger'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Facebook Messenger</span>
          </button>

          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'instagram'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Instagram className="h-4 w-4" />
            <span>Instagram Direct</span>
          </button>
        </div>

        {/* Active Connection Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Current Channel Status</span>
              <h3 className="font-bold text-sm text-slate-100 mt-0.5">
                {activeTab === 'whatsapp' ? 'WhatsApp Business' : activeTab === 'messenger' ? 'Facebook Messenger' : 'Instagram Direct'} — {selectedClient?.business_name || 'Select a Client'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {currentIntegration?.status === 'CONNECTED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-400 text-[11px] font-semibold">
                  <Workflow className="h-3 w-3" />
                  <span>n8n Confirmed</span>
                </span>
              )}
              <StatusBadge status={currentIntegration?.status || 'NOT_CONNECTED'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Connected Account Name:</span>
              <span className="font-bold text-slate-200">
                {currentIntegration?.external_account_name || 'Not Connected'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">External Account ID:</span>
              <span className="font-mono text-slate-300">
                {currentIntegration?.external_account_id || '—'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Last Validated / Verified:</span>
              <span className="text-slate-300">
                {currentIntegration?.last_validated_at ? new Date(currentIntegration.last_validated_at).toLocaleString('en-US') : '—'}
              </span>
            </div>
          </div>

          {currentIntegration?.status === 'CONNECTED' && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyWithN8n}
                  disabled={verifyingN8n}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
                  title="Re-verify and confirm live connection with n8n workflow"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${verifyingN8n ? 'animate-spin' : ''}`} />
                  <span>{verifyingN8n ? 'Verifying with n8n...' : 'Verify with n8n'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowN8nTestModal(true);
                    setN8nTestResult(null);
                    setN8nTestError('');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-xs font-semibold transition-all"
                  title="Simulate sending a message through the n8n pipeline"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Test Message via n8n</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/60 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Unplug className="h-3.5 w-3.5" />
                <span>Disconnect Channel</span>
              </button>
            </div>
          )}

          {/* On-demand n8n Live Verification Result Display */}
          {n8nLiveVerification && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-800/50 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>n8n Workflow Verification Receipt</span>
                </div>
                <span className="text-[10px] text-slate-400">ID: {n8nLiveVerification.n8n_confirmation_id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="text-slate-300">
                  <span className="text-slate-500 block">Workflow Engine:</span>
                  <span className="text-emerald-300 font-bold">{n8nLiveVerification.n8n_status}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500 block">Response Latency:</span>
                  <span className="text-slate-200">{n8nLiveVerification.n8n_latency_ms} ms</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500 block">Confirmed At:</span>
                  <span className="text-slate-200">{new Date(n8nLiveVerification.confirmed_at).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Node Routing Checks:</span>
                {n8nLiveVerification.nodes_verified.map((node, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-200">{node.node_name}:</strong> {node.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications & Feedback */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/50 flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Two-Step Connection & n8n Verification Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step 1: Credentials Input Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-slate-100">
                  {currentIntegration?.status === 'CONNECTED' ? 'Update Credentials (Reconnect & Verify)' : 'Enter Account Credentials'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Step 1 of 2</span>
            </div>

            <form onSubmit={handleValidate} className="space-y-4 text-xs">
              {/* WhatsApp Form Fields */}
              {activeTab === 'whatsapp' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      System User Permanent Access Token *
                    </label>
                    <input
                      type="password"
                      required
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder="EAAB..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">System user access token in Meta Business Manager with whatsapp_business_messaging scope</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Phone Number ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={waPhoneNumberId}
                        onChange={(e) => setWaPhoneNumberId(e.target.value)}
                        placeholder="1000123456789"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        WhatsApp Business Account ID (WABA ID)
                      </label>
                      <input
                        type="text"
                        value={waWabaId}
                        onChange={(e) => setWaWabaId(e.target.value)}
                        placeholder="2000987654321"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Facebook Messenger Form Fields */}
              {activeTab === 'messenger' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Page Access Token *
                    </label>
                    <input
                      type="password"
                      required
                      value={fbToken}
                      onChange={(e) => setFbToken(e.target.value)}
                      placeholder="EAAB..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Permanent page access token with pages_messaging permission</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Facebook Page ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={fbPageId}
                      onChange={(e) => setFbPageId(e.target.value)}
                      placeholder="1029384756"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Instagram Direct Form Fields */}
              {activeTab === 'instagram' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Instagram Access Token *
                    </label>
                    <input
                      type="password"
                      required
                      value={igToken}
                      onChange={(e) => setIgToken(e.target.value)}
                      placeholder="EAAB..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Instagram Professional Account ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={igAccountId}
                        onChange={(e) => setIgAccountId(e.target.value)}
                        placeholder="1784140000000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Linked Facebook Page ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={igPageId}
                        onChange={(e) => setIgPageId(e.target.value)}
                        placeholder="1029384756"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={validating || clients.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${validating ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{validating ? 'Validating & Verifying with n8n...' : 'Validate & Verify with n8n'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Step 2: Validation Feedback & n8n Confirmation Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Validation Result Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-xs text-slate-100 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-emerald-400" />
                  <span>Meta Validation & n8n Confirmation</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Step 2 of 2</span>
              </div>

              {!validationResult && !validating && (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <KeyRound className="h-8 w-8 mx-auto text-slate-700" />
                  <p>Enter credentials and click "Validate & Verify with n8n" to confirm Meta permissions and n8n multi-tenant workflow routing.</p>
                </div>
              )}

              {validating && (
                <div className="p-6 text-center text-slate-300 text-xs space-y-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
                  <div className="space-y-2 text-left bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div className={`flex items-center gap-2 ${validationStage >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {validationStage >= 1 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-slate-600" />}
                      <span>1. Meta Graph API & Scope Handshake...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${validationStage >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {validationStage >= 2 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-slate-600" />}
                      <span>2. n8n Dynamic Workflow Communication...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${validationStage >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {validationStage >= 3 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-slate-600" />}
                      <span>3. Multi-Tenant Postgres Routing Resolution...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${validationStage >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {validationStage >= 4 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-slate-600" />}
                      <span>4. Inbound Webhook Pipeline Readiness...</span>
                    </div>
                  </div>
                </div>
              )}

              {validationResult && (
                <div className="space-y-4 text-xs">
                  {/* Meta API Verification Status */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      validationResult.success
                        ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                    }`}
                  >
                    {validationResult.success ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    )}
                    <div>
                      <h5 className="font-bold text-xs">
                        {validationResult.success ? 'Meta Credentials Verified & Confirmed' : 'Validation Failed'}
                      </h5>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {validationResult.success
                          ? 'Token is valid, bound to target account, and verified with n8n.'
                          : validationResult.error}
                      </p>
                    </div>
                  </div>

                  {/* n8n Confirmation Card */}
                  {validationResult.success && validationResult.n8n_confirmation && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-[11px]">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Workflow className="h-3.5 w-3.5" />
                          <span>n8n Confirmation Confirmed</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Latency: {validationResult.n8n_confirmation.n8n_latency_ms}ms
                        </span>
                      </div>

                      <div className="space-y-1.5 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account Name:</span>
                          <span className="text-slate-100 font-bold">{validationResult.account_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account ID:</span>
                          <span className="text-slate-200">{validationResult.account_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">n8n Confirmation ID:</span>
                          <span className="text-emerald-400 font-semibold">{validationResult.n8n_confirmation.n8n_confirmation_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tenant Bound:</span>
                          <span className="text-slate-200">{selectedClient?.business_name} ({selectedClientId})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Webhook Status:</span>
                          <span className="text-emerald-400 font-bold">Ready</span>
                        </div>
                      </div>

                      {validationResult.n8n_confirmation.nodes_verified.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Verified n8n Nodes:</span>
                          {validationResult.n8n_confirmation.nodes_verified.slice(0, 3).map((n, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span>{n.node_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {validationResult.success && (
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{saving ? 'Saving & Confirming with n8n...' : 'Save & Confirm Connection with n8n'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Webhook Endpoints Setup Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-slate-200">Meta App Webhook Configuration</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Copy this Webhook Callback URL into your Meta App dashboard to route real-time inbound messages into the n8n pipeline:
              </p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px] text-slate-300">
                <span className="truncate max-w-[260px] text-left">{webhookBaseUrl}</span>
                <button
                  onClick={() => handleCopy(webhookBaseUrl, 'webhookUrl')}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0 ml-2"
                >
                  {copiedField === 'webhookUrl' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'webhookUrl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 space-y-1">
                <p>• Required Subscription Fields: <code className="text-cyan-400">messages</code>, <code className="text-cyan-400">messaging_postbacks</code></p>
                <p>• Multi-Tenant Router: Dynamically resolves incoming phone/page ID to tenant.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Interactive n8n Live Message Pipeline Test */}
        {showN8nTestModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                    <Workflow className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">Live n8n Message Pipeline Test</h3>
                    <p className="text-xs text-slate-400">Simulate sending an inbound message and inspect n8n's execution trace</p>
                  </div>
                </div>
                <button onClick={() => setShowN8nTestModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {n8nTestError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 text-rose-300 text-xs">
                  {n8nTestError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Tenant & Channel:</label>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-200">{selectedClient?.business_name} ({selectedClientId})</span>
                    <span className="text-emerald-400 uppercase font-bold">{activeTab}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Test Message Text:</label>
                  <textarea
                    rows={2}
                    value={n8nTestInput}
                    onChange={(e) => setN8nTestInput(e.target.value)}
                    placeholder="Enter test message to send through n8n..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setN8nTestInput('Hello! What services and pricing do you offer?')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Services & Pricing
                    </button>
                    <button
                      type="button"
                      onClick={() => setN8nTestInput('I want to book an appointment for tomorrow at 3pm')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Booking Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setN8nTestInput('help, I need to talk to a human agent')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Human Escalation
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunN8nTest}
                    disabled={testingN8n}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
                  >
                    <Send className={`h-3.5 w-3.5 ${testingN8n ? 'animate-pulse' : ''}`} />
                    <span>{testingN8n ? 'Processing through n8n...' : 'Send Test Event Through n8n'}</span>
                  </button>
                </div>

                {/* Test Result Execution Trace */}
                {n8nTestResult && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-emerald-800/50 space-y-3 font-mono text-[11px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>n8n Pipeline Execution Confirmed</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Duration: {n8nTestResult.total_duration_ms}ms | Exec ID: {n8nTestResult.execution_id.slice(0, 18)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Pipeline Node Trace:</span>
                      {n8nTestResult.pipeline_trace.map((step) => (
                        <div key={step.step} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className="h-5 w-5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {step.step}
                            </span>
                            <div>
                              <strong className="text-slate-200 block">{step.node_name}</strong>
                              <p className="text-[10px] text-slate-400 mt-0.5">{step.summary}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">{step.duration_ms}ms</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Generated Output Response:</span>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 text-xs font-sans">
                        {n8nTestResult.output_reply}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Quick Add Client Tenant */}
        {showAddClientModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Create Business Client Tenant</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Register a tenant account to bind your social channels to</p>
                </div>
                <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {clientModalError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/50 text-rose-300 text-xs">
                  {clientModalError}
                </div>
              )}

              <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={newClient.business_name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30);
                        setNewClient({
                          ...newClient,
                          business_name: name,
                          client_id: newClient.client_id || (slug ? `client_${slug}` : '')
                        });
                      }}
                      placeholder="e.g. Acme Health Clinic"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Client ID (Unique Slug) *</label>
                    <input
                      type="text"
                      required
                      value={newClient.client_id}
                      onChange={(e) => setNewClient({ ...newClient, client_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      placeholder="e.g. client_acme"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Channel Account ID / Phone *</label>
                    <input
                      type="text"
                      required
                      value={newClient.channel_account_id}
                      onChange={(e) => setNewClient({ ...newClient, channel_account_id: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834 or ID"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Subscription Plan</label>
                    <select
                      value={newClient.plan_id}
                      onChange={(e) => setNewClient({ ...newClient, plan_id: e.target.value })}
                      className="w-full bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                    >
                      {plans.map(p => (
                        <option key={p.plan_id} value={p.plan_id}>{p.name} ({p.monthly_chat_limit?.toLocaleString()} chats)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Owner Contact Phone</label>
                    <input
                      type="text"
                      value={newClient.owner_phone}
                      onChange={(e) => setNewClient({ ...newClient, owner_phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={newClient.owner_email}
                      onChange={(e) => setNewClient({ ...newClient, owner_email: e.target.value })}
                      placeholder="owner@business.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{creatingClient ? 'Creating...' : 'Create & Select Client'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
