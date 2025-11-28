# Lacks Expense Management - Setup Guide

## Prerequisites
- Supabase project (✅ Already created!)
- Office 365 Azure AD app registration
- OpenAI API key
- Vercel account

## Step 1: Supabase Configuration

Your Supabase database is already set up! ✅

Get your credentials:
1. Go to https://supabase.com/dashboard
2. Select your project: `lacks-expense-management`
3. Go to Settings > API
4. Copy:
   - **Project URL** → Save for Vercel
   - **anon public key** → Save for Vercel

## Step 2: Office 365 Entra (Azure AD) Setup

1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - Name: "Lacks Expense Management"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Web → `https://your-vercel-url.vercel.app/api/auth/callback/azure-ad`
5. Click **Register**
6. Copy **Application (client) ID** → Save for Vercel
7. Copy **Directory (tenant) ID** → Save for Vercel
8. Go to **Certificates & secrets** > **New client secret**
9. Copy the secret value → Save for Vercel

## Step 3: OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy → Save for Vercel

## Step 4: NextAuth Secret

Generate a random secret:
```bash
openssl rand -base64 32
```
Or use an online generator
Save for Vercel

## Step 5: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`
   - `NEXTAUTH_URL` (your Vercel URL)
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY`
5. Click **Deploy**

## Step 6: Update Azure AD Redirect URI

After deployment:
1. Copy your Vercel URL (e.g., `https://lacks-expense-management.vercel.app`)
2. Go back to Azure AD app registration
3. Update Redirect URI to: `https://your-actual-vercel-url.vercel.app/api/auth/callback/azure-ad`

## Step 7: Create First Admin User

Run this in Supabase SQL Editor:
```sql
INSERT INTO users (name, email, role, is_active)
VALUES 
  ('Your Name', 'your.email@company.com', 'admin', true);
```

Replace with your Office 365 email.

## Step 8: Test Login

1. Go to your deployed URL
2. Try logging in with Office 365
3. Should work! 🎉

---

**Need help?** Check the error logs in Vercel dashboard.
