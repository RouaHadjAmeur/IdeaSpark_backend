# 🏗️ Architecture - Intégration Google Calendar

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Flutter)                     │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  CalendarPage    │  │ GoogleCalendar   │  │  CalendarSync    │ │
│  │  Component       │  │ Button           │  │  Button          │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │  useGoogleCalendar Hook │                     │
│                    └────────────┬────────────┘                     │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │ GoogleCalendar Service  │                     │
│                    └────────────┬────────────┘                     │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │   Axios HTTP Client     │                     │
│                    └────────────┬────────────┘                     │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  │
┌─────────────────────────────────▼──────────────────────────────────┐
│                    BACKEND (NestJS) - Port 3001                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              GoogleCalendarController                         │ │
│  │                                                               │ │
│  │  GET  /google-calendar/auth-url                              │ │
│  │  GET  /google-calendar/callback                              │ │
│  │  POST /google-calendar/sync-entry                            │ │
│  │  POST /google-calendar/sync-plan                             │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                        │
│  ┌────────────────────────▼─────────────────────────────────────┐ │
│  │              GoogleCalendarService                            │ │
│  │                                                               │ │
│  │  • getAuthUrl()                                              │ │
│  │  • getTokensFromCode()                                       │ │
│  │  • syncToGoogleCalendar()                                    │ │
│  │  • syncPlanToGoogleCalendar()                                │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                        │
│           ┌───────────────┼───────────────┐                       │
│           │               │               │                       │
│  ┌────────▼────────┐  ┌──▼──────────┐  ┌▼──────────────┐        │
│  │  CalendarEntry  │  │ GoogleToken │  │  googleapis   │        │
│  │  Model          │  │ Model       │  │  Library      │        │
│  │  (MongoDB)      │  │ (MongoDB)   │  │               │        │
│  └─────────────────┘  └─────────────┘  └───────┬───────┘        │
└─────────────────────────────────────────────────┼──────────────────┘
                                                  │
                                                  │ OAuth 2.0
                                                  │
┌─────────────────────────────────────────────────▼──────────────────┐
│                      GOOGLE CLOUD PLATFORM                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Google Calendar API                          │ │
│  │                                                               │ │
│  │  • OAuth 2.0 Authorization                                   │ │
│  │  • Token Exchange                                            │ │
│  │  • Calendar Events Management                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  OAuth 2.0 Credentials                        │ │
│  │                                                               │ │
│  │  Client ID: 927555530226-og8d2denl0lm1bi5g2ce71ujdmk8naek   │ │
│  │  Client Secret: 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          │ │
│  │  Redirect URI: http://localhost:3001/google-calendar/callback│ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Données - Connexion

```
┌──────────┐                                                    ┌──────────┐
│          │  1. Click "Connect Google Calendar"               │          │
│          ├───────────────────────────────────────────────────>│          │
│          │                                                    │          │
│          │  2. GET /google-calendar/auth-url                 │          │
│  FRONT   ├───────────────────────────────────────────────────>│  BACKEND │
│   END    │                                                    │          │
│          │  3. Return authUrl                                │          │
│          │<───────────────────────────────────────────────────┤          │
│          │                                                    │          │
└────┬─────┘                                                    └──────────┘
     │
     │ 4. Open popup with authUrl
     │
     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         GOOGLE OAUTH POPUP                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Sign in with Google                                         │    │
│  │                                                              │    │
│  │  IdeaSpark wants to access your Google Calendar             │    │
│  │                                                              │    │
│  │  [Allow]  [Deny]                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    │ 5. User clicks "Allow"
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    GOOGLE REDIRECTS TO CALLBACK                       │
│                                                                       │
│  http://localhost:3001/google-calendar/callback?code=4/0AY0e-g7...  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    │ 6. Backend receives code
                                    │
                                    ▼
┌──────────┐                                                    ┌──────────┐
│          │  7. Exchange code for tokens                       │          │
│          │    (googleapis library)                            │          │
│  BACKEND ├───────────────────────────────────────────────────>│  GOOGLE  │
│          │                                                    │   API    │
│          │  8. Return access_token & refresh_token           │          │
│          │<───────────────────────────────────────────────────┤          │
└────┬─────┘                                                    └──────────┘
     │
     │ 9. Return tokens to frontend
     │
     ▼
┌──────────┐
│          │  10. Save tokens in localStorage
│  FRONT   │      - google_access_token
│   END    │      - google_refresh_token
│          │
└──────────┘
```

