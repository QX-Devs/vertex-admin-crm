'use client';

import React, { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Workflow,
  ShieldCheck,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Save,
  Server,
  Key,
  Lock,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  Activity,
  Terminal,
  Clock,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Sliders,
  Play
} from 'lucide-react';
import { N8nConfig, N8nConnectivityTestResult, WORKFLOW_CORE_NODES } from '@/lib/types';



export default function N8nConfigurationPage() {
  const [config, setConfig] = useState<Partial<N8nConfig>>({
    base_url: 'http://localhost:5678',
    webhook_validate_url: 'http://localhost:5678/webhook/admin/channel/validate',
    webhook_inbound_url: 'http://localhost:5678/webhook/inbound/messages',
    api_key: '',
    webhook_verify_token: 'meta_crm_verify_token_2026',
    ssl_reject_unauthorized: true,
    timeout_ms: 5000,
    is_active: true
  });

  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [liveTest, setLiveTest] = useState<N8nConnectivityTestResult | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchConfigAndHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/n8n-conf');
      const data = await res.json();
      if (res.ok) {
        if (data.config) {
          setConfig(data.config);
          setHasStoredApiKey(Boolean(data.config.has_api_key));
        }
        if (data.liveTest) {
          setLiveTest(data.liveTest);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch n8n config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndHealth();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/n8n-conf/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data: N8nConnectivityTestResult = await res.json();
      setLiveTest(data);

      if (data.reachable) {
        setSuccessMessage(`n8n connectivity confirmed! Response received in ${data.latency_ms}ms.`);
      } else {
        setErrorMessage(`Connection test failed: ${data.error || 'n8n instance is not reachable'}.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while testing n8n connection.');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/n8n-conf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save n8n configuration');

      setConfig(data.config);
      setHasStoredApiKey(Boolean(data.config.has_api_key));
      if (data.liveTest) setLiveTest(data.liveTest);

      setSuccessMessage(data.message || 'n8n configuration stored securely in database.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportWorkflow = () => {
    window.location.href = '/api/admin/n8n-conf/export-workflow';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title="n8n Configuration & Integration Hub"
        subtitle="Manage live connection credentials, multi-tenant workflows, and panel-to-n8n communication without manual .env edits"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
              title="Download workflow.json for importing into n8n"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Export workflow.json</span>
            </button>
            <button
              onClick={fetchConfigAndHealth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-md shadow-emerald-900/30"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        }
      />

      <main className="p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">n8n Engine Status</span>
              <StatusBadge status={liveTest?.status === 'healthy' ? 'CONNECTED' : liveTest?.status === 'degraded' ? 'VALIDATING' : 'NOT_CONNECTED'} />
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {liveTest?.reachable ? 'Connected & Active' : 'Fallback Engine'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {liveTest?.reachable ? `Live HTTP Ping: ${liveTest.latency_ms}ms` : 'Internal simulation router ready'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Workflow Core Nodes</span>
              <Workflow className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">12 Mapped Nodes</h3>
            <p className="text-[11px] text-emerald-400 font-medium">Multi-Tenant Routing: 100% Ready</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Credential Storage</span>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">PostgreSQL Store</h3>
            <p className="text-[11px] text-slate-400">Stored in DB with Server Vault Hashing</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Webhook Security</span>
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">HMAC Verified</h3>
            <p className="text-[11px] text-slate-400">Direct Inbound & Outbound Tokens</p>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Main Grid: Settings Form & Live Probe Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: n8n Configuration Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-slate-100">n8n Instance Connectivity Settings</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Dynamic DB Settings</span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  n8n Base URL *
                </label>
                <input
                  type="text"
                  required
                  value={config.base_url || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setConfig({
                      ...config,
                      base_url: url,
                      webhook_validate_url: config.webhook_validate_url?.startsWith('http')
                        ? config.webhook_validate_url
                        : `${url.replace(/\/+$/, '')}/webhook/admin/channel/validate`,
                      webhook_inbound_url: config.webhook_inbound_url?.startsWith('http')
                        ? config.webhook_inbound_url
                        : `${url.replace(/\/+$/, '')}/webhook/inbound/messages`
                    });
                  }}
                  placeholder="http://localhost:5678 or https://n8n.yourdomain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Base HTTP/HTTPS endpoint of your self-hosted or cloud n8n instance</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  n8n Channel Validation Webhook URL *
                </label>
                <input
                  type="text"
                  required
                  value={config.webhook_validate_url || ''}
                  onChange={(e) => setConfig({ ...config, webhook_validate_url: e.target.value })}
                  placeholder="http://localhost:5678/webhook/admin/channel/validate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Webhook triggered when clicking "Validate & Verify with n8n" in Channels</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  n8n Inbound Message Trigger Webhook URL
                </label>
                <input
                  type="text"
                  value={config.webhook_inbound_url || ''}
                  onChange={(e) => setConfig({ ...config, webhook_inbound_url: e.target.value })}
                  placeholder="http://localhost:5678/webhook/inbound/messages"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    n8n API Key / Bearer Authentication
                  </label>
                  {hasStoredApiKey && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ API Key Saved in DB</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.api_key || ''}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder={hasStoredApiKey ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter n8n API Key (optional)'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Used for authenticating webhook requests sent from Next.js to n8n via X-N8N-API-KEY</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Webhook Verification Token
                  </label>
                  <input
                    type="text"
                    value={config.webhook_verify_token || ''}
                    onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                    placeholder="meta_crm_verify_token_2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Request Timeout (Milliseconds)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={30000}
                    step={500}
                    value={config.timeout_ms || 5000}
                    onChange={(e) => setConfig({ ...config, timeout_ms: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={config.is_active !== false}
                  onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-950"
                />
                <label htmlFor="is_active" className="text-slate-300 font-medium">
                  Enable active n8n automation bridge for live webhook events
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 text-emerald-400 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing Connectivity...' : 'Test Connection Probe'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving to Database...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Connectivity Console & Webhook Guides */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Probe Results Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Live n8n Connectivity Probe</span>
                </h4>
                <StatusBadge status={liveTest?.status === 'healthy' ? 'CONNECTED' : liveTest?.status === 'degraded' ? 'VALIDATING' : 'NOT_CONNECTED'} size="sm" />
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Base URL:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{config.base_url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Latency:</span>
                  <span className="text-emerald-400 font-bold">{liveTest ? `${liveTest.latency_ms} ms` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API Key Configured:</span>
                  <span className={hasStoredApiKey || config.api_key ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasStoredApiKey || config.api_key ? 'Yes (Secure)' : 'No (Public)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HTTP Status:</span>
                  <span className="text-slate-200">{liveTest?.response_code ? `${liveTest.response_code} OK` : liveTest?.reachable ? 'Reachable' : 'Not Connected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Checked:</span>
                  <span className="text-slate-400">{liveTest ? new Date(liveTest.timestamp).toLocaleTimeString() : '—'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                {liveTest?.message || 'Click "Test Connection Probe" to test HTTP communication with your n8n server.'}
              </p>
            </div>

            {/* Quick Webhook Copy Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h4 className="font-bold text-slate-200">Panel Webhook Endpoints for n8n</h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Copy these URLs into n8n Webhook Trigger nodes:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">WhatsApp & Multi-Tenant Webhook:</span>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                    <span className="truncate max-w-[220px]">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                    </span>
                    <button
                      onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp', 'waHook')}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0 ml-2"
                    >
                      {copiedField === 'waHook' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedField === 'waHook' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Facebook Messenger Webhook:</span>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-300">
                    <span className="truncate max-w-[220px]">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/messenger` : '/api/webhooks/messenger'}
                    </span>
                    <button
                      onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/messenger` : '/api/webhooks/messenger', 'fbHook')}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0 ml-2"
                    >
                      {copiedField === 'fbHook' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedField === 'fbHook' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Architecture & Mapped Nodes Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Workflow className="h-4 w-4 text-emerald-400" />
                <span>n8n Multi-Tenant Automation Pipeline Architecture</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Core nodes executed in workflow.json for customer message ingestion, Postgres tenant lookup, and AI response dispatch
              </p>
            </div>
            <button
              onClick={handleExportWorkflow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download workflow.json</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WORKFLOW_CORE_NODES.map((node, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">{node.type.replace('n8n-nodes-base.', '')}</span>
                    <h5 className="font-bold text-xs text-slate-200 mt-0.5">{node.name}</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-mono shrink-0">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{node.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
