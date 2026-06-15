# TotemBound

A creature-raising game built with React where players collect, train, and evolve mystical animal spirits called Totems.

12 species across Earth, Water, and Air domains. 6 rarity tiers. 5 evolution stages. 10 challenge mini-games. Team expeditions. A player marketplace. All wrapped in a mobile-first UI with dark mode.

## Game Features

### Totem Collection & Care
- **12 Species** - Wolf, Bear, Falcon, Owl, Otter, Goose, Deer, Beaver, Turtle, Raven, Snake, Woodpecker
- **6 Rarities** - Common (75%) through Legendary (0.5%) with stat bonuses and unique colors
- **5 Evolution Stages** - Hatchling to Wise Elder with species-unique stage names
- **4 Actions** - Feed (+happiness), Train (+XP), Treat (+happiness), Evolve (stage up)
- **3 Stats** - Strength, Agility, Wisdom with species-specific distributions

### Challenge Mini-Games
10 touch-optimized challenge games that test different skills:

| Challenge | Type | Description |
|-----------|------|-------------|
| Boulder Breaker | Tap/Click | Break boulders with timed taps |
| Drum Dance | Rhythm | Follow the beat patterns |
| Garden Pest Patrol | Target | Protect your garden from pests |
| Ring Dive | Precision | Guide your totem through rings |
| Rock Fall Defense | Dodge | Avoid falling obstacles |
| Rune Crafting | Drawing | Trace rune patterns accurately |
| Rune Decoding | Puzzle | Decode ancient rune sequences |
| Spirit Path | Navigation | Navigate a spirit maze |
| Star Map | Memory | Recreate constellation patterns |
| Totem Wrestling | Strategy | Tactical combat encounters |

### Expeditions
Send teams of 3 totems on timed expeditions across different domains. Earn XP, Essence, and bonus rewards based on expedition difficulty and team composition.

### Economy
- **Essence** (soft currency) - Earned through gameplay: signup bonus, daily/weekly rewards, selling totems, challenges
- **Gems** (premium) - Purchased via Stripe, exchangeable to Essence at 1:5 ratio
- **Shop** - Buy/sell totems with dynamic pricing based on stage and rarity

### Rewards & Achievements
- Daily/weekly claim system with streak bonuses
- 6-step tutorial rewards for new players
- Achievement milestones tracking across all game activities

### Real-Time Notifications
Push notifications via AWS IoT Core for instant balance updates, achievement unlocks, and system messages without polling.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework with hooks and context |
| TypeScript | Type safety across the codebase |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling (mobile-first + dark mode) |
| Vitest | Unit testing |
| React Router v6 | Client-side routing |
| Lucide React | Icon system |

## Project Structure

```
src/
├── components/
│   ├── pages/              # Full page components
│   │   ├── TotemGallery.tsx     # Main totem collection view
│   │   ├── ShopInterface.tsx    # Marketplace + gem exchange
│   │   ├── Expeditions.tsx      # Expedition management
│   │   └── ...
│   ├── challenges/         # 10 challenge mini-game components
│   ├── expeditions/        # Expedition panels and selection
│   ├── shop/               # Sell, unbound totems, bundles
│   ├── guides/             # Tutorial wizard (6 steps)
│   └── notifications/      # Bell icon + dropdown panel
├── config/
│   └── config-loader.ts    # Loads 7 static JSON configs at startup
├── contexts/
│   ├── AuthContext.tsx      # Authentication state + JWT management
│   ├── UserContext.tsx      # User data, totems, balances
│   ├── GameContext.tsx      # Game definitions from static config
│   └── AchievementsContext.tsx  # Achievement tracking
├── services/
│   ├── ApiClient.ts        # Singleton HTTP client for all API calls
│   ├── AuthService.ts      # Auth wrapper (login, signup, refresh)
│   ├── IoTService.ts       # MQTT push notification client
│   └── NotificationService.ts  # In-app notification management
├── hooks/                  # Custom hooks for game actions, API calls
├── types/                  # TypeScript type definitions
└── utils/                  # Formatters, totem helpers
```

### Static Config (Zero API Cost)

7 JSON files in `public/config/` loaded once at startup via `config-loader.ts`:

| File | Contents |
|------|----------|
| `species.json` | 12 species with stats, domains, stage names |
| `game-config.json` | Stages, rarities, colors, action definitions |
| `challenges.json` | 10 challenge definitions and requirements |
| `expeditions.json` | Expedition types with costs and rewards |
| `rewards.json` | Daily/weekly/tutorial reward configurations |
| `achievements.json` | Achievement definitions and milestones |
| `shop-config.json` | Shop fees, limits, exchange rates |

Game definitions come from these JSON files. Only dynamic per-user data (balances, totem state, progress) comes from the API.

## Getting Started

### Prerequisites

- Node.js 18+
- [TotemBound API](https://github.com/totembound/totem-api) running on localhost:3001

### Quick Start

```bash
npm install
npm run dev
```

The app runs on **http://localhost:3000** (Vite enforces this port for CORS compatibility with the API).

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
VITE_API_URL=http://localhost:3001   # Backend API URL
VITE_VERSION=0.0.1                   # Shown in UI footer
```

Environment files for deployment:
- `.env.staging` - Points to `api.totembound-test.net`
- `.env.production` - Points to `api.totembound.com`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server on localhost:3000 |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run preview` | Preview production build locally |
| `npm test` | Vitest in watch mode |
| `npm run test:ci` | Single run with coverage report |
| `npm run test:ui` | Browser-based test runner UI |
| `npm run lint` | ESLint check |
| `npm run check-types` | TypeScript type check (tsc --noEmit) |
| `npm run analyze` | Bundle size analysis |

## Design Principles

### Mobile-First
All layouts responsive from 375px (iPhone SE) to desktop. Touch targets minimum 44x44px.

### Dark Mode
Full dark mode support using Tailwind `dark:` classes with system preference detection.

### No Polling
Every API call costs money (Lambda invocations, DynamoDB reads). State refreshes happen only after user actions, never on timers. Real-time updates come via IoT Core push.

### Static Config Pattern
Game definitions (species, challenges, rewards, etc.) live in static JSON files served from CloudFront. The API only handles dynamic per-user data. This means zero API cost for browsing game info.

## Deployment

Frontend deploys to S3 + CloudFront via GitHub Actions:

| Environment | S3 Bucket | CloudFront | Domain |
|-------------|-----------|------------|--------|
| Staging | `totemboundci-app` | `E30D3Q6UOWWMO4` | totembound-test.net |
| Production | `totembound-app` | `E3TBCP5P18U4EE` | totembound.com |

CI/CD workflows in `totem-devops/.github/workflows/`:

| Workflow | Action |
|----------|--------|
| `ci-app-build.yml` | Build + zip → S3 release bucket |
| `ci-app-deploy.yml` | Unzip → sync to S3 → invalidate CloudFront |
| `prod-app-build.yml` | Build + zip → S3 release bucket |
| `prod-app-deploy.yml` | Unzip → sync to S3 → invalidate CloudFront |

## License

MIT