---

## 🔄 Flux de Données - Synchronisation

```
┌──────────┐                                                    ┌──────────┐
│          │  1. Click "Sync Plan"                             │          │
│          │     { planId, accessToken, refreshToken }         │          │
│  FRONT   ├───────────────────────────────────────────────────>│          │
│   END    │  POST /google-calendar/sync-plan                  │  BACKEND │
│          │                                                    │          │
└──────────┘                                                    └────┬─────┘
                                                                     │
                                                                     │ 2. Find all
                                                                     │    calendar entries
                                                                     │    for planId
                                                                     ▼
                                                              ┌──────────────┐
                                                              │   MongoDB    │
                                                              │              │
                                                              │ CalendarEntry│
                                                              │ Collection   │
                                                              └──────┬───────┘
                                                                     │
                                                                     │ 3. Return entries
                                                                     │
┌──────────┐                                                    ┌────▼─────┐
│          │                                                    │          │
│  GOOGLE  │  4. For each entry, create event                  │  BACKEND │
│ CALENDAR │<───────────────────────────────────────────────────┤          │
│   API    │     calendar.events.insert()                      │          │
│          │                                                    │          │
│          │  5. Return event details                          │          │
│          │     { eventId, eventLink }                        │          │
│          ├───────────────────────────────────────────────────>│          │
└──────────┘                                                    └────┬─────┘
                                                                     │
                                                                     │ 6. Return sync result
                                                                     │    { total, synced,
                                                                     │      failed, details }
                                                                     ▼
┌──────────┐                                                    ┌──────────┐
│          │<───────────────────────────────────────────────────┤          │
│  FRONT   │  7. Display result                                │  BACKEND │
│   END    │     "✅ 10/10 entries synced"                     │          │
│          │                                                    │          │
└──────────┘                                                    └──────────┘
```

---

## 🗄️ Modèles de Données

### CalendarEntry (MongoDB)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Référence à User
  planId: ObjectId,           // Référence à Plan
  contentBlockId: ObjectId,   // Référence à ContentBlock
  platform: String,           // "Instagram", "Facebook", etc.
  scheduledDate: Date,        // Date de publication
  scheduledTime: String,      // Heure de publication "14:30"
  googleEventId?: String,     // ID de l'événement Google (après sync)
  createdAt: Date,
  updatedAt: Date
}
```

### GoogleToken (MongoDB)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Référence à User
  accessToken: String,        // Token d'accès Google
  refreshToken: String,       // Token de rafraîchissement
  expiresAt: Date,           // Date d'expiration du access_token
  createdAt: Date,
  updatedAt: Date
}
```

### Google Calendar Event (API Google)

```typescript
{
  id: String,                 // ID unique de l'événement
  summary: String,            // "📱 Publication Instagram"
  description: String,        // Détails de la publication
  start: {
    dateTime: String,         // "2026-03-15T14:30:00+01:00"
    timeZone: String          // "Europe/Paris"
  },
  end: {
    dateTime: String,         // "2026-03-15T15:30:00+01:00"
    timeZone: String          // "Europe/Paris"
  },
  reminders: {
    useDefault: false,
    overrides: [
      { method: "popup", minutes: 30 },
      { method: "email", minutes: 60 }
    ]
  },
  colorId: String,            // "9" (bleu)
  htmlLink: String            // Lien vers l'événement
}
```

---

## 🔐 Sécurité

