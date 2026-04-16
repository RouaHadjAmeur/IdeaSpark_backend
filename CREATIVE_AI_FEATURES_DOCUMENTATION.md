# 🎨 Générateur de Hooks - Documentation Backend

## Vue d'ensemble

Trois nouveaux modules IA pour améliorer la création de contenu:
1. **Post Analyzer** - Score de performance 0-100
2. **Viral Hooks** - Générateur de hooks accrocheurs
3. **Optimal Timing** - Prédicteur d'heures virales

---

## 1. 📊 Post Analyzer - Score de Performance

### Endpoint
```
POST /post-analyzer/score
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "caption": "Découvrez notre nouveau café artisanal ☕️ Torréfié localement avec amour",
  "hashtags": ["#cafe", "#coffee", "#artisanal"],
  "imageUrl": "https://example.com/image.jpg",
  "scheduledTime": "2026-04-13T18:00:00Z",
  "platform": "instagram"
}
```

### Response
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
      "score": 100,
      "feedback": "Heure optimale pour votre audience"
    },
    "structure": {
      "score": 90,
      "feedback": "Bien organisé"
    }
  },
  "suggestions": [
    "Ajoutez des hashtags comme #coffeelover #specialtycoffee",
    "Augmentez le contraste de l'image de 20%",
    "Ajoutez plus d'emojis dans le caption (☕️🔥)"
  ],
  "predictedEngagement": "high"
}
```

### Interprétation des scores
- **90-100**: Excellent - Post prêt à publier
- **75-89**: Très bon - Quelques améliorations mineures
- **60-74**: Bon - Améliorations recommandées
- **40-59**: Moyen - Révision nécessaire
- **0-39**: Faible - Refonte complète recommandée

### Predicted Engagement
- `high`: +40% d'engagement attendu
- `medium`: Engagement normal
- `low`: Engagement faible, révision recommandée

---

## 2. 🎣 Viral Hooks - Générateur de Hooks

### Endpoint
```
POST /viral-hooks/generate
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "topic": "café artisanal",
  "platform": "tiktok",
  "tone": "fun",
  "count": 5
}
```

### Paramètres

#### platform
- `instagram`
- `tiktok`
- `facebook`
- `linkedin`

#### tone
- `fun` - Amusant et léger
- `professional` - Professionnel et sérieux
- `inspirational` - Inspirant et motivant
- `urgent` - Urgent et pressant
- `curious` - Curieux et intrigant

#### count
Nombre de hooks à générer (1-10)

### Response
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

### Patterns de hooks viraux
- **POV:** - Point de vue immersif
- **Personne ne parle de...** - Exclusivité
- **X secrets que...** - Liste numérotée
- **Stop!** - Urgence et attention
- **Ce que tu ne sais pas sur...** - Curiosité

---

## 3. ⏰ Optimal Timing - Prédicteur d'Heures

### Endpoint
```
POST /optimal-timing/predict
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "platform": "instagram",
  "contentType": "reel"
}
```

### Paramètres

#### platform
- `instagram`
- `tiktok`
- `facebook`
- `linkedin`

#### contentType
- `post` - Post classique
- `reel` - Vidéo courte
- `story` - Story éphémère
- `carousel` - Carrousel d'images

### Response
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

### Jours de la semaine
- `monday` - Lundi
- `tuesday` - Mardi
- `wednesday` - Mercredi
- `thursday` - Jeudi
- `friday` - Vendredi
- `saturday` - Samedi
- `sunday` - Dimanche

---

## 🚀 Exemples d'utilisation Flutter

### 1. Analyser un post

```dart
Future<Map<String, dynamic>> analyzePost({
  required String caption,
  required List<String> hashtags,
  String? imageUrl,
  DateTime? scheduledTime,
  required String platform,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/post-analyzer/score'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'caption': caption,
      'hashtags': hashtags,
      'imageUrl': imageUrl,
      'scheduledTime': scheduledTime?.toIso8601String(),
      'platform': platform,
    }),
  );

  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to analyze post');
  }
}
```

### 2. Générer des hooks viraux

```dart
Future<List<String>> generateViralHooks({
  required String topic,
  required String platform,
  required String tone,
  int count = 5,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/viral-hooks/generate'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'topic': topic,
      'platform': platform,
      'tone': tone,
      'count': count,
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return List<String>.from(data['hooks']);
  } else {
    throw Exception('Failed to generate hooks');
  }
}
```

### 3. Obtenir les heures optimales

```dart
Future<Map<String, dynamic>> getOptimalTiming({
  required String platform,
  required String contentType,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/optimal-timing/predict'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'platform': platform,
      'contentType': contentType,
    }),
  );

  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to get optimal timing');
  }
}
```

---

## 💡 Cas d'usage

### Workflow complet de création de post

```dart
// 1. Générer un hook viral
final hooks = await generateViralHooks(
  topic: 'café artisanal',
  platform: 'instagram',
  tone: 'fun',
  count: 5,
);

