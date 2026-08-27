# ⚡ Vertex Admin CRM & Automation Platform

<div align="center">

![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)
![n8n](https://img.shields.io/badge/n8n-Workflow%20Automation-FF6D5A?style=for-the-badge&logo=n8n)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**The Master Admin & Operations Management Platform for the Vertex AI CRM Suite. Manage client accounts, multi-channel provisioning (WhatsApp Cloud API, Meta Messenger, Instagram Graph API), subscription tiers, real-time audit logs, database integrity, and n8n webhook automation pipelines.**

</div>

---

## 🌟 Key Features

* **👥 Client & Account Lifecycle Management**: Onboard new client businesses, assign subscription plans, configure API webhooks, and toggle operational statuses.
* **📦 Subscription Plans & Quota Management**: Configure chat limits, enabled AI models, allowed channels, CRM feature flags, and storage destinations.
* **📱 Multi-Channel Gateway**: Provision and validate Meta WhatsApp Business Accounts (WABA), Instagram Messaging, and Facebook Messenger webhooks with live token diagnostics.
* **🔄 n8n Automation Workflows**: Real-time integration testing, automatic workflow JSON exports, and webhook validation pipelines.
* **🛡️ Security & Real-Time Audit Logs**: Role-based access control (`superadmin`, `admin`, `operator`), edge route guards (`middleware.ts`), and tamper-evident audit logging.
* **🗄️ Database & Schema Tools**: Database health diagnostics, live connection latency monitoring, table row counters, and automated schema export utilities.

---

## ⚙️ Environment Variables

Create `.env` in the root directory:

```env
# Supabase PostgreSQL Connection
POSTGRES_HOST=db.your-supabase-id.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
DATABASE_URL=postgresql://postgres:your-postgres-password@db.your-supabase-id.supabase.co:5432/postgres?sslmode=require

# Admin Authentication & Security
JWT_SECRET=your-64-character-hex-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build
npm start
```

---

## 🛡️ License

Distributed under the **MIT License**.

<div align="center">
  <sub>Built by <b>QX-Devs</b> • Vertex Automation Suite</sub>
</div>
