# PlantFriends 🌱

React Native plant care management app with Firebase backend.

> **Status:** 89.59% test coverage | Ready for features | [Full Review →](./CODEBASE_REVIEW_DEC2025.md)

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

React Native 0.81 • Expo 54 • TypeScript 5.9 • Redux Toolkit • React Navigation • Firebase • Jest (89.59% coverage)

## Commands

```bash
yarn start / android / ios    # Development
yarn test / test:coverage     # Testing
yarn lint / type-check        # Quality checks
yarn validate                 # Run all checks
```

## Documentation

- [**CODEBASE_REVIEW_DEC2025.md**](./CODEBASE_REVIEW_DEC2025.md) - Latest assessment & recommendations
- [**ACTION_PLAN.md**](./ACTION_PLAN.md) - Weekend project ideas
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Patterns & structure
- [**TECH_DEBT.md**](./TECH_DEBT.md) - Known issues (prioritized)

## Next Steps

**Foundation fixes** (2-3 hours): Error handling • Error boundary • Loading states  
**Then**: Build features you want! See [ACTION_PLAN.md](./ACTION_PLAN.md)

---

Made with 🌿 for learning and fun
