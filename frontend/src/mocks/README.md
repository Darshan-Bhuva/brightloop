# Mock Fixtures Directory

This directory holds static mock fixtures for frontend development when `VITE_USE_MOCK=true`.

## Conventions (docs/PLAN.md Section 1, 3, 6)

1. **File naming**: `src/mocks/<module>.js` (e.g. `catalog.js`, `subscriptions.js`, `invoices.js`, etc.)
2. **Envelope**: All mock endpoints MUST return the standard success envelope:
   ```json
   {
     "success": true,
     "message": "OK",
     "data": {},
     "meta": null
   }
   ```
   For paginated responses, `meta` MUST follow:
   ```json
   {
     "current_page": 1,
     "last_page": 5,
     "per_page": 15,
     "total": 71
   }
   ```
3. **Resource Shapes**: Data structures in mock fixtures must match the resource shapes in **Section 6** of `docs/PLAN.md` exactly:
   - Money values are string with 2 decimals (e.g. `"1560.00"`).
   - Rates are strings (e.g. `"18.00"`).
   - Dates are `YYYY-MM-DD` and timestamps are ISO 8601 UTC.
   - Enums are exact lowercase strings as defined in Section 3.
4. **List vs Detail**:
   - List endpoints return `*ListItem` shapes where defined (e.g., `SubscriptionListItem`, `InvoiceListItem`).
   - Detail endpoints return the full entity shape including `allowed_actions`.

