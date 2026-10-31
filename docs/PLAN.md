# Brightloop Subscription Management System: Master Plan

> **Single source of truth for Backend (Laravel 13 + PostgreSQL + Passport) and Frontend (React JS).**
> Both layers read THIS file. Endpoint IDs (e.g. `SUB-07`), resource shapes (section 6) and enums (section 3) are shared. If a name appears in both layers, it is spelled identically here.

---

## 0. How to use this file (read first)

**Kiro prompts (copy-paste, replace N):**

- Backend dev:
  `Read docs/PLAN.md sections 1-6 and the "Module MN" section. Implement the BACKEND tasks of Module MN only. Follow the API contract exactly (paths, field names, validation, response shapes). Do not touch /frontend. When done, create backend/docs/http/mN.http with one request per endpoint of the module, then stop.`
- Frontend dev:
  `Read docs/PLAN.md sections 1-6 and the "Module MN" section. Implement the FRONTEND tasks of Module MN only. Use the API contract exactly. Do not touch /backend. Use mocks while VITE_USE_MOCK=true (static fixtures shaped like section 6). Then stop.`

**Rules**

1. The contract is law. Never invent an endpoint, field or enum value. If something is missing, message the other layer in chat first, then edit PLAN.md in a commit by itself (`docs: contract change - <what>`).
2. Backend devs only touch `/backend`. Frontend devs only touch `/frontend`. Nobody edits `/docs` except for a contract change.
3. Frontend does NOT duplicate business logic. Buttons come from `allowed_actions` returned by the API; totals shown after save come from the API.
4. Cut order when late: drop **P2**, then **P1**. P0 must be polished.
5. Every module ends with: **manual test, push, tag**.

**Definition of done per module (both layers)**

1. Every endpoint of the module works as in the contract (BE: via `.http` file; FE: against the real API with `VITE_USE_MOCK=false`).
2. The module's manual test checklist passes.
3. Push:
   ```
   git add -A && git commit -m "feat(MN-BE): <summary>"      # or MN-FE
   git pull --rebase origin main && git push origin main
   git tag mN-be && git push origin mN-be                    # or mN-fe
   ```
4. Post "MN-BE pushed" or "MN-FE pushed" in the team chat. FE switches that module from mock to real API.

---

## 1. Stack & project layout

| Area | Decision |
|---|---|
| Backend | Laravel 13 (PHP 8.3+), PostgreSQL, Laravel Passport (personal access tokens, bearer header) |
| Frontend | React (JavaScript) + Vite, Tailwind, shadcn/ui + lucide-react, React Router, TanStack Query, axios, react-hook-form + zod, date-fns, recharts |
| Deployment | None. Local demo. Backend `http://localhost:8000`, frontend `http://localhost:5173` |
| Repo | Monorepo: `/backend`, `/frontend`, `/docs`, `/.kiro/steering` |

**Backend folders**
```
app/Enums/*.php                      PHP backed enums (values = section 3)
app/Models/*.php
app/Http/Controllers/Api/*Controller.php    thin: validate -> service -> resource
app/Http/Requests/<Module>/*Request.php
app/Http/Resources/*Resource.php            shapes = section 6
app/Http/Middleware/EnsureRole.php          alias "role"
app/Services/*Service.php                   ALL business logic
app/Policies/*.php
app/Support/ApiResponse.php                 envelope helpers
app/Console/Commands/BillingRun.php         billing:run {--date=}
app/Console/Commands/AutoCloseSubscriptions.php   subscriptions:auto-close
routes/api/<module>.php                     auto-loaded by routes/api.php (glob)
database/{migrations,factories,seeders}
backend/docs/http/mN.http                   request samples per module
```

**Frontend folders**
```
src/api/client.js            axios instance, bearer interceptor, 401 -> logout
src/api/mockable.js          call(real, mock) switch on VITE_USE_MOCK
src/api/<module>.js          one function per endpoint
src/mocks/<module>.js        static fixtures shaped like section 6
src/hooks/use<Module>.js     TanStack Query hooks
src/pages/<module>/*         pages
src/components/ui/*          shadcn
src/components/common/*      DataTable, Pagination, FilterBar, StatusBadge, MoneyText, DateText,
                             ConfirmDialog, PageHeader, EmptyState, FormField, RecordPaymentDialog
src/context/AuthContext.jsx
src/routes/{index.jsx,ProtectedRoute.jsx,RoleRoute.jsx}
src/lib/{format.js,constants.js,errors.js}
```
Env: `VITE_API_URL=http://localhost:8000/api`, `VITE_USE_MOCK=true|false`, `VITE_CURRENCY=INR`. Token key in localStorage: `bl_token`.
Backend `.env`: `FRONTEND_URL=http://localhost:5173`, `MAIL_MAILER=log`, CORS allows `http://localhost:5173`.

---

## 2. Team, ownership, timeline

Split by layer. Same module numbers on both layers.

| Person | Layer | Owns |
|---|---|---|
| BE-A | Backend | M0 (infra), M1, M4, M6, M7 |
| BE-B | Backend | M0 (database), M2, M3, M5, M8 |
| FE-A | Frontend | M0 (shell), M1, M4, M7 |
| FE-B | Frontend | M0 (common UI), M2, M3, M5, M6, M8 |

Counterparts on the same module: BE-A+FE-A (M1, M4, M7), BE-B+FE-B (M2, M3, M5, M8), BE-A+FE-B (M6). FE builds with mocks, then switches to the real API when the BE module is pushed.

| Module | Name | Target done (hours from start) | Priority |
|---|---|---|---|
| M0 | Foundation | 0:45 | P0 |
| M1 | Auth, Users, Customers | 1:30 | P0 |
| M2 | Catalog (taxes, payment terms, products) | 1:30 | P0 |
| M3 | Plans & Discounts | 2:15 | P0 |
| M4 | Quotation templates & Subscriptions | 3:30 | P0 |
| M5 | Invoicing & Billing engine | 4:30 | P0 |
| M6 | Payments | 5:00 | P0 |
| M7 | Reports, Dashboard, Customer portal | 5:45 | P0 |
| M8 | Hardening, demo data, performance, README | 7:00 | P1 |
| | Freeze: no new features | 7:30 | |
| | Final push + demo rehearsal | 8:00 | |

Parallel dependency trick: M0 seeders create ready-to-use demo data (taxes, products, plans, an active subscription, invoices), so BE-A can build M4 without waiting for M2/M3 endpoints, and BE-B can build M5 without waiting for M4 endpoints.

---

## 3. Conventions

**Base URL** `http://localhost:8000/api`. Headers: `Accept: application/json`, `Authorization: Bearer <token>`.

**Success envelope**
```json
{ "success": true, "message": "OK", "data": {}, "meta": null }
```
`data` is an object or an array. For paginated lists `meta` = `{ "current_page":1, "last_page":5, "per_page":15, "total":71 }`, otherwise `null`.

**Error envelope**
```json
{ "success": false, "message": "The given data was invalid.", "errors": { "email": ["The email has already been taken."] } }
```
`errors` is `null` for non-validation errors.

