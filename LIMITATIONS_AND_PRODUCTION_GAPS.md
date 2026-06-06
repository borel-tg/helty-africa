# COUP RDC — Current Limitations & Production Requirements

**Project:** COUP RDC (health training platform for francophone Africa)  
**Repository:** https://github.com/Borel-TG/helty-africa  
**App location:** project root (`evtp-app/` folder locally — rename optional)  
**Last updated:** May 2026  
**Status:** Demo / MVP — **not production-ready**

This document lists what the application does today, what is missing or simulated, and what must be completed before a real deployment for francophone African health organizations.

---

## Executive summary

The UI is largely built and localized in **French**, with responsive layouts and role-based navigation (learner, lead, admin, super admin). However, **most business logic still runs on in-memory mock data** in the browser. Convex (database + file storage) is **partially** integrated: schema and seed exist, uploads can reach Convex storage, but **pages do not read or write training data through Convex** except for file upload URLs.

Production requires: real authentication, wiring all screens to Convex (or another backend), server-side authorization, persistent progress and exams, email flows, security hardening, and operational setup (hosting, monitoring, backups).

---

## 1. Authentication & security

| Limitation | Current behavior | Required for production |
|------------|------------------|------------------------|
| **No real auth system** | Login checks email + shared password `demo1234` against `MOCK_USERS` in `src/lib/mockData.js`. No password hashing, no lockout, no MFA. | Integrate **Convex Auth** (or Auth0 / Clerk / custom JWT) with hashed passwords and org-scoped accounts. |
| **Client-only session** | Session stored in `localStorage` (`helty_session` user id). Anyone with devtools can impersonate a user id. | Server-validated sessions (httpOnly cookies or Convex Auth tokens). Short-lived tokens + refresh. |
| **No server-side route protection** | `RequireAuth` / `RequireRole` in `App.jsx` only check React state. | Convex functions must enforce `organizationId`, role, and resource ownership on every query/mutation. |
| **Demo accounts exposed** | Login page lists all demo emails and password. | Remove demo panel; use separate staging environment only. |
| **Forgot password is fake** | `ForgotPasswordPage` waits 800ms and shows success; no email sent. | Password reset via secure token + transactional email (SendGrid, Resend, etc.). |
| **Registration is fake** | `RegisterPage` accepts any token in URL; on submit always logs in as `learner@helty.africa`. | Validate invitation token against `invitations` table; create user in DB; send welcome email. |
| **No audit logging** | Admin actions (deactivate, reset progress) are not logged. | Audit trail table (who, what, when, IP) for compliance. |
| **No rate limiting** | Login and uploads can be spammed from the client. | Rate limits on auth and upload endpoints. |

---

## 2. Data layer (mock vs Convex)

| Area | Current | Production |
|------|---------|------------|
| **Modules, lessons, exams** | `MOCK_MODULES`, `MOCK_LESSONS`, `MOCK_EXAM_QUESTIONS` in `mockData.js` | `useQuery` / `useMutation` on `convex/modules`, `lessons`, `exams` |
| **Learner progress** | Static `MOCK_LEARNER_PROGRESS`; marking complete only updates UI/toast | `convex/progress` — persist per user/lesson, sync across devices |
| **Exam attempts & scores** | Calculated in browser on submit; results passed via React Router `state` (lost on refresh) | `examAttempts` table; server-side scoring; retake rules enforced in backend |
| **Certificates** | Certificate page uses mock user/module; no PDF generation stored | `certificates` table + generated PDF in storage; verification link |
| **Learners / employees** | `MOCK_EMPLOYEES`, `MOCK_INVITATIONS` | `users` + `invitations` with real CRUD |
| **Statistics** | `MOCK_STATS` and hardcoded rows in `StatisticsPage` | Aggregations from Convex (or scheduled jobs) |
| **Notifications** | `MOCK_NOTIFICATIONS` in top bar | `notifications` table + real-time subscription; mark read persists |
| **Organizations** | Single implicit org in mocks | Multi-tenant `organizations` with strict data isolation |

**Note:** `npx convex run seed:seedDemo` can populate Convex, but the **React app does not consume that data** for main flows yet.

---

## 3. Admin & content management (UI-only operations)

