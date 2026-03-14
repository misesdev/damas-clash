# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Damas Clash** — A Brazilian Draughts (Damas Brasileiras) multiplayer game with Bitcoin Lightning Network wagering. Four components:

- `api/` — .NET 10 ASP.NET Core Web API (Controllers, EF Core + PostgreSQL, SignalR)
- `api.tests/` — xUnit integration tests (WebApplicationFactory + InMemory DB)
- `appmobile/` — React Native CLI app (TypeScript, no Expo)
- `appweb/` — Next.js 16 web app (TypeScript, Tailwind CSS)
- `lnd-gateway/` — .NET 10 Lightning Network gateway (wraps LND REST API)

## Commands

### API
```bash
cd api && dotnet restore && dotnet run          # Local (port 5000)
docker compose up --build api                   # Docker (port 8080)

# EF Core migrations
cd api && dotnet ef migrations add <Name>
cd api && dotnet ef database update
```

### API Tests
```bash
cd api.tests && dotnet test                                   # All tests (requires PostgreSQL)
cd api.tests && dotnet test --filter "Category!=Integration" # In-memory only (no DB needed)
cd api.tests && dotnet test --filter "FullyQualifiedName~GamesControllerTests"  # Single suite
```

### Mobile
```bash
cd appmobile && npm install
npm run android        # Android emulator
npm run ios            # iOS simulator (macOS)
npm test               # All Jest tests
npx jest --testPathPattern="CheckersBoard"  # Single test file
```

### Web
```bash
cd appweb && npm install
npm run dev            # Dev server at http://localhost:3000
npm run build && npm run start  # Production build
npm test               # Jest tests
```

### All services
```bash
docker compose up -d   # PostgreSQL + Redis + LND + lnd-gateway + api + appweb
```

## Architecture

### API Layer (Controllers → Services → Data/Engine)

- **Controllers** (`api/Controllers/`): AuthController, PlayersController, GamesController, HealthController, plus Chat/Wallet/Admin controllers.
- **Services** (`api/Services/`): Business logic; GameService injects `IHubContext<GameHub>` to emit SignalR events (`GameStarted`, `MoveMade`, `GameListUpdated`).
- **Engine** (`api/Engine/`): Pure game logic. `BoardStateData` is JSON-serializable board state. `BoardEngine` enforces all Damas Brasileiras rules.
- **Hubs** (`api/Hubs/`): `GameHub` at `/hubs/game`, `ChatHub` at `/hubs/chat`.
- `ServiceResult<T>` wraps all service responses with `IsNotFound` flag to distinguish 404 vs 400.

### Critical API Patterns

**JWT config** — must use `AddOptions<JwtBearerOptions>().Configure<IOptions<JwtSettings>>(...)`. Never capture the secret as a local variable; it won't be available in the test host context.

**JSON enums** — both `AddControllers()` and `AddSignalR()` must register `JsonStringEnumConverter`. Without it, enums serialize as integers and TypeScript enum filters break.

**Test factory** (`api.tests/Infrastructure/CustomWebApplicationFactory.cs`):
- Calculate `dbName` **outside** the lambda: `var dbName = "TestDb_" + Guid.NewGuid();` — otherwise each request gets a fresh empty DB.
- Remove all `DamasDbContext`-related descriptors including generic `IDbContextOptionsConfiguration<T>`.
- Use `FakeEmailService` (stores OTP codes in `ConcurrentDictionary`, readable via `GetCode(email)`).
- Set `["BCrypt:WorkFactor"] = "4"` for fast tests.

**DTOs** — use `record` types with `[Required]` on constructor parameters (no `property:` qualifier).

### Game Engine (shared across api, appmobile, appweb)

Rules for **Damas Brasileiras** (8x8, dark squares where `(row+col)%2==1`):
- Piece values: 0=Empty, 1=BlackMan, 2=WhiteMan, 3=BlackKing, 4=WhiteKing
- Black starts rows 0–2, White rows 5–7
- Men move forward only; kings move long-range on all diagonals
- Mandatory capture (including multicapture via `PendingCapture*`)
- Promotion during multicapture **ends the turn** (Brazilian rule)
- Win: opponent has no pieces OR no valid moves

Mobile/web use `src/game/GameEngine.ts` (immutable OOP wrapper) and `src/game/checkers.ts` (pure functions).

### Real-time (SignalR)

- Mobile/web connect with `skipNegotiation: true` and `HttpTransportType.WebSockets`.
- On connect: `JoinLobby()`, then `WatchGame(gameId)` if a game is pending.
- Events: `GameListUpdated`, `GameStarted`, `MoveMade`.
- `liveGames` state is null until first `GameListUpdated`; use fetched games as fallback.

### Auth Flow

1. `POST /api/auth/register` → 6-digit OTP code via email (15-min expiry)
2. `POST /api/auth/confirm-email` → activates account
3. `POST /api/auth/login` → returns `LoginResponse` with `accessToken`, `refreshToken`, `expiresAt`
4. Token lifetime: 15 min; refresh 2 min before expiry. `POST /api/auth/refresh`.
5. Google OAuth: `POST /api/auth/google` with `{ idToken }`.

### Mobile App Architecture

- **Global state**: `AppContext` (`src/context/AppContext.tsx`) — eliminates prop drilling.
- **Navigation**: Simple state machine (`AuthNavigator`, `MainNavigator`), no react-navigation library.
- **Screens are thin** — all logic in hooks (`src/hooks/`), all styles in `src/styles/`.
- **Multilanguage**: i18next with `pt.ts`/`en.ts` locales; language preference persisted to AsyncStorage.
- **Base URL**: `http://10.0.2.2:8080` (Android emulator → host localhost).

### Mobile Test Patterns

- Mock `@microsoft/signalr` via factory (no module-level variable references to avoid TDZ):
  ```ts
  jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn(),
    HttpTransportType: { WebSockets: 4 },
    HubConnectionState: { Connected: 'Connected' },
  }));
  ```
  Configure `mockReturnValue` in `beforeEach` via `require('@microsoft/signalr')`.
- `fakeSession` must include `refreshToken` and `expiresAt` (ISO string, ~15 min in future).
- Buttons with `disabled` prop block `fireEvent.press` — check disabled state in tests.
- For animation tests, use `waitFor` after each step; do not use `jest.advanceTimersByTime`.

## Environment Variables

Key vars (set in docker-compose or `.env`):
- `JWT_SECRET`, `DB_*` (database credentials)
- `SENDGRID_API_KEY`, `CLOUDINARY_*`
- `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `LND_REST_URL`, `LND_MACAROON`, `GATEWAY_API_KEY`
- `BCrypt__WorkFactor` (12 prod, 4 tests)

SEMPRE IMPLEMENTE OS TESTES AUTOMATIZADOS E OS EXECUTA PARA GARANTIR QUE ESTA TUDO FUNCIONANDO.
SEMPRE USE AS MELHORES PRATICAS DE PROGRAMACAO DO CODIGO COMO CLEAN CODE E SEMPRE ESTRUTURE MUITO 
BEM QUE IMPLEMENTA USANDO DESIGN PATTERNS CONHECIDOS.
