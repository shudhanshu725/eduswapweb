# EduSwap

EduSwap is a college item exchange platform for VBSPU students. Students can create an account, list items or academic resources, browse available listings, download shared PDFs, contact other students, and manage their own uploads from a dashboard.

This project uses a React frontend with Supabase for auth, database, realtime chat data, and file storage. It does not require a MERN backend, MongoDB, Express API, JWT server auth, or Socket.IO server.

## Features

- Email signup and login with Supabase Auth
- Gmail-only signup/login
- Email confirmation before login
- Browse student listings
- Upload sell, swap, donate, PDF resource, and question paper listings
- Upload PDF files to Supabase Storage
- Direct chat between students using Supabase tables/realtime
- Dashboard for uploads, downloads, and sales
- Contact details for phone, WhatsApp, Instagram, and Telegram
- Row Level Security policies included in `supabase/schema.sql`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase JS
- Lucide React
- Motion

## Requirements

Before running the project, install or create:

- Node.js 18 or newer
- npm
- A Supabase project
- Supabase project URL
- Supabase anon public key

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the local dev server:

   ```bash
   npm run dev
   ```

4. Open the app:

   ```text
   http://localhost:3000
   ```

## Supabase Setup

1. Open your Supabase project.
2. Go to `SQL Editor`.
3. Run the SQL from:

   ```text
   supabase/schema.sql
   ```

4. Go to `Authentication` -> `Providers`.
5. Enable the Email provider.
6. Keep email confirmation enabled if you want users to verify email before login.

The schema creates these required resources:

- `user_profiles`
- `materials`
- `downloads`
- `swap_requests`
- `messages`
- `purchases`
- `contact_messages`
- Storage bucket: `materials`

## Auth Email Setup

EduSwap uses Supabase Auth signup email confirmation flow.

1. Go to Supabase Dashboard -> `Authentication` -> `Providers`.
2. Enable `Email`.
3. Keep `Confirm email` enabled. This is required so users cannot log in with an unverified or fake inbox.
4. Go to `Authentication` -> `Email Templates` -> `Confirm signup`.
5. Use a subject like:

   ```text
   Welcome to EduSwap - Confirm your account
   ```

6. Example email body:

   ```html
   <h2>Welcome to EduSwap</h2>
   <p>Hello,</p>
   <p>Your account has been created successfully.</p>
   <p>Please confirm your email by clicking the button below.</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm my account</a></p>
   <p>Thanks,<br />EduSwap Team</p>
   ```

Use `{{ .ConfirmationURL }}` so Supabase sends a clickable confirmation link.

After signup, users must confirm their email before they can log in. Supabase may still show an unconfirmed Auth user before verification; that is normal. EduSwap does not create the user's app profile until the email is verified and the user can log in. The app only allows Gmail addresses and also validates email format, but inbox confirmation is the real protection.

## Environment Variables

Required variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are frontend-safe Supabase values. Do not put Supabase service role keys in this React app.

## Available Scripts

Run the development server:

```bash
npm run dev
```

Check TypeScript:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Clean the build folder on Windows:

```bash
npm run clean
```

## Project Structure

```text
src/
  auth.ts                  Supabase client and auth helpers
  App.tsx                  App routes and auth state
  main.tsx                 React entry point
  types.ts                 Shared TypeScript types
  supabase.types.ts        Supabase table types
  components/              Shared UI components
  contexts/                React context providers
  pages/                   App pages
supabase/
  schema.sql               Database, RLS, and storage setup
```

## Important Notes

- This project is Supabase-only.
- The app needs `.env.local` before it can run correctly.
- Uploads require the `materials` storage bucket and storage policies from `supabase/schema.sql`.
- Chat requires the `messages` table and RLS policies from `supabase/schema.sql`.
- If uploads fail, check Supabase Storage bucket policies first.
- If browsing shows no data, check the `materials` table and RLS select policy.
- If login fails after signup, confirm the user email from the inbox or Supabase dashboard.

## Deployment

For Vercel or another static hosting provider:

1. Add these environment variables in the hosting dashboard:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Build command:

   ```bash
   npm run build
   ```

3. Output directory:

   ```text
   dist
   ```

The included `vercel.json` rewrites all routes to `index.html`, which is needed for React Router browser routes.
