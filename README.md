# KampungLink Hub

A village (kampung) community platform: announcements, village chat, admin
announcements with threaded replies, a Grab-style Pasar marketplace with seller
dashboard, facility booking (Library, Pusat IT, Hall) with pay-now/pay-later,
fund requests with live goal tracking, reports, lost & found, and admin tools.

Built with React 18, Vite 5, TypeScript, Tailwind CSS v3, shadcn/ui, TanStack
Query, and a Supabase backend.

## Requirements

- Node.js 18+ (npm) — or Bun
- Access to the project's Supabase backend (URL + publishable key are in `.env`)

## Getting started

```sh
npm install        # or: bun install
npm run dev        # start the dev server with live reload
```

Open the printed local URL (usually http://localhost:8080).

Other scripts:

```sh
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

## Environment

`.env` holds the backend connection values that Vite reads at build time:

```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
```

These are public (publishable) values, safe for a client-side app. To point the
app at a different backend, change these three values.

## Database

`supabase/migrations/` contains the full, ordered schema history (tables, row
level security policies, functions, realtime setup) as timestamped SQL files.

To recreate the backend elsewhere:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

Or run the SQL files in `supabase/migrations/` in filename order against your
own Postgres/Supabase project.

## Project layout

```
src/
  pages/          # one file per screen (Dashboard, Messages, Marketplace, ...)
  components/     # shared UI, admin panels, facility + business widgets
  hooks/          # auth and mobile helpers
  integrations/   # generated backend client (do not edit by hand)
  assets/         # logo and hero images
public/           # favicon, robots.txt, placeholder image
supabase/
  migrations/     # database schema history
  config.toml     # backend project config
```

## Pushing this code to GitHub

Create an empty repository on GitHub (no README, no .gitignore), then from this
folder:

```sh
git init
git add .
git commit -m "Initial commit: KampungLink Hub"
git branch -M main
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

`node_modules/`, `dist/`, and logs are already excluded by `.gitignore`.

## Notes

- Authentication, database, storage, and functions are provided by the connected
  Supabase backend; nothing needs to be installed or run server-side here.
- The generated files in `src/integrations/supabase/` are produced by the
  backend tooling — regenerate them rather than editing them by hand.
