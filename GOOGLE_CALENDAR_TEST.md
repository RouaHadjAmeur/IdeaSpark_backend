# 🧪 Guide de Test - Intégration Google Calendar

## ✅ Serveur démarré avec succès !

Le serveur tourne maintenant sur : **http://localhost:3001**

Documentation Swagger : **http://localhost:3001/api**

---

## 📋 Étapes de Test

### 1️⃣ Mettre à jour la Redirect URI dans Google Cloud Console

⚠️ **IMPORTANT** : Vous devez mettre à jour l'URI de redirection dans Google Cloud Console car nous utilisons maintenant le port 3001.

1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre projet "Google Calendar"
3. Cliquez sur votre Client ID OAuth 2.0
4. Dans "Authorized redirect URIs", ajoutez :
   ```
   http://localhost:3001/google-calendar/callback
   ```
5. Sauvegardez les modifications

---

### 2️⃣ Obtenir un Token JWT (Authentification)

Vous devez d'abord vous connecter pour obtenir un token JWT.

**Option A : Créer un compte**
```bash
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456!",
  "firstName": "Test",
  "lastName": "User"
}
```

**Option B : Se connecter**
```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456!"
}
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

💾 **Sauvegardez le `access_token`** - vous en aurez besoin pour les prochaines étapes !

---

### 3️⃣ Obtenir l'URL d'Autorisation Google

```bash
GET http://localhost:3001/google-calendar/auth-url
Authorization: Bearer VOTRE_JWT_TOKEN
```

**Réponse :**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&response_type=code&client_id=927555530226-og8d2denl0lm1bi5g2ce71ujdmk8naek.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fgoogle-calendar%2Fcallback&prompt=consent"
}
```

---

### 4️⃣ Autoriser l'Accès à Google Calendar

1. **Copiez l'URL** reçue dans la réponse
2. **Ouvrez-la dans votre navigateur**
3. **Connectez-vous** avec votre compte Google
4. **Autorisez** l'application à accéder à votre Google Calendar
5. Vous serez redirigé vers : `http://localhost:3001/google-calendar/callback?code=...`

**Réponse du callback :**
```json
{
  "success": true,
  "message": "Successfully connected to Google Calendar",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gXXXXXXXXXXXXX"
}
```

💾 **Sauvegardez les tokens** (`accessToken` et `refreshToken`) !

---

### 5️⃣ Créer une Entrée de Calendrier (pour tester)

Avant de synchroniser, créons une entrée de calendrier :

```bash
POST http://localhost:3001/plans/:planId/add-to-calendar
Authorization: Bearer VOTRE_JWT_TOKEN
Content-Type: application/json

{
  "contentBlockId": "65f1234567890abcdef12345",
  "platform": "Instagram",
  "scheduledDate": "2026-03-15",
  "scheduledTime": "14:30"
}
```

**Réponse :**
```json
{
  "_id": "65f9876543210fedcba98765",
  "planId": "...",
  "contentBlockId": "...",
  "platform": "Instagram",
  "scheduledDate": "2026-03-15T00:00:00.000Z",
  "scheduledTime": "14:30"
}
```

💾 **Sauvegardez le `_id`** de l'entrée créée !

---

### 6️⃣ Synchroniser avec Google Calendar

**Option A : Synchroniser une seule entrée**

```bash
POST http://localhost:3001/google-calendar/sync-entry
Authorization: Bearer VOTRE_JWT_TOKEN
Content-Type: application/json

{
  "calendarEntryId": "65f9876543210fedcba98765",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gXXXXXXXXXXXXX"
}
```

**Option B : Synchroniser tout un plan**

```bash
POST http://localhost:3001/google-calendar/sync-plan
Authorization: Bearer VOTRE_JWT_TOKEN
Content-Type: application/json

{
  "planId": "65f1234567890abcdef12345",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gXXXXXXXXXXXXX"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "eventId": "abc123xyz789",
  "eventLink": "https://www.google.com/calendar/event?eid=..."
}
```

---

### 7️⃣ Vérifier dans Google Calendar

1. Ouvrez **Google Calendar** : https://calendar.google.com
2. Cherchez l'événement créé : **"📱 Publication Instagram"**
3. Vérifiez la date et l'heure
4. L'événement devrait avoir :
   - Un rappel popup 30 minutes avant
   - Un rappel email 1 heure avant
   - Une couleur bleue

---

## 🧪 Test avec Postman ou Thunder Client

### Collection Postman

Vous pouvez importer cette collection dans Postman :

```json
{
  "info": {
    "name": "IdeaSpark - Google Calendar",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123456!\"\n}"
        }
      }
    },
    {
      "name": "2. Get Auth URL",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/google-calendar/auth-url",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ]
      }
    },
    {
      "name": "3. Sync Entry",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/google-calendar/sync-entry",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"calendarEntryId\": \"{{entry_id}}\",\n  \"accessToken\": \"{{google_access_token}}\",\n  \"refreshToken\": \"{{google_refresh_token}}\"\n}"
        }
      }
    }
  ]
}
```

---

## 🐛 Dépannage

### Erreur : "Redirect URI mismatch"
➡️ Vérifiez que vous avez bien ajouté `http://localhost:3001/google-calendar/callback` dans Google Cloud Console

### Erreur : "Invalid credentials"
➡️ Vérifiez que les credentials dans `.env` sont corrects

### Erreur : "Calendar entry not found"
➡️ Créez d'abord une entrée de calendrier avec l'endpoint `/plans/:id/add-to-calendar`

### Erreur : "Unauthorized"
➡️ Vérifiez que votre JWT token est valide et non expiré

---

## 📚 Documentation Complète

- **Backend** : `src/google-calendar/README.md`
- **Frontend** : `GOOGLE_CALENDAR_INTEGRATION.md`
- **Swagger** : http://localhost:3001/api

---

## ✅ Checklist de Test

- [ ] Serveur démarré sur port 3001
- [ ] Redirect URI mise à jour dans Google Cloud Console
- [ ] Compte créé et JWT token obtenu
- [ ] URL d'autorisation Google obtenue
- [ ] Autorisation Google accordée
- [ ] Tokens Google (access + refresh) obtenus
- [ ] Entrée de calendrier créée
- [ ] Synchronisation réussie avec Google Calendar
- [ ] Événement visible dans Google Calendar

---

## 🎉 Prochaines Étapes

Une fois les tests réussis :

1. **Implémenter la persistance des tokens** dans la base de données
2. **Ajouter le refresh automatique** des tokens expirés
3. **Créer l'interface frontend** (voir `GOOGLE_CALENDAR_INTEGRATION.md`)
4. **Ajouter la synchronisation bidirectionnelle** (Google → IdeaSpark)
5. **Gérer les conflits** et les mises à jour d'événements
