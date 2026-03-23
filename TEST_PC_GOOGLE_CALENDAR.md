# 💻 Test Google Calendar sur PC - Guide Complet

## 🎯 Objectif
Tester l'intégration Google Calendar depuis votre PC en 5 minutes.

---

## 📋 Prérequis

- ✅ Backend démarré (`npm start`)
- ✅ Postman, Thunder Client, ou curl installé
- ✅ Compte Google actif
- ✅ Navigateur web

---

## 🚀 Test Complet - Étape par Étape

### ÉTAPE 1 : Démarrer le Backend

```bash
# Dans le dossier du projet
cd IdeaSpark_backend

# Démarrer le serveur
npm start
```

**Vérifiez que le serveur démarre** :
```
✓ Server running on port 3001
✓ MongoDB connected
✓ Google Calendar module loaded
```

---

### ÉTAPE 2 : Obtenir l'URL d'Autorisation

#### Option A : Avec Postman/Thunder Client

```
Méthode : GET
URL : http://localhost:3001/google-calendar/auth-url
Headers : (aucun nécessaire)
```

#### Option B : Avec curl (dans le terminal)

```bash
curl http://localhost:3001/google-calendar/auth-url
```

#### Option C : Dans le navigateur

Ouvrez directement :
```
http://localhost:3001/google-calendar/auth-url
```

**Réponse attendue** :
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&response_type=code&client_id=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fgoogle-calendar%2Fcallback&prompt=consent"
}
```

---

### ÉTAPE 3 : Autoriser l'Application

1. **Copiez l'URL complète** de `authUrl`
2. **Collez dans votre navigateur** (Chrome, Firefox, Edge, etc.)
3. **Connectez-vous** avec votre compte Google
4. **Acceptez les permissions** :
   - ✅ Voir et modifier les événements de tous vos agendas
   - ✅ Consulter vos agendas

5. **Vous serez redirigé** vers :
```
http://localhost:3001/google-calendar/callback?code=4/0AanRRrt...
```

**Réponse affichée dans le navigateur** :
```json
{
  "success": true,
  "message": "Successfully connected to Google Calendar",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gK3..."
}
```

**⚠️ IMPORTANT** : Copiez et sauvegardez ces tokens ! Vous en aurez besoin pour les prochaines étapes.

---

### ÉTAPE 4 : Créer un Événement de Test

Maintenant, créons un événement dans Google Calendar.

#### 4.1 : Créer une entrée de calendrier dans MongoDB

**Option A : Via MongoDB Compass**

1. Ouvrez MongoDB Compass
2. Connectez-vous à : `mongodb+srv://rouahadjameur_db_user:u8kt1379YXWd4zCZ@spark.wwnh1wj.mongodb.net/ideaspark`
3. Allez dans la collection `calendarentries`
4. Cliquez sur "Insert Document"
5. Collez ce JSON :

```json
{
  "userId": "VOTRE_USER_ID",
  "planId": "test-plan-123",
  "contentBlockId": "test-content-456",
  "platform": "Instagram",
  "scheduledDate": "2024-02-01T00:00:00.000Z",
  "scheduledTime": "14:00",
  "status": "scheduled",
  "createdAt": "2024-01-28T10:00:00.000Z",
  "updatedAt": "2024-01-28T10:00:00.000Z"
}
```

6. Cliquez sur "Insert"
7. **Copiez l'_id généré** (ex: `65b6f8a9c1234567890abcde`)

**Option B : Via API (si vous avez un endpoint pour créer des entrées)**

```bash
POST http://localhost:3001/calendar-entries
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "planId": "test-plan-123",
  "contentBlockId": "test-content-456",
  "platform": "Instagram",
  "scheduledDate": "2024-02-01",
  "scheduledTime": "14:00"
}
```

---

#### 4.2 : Synchroniser avec Google Calendar

**Avec Postman/Thunder Client** :

```
Méthode : POST
URL : http://localhost:3001/google-calendar/sync-entry
Headers :
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN (si vous avez l'authentification)

Body (JSON) :
{
  "calendarEntryId": "65b6f8a9c1234567890abcde",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gK3..."
}
```

**Avec curl** :

```bash
curl -X POST http://localhost:3001/google-calendar/sync-entry \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEntryId": "65b6f8a9c1234567890abcde",
    "accessToken": "ya29.a0AfB_byD...",
    "refreshToken": "1//0gK3..."
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "eventId": "abc123xyz789",
  "eventLink": "https://calendar.google.com/calendar/event?eid=YWJjMTIzeHl6Nzg5..."
}
```

---

### ÉTAPE 5 : Vérifier sur Google Calendar Web

#### Option A : Via le lien direct

1. Copiez le `eventLink` de la réponse
2. Ouvrez-le dans votre navigateur
3. Vous verrez l'événement créé ! 🎉

#### Option B : Via Google Calendar

1. Ouvrez : https://calendar.google.com
2. Naviguez vers la date (1er février 2024 dans notre exemple)
3. Cherchez : **"📱 Publication Instagram"** à 14h00
4. Cliquez dessus pour voir les détails

