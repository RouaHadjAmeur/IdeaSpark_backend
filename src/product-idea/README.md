# 💡 Product Idea Generator API

API IA pour transformer un besoin en idée de produit vendable avec analyse de marché complète.

## 🎯 Fonctionnalités

### Génération d'Idée de Produit
Transforme un pain point en produit viable avec:
- ✅ Pain point clairement identifié
- ✅ Features listées et priorisées (Essentielle, Importante, Bonus)
- ✅ Prix suggéré cohérent avec le budget
- ✅ Score de potentiel marché (0-100)
- ✅ Analyse de concurrence détaillée
- ✅ Proposition de valeur unique (UVP)
- ✅ Prochaines étapes recommandées

### Gestion des Idées
- Sauvegarde dans l'historique utilisateur
- Système de favoris
- Historique complet des générations

## 📡 Endpoints

### 1. Générer une Idée de Produit
```http
POST /product-ideas/generate
Content-Type: application/json

{
  "painPoint": "Je perds toujours mes clés de voiture",
  "targetAudience": "Professionnels urbains, 25-45 ans",
  "maxBudget": 50,
  "category": "Technologie"
}
```

**Réponse:**
```json
{
  "productIdea": {
    "productName": "KeyTracker Pro",
    "shortDescription": "Traceur Bluetooth ultra-compact pour ne plus jamais perdre vos clés",
    "detailedDescription": "KeyTracker Pro est un dispositif de localisation...",
    "painPoint": "Perte fréquente de clés causant stress et retards",
    "solution": "Traceur Bluetooth avec application mobile...",
    "features": [
      {
        "name": "Localisation Bluetooth",
        "description": "Portée de 50m en intérieur",
        "priority": "Essentielle"
      },
      {
        "name": "Sonnerie forte",
        "description": "90dB pour retrouver facilement",
        "priority": "Essentielle"
      },
      {
        "name": "Batterie longue durée",
        "description": "12 mois d'autonomie",
        "priority": "Importante"
      }
    ],
    "marketAnalysis": {
      "marketScore": 82,
      "marketSize": "2.5 milliards € en Europe",
      "competitionLevel": "Élevé",
      "marketTrend": "Croissance",
      "competitors": ["Tile", "AirTag", "Samsung SmartTag"]
    },
    "pricing": {
      "minPrice": 15,
      "optimalPrice": 29,
      "maxPrice": 45,
      "priceJustification": "Prix compétitif face aux leaders..."
    },
    "targetAudience": "Professionnels urbains actifs, 25-55 ans",
    "uniqueValueProposition": "Le seul traceur avec batterie remplaçable et design ultra-compact",
    "nextSteps": [
      "Créer un prototype fonctionnel",
      "Tester auprès de 50 utilisateurs cibles",
      "Développer l'application mobile iOS/Android",
      "Lancer une campagne Kickstarter"
    ]
  },
  "generatedAt": "2026-02-19T20:00:00.000Z"
}
```

### 2. Sauvegarder une Idée
```http
POST /product-ideas/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "productName": "KeyTracker Pro",
  "shortDescription": "...",
  ...
}
```

### 3. Récupérer l'Historique
```http
GET /product-ideas/history
Authorization: Bearer {token}
```

### 4. Récupérer les Favoris
```http
GET /product-ideas/favorites
Authorization: Bearer {token}
```

### 5. Basculer le Statut Favori
```http
POST /product-ideas/toggle-favorite/{id}
Authorization: Bearer {token}
```

### 6. Supprimer une Idée
```http
DELETE /product-ideas/{id}
Authorization: Bearer {token}
```

## 🔑 Configuration

