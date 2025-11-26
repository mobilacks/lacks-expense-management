# Lacks Expense Management - Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase project created (✅ Done!)
- Office 365 Azure AD app registration
- OpenAI API key

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

## Step 2: Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Then fill in the values:

### Supabase Configuration
1. Go to your Supabase project: https://supabase.com/dashboard
2. Settings > API
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Office 365 Entra (Azure AD) Setup
1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - Name: "Lacks Expense Management"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Web → `http://localhost:3000/api/auth/callback/azure-ad`
5. Click **Register**
6. Copy **Application (client) ID** → `AZURE_AD_CLIENT_ID`
7. Copy **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`
8. Go to **Certificates & secrets** > **New client secret**
9. Copy the secret value → `AZURE_AD_CLIENT_SECRET`

### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```
Paste the output → `NEXTAUTH_SECRET`

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy → `OPENAI_API_KEY`

## Step 3: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 4: Create Your First Admin User

Since SSO requires users to exist in the database first, you need to manually create the first admin:

```sql
-- Run this in Supabase SQL Editor
INSERT INTO users (name, email, role, is_active)
VALUES 
  ('Your Name', 'your.email@company.com', 'admin', true);
```

Replace with your Office 365 email address.

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── auth/           # NextAuth OAuth handlers
│   ├── dashboard/          # User dashboard (to build)
│   ├── admin/              # Admin pages (to build)
│   ├── accounting/         # Accounting portal (to build)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Reusable components (to build)
├── lib/
│   └── supabase.ts        # Supabase client
├── types/
│   └── next-auth.d.ts     # TypeScript types
├── .env.local.example
└── package.json
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Configure Office 365 Azure AD
3. ✅ Create first admin user in Supabase
4. 🔨 Build authentication pages
5. 🔨 Build user dashboard
6. 🔨 Build receipt upload flow
7. 🔨 Build admin panel
8. 🔨 Build accounting review portal

## Deployment (Vercel)

When ready to deploy:

```bash
npm run build
```

Then deploy to Vercel:
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Update `NEXTAUTH_URL` to your production URL
4. Update Azure AD redirect URI to production URL

---

**Status:** Foundation ready! Alhamdulillah 🚀