**Ce que vous devriez voir** :
```
📱 Publication Instagram
📅 Vendredi 1 février 2024
⏰ 14:00 - 15:00
📝 Publication planifiée sur Instagram depuis IdeaSpark

Plan ID: test-plan-123
Content Block ID: test-content-456

🔔 Rappels :
  - Notification 30 minutes avant
  - Email 1 heure avant
```

---

### ÉTAPE 6 : Lire les Événements (Test de Lecture)

Maintenant, testons la lecture des événements.

**Avec Postman/Thunder Client** :

```
Méthode : GET
URL : http://localhost:3001/google-calendar/events
Headers :
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN

Body (JSON) :
{
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gK3...",
  "maxResults": 10
}
```

**Avec curl** :

```bash
curl -X GET http://localhost:3001/google-calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "accessToken": "ya29.a0AfB_byD...",
    "refreshToken": "1//0gK3...",
    "maxResults": 10
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "count": 5,
  "events": [
    {
      "id": "abc123xyz789",
      "summary": "📱 Publication Instagram",
      "description": "Publication planifiée sur Instagram depuis IdeaSpark\n\nPlan ID: test-plan-123\nContent Block ID: test-content-456",
      "start": "2024-02-01T14:00:00+01:00",
      "end": "2024-02-01T15:00:00+01:00",
      "htmlLink": "https://calendar.google.com/calendar/event?eid=...",
      "status": "confirmed",
      "created": "2024-01-28T10:30:00Z",
      "updated": "2024-01-28T10:30:00Z"
    }
  ]
}
```

---

## 🎯 Résumé des Tests

### ✅ Checklist Complète

- [ ] Backend démarré sur port 3001
- [ ] URL d'autorisation obtenue
- [ ] Autorisation Google réussie
- [ ] Tokens récupérés (accessToken + refreshToken)
- [ ] Entrée de calendrier créée dans MongoDB
- [ ] Événement synchronisé avec Google Calendar
- [ ] Événement visible sur https://calendar.google.com
- [ ] Lecture des événements fonctionnelle

---

## 🐛 Dépannage

### Erreur : "Cannot find module"
```bash
# Réinstaller les dépendances
npm install
```

### Erreur : "MongoDB connection failed"
```bash
# Vérifier la connexion MongoDB dans .env
MONGODB_URI=mongodb+srv://rouahadjameur_db_user:u8kt1379YXWd4zCZ@spark.wwnh1wj.mongodb.net/ideaspark
```

### Erreur : "Invalid credentials"
```bash
# Vérifier les credentials Google dans .env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### Erreur : "Calendar entry not found"
```bash
# Vérifier que l'ID de l'entrée existe dans MongoDB
# Utiliser MongoDB Compass pour vérifier
```

### Erreur : "Token expired"
```bash
# Réautoriser l'application (Étape 2-3)
# Obtenir de nouveaux tokens
```

---

## 📊 Exemple Complet avec Postman

### Collection Postman à Importer

```json
{
  "info": {
    "name": "Google Calendar IdeaSpark",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Get Auth URL",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/google-calendar/auth-url",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["google-calendar", "auth-url"]
        }
      }
    },
    {
      "name": "2. Sync Entry",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"calendarEntryId\": \"VOTRE_ENTRY_ID\",\n  \"accessToken\": \"VOTRE_ACCESS_TOKEN\",\n  \"refreshToken\": \"VOTRE_REFRESH_TOKEN\"\n}"
        },
        "url": {
          "raw": "http://localhost:3001/google-calendar/sync-entry",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["google-calendar", "sync-entry"]
        }
      }
    },
    {
      "name": "3. List Events",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"accessToken\": \"VOTRE_ACCESS_TOKEN\",\n  \"refreshToken\": \"VOTRE_REFRESH_TOKEN\",\n  \"maxResults\": 10\n}"
        },
        "url": {
          "raw": "http://localhost:3001/google-calendar/events",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["google-calendar", "events"]
        }
      }
    }
  ]
}
```

---

## 🎉 Résultat Final

Si tout fonctionne, vous devriez :

1. ✅ Voir l'événement sur https://calendar.google.com
2. ✅ Voir l'événement sur votre téléphone (Google Calendar app)
3. ✅ Pouvoir lire tous vos événements via l'API
4. ✅ Recevoir des notifications 30 min avant l'événement

---

## 🚀 Prochaines Étapes

Maintenant que le test fonctionne, vous pouvez :

1. **Intégrer dans votre frontend** (React/Flutter)
2. **Sauvegarder les tokens** dans la base de données
3. **Créer une interface** pour synchroniser les plans
4. **Ajouter la gestion** des erreurs et des refresh tokens

Consultez `FRONTEND_GOOGLE_CALENDAR_GUIDE.md` pour l'intégration frontend.

---

## 💡 Astuce

Pour tester rapidement sans créer d'entrée MongoDB, vous pouvez modifier temporairement le service pour créer un événement directement. Mais pour une vraie utilisation, suivez le processus complet ci-dessus.
