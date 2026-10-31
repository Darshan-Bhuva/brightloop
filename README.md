# Brightloop

> Production-grade subscription management, recurring billing, customer portal, and invoice lifecycle platform.

> Here is live Project link on vercel :- https://brightloop-odoo.vercel.app/

```
Credential is already set in form
```

Brightloop is organized as a clean monorepo containing a **Laravel 11 REST API** and a **React 19 + Vite** single-page application. Complete specifications, data dictionaries, and architectural guidelines are documented in [`docs/PLAN.md`](docs/PLAN.md).

---

## Repository Layout

```
brightloop/
├── backend/          # Laravel 11 REST API (PHP 8.3+)
│   ├── app/          # Models, Controllers, Policies, Services
│   ├── database/     # Migrations, Factories, Seeders
│   ├── routes/api.php# Fully versioned REST endpoints
│   └── docs/http/    # HTTP client requests for API testing
├── frontend/         # React 19 + Vite SPA (JavaScript)
│   ├── src/          # Components, Pages, State, Context, Hooks
│   ├── docs/http/    # Frontend endpoint contract specifications
│   └── dist/         # Compiled production assets
├── docs/
│   └── PLAN.md       # Master engineering plan and API contracts
└── README.md         # Monorepo setup, credentials, and demo script
```

---

## Seeded User Accounts

The database comes pre-seeded with three default accounts for testing different role permissions:

| Persona | Email | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.test` | `Admin@12345` | Global administrative control, users, tax, plans, discounts, billing runs |
| **Staff** | `staff@brightloop.test` | `Staff@12345` | Operational manager: customer onboarding, quotations, subscriptions, payments |
| **Customer** | `customer@brightloop.test` | `Customer@12345` | Self-service subscriber portal: invoices, payment receipts, pause/cancel |

---

## Quickstart & Local Setup

### 1. Prerequisites

- **PHP**: 8.3 or higher with `pdo_pgsql` / `pdo_sqlite`, `bcmath`, `curl`, `mbstring`
- **Composer**: 2.x
- **Node.js**: 20+ LTS
- **npm**: 10+ (or pnpm / yarn)
- **Database**: PostgreSQL 15+ (or SQLite for fast local development)

---

### 2. Backend Setup (Laravel API)

```bash
cd backend

# Install PHP dependencies
composer install

# Prepare environment file
cp .env.example .env

# Generate application encryption key
php artisan key:generate

# Run database migrations and seed baseline accounts
php artisan migrate:fresh --seed

# (Optional) Seed high-volume demo dataset (3,000 subscriptions, 8,000 invoices)
php artisan db:seed --class=DemoVolumeSeeder

# Start local API server (runs at http://127.0.0.1:8000)
php artisan serve
```

---

### 3. Frontend Setup (React SPA)

```bash
cd frontend

# Install Node dependencies
npm install

# Prepare environment file
cp .env.example .env

# Start Vite development server (runs at http://localhost:5173)
npm run dev
```

To build for production:

```bash
npm run build
npm run preview
```

---

## 8-Minute Manual Demo Script

Follow these steps to demonstrate the end-to-end functionality across roles:

1. **Customer Self-Registration**:
   - Navigate to `http://localhost:5173/register`.
   - Attempt registration with a weak password (e.g. `123456`) to demonstrate password policy validation.
   - Register a valid account: notice automatic redirect to `/portal` with a clean empty state.

2. **Staff Onboarding & Subscription**:
   - Log in as `staff@brightloop.test` / `Staff@12345`.
   - Go to `/customers` -> create a new customer.
   - Go to `/subscriptions` -> create a new subscription from a quotation template.
   - Send quotation, confirm, and activate the subscription.

3. **Admin Discount Management**:
   - Log out and log in as `admin@brightloop.test` / `Admin@12345`.
   - Go to `/discounts` -> click "New Discount".
   - Create a 15% discount code and attach it to the subscription.

4. **Automated Billing Run**:
   - Navigate to `/billing`.
   - Trigger the recurring billing run: inspect generated draft invoices.
   - Bulk-confirm draft invoices.
   - Open an invoice detail, click "Print Invoice" to view the dedicated print stylesheet.

5. **Payment Settlement**:
   - On the confirmed invoice, click "Record Payment".
   - Record a partial settlement (notice balance reduction and remaining due update).
   - Record the remaining balance: notice instant status transition to `PAID`.

6. **Executive Dashboard**:
   - Navigate to `/dashboard`.
   - Review updated KPIs: Active Subscriptions, Monthly Recurring Revenue (MRR), Total Collected, Outstanding, and Overdue balances.
   - Click the "Overdue" quick action to filter invoices by due date.

7. **Customer Portal Operations**:
   - Log in as `customer@brightloop.test` / `Customer@12345`.
   - Navigate to `/portal/subscriptions`: view active plans and cycle dates.
   - Pause the subscription: notice status badge update and action feedback.
   - Navigate to `/portal/invoices`: review paid invoices and download/print receipts.

8. **High-Volume Performance Benchmark**:
   - With `DemoVolumeSeeder` seeded (300 customers, 3,000 subscriptions, 8,000 invoices), browse `/subscriptions` and `/invoices`.
   - Verify pagination, instant filter responses, and load times under 2 seconds.

---

## API Testing & HTTP Client

All REST endpoints are documented with executable `.http` test files (compatible with VS Code REST Client and JetBrains HTTP Client):

- `backend/docs/http/` - End-to-end backend endpoint requests
- `frontend/docs/http/` - Frontend service contract verification requests
