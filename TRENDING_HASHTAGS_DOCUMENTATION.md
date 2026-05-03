# 🔥 Documentation - Hashtags Tendances

## 🎯 Vue d'ensemble

Le module **Trending Hashtags** améliore le générateur de captions en ajoutant des hashtags pertinents et tendances basés sur :
- ✅ La catégorie du post (cosmétiques, sports, mode, etc.)
- ✅ La plateforme (Instagram, TikTok, Facebook)
- ✅ Le nom de la marque
- ✅ Le titre du post

---

## 📡 Endpoints disponibles

### 1. Récupérer les hashtags tendances

**Endpoint** : `GET /trending-hashtags`

**Query Parameters** :
- `category` (required) : Catégorie du post
- `platform` (optional, default: `instagram`) : Plateforme cible
- `country` (optional, default: `FR`) : Pays cible

**Exemple** :
```http
GET /trending-hashtags?category=cosmetics&platform=instagram&country=FR
Authorization: Bearer YOUR_JWT_TOKEN
```

**Réponse** (200 OK) :
```json
[
  {
    "name": "#makeup",
    "category": "cosmetics",
    "platform": "instagram",
    "trend": "stable"
  },
  {
    "name": "#beauty",
    "category": "cosmetics",
    "platform": "instagram",
    "trend": "stable"
  },
  {
    "name": "#skincare",
    "category": "cosmetics",
    "platform": "instagram",
    "trend": "stable"
  }
]
```

---

### 2. Générer des hashtags pour un post spécifique

**Endpoint** : `GET /trending-hashtags/generate`

**Query Parameters** :
- `brandName` (required) : Nom de la marque
- `postTitle` (required) : Titre du post
- `category` (required) : Catégorie du post
- `platform` (optional, default: `instagram`) : Plateforme cible

**Exemple** :
```http
GET /trending-hashtags/generate?brandName=lela&postTitle=The%20Art%20of%20Natural%20Beauty&category=cosmetics&platform=instagram
Authorization: Bearer YOUR_JWT_TOKEN
```

**Réponse** (200 OK) :
```json
{
  "hashtags": [
    "#makeup",
    "#beauty",
    "#skincare",
    "#cosmetics",
    "#makeuptutorial",
    "#beautytips",
    "#glowup",
    "#selfcare",
    "#beautyblogger",
    "#makeuplover",
    "#lela",
    "#natural",
    "#beauty"
  ]
}
```

---

## 🎨 Catégories disponibles

| Catégorie | Hashtags inclus |
|-----------|----------------|
| `cosmetics` | #makeup, #beauty, #skincare, #cosmetics, #makeuptutorial, #beautytips, #glowup, #selfcare, #beautyblogger, #makeuplover, #skincareroutine, #beautycommunity, #makeupoftheday, #beautyaddict, #makeupjunkie, #beautyproducts, #makeupartist, #beautycare |
| `beauty` | #beauty, #spa, #wellness, #massage, #salon, #beautysalon, #skincare, #facial, #beautytherapy, #relaxation, #selfcare, #beautytreatment, #glowingskin, #beautyroutine |
| `sports` | #fitness, #workout, #gym, #training, #fitnessmotivation, #sport, #athlete, #exercise, #fitfam, #gymlife, #fitnessjourney, #workoutmotivation, #fitnessgirl, #sportlife, #running, #cardio, #strength, #healthylifestyle |
| `fashion` | #fashion, #style, #ootd, #fashionblogger, #fashionista, #outfitoftheday, #fashionstyle, #instafashion, #streetstyle, #fashionable, #fashionweek, #styleinspo, #fashionlover, #trendy, #fashionaddict, #stylish, #fashiongram |
| `food` | #food, #foodie, #foodporn, #instafood, #foodblogger, #yummy, #delicious, #foodphotography, #foodstagram, #foodlover, #cooking, #recipe, #homemade, #tasty, #foodgasm, #foodheaven, #foodoftheday, #foodlove |
| `technology` | #tech, #technology, #innovation, #gadgets, #techie, #smartphone, #coding, #programming, #developer, #ai, #machinelearning, #startup, #digital, #future, #software, #techtrends, #innovation, #techworld |
| `lifestyle` | #lifestyle, #life, #instagood, #photooftheday, #love, #happy, #motivation, #inspiration, #goals, #success, #positivevibes, #mindset, #wellness, #selfimprovement, #dailylife, #lifestyleblogger, #goodvibes, #blessed |

