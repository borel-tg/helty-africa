# Helty Africa – Health Training Platform

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Convex
Create `.env.local` with your Convex URL:
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

To deploy the backend schema and functions:
```bash
npx convex dev
```

### 3. Seed demo data (optional)
```bash
npx convex run seed:seedDemo
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

The login page has a quick-fill panel for all demo accounts.

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
