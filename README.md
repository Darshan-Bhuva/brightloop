# Brightloop

Monorepo containing the Brightloop backend and frontend. See `docs/PLAN.md` for the full plan and API contract.

## Layout

```
brightloop/
├── backend/          Laravel API (PHP)
├── frontend/         React + Vite app (JavaScript)
├── docs/PLAN.md      master plan and API contract
└── .kiro/steering/   Kiro project rules
```

Each app is self-contained, with its own dependencies and `.gitignore`.

## Prerequisites

- PHP 8.3+
- Composer 2.x
- Node.js 20+ (current release recommended)
- npm

## Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The API runs at http://127.0.0.1:8000 by default.

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
```

The dev server runs at http://localhost:5173 by default.