---

## 🔄 Intégration avec le générateur de captions

Le module est **automatiquement intégré** dans le générateur de captions existant :

### Avant (sans hashtags tendances)
```json
{
  "short": "✨ The Art of Natural Beauty — lela",
  "medium": "Découvrez The Art of Natural Beauty par lela...",
  "long": "The Art of Natural Beauty 🚀\n\nChez lela...",
  "hashtags": ["#lela", "#instagram", "#marketing", "#ideaspark"],
  "emojis": ["✨", "🚀", "💡", "🎯", "💪"],
  "cta": "❤️ Partagez si vous aimez !"
}
```

### Après (avec hashtags tendances)
```json
{
  "short": "✨ The Art of Natural Beauty — lela",
  "medium": "Découvrez The Art of Natural Beauty par lela...",
  "long": "The Art of Natural Beauty 🚀\n\nChez lela...",
  "hashtags": [
    "#makeup", "#beauty", "#skincare", "#cosmetics", "#makeuptutorial",
    "#beautytips", "#glowup", "#selfcare", "#beautyblogger", "#makeuplover",
    "#lela", "#natural", "#beauty"
  ],
  "emojis": ["✨", "🚀", "💡", "🎯", "💪"],
  "cta": "❤️ Partagez si vous aimez !"
}
```

---

## 🧠 Logique de détection de catégorie

Le service détecte automatiquement la catégorie basée sur le nom de la marque et le titre du post :

```typescript
const categoryKeywords: Record<string, string[]> = {
  cosmetics: ['makeup', 'cosmetic', 'beauty', 'skincare', 'lipstick', 'foundation', 'mascara', 'lela'],
  sports: ['sport', 'fitness', 'gym', 'workout', 'training', 'athlete', 'nike', 'adidas', 'running'],
  fashion: ['fashion', 'style', 'clothing', 'apparel', 'outfit', 'zara', 'h&m', 'dress'],
  food: ['food', 'restaurant', 'cuisine', 'meal', 'recipe', 'cooking', 'mcdonald', 'burger'],
  technology: ['tech', 'software', 'app', 'digital', 'innovation', 'apple', 'samsung', 'google'],
  lifestyle: ['lifestyle', 'life', 'home', 'living', 'wellness', 'mindset'],
};
```

**Exemples** :
- `lela` → `cosmetics`
- `Nike` → `sports`
- `Zara` → `fashion`
- `McDonald's` → `food`
- `Apple` → `technology`

---

## 💾 Cache

Le service utilise un cache en mémoire pour éviter de régénérer les hashtags à chaque requête :

- **Durée du cache** : 24 heures
- **Clé de cache** : `${category}_${platform}_${country}`
- **Exemple** : `cosmetics_instagram_FR`

**Avantages** :
- ✅ Performance optimale
- ✅ Réduction de la charge serveur
- ✅ Réponses instantanées

---

## 🧪 Tests avec curl

### Test 1 : Récupérer les hashtags tendances

```bash
curl -X GET "http://192.168.1.24:3000/trending-hashtags?category=cosmetics&platform=instagram&country=FR" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Résultat attendu** : Liste de 18 hashtags pour la catégorie cosmetics

---

### Test 2 : Générer des hashtags pour un post

```bash
curl -X GET "http://192.168.1.24:3000/trending-hashtags/generate?brandName=lela&postTitle=The%20Art%20of%20Natural%20Beauty&category=cosmetics&platform=instagram" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Résultat attendu** : 13 hashtags (10 de la catégorie + 1 marque + 2 du titre)

---

### Test 3 : Générer une caption avec hashtags tendances

```bash
curl -X POST "http://192.168.1.24:3000/caption-generator/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postTitle": "The Art of Natural Beauty",
    "platform": "instagram",
    "format": "post",
    "pillar": "educational",
    "ctaType": "soft",
    "language": "fr",
    "brandName": "lela"
  }'
```

**Résultat attendu** : Caption avec hashtags tendances automatiquement intégrés

---