Many admin actions show a success toast but **do not persist** (local React state or no-op):

- Create / delete / publish module (`ModulesPage`)
- Add / edit / delete lessons and exam questions (`ModuleEditorPage`)
- Add / delete module resources
- Save module settings (passing score, retakes)
- Invite learner / create account manually (`EmployeesPage`)
- Deactivate / reactivate learner (updates local state only)
- Password reset from learner menu (toast only)
- Reset retakes / reset progress (`EmployeeDetailPage`)
- Certificate template save (`CertificateTemplatePage`)

**Production:** Every action must call a Convex mutation and reflect DB state; handle errors and optimistic UI carefully.

---

## 4. File uploads & document viewing

| Limitation | Detail | Production |
|------------|--------|------------|
| **Upload scope** | `useFileUpload` + Convex storage used in admin upload flows | Extend to all lesson/resource flows; validate MIME, size, virus scan if required |
| **Unauthenticated uploads** | `generateUploadUrl` mutation has **no auth check** | Require authenticated user + role; tie files to `organizationId` |
| **Public storage URLs** | `getUrl` returns URLs that may be shareable | Access control or signed URLs with expiry for sensitive training PDFs |
| **PPT on localhost** | Raw `.ppt` in iframe often **downloads** instead of inline preview | Prefer **Google Slides / Office Online** public URLs, or convert PPT → PDF server-side |
| **PDF worker CDN** | `pdfjs` worker loaded from `unpkg.com` | Self-host worker for offline/low-bandwidth or CSP compliance |
| **Document “protection”** | Right-click / Ctrl+S blocked in UI only | Not true DRM; assume content can be copied. For strict IP, use streaming + watermarked PDFs |
| **Image compression** | Client-side via `browser-image-compression` | Server-side limits + optional resizing pipeline |

---

## 5. Learning experience (learner)

| Limitation | Detail | Production |
|------------|--------|------------|
| **Progress not saved** | “Mark complete” does not update backend | Persist completion timestamp; drive module status from DB |
| **Lesson unlock rules** | Client-side only (previous lesson complete) | Enforce on server when fetching lesson content |
| **Exam timer** | 30-minute timer in browser; auto-submit can be bypassed | Server start time + deadline; reject late submissions |
| **Exam retakes** | `maxRetakes` displayed but not enforced against real attempts | Count attempts in DB; block when exhausted |
| **Certificate eligibility** | Based on mock pass state | Issue certificate only after verified pass + all lessons complete |
| **Offline / low connectivity** | No service worker or offline cache | Consider PWA, download packs, or graceful retry for Africa mobile networks |
| **Video lessons** | YouTube embed only | Hosting policy, fallback if YouTube blocked, optional self-hosted video |

---

## 6. Invitations & onboarding

- Invitation emails are **not sent** (UI simulates delay).
- Magic link tokens in `convex/invitations` are **not validated** by the register flow.
- No expiry enforcement in UI.
- No SMS onboarding (phone is collected but unused) — may matter for learners without email.

**Production:** Email/SMS provider, token lifecycle, resend invitation, admin view of pending/expired invites (partially UI-only today).

---

## 7. Internationalization (i18n)

| Done | Gap |
|------|-----|
| French UI via `i18next` + `src/locales/fr.json` for main flows | Training **content** (module titles, lesson HTML, exam questions) still **English** in `mockData.js` |
| `fr-FR` dates in `utils.js` | Some admin screens still have **hardcoded English** strings (`ModuleEditorPage`, `StatisticsPage`, etc.) |
| Single locale only | No `en` fallback or per-org locale; no RTL if needed later |

**Production:** Content in DB with locale fields or CMS; complete FR coverage; optional second language.

---

## 8. Lead role & team features

- Lead dashboard and learner detail use **mock / partial** data.
- No real assignment of learners to leads synced with `users.leadId`.
- Lead cannot perform scoped actions backed by API.

**Production:** Wire lead views to Convex filters (`by_lead` index); permissions so leads only see their team.

---

## 9. Notifications & email

- In-app notifications are static mocks.
- “Mark all read” does not persist.
- No push notifications (mobile).
- No email for: exam passed, invitation, password reset, certificate issued.

