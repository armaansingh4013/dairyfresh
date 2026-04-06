# Dairy Delivery Platform

Monorepo for:
- Customer Mobile App (React Native / Expo)
- Customer Web App (React + Vite)
- Admin Dashboard (React + Vite)
- Backend API (Node + Express)

## Structure
- `apps/api` - Backend API
- `apps/mobile` - Mobile app
- `apps/web` - Customer web app
- `apps/admin` - Admin/staff dashboard
- `packages/shared` - Shared types/utilities (placeholder)

## Run
1. From repo root, install dependencies with `npm install`.
2. Copy env files with `npm run bootstrap`.
3. Start everything with `npm run dev`.

## Notes
- The API stores runtime data in MongoDB via `MONGODB_URL` from `apps/api/.env`.
- Web and mobile login both use demo OTP `1111`.
- If Expo runs on a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to a reachable host IP instead of `localhost`.
