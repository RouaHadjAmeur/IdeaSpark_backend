# 📖 Guide : Lire les Événements Google Calendar

## ✅ Nouvelles Fonctionnalités Ajoutées

Votre API peut maintenant **LIRE** tous les événements de votre Google Calendar en plus de créer des événements.

---

## 🔑 Étape 1 : Réautoriser l'Application

**IMPORTANT** : Vous devez réautoriser l'application car nous avons ajouté un nouveau scope (permission de lecture).

### 1.1 Obtenir la nouvelle URL d'autorisation

```bash
GET http://localhost:3001/google-calendar/auth-url
```

**Réponse** :
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 1.2 Ouvrir l'URL dans votre navigateur

- Copiez l'URL complète
- Ouvrez-la dans votre navigateur
- Connectez-vous avec votre compte Google
- **Acceptez les nouvelles permissions** (lecture + écriture)

### 1.3 Récupérer les nouveaux tokens

Après autorisation, vous serez redirigé vers :
```
http://localhost:3001/google-calendar/callback?code=...
```

**Réponse** :
```json
{
  "success": true,
  "message": "Successfully connected to Google Calendar",
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0g..."
}
```

**⚠️ IMPORTANT** : Sauvegardez ces tokens, vous en aurez besoin pour toutes les requêtes suivantes.

---

## 📋 Étape 2 : Lire Tous les Événements

### Endpoint : `GET /google-calendar/events`

**Requête** :
```bash
GET http://localhost:3001/google-calendar/events
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0g...",
  "maxResults": 50
}
```

**Paramètres optionnels** :
- `timeMin` : Date de début (ISO 8601) - par défaut : maintenant
- `timeMax` : Date de fin (ISO 8601) - par défaut : aucune limite
- `maxResults` : Nombre max d'événements (1-250) - par défaut : 50

**Exemple avec filtres de date** :
```json
{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0g...",
  "timeMin": "2024-01-01T00:00:00Z",
  "timeMax": "2024-12-31T23:59:59Z",
  "maxResults": 100
}
```

**Réponse** :
```json
{
  "success": true,
  "count": 5,
  "events": [
    {
      "id": "abc123xyz",
      "summary": "Réunion d'équipe",
      "description": "Discussion sur le projet Q1",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z",
      "location": "Salle de conférence A",
      "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
      "status": "confirmed",
      "created": "2024-01-10T08:30:00Z",
      "updated": "2024-01-12T14:20:00Z"
    },
    {
      "id": "def456uvw",
      "summary": "📱 Publication Instagram",
      "description": "Publication planifiée sur Instagram depuis IdeaSpark",
      "start": "2024-01-16T14:00:00Z",
      "end": "2024-01-16T15:00:00Z",
      "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
      "status": "confirmed"
    }
  ]
}
```

---

## 🔍 Étape 3 : Lire un Événement Spécifique

### Endpoint : `GET /google-calendar/events/:eventId`

**Requête** :
```bash
GET http://localhost:3001/google-calendar/events/abc123xyz?eventId=abc123xyz
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0g..."
}
```

**Réponse** :
```json
{
  "success": true,
  "event": {
    "id": "abc123xyz",
    "summary": "Réunion d'équipe",
    "description": "Discussion sur le projet Q1",
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T11:00:00Z",
    "location": "Salle de conférence A",
    "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
    "status": "confirmed",
    "created": "2024-01-10T08:30:00Z",
    "updated": "2024-01-12T14:20:00Z",
    "attendees": [
      {
        "email": "user@example.com",
        "responseStatus": "accepted"
      }
    ],
    "reminders": {
      "useDefault": false,
      "overrides": [
        { "method": "popup", "minutes": 30 }
      ]
    }
  }
}
```

---

## 🧪 Test Complet avec Postman/Thunder Client

### Test 1 : Autorisation
```
1. GET http://localhost:3001/google-calendar/auth-url
2. Ouvrir authUrl dans le navigateur
3. Autoriser l'application
4. Copier accessToken et refreshToken
```

### Test 2 : Lire tous les événements
```
GET http://localhost:3001/google-calendar/events
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "accessToken": "VOTRE_ACCESS_TOKEN",
  "refreshToken": "VOTRE_REFRESH_TOKEN",
  "maxResults": 10
}
```

### Test 3 : Lire les événements de cette semaine
```
GET http://localhost:3001/google-calendar/events
Body:
{
  "accessToken": "VOTRE_ACCESS_TOKEN",
  "refreshToken": "VOTRE_REFRESH_TOKEN",
  "timeMin": "2024-01-15T00:00:00Z",
  "timeMax": "2024-01-22T23:59:59Z"
}
```

### Test 4 : Lire un événement spécifique
```
GET http://localhost:3001/google-calendar/events/EVENT_ID?eventId=EVENT_ID
Body:
{
  "accessToken": "VOTRE_ACCESS_TOKEN",
  "refreshToken": "VOTRE_REFRESH_TOKEN"
}
```

---

## 🎯 Cas d'Usage

### 1. Synchronisation Bidirectionnelle
```
IdeaSpark → Google Calendar (créer des événements)
Google Calendar → IdeaSpark (lire les événements existants)
```

### 2. Détection de Conflits
Avant de créer un événement, vérifiez s'il y a déjà un événement à cette heure :
```javascript
// 1. Lire les événements du jour
const events = await fetch('/google-calendar/events', {
  body: JSON.stringify({
    accessToken: token,
    timeMin: '2024-01-15T00:00:00Z',
    timeMax: '2024-01-15T23:59:59Z'
  })
});

// 2. Vérifier les conflits
const hasConflict = events.events.some(event => {
  // Logique de détection de conflit
});

// 3. Créer l'événement seulement s'il n'y a pas de conflit
if (!hasConflict) {
  await fetch('/google-calendar/sync-entry', { ... });
}
```

### 3. Affichage dans l'Application
Afficher tous les événements Google Calendar dans votre interface IdeaSpark :
```javascript
const response = await fetch('/google-calendar/events', {
  body: JSON.stringify({
    accessToken: token,
    maxResults: 50
  })
});

// Afficher dans un calendrier UI
displayInCalendar(response.events);
```

---

## ⚠️ Notes Importantes

1. **Réautorisation Requise** : Vous devez réautoriser l'application pour obtenir les nouvelles permissions de lecture

2. **Tokens** : Les tokens doivent être sauvegardés dans votre base de données (associés à l'utilisateur)

3. **Refresh Token** : Le refresh token permet de renouveler l'access token quand il expire (1 heure)

4. **Limites** : Google Calendar API a des quotas (10,000 requêtes/jour par défaut)

5. **Sécurité** : Ne jamais exposer les tokens dans le frontend, toujours passer par votre backend

---

## 🚀 Prochaines Étapes

Maintenant vous pouvez :
- ✅ Créer des événements dans Google Calendar
- ✅ Lire tous les événements existants
- ✅ Lire un événement spécifique
- ✅ Filtrer par date
- ✅ Synchronisation bidirectionnelle

**Fonctionnalités futures possibles** :
- Modifier un événement existant
- Supprimer un événement
- Gérer plusieurs calendriers
- Notifications en temps réel (webhooks)
