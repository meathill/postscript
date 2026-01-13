# Postscript Mobile App
Inheritance System for Digital Assets.

## Development Setup

### Preseuqisites
- Node.js > 20
- pnpm
- XCode / Android Studio (for simulators)

### Installation
```bash
cd packages/mobile
pnpm install
```

### Running Tests
```bash
pnpm test
```
*Note: Test environment for Expo might require specific Node configuration.*

### Running App
```bash
pnpm start
pnpm ios
pnpm android
```

## Architecture

### State Management
- **Zustand**: Stores located in `store/`.
- **Offline Cache**: `lib/db.ts` using `expo-sqlite`.

### Security
- **Crypto**: `lib/crypto.ts` handles client-side encryption (PBKDF2 + AES-GCM).
- **Storage**: `expo-secure-store` for tokens and keys.

### UI
- **Styling**: NativeWind (Tailwind CSS).
- **Icons**: Lucide React Native.
- **Navigation**: Expo Router (File-based routing).