## 📊 Logs à surveiller

### Logs backend (NestJS)

```bash
# Génération de hashtags
[TrendingHashtags] Fetching fresh data: cosmetics_instagram_FR
[TrendingHashtags] Generating hashtags for: lela - The Art of Natural Beauty
[TrendingHashtags] Generated 13 hashtags

# Cache hit
[TrendingHashtags] Cache hit: cosmetics_instagram_FR

# Intégration avec caption generator
[CaptionGeneratorService] Generating caption for: lela - The Art of Natural Beauty
[TrendingHashtags] Generating hashtags for: lela - The Art of Natural Beauty
[TrendingHashtags] Generated 13 hashtags
```

---

## ⚙️ Configuration

### Variables d'environnement

Aucune variable d'environnement supplémentaire nécessaire ! Le module utilise les hashtags statiques.

### Modules NestJS

```typescript
// app.module.ts
@Module({
  imports: [
    // ...
    TrendingHashtagsModule,
    CaptionGeneratorModule,
  ],
})
export class AppModule {}
```

---

## 🚀 Prochaines étapes (optionnel)

### Phase 2 : Scraping TikTok Creative Center

Pour obtenir des hashtags en temps réel depuis TikTok :

1. Implémenter le scraping de https://ads.tiktok.com/business/creativecenter/
2. Parser les données HTML
3. Mettre à jour le cache toutes les 24h

**Avantages** :
- ✅ Hashtags en temps réel
- ✅ Tendances montantes/descendantes
- ✅ Nombre de vues par hashtag

**Inconvénients** :
- ❌ Peut être bloqué par TikTok
- ❌ Instable (changements de structure HTML)

---

### Phase 3 : Redis pour cache distribué

Pour un cache partagé entre plusieurs instances du backend :

```bash
npm install @nestjs/cache-manager cache-manager-redis-store redis
```

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 86400, // 24 heures
    }),
    // ...
  ],
})
export class AppModule {}
```

---

## ✅ Checklist d'implémentation

### Backend
- [x] Module `TrendingHashtagsModule` créé
- [x] Service `TrendingHashtagsService` créé
- [x] Controller `TrendingHashtagsController` créé
- [x] Hashtags statiques par catégorie ajoutés
- [x] Cache en mémoire implémenté (24h)
- [x] Intégration avec `CaptionGeneratorService`
- [x] Détection automatique de catégorie
- [x] Module enregistré dans `AppModule`
- [x] Compilation réussie

### Tests
- [ ] Tester `GET /trending-hashtags` avec Postman
- [ ] Tester `GET /trending-hashtags/generate` avec Postman
- [ ] Tester `POST /caption-generator/generate` et vérifier les hashtags
- [ ] Vérifier les logs backend
- [ ] Tester le cache (2ème requête doit être instantanée)

### Frontend (à implémenter)
- [ ] Créer le service `TrendingHashtagsService` Flutter
- [ ] Ajouter le bouton "Hashtags Tendances" dans le générateur de captions
- [ ] Afficher les hashtags avec indicateur de tendance
- [ ] Ajouter le bouton "Copier tous les hashtags"
- [ ] Tester sur téléphone physique

---

## 💡 Avantages

✅ Captions plus pertinents et actuels
✅ Meilleure visibilité sur les réseaux sociaux
✅ Hashtags adaptés à chaque plateforme
✅ Gain de temps pour l'utilisateur
✅ 100% GRATUIT (avec hashtags statiques)
✅ Cache pour performance optimale
✅ Détection automatique de catégorie
✅ Intégration transparente avec le générateur de captions existant

---

## 🎉 Résultat final

Avec cette fonctionnalité, chaque caption générée inclut automatiquement :
- ✅ 10 hashtags pertinents pour la catégorie
- ✅ 1 hashtag de la marque (#lela, #nike, etc.)
- ✅ 2 hashtags basés sur le titre du post
- ✅ Total : ~13 hashtags optimisés pour la visibilité

**Exemple pour Lela (cosmétiques)** :
```
#makeup #beauty #skincare #cosmetics #makeuptutorial #beautytips #glowup #selfcare #beautyblogger #makeuplover #lela #natural #beauty
```

**Prêt pour la démo !** 🚀
