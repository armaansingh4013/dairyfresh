# API

Backend API for the dairy delivery platform.

## Setup
1. Copy `.env.example` to `.env`.
2. Start with `npm run dev`.

## Notes
- Runtime data is stored in `apps/api/data/store.json`, so the API no longer depends on a running PostgreSQL instance for demo usage.
- OTP login is demo-only. Use `1111`.
- Prisma files are still present from the original scaffold, but the live request path is file-backed.

## Core Endpoints
- `GET /products`
- `POST /products`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /auth/session`
- `POST /users/:userId/plans`
- `POST /plans/:planId/days`
- `POST /plans/:planId/pause`
- `POST /admin/deliveries/generate?date=YYYY-MM-DD`
- `GET /admin/deliveries/daily?date=YYYY-MM-DD`
- `PATCH /deliveries/:deliveryId`
- `POST /admin/invoices/generate?month=MM&year=YYYY`
- `POST /invoices/:invoiceId/payments`
