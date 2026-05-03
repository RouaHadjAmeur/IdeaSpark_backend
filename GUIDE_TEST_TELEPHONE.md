# 📱 Guide de Test - Nouveaux Modules IA

## 🎯 3 Modules à Tester

1. **Post Analyzer** - Score de performance
2. **Viral Hooks** - Générateur de hooks
3. **Optimal Timing** - Meilleurs moments pour poster

---

## ✅ Prérequis

### 1. Vérifier la connexion réseau

**Sur votre téléphone, ouvrez Chrome/Safari et allez sur:**
```
http://10.175.98.19:3000
```

✅ Vous devriez voir: **"Hello World!"**
❌ Si erreur: Téléphone et PC ne sont pas sur le même WiFi

### 2. Vérifier que le backend tourne

**Sur votre PC, dans le terminal, vous devriez voir:**
```
✅ Application is running on: http://localhost:3000
✅ Network access: http://0.0.0.0:3000
```

---

## 🧪 Test 1: Post Analyzer (Score de Performance)

### Avec Postman ou l'app

**Endpoint:**
```
POST http://10.175.98.19:3000/post-analyzer/score
```

**Headers:**
```
Authorization: Bearer VOTRE_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "caption": "Découvrez notre nouveau café artisanal ☕️ Torréfié avec amour chaque matin. Cliquez pour en savoir plus!",
  "hashtags": ["#cafe", "#coffee", "#artisanal", "#coffeelover"],
  "platform": "instagram"
}
```

**Réponse attendue:**
```json
{
  "overallScore": 87,
  "scores": {
    "caption": {
      "score": 95,
      "feedback": "Excellent hook et CTA clair"
    },
    "hashtags": {
      "score": 75,
      "feedback": "Ajoutez 2-3 hashtags de niche"
    },
    "timing": {
      "score": 85,
      "feedback": "Bonne heure"
    },
    "structure": {
      "score": 90,
      "feedback": "Bien organisé"
    }
  },
  "suggestions": [
    "Ajoutez des hashtags comme #specialtycoffee",
    "Augmentez le contraste de l'image",
    "Ajoutez plus d'emojis (☕️🔥)"
  ],
  "predictedEngagement": "high"
}
```

---

## 🧪 Test 2: Viral Hooks Generator

### Avec Postman ou l'app

**Endpoint:**
```
POST http://10.175.98.19:3000/viral-hooks/generate
```

**Headers:**
```
Authorization: Bearer VOTRE_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "topic": "café artisanal",
  "platform": "instagram",
  "tone": "fun",
  "count": 5
}
```

**Réponse attendue:**
```json
{
  "hooks": [
    "POV: Tu découvres que ton café du matin coûte moins cher que tu penses ☕️",
    "Personne ne parle de cette astuce café qui change tout 🤫",
    "3 secrets que les baristas ne veulent pas que tu saches 👀",
    "Stop! Tu fais cette erreur avec ton café chaque matin ❌",
    "Le café que tu bois n'est pas ce que tu crois... 😱"
  ]
}
```

**Variations à tester:**

**Ton professionnel:**
```json
{
  "topic": "marketing digital",
  "platform": "linkedin",
  "tone": "professional",
  "count": 3
}
```

**Ton inspirant:**
```json
{
  "topic": "entrepreneuriat",
  "platform": "instagram",
  "tone": "inspirational",
  "count": 5
}
```

---

## 🧪 Test 3: Optimal Timing Predictor

### Avec Postman ou l'app

**Endpoint:**
```
POST http://10.175.98.19:3000/optimal-timing/predict
```

**Headers:**
```
Authorization: Bearer VOTRE_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "platform": "instagram",
  "contentType": "post"
}
```

**Réponse attendue:**
```json
{
  "bestTimes": [
    {
      "day": "tuesday",
      "time": "18:00",
      "score": 95,
      "reason": "Pic d'activité après le travail",
      "expectedEngagement": "+45%"
    },
    {
      "day": "thursday",
      "time": "12:30",
      "score": 88,
      "reason": "Pause déjeuner, forte activité",
      "expectedEngagement": "+35%"
    },
    {
      "day": "wednesday",
      "time": "20:00",
      "score": 85,
      "reason": "Soirée, temps libre",
      "expectedEngagement": "+30%"
    }
  ],
  "worstTimes": [
    {
      "day": "sunday",
      "time": "03:00",
      "score": 15,
      "reason": "Audience inactive"
    },
    {
      "day": "monday",
      "time": "06:00",
      "score": 25,
      "reason": "Début de semaine, faible engagement"
    }
  ]
}
```

**Variations à tester:**

**TikTok Reel:**
```json
{
  "platform": "tiktok",
  "contentType": "reel"
}
```

**Facebook Post:**
```json
{
  "platform": "facebook",
  "contentType": "post"
}
```

---

## 📱 Test avec Postman Mobile

