# Damas — Conectando via WebSocket e Jogando

Base URL: `http://localhost:8080`

---

## Visão Geral do Fluxo

```
1. Registrar conta          POST /api/auth/register
2. Confirmar e-mail         POST /api/auth/confirm-email
3. Login → obter JWT        POST /api/auth/login
4. Criar ou listar partidas POST/GET /api/games
5. Entrar na partida        POST /api/games/{id}/join
6. Conectar ao WebSocket    ws://localhost:8080/hubs/game?access_token=<JWT>
7. Observar partida         → WatchGame(gameId)
8. Jogar                    POST /api/games/{id}/moves
```

---

## 1. Autenticação

### Registrar

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "Senha123"
}
```

Resposta `201`:
```json
{ "id": "<player-uuid>", "username": "player1", "email": "player1@example.com" }
```

Erros: `409 email_taken | username_taken`, `400` validação.

---

### Confirmar e-mail

```http
POST /api/auth/confirm-email
Content-Type: application/json

{
  "email": "player1@example.com",
  "code": "123456"
}
```

O código de 6 dígitos chega por e-mail. Expira em 15 minutos.

---

### Login → JWT

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "Senha123"
}
```

Resposta `200`:
```json
{ "token": "<jwt>", "playerId": "<uuid>", "username": "player1" }
```

Use o `token` em todas as requisições autenticadas:
```
Authorization: Bearer <jwt>
```

---

## 2. Partidas (REST)

### Listar partidas abertas

```http
GET /api/games
```

Retorna lista de `GameResponse` com status `WaitingForPlayers` ou `InProgress`.

---

### Criar partida

```http
POST /api/games
Authorization: Bearer <jwt>
```

Resposta `201 GameResponse`. Você é automaticamente o jogador de **peças pretas**.

---

### Entrar na partida

```http
POST /api/games/{gameId}/join
Authorization: Bearer <jwt>
```

Você entra como jogador de **peças brancas**. O status muda para `InProgress`.
Todos conectados ao grupo via WebSocket recebem o evento `GameStarted`.

---

### Buscar estado atual

```http
GET /api/games/{gameId}
```

Retorna `GameResponse` com o campo `boardState` (JSON serializado).

---

## 3. WebSocket (SignalR)

O servidor usa **SignalR**. Qualquer cliente compatível pode conectar — inclusive espectadores sem JWT.

### Conectar

```
ws://localhost:8080/hubs/game?access_token=<jwt>
```

Espectadores podem omitir o token. Jogadores devem incluí-lo (obrigado para fazer jogadas via REST).

**Exemplo com `wscat`:**
```bash
wscat -c "ws://localhost:8080/hubs/game?access_token=<jwt>"
```

**Exemplo com `signalr` (JavaScript):**
```js
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:8080/hubs/game", {
    accessTokenFactory: () => "<jwt>"
  })
  .build();

await connection.start();
```

---

### Método: `WatchGame(gameId)`

Entra no grupo da partida e recebe o estado atual do tabuleiro imediatamente.

```js
await connection.invoke("WatchGame", "<game-uuid>");
```

Tanto jogadores quanto espectadores devem chamar este método para receber eventos da partida.

---

### Método: `StopWatching(gameId)`

Sai do grupo da partida.

```js
await connection.invoke("StopWatching", "<game-uuid>");
```

---

### Eventos recebidos

| Evento | Quando | Payload |
|---|---|---|
| `GameState` | Imediatamente após `WatchGame` | `BoardStateData` (estado atual) |
| `GameStarted` | 2º jogador entrou (`/join`) | `GameResponse` |
| `MoveMade` | Após cada movimento válido | `GameResponse` atualizado |

```js
connection.on("GameState", (state) => {
  console.log("Tabuleiro atual:", state.cells);
});

connection.on("GameStarted", (game) => {
  console.log("Partida iniciada! Vez de:", game.currentTurn);
});

connection.on("MoveMade", (game) => {
  console.log("Movimento feito. Vez de:", game.currentTurn);
  if (game.status === "Completed") {
    console.log("Vencedor:", game.winnerId);
  }
});
```

---

## 4. Fazer Jogadas

As jogadas são feitas via **REST**, não pelo WebSocket.

```http
POST /api/games/{gameId}/moves
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "fromRow": 2,
  "fromCol": 1,
  "toRow": 3,
  "toCol": 0
}
```

Resposta `200 GameResponse` ou `400 { "error": "..." }`.

Após uma jogada válida, **todos os clientes no grupo** recebem o evento `MoveMade`.

---

## 5. O Tabuleiro

`boardState` é um JSON com a estrutura:

```json
{
  "cells": [[0,1,0,...], ...],   // matriz 8x8
  "pendingCaptureRow": -1,       // -1 = sem captura pendente
  "pendingCaptureCol": -1
}
```

Valores das células:

| Valor | Peça |
|---|---|
| `0` | Vazio |
| `1` | Peça preta (homem) |
| `2` | Peça branca (homem) |
| `3` | Dama preta |
| `4` | Dama branca |

**Coordenadas:** `row 0` é o lado preto (topo), `row 7` é o lado branco (base). Colunas 0–7 da esquerda para a direita. Peças ocupam apenas casas escuras onde `(row + col) % 2 == 1`.

---

## 6. Regras Resumidas (Damas Brasileiras)

- **Preto** começa sempre
- Homens movem apenas para frente (em diagonal); **capturam em qualquer diagonal**
- Damas: movimento longo em qualquer diagonal
- **Captura obrigatória** — se houver captura disponível, não é possível fazer movimento simples
- **Multicaptura**: após capturar, se houver mais capturas disponíveis, o turno continua (`pendingCaptureRow/Col` indica a peça bloqueada)
- **Promoção durante multicaptura encerra o turno** (regra brasileira)
- Vitória: oponente sem peças **ou** sem movimentos válidos

---

## 7. Exemplo Completo (curl + wscat)

```bash
# 1. Registrar e confirmar (omitido por brevidade)

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"p1@x.com","password":"Senha123"}' | jq -r .token)

# 3. Criar partida
GAME_ID=$(curl -s -X POST http://localhost:8080/api/games \
  -H "Authorization: Bearer $TOKEN" | jq -r .id)

echo "Game: $GAME_ID"

# 4. Conectar ao WebSocket em outro terminal
wscat -c "ws://localhost:8080/hubs/game?access_token=$TOKEN"
# > {"type":1,"target":"WatchGame","arguments":["<GAME_ID>"]}

# 5. (2º jogador entra via /join em outro terminal)

# 6. Fazer jogada
curl -s -X POST "http://localhost:8080/api/games/$GAME_ID/moves" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromRow":2,"fromCol":1,"toRow":3,"toCol":0}' | jq .
```

> **Nota:** O protocolo nativo do SignalR sobre WebSocket usa um formato JSON próprio (mensagens terminam com `\x1e`). Para testes manuais simples é mais prático usar uma biblioteca cliente SignalR.

---

## 8. Erros Comuns

| Código | Mensagem | Causa |
|---|---|---|
| `400` | `"It is not your turn"` | Tentando jogar fora da vez |
| `400` | `"Capture is mandatory when available"` | Ignorando captura obrigatória |
| `400` | `"Must continue the capture chain"` | Multicaptura: tentativa de mover outra peça |
| `400` | `"You are not a participant in this game"` | JWT de espectador tentando jogar |
| `401` | — | Token ausente ou inválido |
| `403` | `"email_not_confirmed"` | Login antes de confirmar e-mail |
