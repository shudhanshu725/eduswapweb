# EduSwap

College item exchange platform for VBSPU students.

## Run Locally

Prerequisites: Node.js 18+

1. Install dependencies:
   `npm install`
2. Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Start dev server:
   `npm run dev`
4. Open:
   `http://localhost:3000`

## Welcome Email Setup (Signup)

EduSwap uses Supabase Auth signup email flow.

1. Go to Supabase Dashboard -> `Authentication` -> `Providers`.
2. Enable `Email` provider and keep `Confirm email` enabled.
3. Go to `Authentication` -> `Email Templates` -> `Confirm signup`.
4. Use subject:
   `Welcome to EduSwap - Your account is ready`
5. Use message body like:
   ```html
   <h2>Welcome to EduSwap</h2>
   <p>Hello,</p>
   <p>Your account has been created successfully.</p>
   <p>Please confirm your email by clicking the button below.</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm my account</a></p>
   <p>Thanks,<br/>EduSwap Team</p>
   ```

After this, every new signup gets the welcome + account-created email automatically.
When `Confirm email` is enabled, signup will create the account and ask the user to verify their email before first login.

## Supabase Setup

This project uses Supabase only. It does not need MongoDB, Express, JWT server auth, or a separate API server.

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. In Supabase Dashboard -> `Authentication` -> `Providers`, enable Email auth.

The app expects these Supabase tables/storage resources:
- `materials`
- `downloads`
- `swap_requests`
- `messages`
- `purchases`
- `contact_messages`
- `user_profiles`
- Storage bucket: `materials`
