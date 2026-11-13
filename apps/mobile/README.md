# @mindbridge/mobile

Student app — React Native + Expo (SDK 58) + Expo Router + TanStack Query + Zustand + React Hook Form/Zod.

```bash
cp .env.example .env     # set EXPO_PUBLIC_API_URL for your device/emulator
pnpm dev:mobile          # from the repo root, then press a / i / w
```

- Tokens: access token in memory, refresh token in the OS keystore (`expo-secure-store`).
- Password-reset links open `mindbridge://reset-password?token=…`.
- "Show AI insights" (Profile & privacy) reveals the pipeline trace under each reply — useful for the showcase.
