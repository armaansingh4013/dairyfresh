# Mobile App

React Native (Expo) starter for the customer mobile app.

## Run
1. Install dependencies in `apps/mobile`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` if needed.
2. `npm run start` or `npm run ios` / `npm run android`.

## Notes
- Mobile login uses the same demo OTP flow as the web app: `1111`.
- If you test on a physical device, `localhost` will not reach your API. Use your machine's LAN IP in `EXPO_PUBLIC_API_URL`.
