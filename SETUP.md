# COUP RDC – Health Training Platform

**Rebrand:** change `APP_BRAND_NAME` (and related constants) in `src/lib/brand.js` and `convex/lib/brand.ts`.

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Convex
Create `.env.local` with your Convex URL:
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

In the [Convex dashboard](https://dashboard.convex.dev) → **Settings → Environment variables**, set:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Sends invitation emails (Resend). Without it, the invite URL is only logged in Convex. |
| `SITE_URL` | Base URL for links in emails, e.g. `http://localhost:5173` |
| `RESEND_FROM` | Optional. Default uses brand name from `convex/lib/brand.ts` (Resend dev sender) |

Until you verify a domain in Resend, dev mode usually only delivers to the email on your Resend account.

To deploy the backend schema and functions:
```bash
npx convex dev
```

### 3. Seed demo data
```bash
npm run seed
```

### 4. Start the dev server
```bash
npm run dev
```
Open http://localhost:5173

---

## Demo Login Accounts
| Role        | Email                        | Password  |
|-------------|------------------------------|-----------|
| Super Admin | superadmin@helty.africa      | demo1234  |
| Admin       | admin@helty.africa           | demo1234  |
| Lead        | lead@helty.africa            | demo1234  |
| Learner     | learner@helty.africa         | demo1234  |

Additional seeded learners (same password): ibrahim@, amina@, mariam@, kofi@ (inactive), ousmane@ — see `convex/seed.ts` for profiles.

The login page has a quick-fill panel for all demo accounts.

### Test invitation registration (after seed)
Open: `http://localhost:5173/register?token=seed-invite-pending`

Flow: email prefilled → prénom, nom, téléphone (+243), catégorie (National / Provincial / Zonal), mot de passe → accès au portail apprenant.

**Manual account create (admin):** requires an email; Resend sends a welcome message with `{SITE_URL}/login`. Share the temporary password with the user separately (not included in the email).

---

## Repository
https://github.com/Borel-TG/helty-africa

---

## Project Structure
```
├── convex/               ← Convex backend (schema + functions)
├── src/
│   ├── i18n/             ← French localization
│   ├── locales/fr.json
│   ├── hooks/useAuth.jsx ← Auth context (swap for Convex Auth in production)
│   └── pages/            ← learner, admin, lead, auth
```

See `LIMITATIONS_AND_PRODUCTION_GAPS.md` for production readiness checklist.
