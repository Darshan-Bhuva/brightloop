# Brightloop Backend API

Brightloop Subscription & Invoicing Management System backend powered by Laravel 13, PostgreSQL, and Laravel Passport.

---

## 1. Requirements

- **PHP**: 8.3+
- **PostgreSQL**: 15+
- **Composer**: 2.x
- **Extensions**: `pdo_pgsql`, `pgsql`, `bcmath`, `ctype`, `fileinfo`, `json`, `mbstring`, `openssl`, `tokenizer`, `xml`

---

## 2. Setup & Installation

### Step 1: Clone and install PHP dependencies
```bash
cd backend
composer install
```

### Step 2: Environment configuration
Copy the example environment file and generate the application key:
```bash
cp .env.example .env
php artisan key:generate
```

Configure database credentials in `.env`:
```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=brightloop
DB_USERNAME=postgres
DB_PASSWORD=admin

FRONTEND_URL=http://localhost:5173
MAIL_MAILER=log
```

### Step 3: Run migrations and seed baseline data
```bash
php artisan migrate:fresh --seed
```
This runs all migrations and seeds default admin, staff, customer accounts, taxes, products, plans, payment terms, discounts, quotation templates, and sample subscriptions.

### Step 4: Passport keys and client setup
Passport clients are automatically seeded via `DatabaseSeeder` (`PassportClientSeeder`). To manually generate encryption keys if needed:
```bash
php artisan passport:keys
```

### Step 5: (Optional) High-Volume Demo Seeding
To seed benchmark volume data (300 customers, 3,000 subscriptions, 8,000 invoices, 6,000 payments):
```bash
php artisan db:seed --class=DemoVolumeSeeder
```

### Step 6: Start the Development Server
```bash
php artisan serve
```
The API is served at `http://localhost:8000/api`.

---

## 3. Seeded Accounts & Credentials

Password rule across all roles: minimum 9 characters with uppercase, lowercase, and special character (`Admin@12345`).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@brightloop.test` | `Admin@12345` |
| Staff | `staff@brightloop.test` | `Staff@12345` |
| Customer | `customer@brightloop.test` | `Customer@12345` |

---

## 4. Scheduled Commands & Billing Engine

The recurring billing engine runs daily at `00:30` to auto-close expired subscriptions and generate due invoices:
```bash
# Run manually with optional as-of date
php artisan billing:run
php artisan billing:run --date=2026-03-01

# Run Laravel scheduler worker
php artisan schedule:work
```

---

## 5. Testing & Code Quality

Run PHPUnit feature and unit test suites:
```bash
php artisan test
```

Run Pint code style check and formatting:
```bash
./vendor/bin/pint --test
./vendor/bin/pint
```

---

## 6. API Documentation & HTTP Requests

Interactive HTTP request samples per module are located in `backend/docs/http/`:
- `m0.http`: Health check & system diagnostics
- `m1.http`: Authentication, profile, customer CRUD
- `m2.http`: Catalog (taxes, payment terms, products, variants)
- `m3.http`: Plans, discounts, and eligibility checks
- `m4.http`: Quotation templates and subscriptions lifecycle
- `m5.http`: Invoicing and billing run endpoints
- `m8.http`: Hardening and performance verification