| Status | Use |
|---|---|
| 200 / 201 | OK / created |
| 401 | missing or invalid token (and bad login) |
| 403 | role not allowed, or inactive account |
| 404 | not found (also: customer asking for another customer's record) |
| 409 | business-rule/state conflict (illegal transition, record in use). `message` explains. |
| 422 | validation failed, `errors` keyed by field |

Frontend: 422 -> map `errors` to form fields; 401 -> logout + redirect `/login`; 403/409/other -> toast `message`.

**Formats**: JSON keys `snake_case`. Money = string with 2 decimals (`"1560.00"`). Rates = string (`"18.00"`). Dates = `YYYY-MM-DD`. Timestamps = ISO 8601 UTC. Booleans = `true/false`. IDs = integers. Empty = `null`. Enums = lowercase strings.

**Notation used below**: `req` required, `?` optional/nullable, types `str int dec bool date ts`, `A`=admin, `S`=staff, `C`=customer (own data only).

**Common list query params** (all list endpoints): `page` (default 1), `per_page` (default 15, max 100), `search`, `sort` (field name listed per endpoint), `direction` (`asc|desc`). **Dropdown mode**: `?all=1` on taxes, payment-terms, products, plans, discounts, customers, quotation-templates returns all (max 500) rows, `meta: null`.

**Enums (exact values)**

| Enum | Values |
|---|---|
| `role` | `admin`, `staff`, `customer` |
| `product_type` | `service`, `goods` |
| `tax_type` | `percentage`, `fixed` |
| `billing_period` | `daily`, `weekly`, `monthly`, `yearly` |
| `discount_type` | `fixed`, `percentage` |
| `discount_applies_to` | `products`, `subscription` |
| `discount_state` (derived) | `active`, `scheduled`, `expired`, `exhausted`, `inactive` |
| `subscription_status` | `draft`, `quotation`, `confirmed`, `active`, `closed` |
| `subscription_line_type` | `plan`, `product` |
| `invoice_status` | `draft`, `confirmed`, `paid`, `cancelled` |
| `payment_method` | `cash`, `bank_transfer`, `card`, `upi`, `cheque`, `other` |

**Permissions matrix**

| Area | Admin | Staff | Customer |
|---|---|---|---|
| Auth (register, login, me, reset) | yes | yes | yes |
| Users | full | none | none |
| Customers | full | create/read/update (no delete) | none (own profile via AUTH-07) |
| Taxes, payment terms, products, plans, discounts | full | read only | none |
| Quotation templates | full | full | none |
| Subscriptions | full | create/read/update/all actions | own: read + pause, resume, close, renew |
| Billing (due list, run) | yes | yes | none |
| Invoices | all actions | all actions | own: read only, never sees `draft` |
| Payments | create/read/delete | create/read | own: read |
| Reports | yes | yes | none (`/portal/summary` instead) |

Enforcement: route middleware `auth:api` + `role:admin,staff`; customer scoping inside services (`customers.user_id = auth user`). Other customer's record returns 404.

**Password rule (everywhere)**: min **9** characters, at least 1 uppercase, 1 lowercase, 1 special character. Laravel: `Password::min(9)->mixedCase()->symbols()`. Frontend zod: `length>=9`, `/[A-Z]/`, `/[a-z]/`, `/[^A-Za-z0-9]/`.

**Seeded logins**: `admin@brightloop.test / Admin@12345`, `staff@brightloop.test / Staff@12345`, `customer@brightloop.test / Customer@12345`.

---

## 4. Business rules (implemented in services, backend only; frontend shows results)

**BR-1 Unit price.** `unit_price = product.sales_price + variant.extra_price` (variant optional). Server computes it. Client never sends `unit_price`.

**BR-2 Plan fee line.** Plan `price` is a flat recurring fee per billing period. Every subscription has exactly one auto-generated line with `line_type=plan`, `product_id=null`, `description="Plan: <plan name> (<billing_period>)"`, `quantity=1`, `unit_price=plan.price`, `tax_id=plan.tax_id`. Client sends only product lines. Plan line is regenerated whenever plan changes. Plan `min_quantity` applies to every product line quantity (`quantity >= plan.min_quantity`).

**BR-3 Line math (rounded half-up to 2 decimals per line).**
`amount = quantity * unit_price`
`tax_amount = percentage: (amount - discount) * rate / 100` or `fixed: rate` (flat per line; 0 when net is 0)
Subscription totals (no discounts, shown for estimate): `subtotal = sum(amount)`, `tax_total = sum(tax_amount)`, `total = subtotal + tax_total`.
Invoice: `subtotal = sum(quantity*unit_price)`, `discount_total = sum(discount_amount)`, `tax_total = sum(tax_amount)`, `total = subtotal - discount_total + tax_total`, `line_total = quantity*unit_price - discount_amount + tax_amount`, `amount_due = total - amount_paid`.

**BR-4 Subscription state machine**

| Action | Endpoint | From -> To | Extra preconditions | Who |
|---|---|---|---|---|
| send quotation | SUB-06 | draft -> quotation | sets `quotation_valid_until = today + template.validity_days` (30 if no template) | A,S |
| confirm | SUB-07 | quotation -> confirmed | `quotation_valid_until >= today`, else 409 "Quotation expired" | A,S |
| activate | SUB-08 | confirmed -> active | sets `next_invoice_date = start_date` | A,S |
| close | SUB-11 | confirmed/active -> closed | `plan.closable=true` else 409; sets `closed_at`, `close_reason`, `next_invoice_date=null` | A,S,C(own) |
| pause | SUB-09 | active (not paused) -> same status, `is_paused=true` | `plan.pausable=true` else 409 | A,S,C(own) |
| resume | SUB-10 | active+paused -> `is_paused=false` | if `next_invoice_date < today` set it to today (paused time is not back-billed) | A,S,C(own) |
| renew | SUB-12 | active | `plan.renewable=true` else 409; `new_expiry_date > expiry_date`; if `next_invoice_date` is null set it to `old_expiry_date + 1 day` | A,S,C(own) |
| edit | SUB-04 | only draft, quotation | | A,S |
| delete | SUB-05 | only draft | | A,S |

Auto close: `subscriptions:auto-close` (also run at the start of every billing run) closes `active` subscriptions where `expiry_date < today` and `plan.auto_close=true` (`close_reason="Expired"`). Plans with `auto_close=false` stay `active` after expiry but are never billed beyond `expiry_date`.

`allowed_actions` (returned on Subscription): subset of `edit, delete, send_quotation, confirm, activate, pause, resume, close, renew, add_discount`. Computed from status + plan flags + role. `add_discount` is shown for A,S when status is draft/quotation/confirmed/active.

**BR-5 Billing run (no double billing, nothing skipped).**
For each subscription with `status=active`, `is_paused=false`, `next_invoice_date <= as_of_date` and `next_invoice_date <= expiry_date`, inside a DB transaction with a row lock on the subscription:
```
while next_invoice_date <= as_of_date and next_invoice_date <= expiry_date:
    period_start = next_invoice_date
    period_end   = period_start + 1 period - 1 day        # daily: same day, weekly: +6d, monthly: +1 month -1d, yearly: +1 year -1d
    period_end   = min(period_end, expiry_date)
    if invoice exists for (subscription_id, period_start): skip   # DB unique index also guards this
    create DRAFT invoice (invoice_date = as_of_date, due_date = invoice_date + payment_term.due_days)
    copy subscription lines -> invoice lines (snapshot tax name/rate/type), apply discounts (BR-6), compute tax and totals (BR-3)
    next_invoice_date = period_end + 1 day
if next_invoice_date > expiry_date: next_invoice_date = null
```
Missed periods are caught up in the same run (one invoice per period). Running billing twice creates nothing new (idempotent). A cancelled invoice still blocks its period (unique index) by design.

**BR-6 Discounts (evaluated at invoice generation, using `as_of_date`).**
A discount is *eligible* when: `is_active`, `start_date <= as_of_date <= end_date`, and (`usage_limit` is null or `used_count < usage_limit`).
1. *Line level* (`applies_to=products`): for each product line, candidates = eligible discounts that include the line's product and satisfy `min_quantity` (line quantity) and `min_purchase` (line gross amount) when set. Amount: `percentage: gross*value/100`, `fixed: value` (per line), capped at gross. Pick the largest (tie: lowest id). Store `invoice_lines.discount_id` and add to `discount_amount`.
2. *Subscription level* (`applies_to=subscription`): candidates = eligible discounts attached to the subscription (SUB-13). `min_purchase` compares against invoice gross after line discounts; `min_quantity` against total product-line quantity. Pick the largest, compute on base = gross after line discounts (percentage of base, or fixed capped at base). Spread across ALL lines proportionally to (gross - line discount); the last line takes the rounding remainder. Store `invoices.discount_id`.
3. Usage: each distinct discount used on an invoice increments `used_count` by 1 (lock the discount row so the limit holds under a bulk run). Cancelling the invoice (INV-05) decrements it.
4. Derived `discount_state`: `inactive` (is_active=false) > `exhausted` (limit reached) > `expired` (end_date < today) > `scheduled` (start_date > today) > `active`.

**BR-7 Tax.** Taxes come from admin tax rules. Product `tax_id` defaults the line's tax; plan line uses `plan.tax_id`. Subscription lines reference the live tax; invoice lines snapshot `tax_name, tax_type, tax_rate`.

**BR-8 Invoice state machine**

| Action | Endpoint | From -> To | Rules |
|---|---|---|---|
| confirm | INV-04 | draft -> confirmed | if `amount_due = 0` go straight to `paid` |
| cancel | INV-05 | draft/confirmed -> cancelled | confirmed only when `amount_paid = 0`; releases discount usage |
| send | INV-06 | confirmed/paid | sets `sent_at`, emails customer (mail log driver) |
| auto paid | PAY-02 | confirmed -> paid | when `amount_due` reaches 0 |
| payment deleted | PAY-03 | paid -> confirmed | when `amount_due > 0` again |

`allowed_actions` (Invoice): subset of `edit, confirm, cancel, send, record_payment, print`. draft: edit, confirm, cancel. confirmed: send, record_payment, print, plus cancel if `amount_paid=0`. paid: send, print. cancelled: print. Customers get only `print`.

**BR-9 Overdue (derived, never stored).** `is_overdue = status=confirmed AND due_date < today AND amount_due > 0`, `days_overdue = today - due_date`. SQL filter: `status='confirmed' AND due_date < CURRENT_DATE`.

**BR-10 Reports.**
- `mrr` = sum over `active`, not paused subscriptions of `subscription.total` normalized to a month: daily x30, weekly x4.345, monthly x1, yearly /12.
- `invoiced` = sum `invoices.total` where status in (confirmed, paid) and `invoice_date` in range.
- `collected` = sum `payments.amount` where `payment_date` in range.
- `outstanding_amount` = sum `amount_due` of confirmed invoices (all time). `overdue_*` = subset where overdue (BR-9).

**BR-11 Numbers.** `SUB-000001` and `INV-000001`: set from the row id right after insert (`str_pad(id, 6, '0')`) in the same transaction (observer).

**BR-12 Performance.** Paginate every list (max 100). Eager load relations (no N+1; `Model::preventLazyLoading()` outside production). Reports use aggregate SQL (`SUM/COUNT ... GROUP BY`), never load models into memory. Indexes in section 5 are mandatory. Target < 2s per page with 3,000+ subscriptions seeded.

---

## 5. Database schema (Kiro: build as migrations in this order)

Notation: `fk -> table.col, onDelete`. `timestamps` = created_at/updated_at. `softDeletes` = deleted_at. Money = `decimal(14,2)` unless noted. Passport tables come from Passport's own migrations.

```
table: users                                   (modify Laravel default)
  id: bigint pk
  name: string(255)
  email: string(255), unique            # store lowercase
  email_verified_at: timestamp nullable
  password: string
  role: string(20), default customer, index      # enum role
  is_active: boolean, default true
  remember_token: string(100) nullable
  timestamps
  relations: hasOne Customer ; uses HasApiTokens (Passport)

table: password_reset_tokens                   (Laravel default)

table: customers
  id: bigint pk
  user_id: fk -> users.id, nullOnDelete, nullable, unique
  name: string(255), index
  email: string(255), unique
  phone: string(30) nullable
  company_name: string(255) nullable
  address_line: string(255) nullable
  city: string(100) nullable
  state: string(100) nullable
  country: string(100) nullable
  postal_code: string(20) nullable
  timestamps, softDeletes
  relations: belongsTo User; hasMany Subscription, Invoice, Payment

table: taxes
  id, name: string(100), type: string(20) enum tax_type,
  rate: decimal(8,2), is_active: boolean default true, timestamps
  relations: hasMany Product, Plan

table: payment_terms
  id, name: string(100), due_days: unsignedSmallInteger default 0, timestamps

table: products
  id, name: string(255) index, type: string(20) enum product_type index,
  sales_price: decimal(12,2), cost_price: decimal(12,2),
  tax_id: fk -> taxes.id, nullOnDelete, nullable,
  notes: text nullable, is_active: boolean default true index, timestamps, softDeletes
  relations: belongsTo Tax; hasMany ProductVariant; belongsToMany Discount (discount_product)

table: product_variants
  id, product_id: fk -> products.id, cascade,
  attribute: string(100), value: string(100),
  extra_price: decimal(12,2) default 0, timestamps, softDeletes
  index: (product_id)
  relations: belongsTo Product

table: plans
  id, name: string(255), price: decimal(12,2),
  billing_period: string(20) enum billing_period, index,
  min_quantity: unsignedInteger default 1,
  start_date: date, end_date: date nullable,
  tax_id: fk -> taxes.id, nullOnDelete, nullable,
  auto_close: boolean default false, closable: boolean default true,
  pausable: boolean default false, renewable: boolean default false,
  is_active: boolean default true, timestamps, softDeletes
  index: (is_active, start_date, end_date)
  relations: belongsTo Tax; hasMany Subscription

table: quotation_templates
  id, name: string(255), validity_days: unsignedSmallInteger default 30,
  plan_id: fk -> plans.id, restrict, notes: text nullable,
  created_by: fk -> users.id, nullOnDelete, nullable, timestamps, softDeletes
  relations: belongsTo Plan; hasMany QuotationTemplateLine

table: quotation_template_lines
  id, quotation_template_id: fk -> quotation_templates.id, cascade,
  product_id: fk -> products.id, restrict,
  variant_id: fk -> product_variants.id, nullOnDelete, nullable,
  quantity: unsignedInteger default 1, timestamps

table: subscriptions
  id, number: string(20) nullable unique          # set by observer (BR-11)
  customer_id: fk -> customers.id, restrict, index
  plan_id: fk -> plans.id, restrict, index
  quotation_template_id: fk -> quotation_templates.id, nullOnDelete, nullable
  payment_term_id: fk -> payment_terms.id, restrict
  status: string(20) enum subscription_status, default draft
  is_paused: boolean default false, paused_at: timestamp nullable
  start_date: date, expiry_date: date,
  quotation_valid_until: date nullable, next_invoice_date: date nullable
  notes: text nullable
  subtotal: decimal(14,2) default 0, tax_total: decimal(14,2) default 0, total: decimal(14,2) default 0
  closed_at: timestamp nullable, close_reason: string(255) nullable
  created_by: fk -> users.id, nullOnDelete, nullable
  timestamps, softDeletes
  indexes: (status), (status, is_paused, next_invoice_date), (start_date), (expiry_date)
  relations: belongsTo Customer, Plan, PaymentTerm, QuotationTemplate; hasMany SubscriptionLine, Invoice;
             belongsToMany Discount (subscription_discounts)

table: subscription_lines
  id, subscription_id: fk -> subscriptions.id, cascade,
  line_type: string(20) enum subscription_line_type, default product,
  product_id: fk -> products.id, restrict, nullable,
  variant_id: fk -> product_variants.id, nullOnDelete, nullable,
  description: string(255),
  quantity: unsignedInteger, unit_price: decimal(12,2),
  tax_id: fk -> taxes.id, nullOnDelete, nullable,
  amount: decimal(14,2), tax_amount: decimal(14,2) default 0,
  sort_order: unsignedSmallInteger default 0, timestamps

table: discounts
  id, name: string(255), code: string(50) nullable unique,
  type: string(20) enum discount_type, value: decimal(12,2),
  applies_to: string(20) enum discount_applies_to,
  min_purchase: decimal(12,2) nullable, min_quantity: unsignedInteger nullable,
  start_date: date, end_date: date,
  usage_limit: unsignedInteger nullable, used_count: unsignedInteger default 0,
  is_active: boolean default true, timestamps, softDeletes
  index: (is_active, start_date, end_date)
  relations: belongsToMany Product (discount_product); belongsToMany Subscription (subscription_discounts)

table: discount_product
  discount_id: fk -> discounts.id, cascade ; product_id: fk -> products.id, cascade
  primary key (discount_id, product_id)

table: subscription_discounts
  subscription_id: fk -> subscriptions.id, cascade ; discount_id: fk -> discounts.id, restrict
  timestamps ; primary key (subscription_id, discount_id)

table: invoices
  id, number: string(20) nullable unique          # set by observer (BR-11)
  subscription_id: fk -> subscriptions.id, restrict
  customer_id: fk -> customers.id, restrict, index
  payment_term_id: fk -> payment_terms.id, restrict
  status: string(20) enum invoice_status, default draft
  invoice_date: date, due_date: date, period_start: date, period_end: date
  subtotal, discount_total, tax_total, total: decimal(14,2) default 0
  amount_paid: decimal(14,2) default 0, amount_due: decimal(14,2) default 0
  discount_id: fk -> discounts.id, nullOnDelete, nullable       # subscription-level discount used
  sent_at: timestamp nullable, cancelled_at: timestamp nullable, cancel_reason: string(255) nullable
  notes: text nullable
  created_by: fk -> users.id, nullOnDelete, nullable, timestamps
  UNIQUE (subscription_id, period_start)           # guarantees nothing is billed twice
  indexes: (status), (status, due_date), (invoice_date), (due_date), (customer_id)
  relations: belongsTo Subscription, Customer, PaymentTerm, Discount; hasMany InvoiceLine, Payment

table: invoice_lines
  id, invoice_id: fk -> invoices.id, cascade,
  product_id: fk -> products.id, nullOnDelete, nullable,
  variant_id: fk -> product_variants.id, nullOnDelete, nullable,
  description: string(255), quantity: unsignedInteger, unit_price: decimal(12,2),
  discount_id: fk -> discounts.id, nullOnDelete, nullable,
  discount_amount: decimal(14,2) default 0,
  tax_id: fk -> taxes.id, nullOnDelete, nullable,
  tax_name: string(100) nullable, tax_type: string(20) nullable, tax_rate: decimal(8,2) default 0,
  tax_amount: decimal(14,2) default 0, line_total: decimal(14,2),
  sort_order: unsignedSmallInteger default 0, timestamps

table: payments
  id, invoice_id: fk -> invoices.id, restrict, index
  customer_id: fk -> customers.id, restrict, index           # denormalized from invoice
  method: string(20) enum payment_method, index
  amount: decimal(14,2), payment_date: date, index
  reference: string(100) nullable, note: string(500) nullable
  recorded_by: fk -> users.id, nullOnDelete, nullable, timestamps
  relations: belongsTo Invoice, Customer, User(recorded_by)
```

**Seed data (DatabaseSeeder calls one seeder per block; dates relative to today)**
- Users: the 3 logins in section 3 (+ a `customers` row linked to the customer user).
- Taxes: `GST 5%`, `GST 12%`, `GST 18%` (percentage), `No Tax` (0).
- Payment terms: `Immediate` 0, `Net 15` 15, `Net 30` 30, `Net 45` 45.
- Products: `Brightloop Business Suite` (service, sales 4000.00, cost 1500.00, GST 18%, variants Brand: Odoo +560.00, Brand: Zoho +300.00, Brand: Custom +0.00), `Brightloop CRM Seat` (service, 1200.00/400.00, GST 18%), `Extra Storage 100GB` (service, 300.00/100.00, GST 18%), `Priority Support` (service, 800.00/300.00, GST 18%), `Onboarding Kit` (goods, 2500.00/1200.00, GST 12%).
- Plans (start_date = today-90): `Monthly Starter` (monthly, 999.00, min 1, pausable, closable, renewable), `Yearly Business` (yearly, 9999.00, min 5, auto_close, renewable, not closable, not pausable), `Weekly Trial` (weekly, 199.00, min 1, auto_close, closable), `Daily Pass` (daily, 49.00, min 1, closable). Tax GST 18% on all.
- Discounts: `Volume 10%` (percentage 10, applies_to products [CRM Seat], min_quantity 10, valid today-30..today+180), `Loyalty 500 Off` (fixed 500, subscription, min_purchase 5000, usage_limit 5), `Expired Promo` (percentage 20, ended 10 days ago).
- Quotation template: `Standard SMB Offer` (plan Monthly Starter, validity 14 days, lines: CRM Seat x2, Extra Storage x1).
- Demo subscriptions (~12 across all statuses): 4 `active` with `next_invoice_date <= today` (due for billing), 2 `active` paused/not due, 2 `draft`, 1 `quotation`, 1 `confirmed`, 2 `closed`; 3 existing invoices (1 paid, 1 confirmed overdue, 1 draft).

---

## 6. Resource shapes (responses; identical on both layers)

```
User            { id:int, name, email, role:role, is_active:bool, customer_id:int|null, created_at:ts }
Customer        { id, user_id:int|null, name, email, phone?, company_name?, address_line?, city?, state?, country?,
                  postal_code?, has_login:bool, active_subscriptions_count:int, created_at }
Tax             { id, name, type:tax_type, rate:dec, is_active:bool }
PaymentTerm     { id, name, due_days:int }
Variant         { id, attribute, value, extra_price:dec }
Product         { id, name, type:product_type, sales_price:dec, cost_price:dec, tax_id:int|null,
                  tax:{id,name,type,rate}|null, notes?, is_active:bool, variants:Variant[], created_at }
Plan            { id, name, price:dec, billing_period, min_quantity:int, start_date:date, end_date:date|null,
                  tax_id:int|null, tax:{id,name,rate}|null, auto_close:bool, closable:bool, pausable:bool,
                  renewable:bool, is_active:bool, is_available:bool }          # is_available = is_active and today within dates
Discount        { id, name, code:str|null, type:discount_type, value:dec, applies_to,
                  product_ids:int[], products:{id,name}[], min_purchase:dec|null, min_quantity:int|null,
                  start_date, end_date, usage_limit:int|null, used_count:int, remaining_uses:int|null,
                  state:discount_state, is_active:bool }
QuotationTemplate { id, name, validity_days:int, plan_id, plan:{id,name,billing_period,price}, notes?,
                  lines:[{ id, product_id, product:{id,name}, variant_id:int|null,
                           variant:{id,attribute,value,extra_price}|null, quantity:int }] }
SubscriptionLine  { id, line_type, product_id:int|null, product_name:str|null, variant_id:int|null,
                  variant_label:str|null, description, quantity:int, unit_price:dec,
                  tax_id:int|null, tax_name:str|null, tax_rate:dec, amount:dec, tax_amount:dec,
                  total:dec }                                  # total = amount + tax_amount
SubscriptionListItem { id, number, status, is_paused:bool, customer:{id,name}, plan:{id,name,billing_period},
                  start_date, expiry_date, next_invoice_date:date|null, total:dec }
Subscription    { id, number, status, is_paused:bool, customer:{id,name,email},
                  plan:{id,name,billing_period,price,closable,pausable,renewable,auto_close},
                  payment_term:{id,name,due_days}, quotation_template_id:int|null,
                  start_date, expiry_date, quotation_valid_until:date|null, next_invoice_date:date|null,
                  notes?, lines:SubscriptionLine[], discounts:{id,name,type,value,state}[],
                  subtotal:dec, tax_total:dec, total:dec, closed_at:ts|null, close_reason?,
                  allowed_actions:str[], created_at }
InvoiceLine     { id, product_id:int|null, description, quantity:int, unit_price:dec, discount_amount:dec,
                  discount_name:str|null, tax_name:str|null, tax_rate:dec, tax_amount:dec, line_total:dec }
Payment         { id, invoice_id, invoice_number, customer:{id,name}, method:payment_method, amount:dec,
                  payment_date:date, reference?, note?, recorded_by:{id,name}|null, created_at }
InvoiceListItem { id, number, status, is_overdue:bool, days_overdue:int, customer:{id,name},
                  subscription:{id,number}, invoice_date, due_date, total:dec, amount_paid:dec, amount_due:dec }
Invoice         { id, number, status, is_overdue, days_overdue,
                  customer:{id,name,email,phone,company_name,address_line,city,state,country,postal_code},
                  subscription:{id,number}, payment_term:{id,name,due_days},
                  invoice_date, due_date, period_start, period_end,
                  subtotal:dec, discount_total:dec, tax_total:dec, total:dec, amount_paid:dec, amount_due:dec,
                  sent_at:ts|null, notes?, lines:InvoiceLine[], payments:Payment[],
                  allowed_actions:str[], created_at }
```
`List` endpoints return `*ListItem` where it exists, otherwise the full shape. Frontend mock fixtures must follow these exactly.

---

# 7. MODULES

---

## Module M0: Foundation

**Goal:** both apps boot, DB exists with demo data, auth plumbing works, shared UI kit exists.
**Owners:** BE-A (infra), BE-B (database), FE-A (shell), FE-B (common UI). All four work in parallel.

### API contract
| ID | Endpoint | Roles | Returns |
|---|---|---|---|
| SYS-01 | `GET /ping` | public | `data: { app:"Brightloop", time: ts }` |
| SYS-02 | `GET /ping/auth` | any logged in | `data: { user: User }` |

### Backend tasks
**BE-A (config/bootstrap/routes only; do NOT touch database/ or app/Models)**
1. Create Laravel 13 project in `/backend`, `.env` for Postgres, `FRONTEND_URL`, `MAIL_MAILER=log`.
2. Install Passport: `composer require laravel/passport`, `php artisan install:api --passport`. In `config/auth.php` set guard `api` driver `passport`. Set `Passport::personalAccessTokensExpireIn(now()->addDays(7))`. If `createToken` complains about a missing personal access client run `php artisan passport:client --personal`.
3. CORS for `http://localhost:5173`. `routes/api.php` auto-loads every file in `routes/api/*.php`.
4. `app/Support/ApiResponse.php` (success, created, paginated, error) producing the section 3 envelopes; paginated helper builds `meta`.
5. Exception rendering for API: 401, 403, 404, 409 (custom `ConflictException`), 422, 500 -> section 3 error envelope.
6. `EnsureRole` middleware aliased `role` (usage `role:admin,staff`). Inactive users get 403.
7. Routes SYS-01, SYS-02. Rate limit login later in M1.

**BE-B (database layer only)**
1. Migrations for every table in section 5 (order by dependency), PHP backed enums in `app/Enums` (values from section 3), models with `$casts`, relations, `SoftDeletes` where listed. `User` model: `HasApiTokens`, role cast.
2. Observers: `Subscription` and `Invoice` set `number` after create (BR-11).
3. Factories for every model; seeders as in the "Seed data" block of section 5; `DatabaseSeeder` calls them in order.
4. `php artisan migrate:fresh --seed` must pass.

### Frontend tasks
**FE-A (shell)**
1. `npm create vite@latest frontend -- --template react`, Tailwind, `npx shadcn@latest init`; add shadcn components: button, input, label, select, dialog, dropdown-menu, table, badge, card, tabs, toast (sonner), checkbox, switch, textarea, popover, calendar, separator, skeleton, sheet.
2. `src/api/client.js` (baseURL from env, bearer interceptor reading `bl_token`, 401 handler), `AuthContext` (user, role, login, logout, token persistence), `ProtectedRoute`, `RoleRoute`.
3. Layout shell: sidebar + topbar. Menu by role:
   - admin/staff: Dashboard, Customers, Subscriptions, Quotation Templates, Billing, Invoices, Payments, Catalog (Products, Plans, Discounts), Settings (Taxes, Payment Terms), Users (admin only).
   - customer: Home, My Subscriptions, My Invoices, My Payments, Profile.
4. Route skeleton with placeholder pages for all routes listed in later modules.

**FE-B (common UI + conventions)**
1. Common components: `DataTable` (server pagination + sort header), `Pagination`, `FilterBar` (search + selects + date range, debounced), `StatusBadge` (colour map for every status enum), `MoneyText` (uses `VITE_CURRENCY`, `en-IN`), `DateText`, `ConfirmDialog`, `PageHeader`, `EmptyState`, `FormField`.
2. `lib/errors.js` (map 422 `errors` to react-hook-form `setError`, toast for others), `lib/constants.js` (all enums as constants + label maps), `lib/format.js`.
3. `src/api/mockable.js` and an empty `src/mocks/` folder with the convention.

### Manual test
1. BE: `php artisan migrate:fresh --seed` succeeds. `GET /api/ping` returns the envelope. Unknown URL returns JSON 404 envelope.
2. BE: In `tinker`, `User::where('email','admin@brightloop.test')->first()->createToken('t')->accessToken`; `GET /api/ping/auth` with that bearer returns 200; without it returns 401 envelope.
3. FE: `npm run dev` loads; sidebar/topbar render; `/dashboard` while logged out redirects to `/login`; `DataTable` demo renders with fake rows.
4. Push + tag `m0-be`, `m0-fe`.

---

## Module M1: Auth, Users, Customers

**Owners:** BE-A, FE-A. **Depends on:** M0.

### API contract

**AUTH-01 Register** `POST /auth/register` (public)
- Body: `name` str req max 255; `email` str req email max 255 unique in `users.email` (lowercased); `password` req (password rule, section 3); `password_confirmation` req same; `phone`? str max 30; `company_name`? str max 255.
- Behaviour: creates `users` (role=customer) and a `customers` profile in one transaction. If a staff-created customer with the same email and `user_id=null` exists, link it instead of creating a new one.
- 201 -> `data: { user: User, token: str, token_type: "Bearer" }`.

**AUTH-02 Login** `POST /auth/login` (public, throttle 10/min)
- Body: `email` req, `password` req.
- 200 -> `data: { user: User, token, token_type: "Bearer" }`. Wrong credentials -> 401 `message: "Invalid email or password"`. Inactive -> 403 `"Account is deactivated"`.

**AUTH-03 Logout** `POST /auth/logout` (any auth) -> revokes current token. 200 `data: null`.

**AUTH-04 Me** `GET /auth/me` (any auth) -> `data: { user: User, customer: Customer|null }`.

**AUTH-05 Forgot password** `POST /auth/forgot-password` (public, throttle)
- Body: `email` req email. Always 200 `message: "If the email exists, a reset link has been sent."`
- Email link: `${FRONTEND_URL}/reset-password?token={token}&email={email}` (use `ResetPassword::createUrlUsing`). Local: read link from `storage/logs/laravel.log`.

**AUTH-06 Reset password** `POST /auth/reset-password` (public)
- Body: `token` req, `email` req, `password` req (rule), `password_confirmation` req.
- 200 `data: null`. Invalid/expired token -> 422 `errors.email: ["This password reset token is invalid."]`. Revoke all existing tokens of the user.

**AUTH-07 Update my profile** `PUT /auth/me` (any auth)
- Body: `name` req; customers may also send `phone, company_name, address_line, city, state, country, postal_code` (all `?` str). Admin/staff: only `name`.
- 200 -> `data: { user: User, customer: Customer|null }`.

**USR-01 List users** `GET /users` (A)
- Filters: `role`, `is_active` (true/false), `search` (name, email). Sort: `name|email|created_at`. Paginated. Returns `User[]`.

**USR-02 Create staff** `POST /users` (A)
- Body: `name` req; `email` req unique; `password` req (rule) + `password_confirmation`; `role` req `in:staff`. 201 -> `User`.

**USR-03 Show user** `GET /users/{id}` (A) -> `User`.

**USR-04 Update user** `PUT /users/{id}` (A)
- Body: `name`? ; `is_active`? bool; `password`? (rule). Email is immutable. Cannot deactivate yourself (409). Deactivating revokes the user's tokens. 200 -> `User`.

**CUS-01 List customers** `GET /customers` (A,S)
- Filters: `search` (name, email, company_name), `has_login` (true/false). Sort: `name|created_at`. Supports `all=1`. Returns `Customer[]`.

**CUS-02 Create customer** `POST /customers` (A,S)
- Body: `name` req max 255; `email` req email unique in `customers.email`; `phone`? max 30; `company_name`? ; `address_line, city, state, country`? max 255/100; `postal_code`? max 20. 201 -> `Customer` (`has_login=false`).

**CUS-03 Show customer** `GET /customers/{id}` (A,S) -> `Customer`.

**CUS-04 Update customer** `PUT /customers/{id}` (A,S): same fields as CUS-02 (email unique ignoring itself). 200 -> `Customer`.

**CUS-05 Delete customer** `DELETE /customers/{id}` (A). 409 if the customer has subscriptions in `confirmed|active` or invoices with `amount_due > 0`; otherwise soft delete. 200 `data: null`.

### Backend tasks (BE-A)
Migrations already exist (M0). Create `AuthController`, `UserController`, `CustomerController`; requests (`RegisterRequest`, `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `UpdateProfileRequest`, `StoreUserRequest`, `UpdateUserRequest`, `StoreCustomerRequest`, `UpdateCustomerRequest`); `UserResource`, `CustomerResource`; `AuthService` (register/login/token issue/reset), `CustomerService`; routes in `routes/api/auth.php`, `users.php`, `customers.php`; reset mail uses the frontend URL; `backend/docs/http/m1.http`.

### Frontend tasks (FE-A)
| Route | Page | Roles |
|---|---|---|
| `/login` | Login form, link to register and forgot | public |
| `/register` | Name, email, password, confirm; live password checklist (9+ chars, upper, lower, special) | public |
| `/forgot-password` | Email field, generic success message | public |
| `/reset-password` | Reads `token` and `email` from query; new password + confirm | public |
| `/profile` | Edit own profile (AUTH-07) | all |
| `/users` | Table + filters (role, active, search); "Add staff" dialog (USR-02); active toggle (USR-04) | admin |
| `/customers` | Table + search + has_login filter; create/edit dialog | admin, staff |
| `/customers/:id` | Profile card + "Subscriptions" table (`GET /subscriptions?customer_id=`; mock until M4) | admin, staff |

After login: admin/staff -> `/dashboard`, customer -> `/portal`. Zod schemas mirror the validation rules above. Delete customer button only for admin; show the 409 message in a toast.

### Manual test
1. Register with a weak password (`abc12345`) -> 422 on `password`. Use `Brightloop@2026` -> 201, lands on `/portal`.
2. Register again with the same email -> 422 on `email`.
3. Login with wrong password -> 401 message; with seeded admin -> lands on `/dashboard`.
4. Forgot password -> link appears in `laravel.log`; open it, set a new password, old password fails, new works.
5. As admin: create staff `new@brightloop.test` -> appears in `/users`; log in as that staff -> no "Users" menu; `GET /users` as staff -> 403.
6. Staff creates a customer; admin deactivates a staff and that staff can no longer log in (403).
7. Customer token calling `GET /customers` -> 403.
8. Push + tag `m1-be`, `m1-fe`.

---

## Module M2: Catalog (Taxes, Payment Terms, Products)

**Owners:** BE-B, FE-B. **Depends on:** M0.

### API contract

**TAX-01** `GET /taxes` (A,S): filters `is_active`, `search`; `all=1`. Returns `Tax[]`.
**TAX-02** `POST /taxes` (A): `name` req max 100 unique; `type` req `tax_type`; `rate` req numeric min 0 (max 100 when percentage); `is_active`? bool default true. 201 -> `Tax`.
**TAX-03** `PUT /taxes/{id}` (A): same rules. 200 -> `Tax`.
**TAX-04** `DELETE /taxes/{id}` (A): 409 `"Tax is in use; deactivate it instead"` if referenced by a product or plan; else delete.

**PT-01** `GET /payment-terms` (A,S): `all=1` supported. Returns `PaymentTerm[]`.
**PT-02** `POST /payment-terms` (A): `name` req max 100 unique; `due_days` req int 0..365. 201.
**PT-03** `PUT /payment-terms/{id}` (A). **PT-04** `DELETE /payment-terms/{id}` (A): 409 if used by a subscription or invoice.

**PRD-01** `GET /products` (A,S): filters `type`, `is_active`, `search` (name). Sort `name|sales_price|created_at`. Supports `all=1`. Returns `Product[]` (with variants).
**PRD-02** `POST /products` (A): `name` req max 255; `type` req `product_type`; `sales_price` req numeric >= 0; `cost_price` req numeric >= 0; `tax_id`? exists; `notes`? text; `is_active`? bool default true; `variants`? array of `{ attribute req max 100, value req max 100, extra_price? numeric >= 0 default 0 }`. `(attribute,value)` must be unique within the product (422). 201 -> `Product`.
**PRD-03** `GET /products/{id}` (A,S) -> `Product`.
**PRD-04** `PUT /products/{id}` (A): same body. Variants are synced: items with `id` updated, items without `id` created, missing ids soft-deleted. 200 -> `Product`.
**PRD-05** `DELETE /products/{id}` (A): 409 if used by a subscription line in `draft|quotation|confirmed|active` subscriptions; else soft delete.

### Backend tasks (BE-B)
`TaxController`, `PaymentTermController`, `ProductController`; requests; resources (`TaxResource`, `PaymentTermResource`, `ProductResource`, `VariantResource`); `ProductService` (sync variants in a transaction); routes `routes/api/catalog.php`; `backend/docs/http/m2.http`.

### Frontend tasks (FE-B)
| Route | Page | Roles |
|---|---|---|
| `/products` | Table (name, type badge, sales, cost, tax, active) + filters (type, active, search); row actions | admin, staff |
| `/products/new`, `/products/:id/edit` | Form: fields + **variants repeater** (attribute, value, extra price) + live preview "Odoo -> sales_price + extra_price" | admin (staff view only) |
| `/settings/taxes` | Table + create/edit dialog (type switches rate suffix % vs fixed) | admin edit, staff view |
| `/settings/payment-terms` | Table + dialog | admin edit, staff view |

Hide create/edit/delete controls for staff. 409 on delete -> toast.

### Manual test
1. Admin creates tax `GST 28%`; creating `rate=150` with type percentage -> 422.
2. Create product "Test Suite" with variants Brand: Odoo +560, Brand: Odoo +100 (duplicate) -> 422; fix duplicate -> 201; table shows price preview 4560 for 4000 base.
3. Edit product: remove one variant, add another; reload to confirm.
4. Delete the tax used by a product -> 409 toast.
5. Staff can open lists but sees no create/edit buttons; `POST /products` as staff -> 403.
6. Push + tag `m2-be`, `m2-fe`.

---

## Module M3: Plans & Discounts

**Owners:** BE-B, FE-B. **Depends on:** M2 (products, taxes).

### API contract

**PLN-01** `GET /plans` (A,S): filters `billing_period`, `is_active`, `available` (true = currently available), `search`. Sort `name|price|created_at`. `all=1`. Returns `Plan[]`.
**PLN-02** `POST /plans` (A): `name` req max 255 unique; `price` req numeric >= 0; `billing_period` req enum; `min_quantity` int >= 1 default 1; `start_date` req date; `end_date`? date >= start_date; `tax_id`? exists; `auto_close` bool default false; `closable` bool default true; `pausable` bool default false; `renewable` bool default false; `is_active` bool default true. 201 -> `Plan`.
**PLN-03** `GET /plans/{id}` (A,S). **PLN-04** `PUT /plans/{id}` (A): same rules; 200 -> `Plan`. Changing a plan does not alter existing invoices.
**PLN-05** `DELETE /plans/{id}` (A): 409 if any subscription uses it; else soft delete.

**DSC-01** `GET /discounts` (A,S): filters `state` (discount_state), `type`, `applies_to`, `search`; `all=1`. Returns `Discount[]`.
**DSC-02** `POST /discounts` (A): `name` req max 255; `code`? max 50 unique (stored uppercase); `type` req `discount_type`; `value` req numeric > 0 (percentage <= 100); `applies_to` req enum; `product_ids` req array min 1 exists when `applies_to=products`, must be empty/absent when `subscription`; `min_purchase`? numeric >= 0; `min_quantity`? int >= 1; `start_date` req date; `end_date` req date >= start_date; `usage_limit`? int >= 1 (null = unlimited); `is_active` bool default true. 201 -> `Discount`.
**DSC-03** `GET /discounts/{id}` (A,S). **DSC-04** `PUT /discounts/{id}` (A): same rules; `usage_limit` cannot be lower than `used_count` (422 on `usage_limit`). 200.
**DSC-05** `DELETE /discounts/{id}` (A): soft delete (history on invoices stays).

### Backend tasks (BE-B)
`PlanController`, `DiscountController`; requests; resources (`is_available`, `state`, `remaining_uses` computed in resource); `DiscountService::state()` and `DiscountService::isEligible($discount, $date)` reused by billing in M5; routes `plans.php`, `discounts.php`; `m3.http`.

### Frontend tasks (FE-B)
| Route | Page | Roles |
|---|---|---|
| `/plans` | Table (name, price, period, min qty, dates, flags as small badges, available) + filters | admin, staff |
| `/plans/new`, `/plans/:id/edit` | Form with 4 switches: auto close, closable, pausable, renewable (with helper text) | admin |
| `/discounts` | Table (name, type/value, applies to, window, used/limit, state badge) + filters (state, type) | admin, staff |
| `/discounts/new`, `/discounts/:id/edit` | Form; product multi-select appears only when applies_to = products; percentage caps at 100 | admin |

### Manual test
1. Create plan with `end_date` before `start_date` -> 422. Create `Quarterly Test` monthly plan with pausable on -> appears with badge.
2. Create discount percentage 150 -> 422. Create products-scoped discount without products -> 422. Valid one -> state `active`.
3. Seeded `Expired Promo` shows state `expired`; filter state=expired returns it.
4. Delete plan with subscriptions -> 409.
5. Staff cannot create (403, buttons hidden).
6. Push + tag `m3-be`, `m3-fe`.

---

## Module M4: Quotation Templates & Subscriptions

**Owners:** BE-A, FE-A. **Depends on:** M0 seeds (+ M2/M3 for real dropdown data). Implements BR-1, BR-2, BR-3, BR-4.

### API contract

**TPL-01** `GET /quotation-templates` (A,S): `search`; `all=1`. Returns `QuotationTemplate[]`.
**TPL-02** `POST /quotation-templates` (A,S): `name` req max 255; `validity_days` req int 1..365; `plan_id` req exists; `notes`?; `lines` req array min 1 of `{ product_id req exists, variant_id? (must belong to product), quantity req int >= 1 }`. 201.
**TPL-03** `GET /quotation-templates/{id}`. **TPL-04** `PUT /quotation-templates/{id}` (lines replaced). **TPL-05** `DELETE /quotation-templates/{id}` (soft).

**SUB-01 List** `GET /subscriptions` (A,S all; C own)
- Filters: `status`, `customer_id`, `plan_id`, `is_paused` (true/false), `start_from`, `start_to` (on `start_date`), `expiry_from`, `expiry_to`, `search` (number, customer name). Sort `number|start_date|expiry_date|total|created_at` (default `created_at desc`). Returns `SubscriptionListItem[]`.

**SUB-02 Create** `POST /subscriptions` (A,S)
- Body: `customer_id` req exists; `plan_id` req exists and plan `is_available` today (422 on `plan_id` "Plan is not available"); `quotation_template_id`? exists; `payment_term_id` req exists; `start_date` req date; `expiry_date` req date > start_date; `notes`?; `lines` array of `{ product_id req, variant_id? (belongs to product), quantity req int >= plan.min_quantity }`. `lines` required unless `quotation_template_id` is given (then plan and lines are copied from the template when `plan_id`/`lines` are absent). No duplicate `(product_id, variant_id)` rows (422).
- Behaviour: status `draft`; server adds the plan line (BR-2), computes prices/amounts/tax/totals (BR-1, BR-3).
- 201 -> `Subscription`.

**SUB-03 Show** `GET /subscriptions/{id}` (A,S; C own) -> `Subscription`.
**SUB-04 Update** `PUT /subscriptions/{id}` (A,S): same body as SUB-02; only `draft|quotation` else 409. Lines replaced; totals recomputed. 200 -> `Subscription`.
**SUB-05 Delete** `DELETE /subscriptions/{id}` (A,S): only `draft` else 409.

**SUB-06** `POST /subscriptions/{id}/send-quotation` (A,S): no body. 200 -> `Subscription`.
**SUB-07** `POST /subscriptions/{id}/confirm` (A,S). **SUB-08** `POST /subscriptions/{id}/activate` (A,S).
**SUB-09** `POST /subscriptions/{id}/pause` (A,S,C own). **SUB-10** `POST /subscriptions/{id}/resume` (A,S,C own).
**SUB-11** `POST /subscriptions/{id}/close` (A,S,C own): body `reason`? str max 255.
**SUB-12** `POST /subscriptions/{id}/renew` (A,S,C own): body `new_expiry_date` req date > current `expiry_date`.
All actions: rules and 409 messages per BR-4; each returns the updated `Subscription`.

**SUB-13 Attach discount** `POST /subscriptions/{id}/discounts` (A,S): body `discount_id` req exists, discount `applies_to=subscription` and `state=active` (422 otherwise); duplicates ignored. 200 -> `Subscription`.
**SUB-14 Detach discount** `DELETE /subscriptions/{id}/discounts/{discountId}` (A,S). 200 -> `Subscription`.

### Backend tasks (BE-A)
`QuotationTemplateController`, `SubscriptionController`; requests; resources (`SubscriptionResource`, `SubscriptionListResource`, `SubscriptionLineResource`, `QuotationTemplateResource`; `allowed_actions` computed in resource via `SubscriptionService::allowedActions($sub, $user)`); `SubscriptionService` (create/update with line building, totals, state transitions, auto-close), `SubscriptionPolicy`; customer scoping on every query; `subscriptions:auto-close` command; routes `quotation-templates.php`, `subscriptions.php`; `m4.http`. Use `lockForUpdate` on transitions.

### Frontend tasks (FE-A)
| Route | Page | Roles |
|---|---|---|
| `/quotation-templates` | Table + create/edit page with lines repeater (product, variant, qty) | admin, staff |
| `/subscriptions` | Status tabs (All, Draft, Quotation, Confirmed, Active, Closed) + search + customer, plan, date-range filters; columns: number, customer, plan, period, start, expiry, next invoice, total, status badge (+ "Paused" badge) | admin, staff |
| `/subscriptions/new`, `/subscriptions/:id/edit` | Form: optional "Start from template" select (prefills plan and lines from TPL-03), customer, plan (shows price and period), payment term, start/expiry dates, lines repeater (product, variant, quantity >= plan min qty, unit price preview = BR-1), read-only plan fee row, estimated totals preview; after save, show server totals | admin, staff |
| `/subscriptions/:id` | Header (number, status stepper Draft -> Quotation -> Confirmed -> Active -> Closed, Paused badge, valid-until), action buttons rendered strictly from `allowed_actions` (close and renew open dialogs), lines table, totals, attached discounts with add/remove, "Invoices" table (`GET /invoices?subscription_id=` once M5 lands) | admin, staff |

Customer portal reuses this detail page in M7 (same API, fewer `allowed_actions`).

### Manual test
1. Create from template `Standard SMB Offer`: plan and lines prefill; save -> `SUB-00000X`, status draft, lines include plan fee row, totals match hand calculation (e.g. CRM Seat 2 x 1200 + Extra Storage 300 + plan 999 = 3699.00 base, tax 18%).
2. Quantity below plan `min_quantity` -> 422. Plan not available -> 422.
3. Click through: Send quotation -> Confirm -> Activate; stepper moves each time; Edit button disappears after quotation.
4. On the `Yearly Business` plan (not closable, not pausable) the Close and Pause buttons never appear; `POST .../close` -> 409.
5. On `Monthly Starter`: Pause -> badge; Resume; Renew with a later date works.
6. Confirm an expired quotation (set `quotation_valid_until` in the past in DB) -> 409 "Quotation expired".
7. Attach `Loyalty 500 Off` discount; detach it.
8. As the seeded customer: `GET /subscriptions` returns only their own; another customer's id -> 404.
9. Push + tag `m4-be`, `m4-fe`.

---

## Module M5: Invoicing & Billing Engine

**Owners:** BE-B, FE-B. **Depends on:** M4 data (seeded active subscriptions are enough to start). Implements BR-3 to BR-9.

### API contract

**BIL-01 Due list** `GET /billing/due` (A,S)
- Query: `as_of_date`? date default today; `page`, `per_page`.
- Returns `data: DueSubscription[]` with `DueSubscription = { id, number, customer:{id,name}, plan:{id,name,billing_period}, next_invoice_date:date, periods_due:int, estimated_total:dec }`, paginated (`meta.total` = number of subscriptions due). Only `active`, not paused, `next_invoice_date <= as_of_date` and `<= expiry_date`.

**BIL-02 Run billing** `POST /billing/run` (A,S)
- Body: `as_of_date`? date default today (not in the future unless an admin demo flag `BILLING_ALLOW_FUTURE=true`); `subscription_ids`? int[] (limit run to these).
- Behaviour: auto-close expired subscriptions first, then BR-5 for each due subscription; one transaction per subscription; a failure in one does not stop the others.
- 200 -> `data: { as_of_date, processed:int, invoices_created:int, skipped:int, failed:int, auto_closed:int, failures:[{ subscription_id, number, message }] }`.
- Idempotent: second call right away returns `invoices_created: 0`.
- Also: `php artisan billing:run --date=YYYY-MM-DD` and scheduler daily 00:30 calls the same service.

**INV-01 List** `GET /invoices` (A,S all; C own, never `draft`)
- Filters: `status`, `customer_id`, `subscription_id`, `overdue` (true), `invoice_from`, `invoice_to` (on `invoice_date`), `due_from`, `due_to`, `search` (number, customer name). Sort `number|invoice_date|due_date|total|amount_due` (default `invoice_date desc`). Returns `InvoiceListItem[]`.
**INV-02 Show** `GET /invoices/{id}` -> `Invoice` (with lines and payments).
**INV-03 Update (P1)** `PUT /invoices/{id}` (A,S): only `draft`; body `due_date`? date >= invoice_date, `notes`? str max 1000. 200 -> `Invoice`.
**INV-04 Confirm** `POST /invoices/{id}/confirm` (A,S) -> `Invoice` (409 if not draft).
**INV-05 Cancel** `POST /invoices/{id}/cancel` (A,S): body `reason`? str max 255. 409 if paid or has payments. -> `Invoice`.
**INV-06 Send** `POST /invoices/{id}/send` (A,S): only confirmed/paid (409 otherwise); mails `customer.email` (log driver), sets `sent_at`. -> `Invoice`.
**INV-07 Bulk confirm (P1)** `POST /invoices/bulk-confirm` (A,S): body `ids` req int[] min 1 max 500. 200 -> `data: { confirmed:int, skipped:[{ id, message }] }`.
**Print:** no endpoint. Frontend prints `GET /invoices/{id}` data with a print stylesheet.

### Backend tasks (BE-B)
`BillingController`, `InvoiceController`; requests; `InvoiceResource`, `InvoiceListResource`, `InvoiceLineResource`; **`BillingService`** (BR-5, BR-6, BR-3 in one transaction per subscription; reuse `DiscountService`), `InvoiceService` (transitions, `allowedActions`), `InvoicePolicy`; mail class `InvoiceMail`; commands `billing:run`, scheduler entry in `routes/console.php`; routes `billing.php`, `invoices.php`; `m5.http`. Write 3 feature tests: idempotent run, discount at invoice (line + subscription level, usage limit), catch-up of 3 missed periods.

### Frontend tasks (FE-B)
| Route | Page | Roles |
|---|---|---|
| `/billing` | "Billing day": date picker (as_of_date), due-count card, due table (BIL-01), **Run billing** button with confirm dialog, result panel (created / skipped / failed / auto-closed + failures list), link "View new draft invoices" -> `/invoices?status=draft` | admin, staff |
| `/invoices` | Status tabs (All, Draft, Confirmed, Paid, Cancelled) + "Overdue only" toggle + customer, date-range, search filters; row selection + **Bulk confirm** (INV-07); columns incl. due date, amount due, overdue badge with days | admin, staff |
| `/invoices/:id` | Header (number, status badge, customer, subscription link, dates, period), lines table with discount and tax columns, totals box (subtotal, discount, tax, total, paid, due), payments table, buttons from `allowed_actions` (Confirm, Cancel with reason dialog, Send, Record payment (M6), Print) | admin, staff |
| `/invoices/:id/print` | Clean printable invoice layout, auto `window.print()` button, hides sidebar | admin, staff, customer |

### Manual test
1. `/billing` shows the seeded due subscriptions. Run billing -> N drafts created; run again -> 0 created.
2. Open a created draft: lines copied (plan fee + products), customer details present, taxes and totals correct by hand (GST 18% on plan fee 999.00 = 179.82).
3. Subscription with 10+ CRM Seats gets `Volume 10%` line discount; subscription with `Loyalty 500 Off` attached and gross >= 5000 gets 500 spread over lines; `used_count` increments; stops after `usage_limit`.
4. Confirm -> status confirmed, allowed actions change; Send -> `sent_at` set, email in `laravel.log`; Cancel a confirmed unpaid invoice -> cancelled, discount `used_count` decremented.
5. Bulk confirm 5 drafts at once.
6. Set a subscription's `next_invoice_date` 3 months back, run billing -> 3 invoices, no duplicates.
7. Print view opens clean.
8. As customer: `GET /invoices` shows only own non-draft invoices.
9. Push + tag `m5-be`, `m5-fe`.

---

## Module M6: Payments

**Owners:** BE-A, FE-B. **Depends on:** M5.

### API contract

**PAY-01 List** `GET /payments` (A,S all; C own)
- Filters: `invoice_id`, `customer_id`, `method`, `date_from`, `date_to` (on `payment_date`), `search` (reference, invoice number). Sort `payment_date|amount|created_at` (default `payment_date desc`). Returns `Payment[]`.

**PAY-02 Record payment** `POST /payments` (A,S)
- Body: `invoice_id` req exists; `method` req `payment_method`; `amount` req numeric > 0 and <= invoice `amount_due` (422 on `amount`); `payment_date` req date, not in the future; `reference`? str max 100; `note`? str max 500.
- Rules: invoice must be `confirmed` (409 `"Invoice must be confirmed before recording payments"`). In one transaction (row lock on invoice): create payment, `amount_paid += amount`, `amount_due -= amount`; if `amount_due = 0` set invoice `paid`.
- 201 -> `data: { payment: Payment, invoice: InvoiceListItem }`.

**PAY-03 Delete payment (P2)** `DELETE /payments/{id}` (A): reverses amounts; `paid -> confirmed` if due again > 0. 200 `data: null`.

### Backend tasks (BE-A)
`PaymentController`, `StorePaymentRequest`, `PaymentResource`, `PaymentService` (with locks), routes `payments.php`, `m6.http`. Feature test: partial then full payment moves invoice to paid.

### Frontend tasks (FE-B)
| Route / Component | What | Roles |
|---|---|---|
| `RecordPaymentDialog` | Method select, amount (defaults to amount due, max = amount due), date (today default), reference, note; used on invoice detail and payments page; on success refetch invoice and lists | admin, staff |
| `/payments` | Table + filters (method, date range, search) + "Record payment" (invoice autocomplete from `GET /invoices?status=confirmed&search=`) | admin, staff |
| Invoices list tweaks | Quick views: "Outstanding" (`status=confirmed`) and "Overdue" (`overdue=true`, sorted by `due_date asc`) with days-overdue column | admin, staff |

### Manual test
1. Open a confirmed invoice, record a partial payment (e.g. UPI 500): amount due drops, status stays confirmed, payment shown in the invoice's list.
2. Record the remaining amount: status becomes `paid`, "Record payment" button disappears.
3. Paying more than due -> 422 on amount. Paying a draft invoice -> 409. Future date -> 422.
4. `/invoices?overdue=true` lists the seeded overdue invoice; after paying it, it disappears.
5. Customer sees own payments only.
6. Push + tag `m6-be`, `m6-fe`.

---

## Module M7: Reports, Dashboard, Customer Portal

**Owners:** BE-A, FE-A. **Depends on:** M4, M5, M6. Implements BR-9, BR-10.

### API contract

**RPT-01 Summary** `GET /reports/summary` (A,S)
- Query: `date_from`? date, `date_to`? date (default current month; `date_from <= date_to`).
- Returns:
```json
{
  "period": { "date_from": "2026-10-01", "date_to": "2026-10-31" },
  "subscriptions": { "total": 3000, "active": 1800, "paused": 40,
    "by_status": { "draft": 100, "quotation": 60, "confirmed": 40, "active": 1800, "closed": 1000 },
    "new_in_period": 120, "closed_in_period": 35 },
  "mrr": "1250000.00",
  "revenue": { "invoiced_in_period": "900000.00", "collected_in_period": "750000.00" },
  "receivables": { "outstanding_amount": "300000.00", "outstanding_count": 210,
                   "overdue_amount": "90000.00", "overdue_count": 55 },
  "invoices_by_status": { "draft": 40, "confirmed": 210, "paid": 2500, "cancelled": 12 }
}
```
**RPT-02 Revenue trend** `GET /reports/revenue-trend` (A,S): `date_from`, `date_to`, `interval` (`day|week|month`, default `month`). Returns `[{ "period": "2026-10", "invoiced": "dec", "collected": "dec" }]` ordered ascending, no gaps.
**RPT-03 Overdue aging (P1)** `GET /reports/overdue-aging` (A,S): returns `{ "total_overdue": "dec", "buckets": [{ "label":"1-30", "count":int, "amount":"dec" }, { "label":"31-60" ... }, { "label":"61-90" ... }, { "label":"90+" ... }] }`.
**PORTAL-01 Customer summary** `GET /portal/summary` (C): returns `{ "active_subscriptions": int, "next_billing_date": date|null, "outstanding_amount": "dec", "overdue_count": int, "recent_invoices": InvoiceListItem[] (last 5, no drafts) }`.

### Backend tasks (BE-A)
`ReportController`, `PortalController`; `ReportService` using aggregate SQL only (conditional aggregates, `date_trunc` for intervals), response cached 60 seconds keyed by params (`Cache::remember`); routes `reports.php`, `portal.php`; `m7.http`. Verify with seeded demo volume (M8 seeder) that each report call is < 2s.

### Frontend tasks (FE-A)
| Route | Page | Roles |
|---|---|---|
| `/dashboard` | Date range filter (presets: This month, Last month, This year, Custom). KPI cards: Active subscriptions, MRR, Collected, Outstanding, Overdue (count + amount). Revenue trend chart (recharts bar/line, invoiced vs collected). Subscriptions by status chart. Aging chart (P1). Table "Top overdue invoices" (`GET /invoices?overdue=true&sort=due_date&direction=asc&per_page=10`). KPI cards link to filtered lists (active -> `/subscriptions?status=active`, overdue -> `/invoices?overdue=true`) | admin, staff |
| `/portal` | Welcome, cards (active subscriptions, next billing date, outstanding, overdue), recent invoices | customer |
| `/portal/subscriptions`, `/portal/subscriptions/:id` | Reuse subscription list and detail components; customer actions only from `allowed_actions` (pause, resume, close, renew) | customer |
| `/portal/invoices`, `/portal/invoices/:id` | Reuse invoice list/detail + print; no staff actions | customer |
| `/portal/payments` | Reuse payments list (own) | customer |

Pages read URL query params as initial filters (so KPI links work).

### Manual test
1. Dashboard numbers equal hand totals from the seeded data (active count, outstanding sum, overdue count).
2. Change date range -> collected/invoiced/trend update; invalid range -> 422 message.
3. Click Overdue KPI -> invoices list pre-filtered.
4. Customer login -> `/portal` shows only their numbers; manual URL to `/dashboard` is blocked; `GET /reports/summary` as customer -> 403.
5. Customer pauses a pausable subscription from portal; the Close button is absent for non-closable plans.
6. Push + tag `m7-be`, `m7-fe`.

---

## Module M8: Hardening, demo data, performance, README (P1)

**Owners:** BE-B (+ BE-A tests), FE-B (+ FE-A polish).

### Backend tasks
- **BE-B:** `DemoVolumeSeeder` (separate: `php artisan db:seed --class=DemoVolumeSeeder`): 300 customers, 3,000 subscriptions across statuses, 8,000 invoices, 6,000 payments; use chunked raw inserts. Run `EXPLAIN` on `GET /subscriptions`, `GET /invoices`, `GET /reports/summary`; add missing indexes; remove N+1 (`preventLazyLoading`). Confirm every list and report < 2s.
- **BE-A:** one `api.http` index of all modules; role tests (403s from the permissions matrix); smoke feature tests for: register password rules, subscription transitions, payment to paid.
- Both: `README.md` in `/backend` (setup: composer, `.env`, Postgres, `migrate:fresh --seed`, Passport install, `php artisan serve`).

### Frontend tasks
- **FE-B:** loading skeletons, empty and error states on every list, form submit disabled while pending, responsive tables, print CSS check, consistent toasts.
- **FE-A:** portal polish, navigation highlights, role-based redirects, 404 page.
- Both: `README.md` in `/frontend` and root `README.md` (stack, setup for both, seeded logins, demo script).

### Manual test (full demo script, 8 minutes)
1. Register a new customer account (weak password fails first) -> portal empty.
2. Staff logs in: create customer, create subscription from template, send quotation, confirm, activate.
3. Admin: create a discount and attach it to the subscription.
4. Billing day: run billing, show drafts, bulk confirm, send one, print one.
5. Record a partial and a full payment; invoice becomes paid.
6. Dashboard: active subscriptions, MRR, collected, outstanding, overdue, charts; open overdue list.
7. Customer portal: view subscription/invoices, pause a subscription.
8. Show seeded 3,000-subscription pages loading under 2 seconds.
9. Final push to `main`, tag `final`, send repo link.

---

## 8. Final checklist (T-30 minutes)

- [ ] `main` builds: `composer install && php artisan migrate:fresh --seed` and `npm install && npm run dev` work from a clean clone.
- [ ] All 9 tags exist (`m0-be` ... `m8-fe`) or the highest completed.
- [ ] `VITE_USE_MOCK=false` in the committed `.env.example`.
- [ ] Seeded logins documented in root `README.md`.
- [ ] Demo script rehearsed once end to end.