**Production:** Notification mutations + optional email digests; consider SMS for critical alerts.

---

## 10. Convex backend gaps

- **No Convex Auth** configured (schema has `tokenIdentifier` placeholder only).
- **No authorization helpers** (e.g. `requireRole(ctx, "admin")`) in functions.
- Mutations/queries in `convex/*.ts` exist for domains but are **unused** by the frontend.
- **Seed script** wipes and re-seeds — must not run in production as-is.
- **Environment:** `VITE_CONVEX_URL` required; app runs against placeholder if missing (uploads fail silently with warning).

**Production:** Separate dev/staging/prod Convex projects; migrations strategy; backup policy.

---

## 11. Testing & quality

| Missing | Needed |
|---------|--------|
| Automated tests | Unit tests (scoring, auth guards), E2E (login → lesson → exam) |
| CI pipeline | Lint, test, build on PR |
| Accessibility audit | WCAG for mobile-first African users |
| Load testing | Concurrent learners on slow networks |

---

## 12. DevOps & deployment

| Missing | Needed |
|---------|--------|
| Production hosting | Vercel/Netlify/Cloudflare for frontend; Convex cloud for backend |
| Custom domain + HTTPS | Required |
| CSP / security headers | Restrict scripts, frame ancestors for document viewer |
| Secrets management | No secrets in repo; `.env.local` gitignored only |
| Error monitoring | Sentry or similar |
| Analytics | Optional privacy-conscious usage metrics |
| Git repo | Initialized under `evtp-app/` only; parent `Polio-Africa` may need monorepo docs |

---

## 13. Legal, privacy & compliance

- No privacy policy / consent flow in app.
- Personal data (name, phone, email) handled only in mocks — **GDPR / local African data protection** not implemented.
- No data export or account deletion for learners.
- Health-adjacent training content may require organizational data processing agreements.

**Production:** Legal review, privacy notice, retention policy, export/delete endpoints.

---

## 14. Production checklist (priority order)

### P0 — Must have before any real users

- [ ] Convex Auth (or equivalent) with secure passwords
- [ ] All reads/writes through Convex with **org + role checks**
- [ ] Remove demo login panel and shared `demo1234` password
- [ ] Persist learner progress, exam attempts, and results
- [ ] Real invitation + registration flow
- [ ] Admin CRUD persisted (modules, lessons, questions, learners)
- [ ] Authenticated, authorized file uploads

### P1 — Required for credible launch

- [ ] Password reset and email delivery
- [ ] Certificate generation and storage
- [ ] Statistics from live data
- [ ] Notifications persisted
- [ ] French content in database (not English mocks)
- [ ] Complete French UI strings on remaining admin pages
- [ ] Staging environment + production Convex deployment

### P2 — Hardening & scale

- [ ] Exam anti-cheat basics (server timer, attempt limits)
- [ ] Audit logs for admin actions
- [ ] Rate limiting and monitoring
- [ ] PPT/PDF strategy for low bandwidth (PDF preferred, external embed URLs)
- [ ] Automated tests + CI
- [ ] Privacy compliance (export/delete, policies)

### P3 — Nice to have

- [ ] PWA / offline hints
- [ ] SMS invitations
- [ ] Multi-language content
- [ ] Push notifications

---

## 15. What works today (demo-ready)

- Responsive UI (mobile bottom nav, drawer sidebar)
- Role-based routing (learner / lead / admin / super admin)
- French localization for core navigation and main pages
- PDF viewer with mobile toolbar and reader mode
- External document URLs (Google Docs/Slides) normalization
- File upload pipeline to Convex storage (admin)
- Image compression on upload
- Session survives page reload (localStorage demo session)
- Convex schema + seed script for future backend wiring

---

## References

| Resource | Path |
|----------|------|
| Setup guide | `evtp-app/SETUP.md` |
| Mock data | `evtp-app/src/lib/mockData.js` |
| Auth (demo) | `evtp-app/src/hooks/useAuth.jsx` |
| Convex schema | `evtp-app/convex/schema.ts` |
| French translations | `evtp-app/src/locales/fr.json` |

---

*For questions or to track completion, map each checklist item to a GitHub issue or project board milestone.*
