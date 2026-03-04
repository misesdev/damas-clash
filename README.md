# damas

Estrutura base:
- `appmobile`: React Native CLI (sem Expo, TypeScript + Jest)
- `api`: ASP.NET Core REST + WebSocket

## Requisitos

- .NET SDK 10
- Node.js 22+
- Android Studio (para Android) e/ou Xcode (para iOS)

## Executar API (local)

```bash
cd api
dotnet restore
dotnet run
```

API local:
- Base: `http://localhost:5271` (perfil `http` do `launchSettings.json`)
- Endpoint exemplo: `GET /weatherforecast`

## Executar API (Docker)

```bash
docker compose up --build api
```

API no Docker:
- Base: `http://localhost:8080`
- Endpoint exemplo: `GET /weatherforecast`

## Executar Mobile (React Native)

```bash
cd appmobile
npm install
```

Iniciar Metro:

```bash
npm run start
```

Rodar no Android:

```bash
npm run android
```

Rodar no iOS:

```bash
npm run ios
```

## Testes Mobile

```bash
cd appmobile
npm test
```