### Installation
1. Téléchargez **Postman** depuis Play Store/App Store
2. Ouvrez Postman sur votre téléphone

### Configuration

1. **Créer une nouvelle requête**
   - Cliquez sur "+"
   - Sélectionnez "POST"

2. **URL:**
   ```
   http://10.175.98.19:3000/post-analyzer/score
   ```

3. **Headers:**
   - Cliquez sur "Headers"
   - Ajoutez:
     - Key: `Authorization`, Value: `Bearer VOTRE_TOKEN`
     - Key: `Content-Type`, Value: `application/json`

4. **Body:**
   - Cliquez sur "Body"
   - Sélectionnez "raw" et "JSON"
   - Collez le JSON de test

5. **Send!**

---

## 🔑 Obtenir votre Token JWT

### Méthode 1: Depuis l'app Flutter

Si votre app stocke le token, vous pouvez le récupérer:
- Ouvrez les DevTools Flutter
- Cherchez dans SharedPreferences ou SecureStorage
- Copiez le token

### Méthode 2: Login via Postman

**Endpoint:**
```
POST http://10.175.98.19:3000/auth/login
```

**Body:**
```json
{
  "email": "votre_email@example.com",
  "password": "votre_mot_de_passe"
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "...",
    "name": "chayma"
  }
}
```

Copiez le `access_token` et utilisez-le dans vos tests!

---

## 🎨 Test Visuel dans l'App

Si vous avez intégré les modules dans votre app Flutter:

### 1. Test Post Analyzer

1. Créez un nouveau post
2. Remplissez le caption et les hashtags
3. Cliquez sur "Analyser"
4. Vous devriez voir:
   - Score global (0-100)
   - Scores détaillés (caption, hashtags, timing, structure)
   - Suggestions d'amélioration
   - Prédiction d'engagement

### 2. Test Viral Hooks

1. Créez un nouveau post
2. Cliquez sur "Générer des hooks"
3. Entrez le sujet (ex: "café")
4. Choisissez la plateforme et le ton
5. Vous devriez voir 5 hooks viraux
6. Sélectionnez-en un pour l'utiliser

### 3. Test Optimal Timing

1. Planifiez un post
2. Cliquez sur "Meilleurs moments"
3. Vous devriez voir:
   - 3 meilleurs moments (jour + heure + score)
   - Raison pour chaque moment
   - Engagement attendu
   - 2 pires moments à éviter

---

## ❌ Dépannage

### Erreur: "Connection timed out"

**Cause:** Téléphone et PC pas sur le même WiFi

**Solution:**
1. Vérifiez que les deux sont sur le même réseau
2. Testez `http://10.175.98.19:3000` dans le navigateur du téléphone
3. Si ça ne marche pas, vérifiez le firewall Windows

### Erreur: "Unauthorized" (401)

**Cause:** Token JWT manquant ou expiré

**Solution:**
1. Connectez-vous à nouveau pour obtenir un nouveau token
2. Vérifiez que le header `Authorization: Bearer TOKEN` est correct

### Erreur: "Cannot find module"

**Cause:** Backend pas démarré ou erreur de compilation

**Solution:**
1. Sur le PC, vérifiez que le backend tourne
2. Regardez les logs dans le terminal
3. Redémarrez avec `npm start` si nécessaire

### Réponse vide ou erreur 500

**Cause:** Gemini API non configuré (utilise le fallback)

**Solution:**
- C'est normal! Le fallback fonctionne
- Les réponses seront basiques mais fonctionnelles
- Pour de meilleures réponses, configurez `GEMINI_API_KEY` dans `.env`

---

## ✅ Checklist de Test

- [ ] Backend accessible depuis le navigateur du téléphone
- [ ] Token JWT obtenu
- [ ] Test Post Analyzer avec Postman
- [ ] Test Viral Hooks avec Postman
- [ ] Test Optimal Timing avec Postman
- [ ] Test Post Analyzer dans l'app (si intégré)
- [ ] Test Viral Hooks dans l'app (si intégré)
- [ ] Test Optimal Timing dans l'app (si intégré)

---

## 🎯 Résultats Attendus

### Post Analyzer
- ✅ Score entre 0-100
- ✅ 4 scores détaillés
- ✅ 3+ suggestions
- ✅ Prédiction d'engagement

### Viral Hooks
- ✅ 5 hooks générés
- ✅ Emojis inclus
- ✅ Patterns viraux (POV, 3 secrets, etc.)
- ✅ Adapté à la plateforme

### Optimal Timing
- ✅ 3 meilleurs moments
- ✅ Scores et raisons
- ✅ Engagement attendu
- ✅ 2 pires moments

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs du backend dans le terminal
2. Testez d'abord avec Postman avant l'app
3. Assurez-vous que le WiFi est le même
4. Vérifiez que le token JWT est valide

Bonne chance pour les tests! 🚀
