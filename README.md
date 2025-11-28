# Lacks Expense Management System

A comprehensive expense reporting and management system with Office 365 SSO integration.

## Features

- 📸 Receipt upload with AI-powered data extraction (OpenAI Vision API)
- 👤 Office 365 Entra SSO authentication
- 📊 User dashboard with expense tracking
- 📝 Expense report creation and submission
- ✅ Accounting review and approval workflow
- 👨‍💼 Admin panel for user and department management
- 📈 Analytics and reporting by department/category
- 🔍 Complete audit trail of all changes

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js + Office 365 Entra
- **Storage:** Supabase Storage
- **AI:** OpenAI Vision API
- **Deployment:** Vercel

## User Roles

- **User:** Upload receipts, create expense reports, view own expenses
- **Accounting:** Review and approve/reject expense reports
- **Admin:** Manage users, departments, categories, view global reports

## Setup

See `SETUP_GUIDE.md` for detailed setup instructions.

## Environment Variables

Required environment variables (see `.env.local.example`):
- Supabase URL and API key
- Office 365 Entra credentials
- NextAuth secret
- OpenAI API key

## Database

Database schema and migrations are in the `supabase/migrations/` folder.

## Project Status

🚧 In Development

---

Built with ❤️ using Next.js and Supabase
