# Module AI - Génération de Slogans

Ce module fournit des fonctionnalités d'intelligence artificielle pour générer des slogans créatifs et mémorables pour les marques.

## 🎯 Fonctionnalités

### Génération de Slogans
- **Minimum 10 slogans** générés par requête
- **Explication détaillée** pour chaque slogan
- **Score de mémorabilité** (0-100) visible pour chaque slogan
- **Catégorisation** des slogans (Innovation, Émotion, Bénéfice, etc.)
- **Support multilingue** (français, anglais, espagnol, etc.)

## 🔐 Authentification

Toutes les routes AI nécessitent une authentification JWT. L'utilisateur doit être connecté pour utiliser ces fonctionnalités.

## 📡 Endpoints

### POST /ai/slogans/generate

Génère des slogans pour une marque.

**Headers requis:**
```
Authorization: Bearer <jwt_token>
```

**Body (JSON):**
```json
{
  "brandName": "EcoTech Solutions",
  "description": "Solutions technologiques écologiques pour entreprises",
  "industry": "Technologie verte",
  "targetAudience": "Entreprises soucieuses de l'environnement",
  "language": "fr"
}
```

**Paramètres:**
- `brandName` (requis) : Nom de la marque (2-100 caractères)
- `description` (optionnel) : Description du produit/service (max 500 caractères)
- `industry` (optionnel) : Secteur d'activité (max 100 caractères)
- `targetAudience` (optionnel) : Public cible (max 200 caractères)
- `language` (optionnel) : Code langue (fr, en, es, de, it, pt) - défaut: fr

**Réponse (200 OK):**
```json
{
  "slogans": [
    {
      "slogan": "L'innovation verte au service de votre entreprise",
      "explanation": "Ce slogan met en avant l'aspect innovant et écologique de la marque tout en soulignant son orientation B2B. Il positionne la marque comme un partenaire de confiance pour les entreprises.",
      "memorabilityScore": 85,
      "category": "Innovation"
    },
    {
      "slogan": "Votre avenir durable commence ici",
      "explanation": "Un slogan aspirationnel qui crée un sentiment d'urgence et d'opportunité. Il suggère que choisir EcoTech est le premier pas vers un futur meilleur.",
      "memorabilityScore": 78,
      "category": "Aspiration"
    }
    // ... 8 autres slogans
  ],
  "brandName": "EcoTech Solutions",
  "language": "fr",
  "generatedAt": "2026-02-09T20:15:00.000Z"
}
```

## 🔧 Configuration

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

### Obtenir une clé API OpenAI

1. Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Allez dans [API Keys](https://platform.openai.com/api-keys)
3. Créez une nouvelle clé API
4. Copiez la clé dans votre fichier `.env`

### Modèles recommandés

- `gpt-4o-mini` : Rapide et économique (recommandé)
- `gpt-4o` : Plus créatif mais plus coûteux
- `gpt-3.5-turbo` : Alternative économique

## 💡 Exemples d'utilisation

### Exemple 1 : Marque tech minimaliste
```bash
curl -X POST http://localhost:3001/ai/slogans/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "TechFlow",
    "description": "Productivity software for remote teams",
    "language": "en"
  }'
```

### Exemple 2 : Marque food & beverage
```bash
curl -X POST http://localhost:3001/ai/slogans/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "FreshBite",
    "description": "Application de livraison de repas sains",
    "industry": "Food Tech",
    "targetAudience": "Jeunes actifs urbains",
    "language": "fr"
  }'
```

### Exemple 3 : Marque de luxe
```bash
curl -X POST http://localhost:3001/ai/slogans/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Élégance Parisienne",
    "description": "Maroquinerie de luxe artisanale",
    "industry": "Mode & Luxe",
    "targetAudience": "Clientèle haut de gamme",
    "language": "fr"
  }'
```

## 📊 Catégories de slogans

Les slogans sont automatiquement catégorisés :

- **Innovation** : Met en avant l'aspect novateur
- **Émotion** : Crée une connexion émotionnelle
- **Bénéfice** : Souligne les avantages concrets
- **Aspiration** : Inspire et motive
- **Descriptif** : Décrit clairement l'offre
- **Provocateur** : Interpelle et challenge
- **Humoristique** : Utilise l'humour pour marquer les esprits

## 🎯 Score de mémorabilité

Le score de mémorabilité (0-100) est calculé en fonction de :
- **Simplicité** : Facilité de compréhension
- **Originalité** : Caractère unique et distinctif
- **Sonorité** : Rythme et musicalité
- **Longueur** : Concision et impact
- **Clarté** : Message clair et direct

## ⚠️ Gestion des erreurs

### Erreur 400 : Clé API non configurée
```json
{
  "statusCode": 400,
  "message": "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.",
  "error": "Bad Request"
}
```

**Solution** : Configurez `OPENAI_API_KEY` dans votre fichier `.env`

### Erreur 401 : Non authentifié
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution** : Incluez un token JWT valide dans le header `Authorization`

### Erreur 400 : Validation échouée
```json
{
  "statusCode": 400,
  "message": [
    "Le nom de la marque est requis",
    "Le nom de la marque doit contenir au moins 2 caractères"
  ],
  "error": "Bad Request"
}
```

**Solution** : Vérifiez que tous les champs requis sont présents et valides

## 💰 Coûts estimés

Avec `gpt-4o-mini` :
- ~0.15$ pour 1000 tokens d'entrée
- ~0.60$ pour 1000 tokens de sortie
- Coût moyen par génération : ~0.02-0.05$

## 🚀 Optimisations futures

- [ ] Cache des slogans générés
- [ ] Génération par batch
- [ ] Support de plus de langues
- [ ] Personnalisation du ton (formel, décontracté, etc.)
- [ ] Export en différents formats (PDF, CSV)
- [ ] Analyse de sentiment
- [ ] Suggestions de variations

## 📝 Notes techniques

- Le service utilise OpenAI GPT avec `temperature: 0.9` pour maximiser la créativité
- Le format de réponse est forcé en JSON pour garantir la structure
- Un minimum de 10 slogans est toujours garanti
- Les slogans sont générés en une seule requête API pour optimiser les coûts
