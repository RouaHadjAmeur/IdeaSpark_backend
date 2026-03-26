# 📱 Test : Vérifier les Événements sur Téléphone

## 🎯 Objectif
Vérifier que les événements créés depuis IdeaSpark apparaissent bien sur votre téléphone.

---

## ✅ Prérequis

1. **Application Google Calendar installée** sur votre téléphone
2. **Connecté au même compte Google** que celui utilisé pour l'autorisation
3. **Connexion internet active**
4. **Backend IdeaSpark démarré** (`npm start`)

---

## 🧪 Test Étape par Étape

### Étape 1 : Autoriser l'Application (si pas déjà fait)

```bash
# 1. Obtenir l'URL d'autorisation
GET http://localhost:3001/google-calendar/auth-url

# Réponse :
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}

# 2. Ouvrir l'URL dans votre navigateur
# 3. Se connecter avec votre compte Google
# 4. Accepter les permissions
# 5. Récupérer les tokens
```

**⚠️ IMPORTANT** : Utilisez le **même compte Google** que celui de votre téléphone !

---

### Étape 2 : Créer un Événement de Test

#### Option A : Créer un événement simple (recommandé pour test)

```bash
POST http://localhost:3001/google-calendar/sync-entry
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "calendarEntryId": "VOTRE_CALENDAR_ENTRY_ID",
  "accessToken": "ya29.a0AfB_...",
  "refreshToken": "1//0g..."
}
```

#### Option B : Créer un événement de test manuel

Si vous n'avez pas de `calendarEntryId`, vous devez d'abord créer une entrée dans votre base de données MongoDB.

**Vérifiez vos entrées existantes** :
```javascript
// Dans MongoDB Compass ou via API
db.calendarentries.find({ userId: "VOTRE_USER_ID" })
```

---

### Étape 3 : Vérifier sur Votre Téléphone

#### 📱 Sur Android
1. Ouvrez l'application **Google Calendar**
2. Naviguez vers la date de l'événement
3. Cherchez : **"📱 Publication [Platform]"**
4. Tapez sur l'événement pour voir les détails

#### 📱 Sur iPhone
1. Ouvrez l'application **Google Calendar** (pas Apple Calendar)
2. Naviguez vers la date de l'événement
3. Cherchez : **"📱 Publication [Platform]"**
4. Tapez sur l'événement pour voir les détails

---

## 🔍 Que Vérifier

### ✅ Checklist de Vérification

- [ ] L'événement apparaît à la bonne date
- [ ] L'événement apparaît à la bonne heure
- [ ] Le titre contient "📱 Publication [Platform]"
- [ ] La description mentionne "IdeaSpark"
- [ ] La durée est de 1 heure
- [ ] Les rappels sont configurés (30 min + 1h)
- [ ] La couleur est bleue

---

## 🐛 Problèmes Courants

### ❌ L'événement n'apparaît pas

**Causes possibles** :

1. **Compte Google différent**
   - Solution : Vérifiez que vous êtes connecté au même compte Google

2. **Synchronisation désactivée**
   - Solution : Paramètres → Comptes → Google → Activer la synchronisation du calendrier

3. **Calendrier masqué**
   - Solution : Dans Google Calendar, vérifiez que le calendrier principal est visible

4. **Délai de synchronisation**
   - Solution : Attendez 1-2 minutes et rafraîchissez (tirez vers le bas)

5. **Connexion internet**
   - Solution : Vérifiez votre connexion WiFi/4G

---

## 🔄 Forcer la Synchronisation

### Sur Android
```
1. Ouvrez Paramètres
2. Comptes → Google
3. Sélectionnez votre compte
4. Tapez sur "Synchroniser maintenant"
```

### Sur iPhone
```
1. Ouvrez l'application Google Calendar
2. Tirez vers le bas pour rafraîchir
3. Ou fermez et rouvrez l'application
```

---

## 🎯 Test de Synchronisation Bidirectionnelle

### Test 1 : IdeaSpark → Téléphone ✅
```
Créer événement via API → Vérifier sur téléphone
```

### Test 2 : Téléphone → IdeaSpark ✅
```
Lire événements via API → Afficher dans IdeaSpark
```

**Exemple de lecture** :
```bash
GET http://localhost:3001/google-calendar/events
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0g...",
  "maxResults": 10
}
```

**Réponse** : Vous verrez TOUS les événements de votre Google Calendar, y compris ceux créés manuellement sur votre téléphone !

---

## 📊 Résultat Attendu

### ✅ Succès
```
✓ Événement créé via API
✓ Visible sur téléphone en 1-5 secondes
✓ Tous les détails corrects
✓ Rappels fonctionnels
✓ Synchronisation bidirectionnelle OK
```

### ❌ Échec
```
✗ Événement non visible après 2 minutes
→ Vérifier le compte Google
→ Vérifier la synchronisation
→ Vérifier les logs du backend
```

---

## 🚀 Commandes de Débogage

### Vérifier les logs du backend
```bash
# Dans le terminal où tourne npm start
# Cherchez les messages d'erreur après la création d'événement
```

### Vérifier la réponse de l'API
```json
// Réponse attendue après sync-entry
{
  "success": true,
  "eventId": "abc123xyz",
  "eventLink": "https://calendar.google.com/calendar/event?eid=..."
}
```

### Ouvrir le lien direct
```
Copiez le "eventLink" de la réponse
Ouvrez-le dans votre navigateur
Vous devriez voir l'événement dans Google Calendar web
```

---

## 💡 Astuce Pro

Pour tester rapidement, créez un événement **dans 5 minutes** :

1. Créez l'événement via l'API
2. Attendez 5 minutes
3. Vous recevrez une notification sur votre téléphone ! 🔔

Cela confirme que :
- ✅ L'événement est bien synchronisé
- ✅ Les rappels fonctionnent
- ✅ Les notifications sont actives

---

## 📞 Support

Si l'événement n'apparaît toujours pas après avoir vérifié tous les points :

1. Vérifiez les logs du backend
2. Testez avec l'URL web : `https://calendar.google.com`
3. Vérifiez que l'API Google Calendar est bien activée dans Google Cloud Console
4. Vérifiez que les credentials sont corrects dans `.env`

---

## ✅ Conclusion

**OUI, les événements apparaissent sur votre téléphone !**

La synchronisation est automatique et instantanée grâce à l'infrastructure cloud de Google Calendar.

**Prochaine étape** : Testez maintenant en créant un événement ! 🚀
