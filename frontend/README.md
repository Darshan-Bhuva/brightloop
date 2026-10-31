# Brightloop Frontend

Production-ready subscription lifecycle, recurring billing, and customer portal web application built with **React**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with CSS variables design tokens
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) accessible primitives (`@radix-ui/*`)
- **State & Server Cache**: [@tanstack/react-query](https://tanstack.com/query/latest)
- **Routing**: [React Router v7](https://reactrouter.com/) (Data APIs with `createBrowserRouter`)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) resolvers
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) rich toasts
- **HTTP Client**: [Axios](https://axios-http.com/) with token interceptor and mock fallback wrappers
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS or current)
- npm 10+ (or pnpm / yarn)

### Installation

```bash
# From the repository root
cd frontend

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in `frontend/` (or copy from `.env.example`):

```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | Base URL of the Laravel backend API |
| `VITE_USE_MOCK` | `false` | When `true`, enables mock fallback if the API is offline |
| `VITE_CURRENCY` | `USD` | Display currency code used across money formatters |

### Running the Development Server

```bash
npm run dev
```

The application will be served at `http://localhost:5173`.

### Production Build & Linting

```bash
# Check code style and rules
npm run lint

# Compile production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Seeded User Accounts

The database seeds three distinct user personas for testing:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.test` | `Admin@12345` | Full access: users, catalog, plans, discounts, billing, subscriptions, invoices, payments |
| **Staff** | `staff@brightloop.test` | `Staff@12345` | Operations access: customers, quotations, subscriptions, billing, invoices, payments |
| **Customer** | `customer@brightloop.test` | `Customer@12345` | Self-service portal: view personal subscriptions, invoices, pay invoices, pause/cancel |

---

## Architecture & Project Structure

```
frontend/src/
├── api/             # API client modules (auth, customers, catalog, subscriptions, invoices, payments)
│   ├── client.js    # Axios instance with Authorization Bearer interceptors
│   └── mockable.js  # Graceful fallback wrapper for network disruptions & demo mocks
├── components/
│   ├── common/      # Universal components: DataTable, PageHeader, StatusBadge, ConfirmDialog, etc.
│   ├── layout/      # AppLayout, Sidebar, Navbar, MobileMenu, Breadcrumbs
│   └── ui/          # Headless UI primitives (Button, Input, Card, Dialog, Dropdown, Skeleton)
├── context/         # AuthContext (token storage, current user role, reactive redirects)
├── lib/
│   ├── constants.js # Application statuses, billing cycles, payment methods
│   ├── errors.js    # Centralized API error parsing & toast handlers
│   ├── format.js    # Currency, date, and percentage formatters
│   └── validation.js# Zod validation schemas for all modules (M0 - M8)
├── mocks/           # Deterministic in-memory mock repositories and state engines
├── pages/
│   ├── auth/        # Login, Register, Forgot Password, Reset Password, Profile
│   ├── billing/     # Automated billing run runner, batch processing, summary
│   ├── catalog/     # Products, Subscription Plans, Promotional Discounts
│   ├── customers/   # Customer directories and detailed financial profiles
│   ├── dashboard/   # Executive KPI metrics, MRR, trends, and quick actions
│   ├── invoices/    # Invoices listing, detail breakdown, PDF/HTML print template
│   ├── payments/    # Settlement ledger, manual payment recording, receipt dialogs
│   ├── portal/      # Customer-facing self-service portal (subscriptions, bills)
│   ├── quotations/  # Quotation templates and draft lifecycle
│   └── subscriptions/# Subscription manager, lifecycle actions (activate, pause, close)
└── routes/          # ProtectedRoute, RoleRoute guards, and route hierarchy
```

---

## Hardening & UX Design Standards (FE-B)

The frontend is hardened according to strict production UX criteria:

1. **Skeleton Loading States**:
   Every table, list, and detail view displays animated loading skeletons with staggered column widths during data retrieval, eliminating layout shift (CLS).
2. **Universal Empty & Error States**:
   Tables render contextual empty states with actionable create triggers. Failed API requests present error cards with immediate retry buttons.
3. **Double-Submit Prevention**:
   All form submission buttons are dynamically disabled (`disabled={isSubmitting}`) with inline spinner indicators while requests are pending.
4. **Responsive Horizontal Overflow**:
   All data tables wrap content inside horizontal scroll containers with sticky actions to prevent layout breakage on mobile and small tablet screens.
5. **Print CSS Optimization**:
   The invoice detail view includes a dedicated standalone print route (`/invoices/:id/print`) and print media stylesheets (`@media print`) that hide navigation chrome and fit neatly onto standard A4/Letter pages.
6. **Unified Notifications**:
   Toasts across all mutations use a standardized Sonner toast layout (`toast.success`, `toast.error`, `handleApiError`) displaying server-provided messages.
