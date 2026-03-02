# 十八啦 Online — Design Document

**Date**: 2026-03-03
**Status**: Approved

---

## Overview

A real-time multiplayer 十八啦 (Shíbā la) dice game website hosted on GitHub Pages. Players join anonymously, play in real-time rooms of 2–6 players, and compete on global and seasonal leaderboards.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS (festive 台味 theme) |
| Animations | Framer Motion |
| Backend | Firebase Realtime Database |
| Auth | Firebase Anonymous Auth |
| Hosting | GitHub Pages (`gh-pages` branch) |

---

## Architecture

```
User opens site
  → Firebase Anonymous Auth (auto-login, pick nickname)
  → Home: Create Room | Join Room | Leaderboard

In a room:
  → RTDB /rooms/{roomId} synced live to all players
  → Host starts game → turn-based dice rolling
  → Results written to /players/{uid}/stats on game end
  → Leaderboard reads /leaderboard/{season} and /leaderboard/alltime
```

Firebase config stored in Vite env vars (`.env.local`, not committed).

---

## Game Rules (Classic 4-dice 十八啦)

- Each player rolls 4 dice
- If at least one **pair** exists → score = sum of the other 2 dice (max 18 = 十八啦!)
- **No pair** → score 0 (豬頭)
- **Pair of 1s** → automatic loss
- Highest score wins the round; ties re-roll
- Game = best-of-N rounds (1, 3, or 5 — host chooses)

---

## RTDB Data Structure

### Rooms

```json
/rooms/{roomId}: {
  "status": "waiting" | "playing" | "finished",
  "hostUid": "abc123",
  "round": 1,
  "maxRounds": 3,
  "currentTurn": "uid_of_current_player",
  "players": {
    "uid1": { "nickname": "骰神", "score": 0, "dice": [1,2,3,4], "rolled": false, "ready": true },
    "uid2": { "nickname": "賭聖", "score": 0, "dice": [], "rolled": false, "ready": false }
  },
  "roundResults": {
    "1": { "uid1": 12, "uid2": 18, "winner": "uid2" }
  },
  "createdAt": 1234567890
}
```

### Players

```json
/players/{uid}: {
  "nickname": "骰神",
  "gamesPlayed": 42,
  "wins": 28,
  "losses": 14,
  "highScore": 18,
  "seasonKey": "2026-Q1"
}
```

### Leaderboard

```json
/leaderboard/alltime/{uid}: { "nickname": "骰神", "wins": 28, "winRate": 0.67 }
/leaderboard/2026-Q1/{uid}: { "nickname": "骰神", "wins": 10, "winRate": 0.71 }
```

- Season key format: `YYYY-QN` (quarterly resets)
- Query: `.orderByChild("wins").limitToLast(20)`

---

## Room & Turn Flow

1. Host creates room → gets 6-char room code (e.g. `AB12CD`)
2. Others join via code or link `/?room=AB12CD`
3. Host sets rounds (1/3/5) and starts game
4. Each round: players take turns rolling → results broadcast via RTDB
5. After all players roll → winner calculated → next round
6. After max rounds → game over → stats updated → winner celebrated

---

## UI Screens

| Screen | Description |
|--------|-------------|
| Home | Nickname, Create/Join room, Leaderboard |
| Lobby | Room code, player list with ready status, host start button |
| Game | All players' dice, "擲骰!" button, scores, round indicator |
| Round Results | Winner highlight, running totals, "下一局" |
| Game Over | Confetti, final winner, stats summary, Back to Home |
| Leaderboard | All-time / Season tabs, top 20 table |

---

## Visual Design (Festive 台味)

- **Colors**: Red (`#DC2626`) and gold (`#D97706`) primary palette
- **Motifs**: Temple lantern decorative elements, auspicious patterns
- **Animations**: Dice shake + slam on roll (Framer Motion)
- **Sound**: Dice rattling SFX, "十八啦！" shout on score of 18
- **Layout**: Mobile-first (players use phones)

---

## Auth & Identity

- Firebase Anonymous Auth on first visit → UID persisted in browser
- User picks nickname (stored in RTDB `/players/{uid}/nickname`)
- Nickname editable from home screen
- No email or password required

---

## Leaderboard

- **All-time**: Cumulative wins and win rate, never resets
- **Seasonal**: Quarterly reset (`YYYY-QN`), fresh start each quarter
- Top 20 players shown per board
- Stats updated via Firebase client SDK after each game (no Cloud Functions needed for MVP)