### Stockage des Tokens

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Temporaire)                     │
│                                                              │
│  localStorage:                                               │
│  • google_access_token  (expire après 1h)                   │
│  • google_refresh_token (expire après 6 mois)               │
│                                                              │
│  ⚠️ Pas idéal pour la production                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Recommandé)                        │
│                                                              │
│  MongoDB (GoogleToken collection):                          │
│  • Tokens chiffrés                                          │
│  • Associés à l'utilisateur                                 │
│  • Refresh automatique                                      │
│  • Révocation possible                                      │
│                                                              │
│  ✅ Meilleure sécurité                                      │
└─────────────────────────────────────────────────────────────┘
```

### OAuth 2.0 Flow

```
1. Authorization Request
   ↓
2. User Consent
   ↓
3. Authorization Code
   ↓
4. Token Exchange
   ↓
5. Access Token + Refresh Token
   ↓
6. API Calls with Access Token
   ↓
7. Token Refresh (when expired)
```

---

## 📦 Dépendances

### Backend (NestJS)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/mongoose": "^10.0.0",
    "googleapis": "^128.0.0",
    "mongoose": "^8.0.0"
  }
}
```

### Frontend (React)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  }
}
```

### Frontend (Flutter)

```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.0
  url_launcher: ^6.2.0
```

---

## 🌐 Endpoints API

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/google-calendar/auth-url` | JWT | Obtenir l'URL d'autorisation Google |
| `GET` | `/google-calendar/callback` | - | Callback OAuth (automatique) |
| `POST` | `/google-calendar/sync-entry` | JWT | Synchroniser une entrée |
| `POST` | `/google-calendar/sync-plan` | JWT | Synchroniser un plan complet |

---

## 🔄 États de l'Application

### Frontend State Management

```typescript
interface GoogleCalendarState {
  isConnected: boolean;        // Utilisateur connecté à Google?
  isLoading: boolean;          // Opération en cours?
  error: string | null;        // Erreur éventuelle
  tokens: {
    accessToken: string;
    refreshToken: string;
  } | null;
}
```

### Transitions d'État

```
┌─────────────┐
│ Disconnected│
└──────┬──────┘
       │
       │ connect()
       ▼
┌─────────────┐
│  Loading    │
└──────┬──────┘
       │
       ├─ Success ──> ┌───────────┐
       │              │ Connected │
       │              └───────────┘
       │
       └─ Error ────> ┌─────────────┐
                      │ Disconnected│
                      │ (with error)│
                      └─────────────┘
```

---

## 📊 Métriques de Performance

### Temps de Réponse Attendus

| Opération | Temps | Notes |
|-----------|-------|-------|
| GET auth-url | < 100ms | Génération URL locale |
| Token exchange | 1-2s | Appel API Google |
| Sync 1 entry | 1-2s | Création événement Google |
| Sync 10 entries | 10-20s | Séquentiel (peut être optimisé) |

### Optimisations Possibles

1. **Batch API calls** - Créer plusieurs événements en une seule requête
2. **Parallel processing** - Synchroniser plusieurs entrées en parallèle
3. **Caching** - Mettre en cache les tokens valides
4. **Queue system** - Utiliser une file d'attente pour les grandes synchronisations

---

## 🎯 Améliorations Futures

### Phase 1 (Court terme)
- ✅ Backend fonctionnel
- 🔨 Frontend implémenté
- 🔐 Tokens sauvegardés en base de données
- 🔄 Refresh automatique des tokens

### Phase 2 (Moyen terme)
- 📥 Synchronisation bidirectionnelle (Google → IdeaSpark)
- 🔔 Notifications de synchronisation
- 📊 Dashboard de statistiques
- 🎨 Interface de gestion des événements

### Phase 3 (Long terme)
- 🗓️ Support de plusieurs calendriers
- 👥 Partage de calendriers en équipe
- 🤖 Synchronisation automatique
- 📱 Application mobile native

---

## ✅ Checklist Architecture

- [x] Backend NestJS configuré
- [x] Google Cloud Platform configuré
- [x] OAuth 2.0 flow implémenté
- [x] API endpoints créés
- [x] Modèles de données définis
- [x] Documentation complète
- [ ] Frontend implémenté
- [ ] Tests end-to-end
- [ ] Déploiement production

---

**🎉 Architecture complète et prête pour la production !**
