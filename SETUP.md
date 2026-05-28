# EVTP – Employee Vaccination Training Platform
## Setup Guide

### 1. Install dependencies
```bash
cd evtp-app
npm install
```

### 2. Configure Convex
The `.env.local` is already pre-filled with your Convex URL:
```
VITE_CONVEX_URL=https://whimsical-meerkat-333.convex.cloud
```

To deploy the backend schema and functions to your Convex project:
```bash
npx convex dev
```

This will:
- Push the schema (`convex/schema.ts`) to Convex
- Deploy all query/mutation functions
- Start a file watcher for changes

### 3. Seed demo data (optional)
Once Convex is running, seed the database with sample data:
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
| Role        | Email                   | Password  |
|-------------|-------------------------|-----------|
| Super Admin | superadmin@evtp.demo    | demo1234  |
| Admin       | admin@evtp.demo         | demo1234  |
| Lead        | lead@evtp.demo          | demo1234  |
| Learner     | learner@evtp.demo       | demo1234  |

The login page has a quick-fill panel for all demo accounts.

---

## Project Structure
```
evtp-app/
├── convex/               ← Convex backend (schema + functions)
│   ├── schema.ts         ← Database schema
│   ├── users.ts          ← User CRUD
│   ├── modules.ts        ← Module management
│   ├── lessons.ts        ← Lesson management
│   ├── exams.ts          ← Exam questions, settings, attempts
│   ├── progress.ts       ← Lesson progress tracking
│   ├── certificates.ts   ← Certificate generation & templates
│   ├── notifications.ts  ← In-app notifications
│   ├── invitations.ts    ← Magic-link invitations
│   └── seed.ts           ← Demo data seeder
└── src/
    ├── main.jsx           ← App entry point
    ├── App.jsx            ← Router + role-based route guards
    ├── index.css          ← Tailwind base + custom styles
    ├── lib/
    │   ├── utils.js       ← Shared helpers (dates, cn, etc.)
    │   └── mockData.js    ← Demo data for UI development
    ├── hooks/
    │   └── useAuth.jsx    ← Auth context (swap for Convex Auth)
    ├── components/
    │   ├── ui/            ← Button, Input, Card, Modal, Toast, etc.
    │   └── layout/        ← AppLayout, Sidebar, BottomNav, TopBar
    └── pages/
        ├── auth/          ← Login, Register (invite), ForgotPassword
        ├── learner/       ← Dashboard, Module, Lesson, Exam, Certificate
        ├── admin/         ← Dashboard, Modules, Employees, Stats, Certs
        └── lead/          ← Team Dashboard, Learner Detail
```

---

## Connecting Convex Auth
The mock currently uses a local AuthProvider. To connect real auth:

1. Install Convex Auth: `npm install @convex-dev/auth`
2. Replace `AuthProvider` in `main.jsx` with ConvexAuthProvider
3. Update `useAuth.jsx` to use `useConvexAuth()` and `useQuery(api.users.getMe, ...)`
4. See: https://labs.convex.dev/auth

---

## Design Tokens
- **Primary green:** `#2E7D64`
- **Secondary orange:** `#E67E22`
- **Background:** `#FFF9F0`
- **Font:** Inter (Google Fonts)
- **Border radius:** 12px cards, 8px buttons