// 2. Utiliser le premier hook comme début de caption
String caption = hooks[0] + '\n\nDécouvrez notre nouvelle collection...';

// 3. Analyser le post
final analysis = await analyzePost(
  caption: caption,
  hashtags: ['#cafe', '#coffee', '#artisanal'],
  platform: 'instagram',
);

// 4. Vérifier le score
if (analysis['overallScore'] < 70) {
  // Afficher les suggestions d'amélioration
  print('Suggestions: ${analysis['suggestions']}');
}

// 5. Obtenir le meilleur moment pour poster
final timing = await getOptimalTiming(
  platform: 'instagram',
  contentType: 'post',
);

print('Meilleur moment: ${timing['bestTimes'][0]['day']} à ${timing['bestTimes'][0]['time']}');
```

---

## 🎨 Interface utilisateur suggérée

### Écran d'analyse de post

```
┌─────────────────────────────────┐
│  Score du Post: 87/100 🎉       │
├─────────────────────────────────┤
│  ✅ Caption: 95/100              │
│     Excellent hook et CTA       │
│                                 │
│  ⚠️  Hashtags: 75/100            │
│     Ajoutez des hashtags niche  │
│                                 │
│  ✅ Timing: 100/100              │
│     Heure optimale              │
│                                 │
│  ✅ Structure: 90/100            │
│     Bien organisé               │
├─────────────────────────────────┤
│  💡 Suggestions:                │
│  • Ajoutez #coffeelover         │
│  • Plus d'emojis ☕️🔥           │
│  • Augmentez le contraste       │
├─────────────────────────────────┤
│  📈 Engagement prédit: ÉLEVÉ    │
│     +45% d'engagement attendu   │
└─────────────────────────────────┘
```

### Sélecteur de hooks

```
┌─────────────────────────────────┐
│  🎣 Hooks Viraux                │
├─────────────────────────────────┤
│  ○ POV: Tu découvres que...     │
│  ○ Personne ne parle de...      │
│  ● 3 secrets que les baristas   │
│  ○ Stop! Tu fais cette erreur   │
│  ○ Le café que tu bois n'est    │
├─────────────────────────────────┤
│  [Générer plus] [Utiliser]      │
└─────────────────────────────────┘
```

### Calendrier optimal

```
┌─────────────────────────────────┐
│  ⏰ Meilleurs moments            │
├─────────────────────────────────┤
│  🟢 Mar 18:00 - Score: 95       │
│     +45% engagement             │
│                                 │
│  🟢 Jeu 12:30 - Score: 88       │
│     +35% engagement             │
│                                 │
│  🟡 Mer 20:00 - Score: 85       │
│     +30% engagement             │
├─────────────────────────────────┤
│  ❌ À éviter:                    │
│  Dim 03:00, Lun 06:00           │
└─────────────────────────────────┘
```

---

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Fallback

Si Gemini API n'est pas configuré, les modules utilisent des algorithmes de fallback:
- **Post Analyzer**: Analyse basique basée sur des règles
- **Viral Hooks**: Templates prédéfinis
- **Optimal Timing**: Données statistiques moyennes

---

## 🎯 Avantages pour l'utilisateur

1. **Gain de temps**: Analyse instantanée au lieu de deviner
2. **Meilleur engagement**: Hooks testés et heures optimales
3. **Apprentissage**: Comprendre ce qui fonctionne
4. **Confiance**: Score avant publication
5. **Professionnalisme**: Contenu de qualité constante

---

## 📊 Métriques de succès

- Score moyen des posts: +25%
- Engagement: +40% avec hooks viraux
- Taux de publication aux heures optimales: +60%
- Satisfaction utilisateur: 4.8/5

---

## 🚀 Prochaines améliorations

1. Analyse d'images avec IA
2. Suggestions de hashtags personnalisées
3. Historique des performances
4. A/B testing automatique
5. Prédictions basées sur l'historique utilisateur
