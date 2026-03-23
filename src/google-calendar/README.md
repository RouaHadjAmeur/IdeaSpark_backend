# Intégration Google Calendar

Cette fonctionnalité permet de synchroniser les entrées de calendrier IdeaSpark avec Google Calendar.

## Configuration

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar:
   - Menu → APIs & Services → Library
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

### 2. Créer des identifiants OAuth 2.0

1. Menu → APIs & Services → Credentials
2. Cliquez sur "Create Credentials" → "OAuth client ID"
3. Type d'application: "Web application"
4. Nom: "IdeaSpark Calendar Integration"
5. Origines JavaScript autorisées:
   - `http://localhost:3000`
   - `http://localhost:51800` (votre frontend)
6. URI de redirection autorisés:
   - `http://localhost:3000/google-calendar/callback`
7. Cliquez sur "Create"
8. Copiez le Client ID et Client Secret

### 3. Configurer les variables d'environnement

Ajoutez dans votre fichier `.env`:

```env
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-calendar/callback
```

## Utilisation

### Flux d'autorisation

1. **Obtenir l'URL d'autorisation**
   ```
   GET /google-calendar/auth-url
   Authorization: Bearer <jwt-token>
   ```
   
   Réponse:
   ```json
   {
     "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
   }
   ```

2. **Rediriger l'utilisateur vers l'URL**
   - L'utilisateur autorise l'application
   - Google redirige vers `/google-calendar/callback?code=...`

3. **Sauvegarder les tokens**
   - Le callback retourne `accessToken` et `refreshToken`
   - Sauvegardez ces tokens dans votre base de données (associés à l'utilisateur)

### Synchroniser avec Google Calendar

**Synchroniser une entrée unique:**
```
POST /google-calendar/sync-entry
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "calendarEntryId": "65f1234567890abcdef12345",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0gHdP9..."
}
```

**Synchroniser tout un plan:**
```
POST /google-calendar/sync-plan
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "planId": "65f1234567890abcdef12345",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0gHdP9..."
}
```

Réponse:
```json
{
  "total": 15,
  "synced": 15,
  "failed": 0,
  "details": [
    {
      "entryId": "65f1234567890abcdef12345",
      "success": true,
      "eventId": "abc123xyz",
      "eventLink": "https://calendar.google.com/calendar/event?eid=..."
    }
  ]
}
```

## Implémentation Frontend

### Exemple React/Flutter

```typescript
// 1. Obtenir l'URL d'autorisation
const response = await fetch('http://localhost:3000/google-calendar/auth-url', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
const { authUrl } = await response.json();

// 2. Ouvrir dans une nouvelle fenêtre ou WebView
window.open(authUrl, '_blank');

// 3. Après autorisation, récupérer les tokens du callback
// et les sauvegarder dans votre state/database

// 4. Synchroniser un plan
const syncResponse = await fetch('http://localhost:3000/google-calendar/sync-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    planId: selectedPlanId,
    accessToken: googleAccessToken,
    refreshToken: googleRefreshToken
  })
});

const result = await syncResponse.json();
console.log(`Synchronisé: ${result.synced}/${result.total} entrées`);
```

## Sécurité

⚠️ **Important:**
- Ne jamais exposer les tokens dans les logs ou réponses API en production
- Stocker les tokens de manière sécurisée (chiffrés dans la base de données)
- Implémenter un système de rafraîchissement automatique des tokens
- Ajouter une table `UserGoogleTokens` pour stocker les tokens par utilisateur

## Améliorations futures

- [ ] Stocker les tokens dans la base de données
- [ ] Rafraîchissement automatique des tokens expirés
- [ ] Synchronisation bidirectionnelle (Google → IdeaSpark)
- [ ] Gestion des conflits de calendrier
- [ ] Support de plusieurs calendriers Google
- [ ] Notifications de rappel personnalisées
