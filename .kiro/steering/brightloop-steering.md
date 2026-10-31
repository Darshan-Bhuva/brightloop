---
inclusion: always
---

# Brightloop project rules (apply to every task)

- `docs/PLAN.md` is the single source of truth. Never invent endpoints, fields, enums or validation. Follow the module you are told to implement, nothing else.
- Backend = Laravel 13 + PostgreSQL + Passport, in `/backend`. Frontend = React (JavaScript) + Vite + Tailwind + shadcn/ui, in `/frontend`. Never edit the other layer.
- Backend structure: thin controllers -> FormRequest validation -> Service (all business logic) -> API Resource. Routes live in `routes/api/<module>.php`. Enums in `app/Enums`.
- Every API response uses the envelope `{ success, message, data, meta }`; errors `{ success:false, message, errors }`. Use `App\Support\ApiResponse`. Status codes: 401, 403, 404, 409 (state/business conflict), 422 (validation).
- JSON keys snake_case. Money = string with 2 decimals. Dates `YYYY-MM-DD`. Enums are lowercase strings exactly as in PLAN.md section 3.
- Customers can only access their own records (return 404 for others). Admin/staff permissions follow the PLAN.md permissions matrix.
- No N+1 queries: eager load relations, paginate every list (`page`, `per_page` max 100), use the indexes from PLAN.md section 5.
- Frontend: all API calls go through `src/api/<module>.js` using `src/api/client.js`; data fetching with TanStack Query; forms with react-hook-form + zod mirroring backend rules; action buttons come from `allowed_actions`; map 422 errors to fields; use `MoneyText`/`DateText`/`StatusBadge` common components.
- Frontend mocks (while `VITE_USE_MOCK=true`) must match PLAN.md section 6 shapes exactly.
- Keep code simple and fast to write: no extra abstractions, no unrequested features, no tests unless the module says so.
- When a module is finished: create the `.http` file (backend) or verify against the real API (frontend), then stop and wait.
