# PlantFriends 🌱

React Native plant care management app with Firebase backend.

> **Status:** Type check, lint, and 202 tests passing | Ready for features

## Features

Plant search • Personal collection • Room organization • Custom care schedules • Light/dark theme • Firebase auth

## Quick Start

```bash
# Install
pnpm install

# Configure (copy .env.example to .env)
# Add Firebase config files (see ARCHITECTURE.md)

# Run
pnpm start
pnpm android  # or pnpm ios
```

## Package Manager

- This repo uses pnpm and Corepack — see `packageManager` in package.json.
- Prefer pnpm commands for consistent tooling.

Common equivalents:

```bash
# Start Metro + dev client
pnpm start

# Platforms
pnpm android
pnpm ios

# Tests & checks
pnpm test
pnpm test:coverage
pnpm lint
pnpm type-check
```

## Tech Stack

React Native 0.83 • Expo 55 • TypeScript 5.9 • Redux Toolkit • React Navigation • Firebase • Jest

## Commands

```bash
pnpm start / android / ios    # Development
pnpm test / test:coverage     # Testing
pnpm lint / type-check        # Quality checks
pnpm validate                 # Run all checks
```

## Documentation

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Patterns & structure

## Next Steps

**Foundation fixes**: Error handling • Error boundary • Loading states
**Then**: Build features you want! See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

Made with 🌿 for learning and fun