### Variables d'Environnement
```env
GEMINI_API_KEY=votre-clé-gemini
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Obtenir une Clé API Gemini
1. Visitez: https://makersuite.google.com/app/apikey
2. Créez une nouvelle clé API
3. Ajoutez-la dans votre fichier `.env`

## 💡 Exemples d'Utilisation

### Exemple 1: Produit Tech
```json
{
  "painPoint": "Mon téléphone se décharge trop vite en déplacement",
  "targetAudience": "Voyageurs fréquents",
  "maxBudget": 80,
  "category": "Technologie"
}
```

### Exemple 2: Service
```json
{
  "painPoint": "Difficile de trouver un plombier fiable rapidement",
  "targetAudience": "Propriétaires de maison",
  "category": "Service"
}
```

### Exemple 3: Accessoire
```json
{
  "painPoint": "Mes écouteurs s'emmêlent toujours dans mon sac",
  "maxBudget": 25,
  "category": "Accessoire"
}
```

## 📊 Analyse de Marché

L'API fournit une analyse complète incluant:

### Score de Potentiel Marché (0-100)
- **0-30**: Marché de niche ou très risqué
- **31-60**: Potentiel moyen, nécessite validation
- **61-80**: Bon potentiel, marché viable
- **81-100**: Excellent potentiel, forte demande

### Niveau de Concurrence
- **Faible**: Marché émergent, peu de concurrents
- **Moyen**: Concurrence modérée, place disponible
- **Élevé**: Marché saturé, différenciation nécessaire

### Tendance du Marché
- **Croissance**: Marché en expansion
- **Stable**: Marché mature et stable
- **Déclin**: Marché en décroissance

## 🎯 Priorisation des Features

### Essentielle
Fonctionnalités indispensables pour le MVP (Minimum Viable Product)

### Importante
Fonctionnalités qui améliorent significativement le produit

### Bonus
Fonctionnalités "nice-to-have" pour versions futures

## 🚀 Intégration

### Avec Swagger UI
1. Démarrez le serveur: `npm run start:dev`
2. Ouvrez: http://localhost:3000/api
3. Trouvez la section "Product Ideas"
4. Testez l'endpoint `/product-ideas/generate`

### Avec cURL
```bash
curl -X POST http://localhost:3000/product-ideas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "painPoint": "Je perds toujours mes clés",
    "maxBudget": 50
  }'
```

### Avec JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3000/product-ideas/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    painPoint: 'Je perds toujours mes clés',
    targetAudience: 'Professionnels urbains',
    maxBudget: 50,
  }),
});

const data = await response.json();
console.log(data.productIdea);
```

## ⚠️ Limites et Considérations

### Rate Limiting
- Gemini API gratuit: 15 requêtes/minute
- En cas de dépassement, attendez quelques secondes

### Qualité des Résultats
- Plus le pain point est précis, meilleure est l'analyse
- Spécifier le public cible améliore la pertinence
- Le budget influence la stratégie de prix

### Validation Requise
- Les analyses sont générées par IA et doivent être validées
- Effectuez votre propre étude de marché
- Testez le concept auprès de vrais utilisateurs

## 📝 Notes Techniques

### Modèle IA Utilisé
- **Gemini 2.0 Flash Exp**: Modèle rapide et performant
- **Temperature**: 0.85 (équilibre créativité/cohérence)
- **Max Tokens**: 8000 (réponses détaillées)

### Format de Réponse
- JSON structuré pour faciliter l'intégration
- Validation automatique des champs requis
- Gestion d'erreurs complète

## 🎓 Cas d'Usage

1. **Entrepreneurs**: Valider rapidement une idée de startup
2. **Product Managers**: Explorer de nouvelles opportunités
3. **Designers**: Comprendre les besoins utilisateurs
4. **Marketeurs**: Analyser le potentiel d'un marché
5. **Étudiants**: Apprendre l'analyse produit

## 🔄 Workflow Recommandé

1. **Identifier** un pain point réel
2. **Générer** une idée de produit via l'API
3. **Analyser** le score de marché et la concurrence
4. **Valider** auprès d'utilisateurs potentiels
5. **Itérer** en ajustant les features
6. **Prototyper** le MVP
7. **Lancer** et mesurer

## 📞 Support

Pour toute question ou problème:
- Consultez la documentation Swagger
- Vérifiez les logs du serveur
- Assurez-vous que la clé API Gemini est valide
