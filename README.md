<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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

## MERN Backend (New)

A full backend scaffold is added at `server/` with:
- JWT auth (`/api/auth`)
- Listings (`/api/listings`)
- Chat REST + Socket.IO (`/api/chats`)

### Backend setup

1. Copy env:
   `cp server/.env.example server/.env`
2. Set values in `server/.env`:
   - `MONGO_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CLIENT_URL=http://localhost:3000`
3. Install packages:
   `npm install`
4. Run both API + frontend:
   `npm run dev:mern`

API default URL: `http://localhost:5000`
