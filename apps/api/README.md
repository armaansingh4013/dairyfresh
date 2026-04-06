# API

Backend API for the dairy delivery platform.

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URL` to your MongoDB connection string.
3. Start with `npm run dev`.

## Notes
- Runtime data is stored in MongoDB through Mongoose models in `src/models/index.js`.
- OTP login is demo-only. Use `1111`.

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
