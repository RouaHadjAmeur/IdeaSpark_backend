# 💾 Explication - Stockage des Images

## 🎯 Concept important

**Les images ne sont PAS téléchargées sur votre serveur !**

Seules les **URLs** sont sauvegardées dans MongoDB. Les images restent hébergées sur Unsplash et Pexels (gratuitement).

---

## 📊 Structure de la base de données

### Collection 1 : `generatedimages` (Historique)

**Schéma** :
```typescript
{
  _id: ObjectId,
  userId: string,           // ID de l'utilisateur
  url: string,              // URL de l'image (Unsplash/Pexels)
  prompt: string,           // Query utilisée pour la recherche
  style: string,            // Style sélectionné (professional, colorful, etc.)
  brandName: string,        // Nom de la marque
  createdAt: Date,          // Date de génération
  updatedAt: Date
}
```

**Exemple** :
```json
{
  "_id": "67890abcdef12345",
  "userId": "user123",
  "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "prompt": "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
  "style": "professional",
  "brandName": "lela",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Utilisé pour** :
- ✅ Écran "Historique Images" dans Flutter
- ✅ Endpoint `GET /ai-images/history`
- ✅ Endpoint `DELETE /ai-images/:id`

---

### Collection 2 : `contentblocks` (Posts)

**Schéma** (champs pertinents) :
```typescript
{
  _id: ObjectId,
  userId: string,
  brandId: string,
  planId: string,
  title: string,
  description: string,
  imageUrl: string | null,  // ← URL de l'image associée
  status: string,
  scheduledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Exemple** :
```json
{
  "_id": "post123abc",
  "userId": "user123",
  "brandId": "brand456",
  "planId": "plan789",
  "title": "lela - The Art of Natural Beauty",
  "description": "Discover the secrets of natural beauty...",
  "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "status": "idea",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

**Utilisé pour** :
- ✅ Associer une image à un post spécifique
- ✅ Afficher la miniature dans la liste des posts
- ✅ Endpoint `PATCH /content-blocks/:id/image`

---

## 🔄 Flux complet de sauvegarde

### 1. Génération d'une image

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clique "Générer" dans le dialog Flutter            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /ai-images/generate                                 │
│    Body: {                                                  │
│      description: "lela - The Art of Natural Beauty",       │
│      style: "professional",                                 │
│      brandName: "lela",                                     │
│      category: "cosmetics"                                  │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend construit la query:                              │
│    "cosmetics makeup skincare beauty products lipstick      │
│     foundation eyeshadow lela lela - professional high      │
│     quality studio"                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend appelle Unsplash API                             │
│    GET https://api.unsplash.com/photos/random?query=...     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Unsplash retourne:                                       │
│    {                                                        │
│      urls: {                                                │
│        regular: "https://images.unsplash.com/photo-123..."  │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend sauvegarde dans MongoDB (generatedimages):       │
│    {                                                        │
│      userId: "user123",                                     │
│      url: "https://images.unsplash.com/photo-123...",       │
│      prompt: "cosmetics makeup skincare...",                │
│      style: "professional",                                 │
│      brandName: "lela"                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend retourne au frontend:                            │
│    {                                                        │
│      _id: "67890abcdef",                                    │
│      url: "https://images.unsplash.com/photo-123...",       │
│      prompt: "cosmetics makeup skincare...",                │
│      style: "professional",                                 │
│      brandName: "lela",                                     │
│      createdAt: "2024-01-15T10:30:00.000Z"                  │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Flutter affiche l'image dans le dialog                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Sauvegarde dans un post

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clique "Utiliser" dans le dialog                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PATCH /content-blocks/:id/image                          │
│    Body: {                                                  │
│      imageUrl: "https://images.unsplash.com/photo-123..."   │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend met à jour le ContentBlock:                      │
│    db.contentblocks.updateOne(                              │
│      { _id: "post123" },                                    │
│      { $set: { imageUrl: "https://images.unsplash..." } }   │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend retourne le ContentBlock mis à jour              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Flutter recharge le plan                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Miniature 50x50px affichée dans la liste des posts       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Affichage de l'historique

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User ouvre "Historique Images" dans le menu              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GET /ai-images/history                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend récupère de MongoDB (generatedimages):           │
│    db.generatedimages.find({ userId: "user123" })           │
│      .sort({ createdAt: -1 })                               │
│      .limit(50)                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend retourne un tableau d'images:                    │
│    [                                                        │
│      {                                                      │
│        _id: "67890abcdef",                                  │
│        url: "https://images.unsplash.com/photo-123...",     │
│        prompt: "cosmetics makeup...",                       │
│        style: "professional",                               │
│        brandName: "lela",                                   │
│        createdAt: "2024-01-15T10:30:00.000Z"                │
│      },                                                     │
│      { ... },                                               │
│      { ... }                                                │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Flutter affiche une grille 2 colonnes avec les images    │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Suppression d'une image

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clique "Supprimer" dans l'historique                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. DELETE /ai-images/:id                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend supprime de MongoDB (generatedimages):           │
│    db.generatedimages.deleteOne({                           │
│      _id: "67890abcdef",                                    │
│      userId: "user123"  // Vérifie l'ownership              │
│    })                                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend retourne { success: true }                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Flutter recharge l'historique                            │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ Important** : La suppression de l'historique ne supprime PAS l'image des posts qui l'utilisent !

---

## 🔍 Requêtes MongoDB

### Créer une image dans l'historique
```javascript
db.generatedimages.insertOne({
  userId: "user123",
  url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  prompt: "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
  style: "professional",
  brandName: "lela",
  createdAt: new Date()
});
```

### Récupérer l'historique d'un utilisateur
```javascript
db.generatedimages.find({ userId: "user123" })
  .sort({ createdAt: -1 })
  .limit(50);
```

### Associer une image à un post
```javascript
db.contentblocks.updateOne(
  { _id: ObjectId("post123abc") },
  { $set: { imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348" } }
);
```

### Récupérer les posts avec images
```javascript
db.contentblocks.find({
  userId: "user123",
  imageUrl: { $ne: null }
});
```

### Supprimer une image de l'historique
```javascript
db.generatedimages.deleteOne({
  _id: ObjectId("67890abcdef"),
  userId: "user123"
});
```

---

## 💡 Avantages de cette approche

### 1. Pas de stockage de fichiers
- ✅ Pas besoin de serveur de fichiers (AWS S3, etc.)
- ✅ Pas de coûts de stockage
- ✅ Pas de gestion de uploads/downloads
- ✅ Bande passante gratuite (Unsplash/Pexels)

### 2. Performance
- ✅ Images servies par CDN d'Unsplash/Pexels (ultra rapide)
- ✅ Pas de charge sur votre serveur
- ✅ Optimisation automatique des images

### 3. Légalité
- ✅ Licence Unsplash : Utilisation commerciale gratuite
- ✅ Licence Pexels : Utilisation commerciale gratuite
- ✅ Pas besoin d'attribution (mais recommandé)

---

## ⚠️ Limitations

### 1. Dépendance externe
- ❌ Si Unsplash/Pexels supprime une image, elle disparaît de votre app
- ✅ Solution : Télécharger et héberger les images importantes

### 2. Quota API
- ❌ Unsplash : 50 requêtes/heure
- ❌ Pexels : 200 requêtes/heure
- ✅ Total : 250 images/heure (largement suffisant)

### 3. Pas de modification
- ❌ Impossible de modifier les images (crop, resize, filtres)
- ✅ Solution : Utiliser un service comme Cloudinary (gratuit jusqu'à 25GB)

---

## 🎯 Résumé

| Aspect | Détail |
|--------|--------|
| **Stockage des fichiers** | ❌ Non, seulement les URLs |
| **Hébergement des images** | ✅ Unsplash et Pexels (gratuit) |
| **Base de données** | ✅ MongoDB (2 collections) |
| **Collection 1** | `generatedimages` (historique) |
| **Collection 2** | `contentblocks` (posts avec images) |
| **Coût** | ✅ 100% GRATUIT |
| **Performance** | ✅ CDN ultra rapide |
| **Légalité** | ✅ Licence commerciale gratuite |

---

## 📊 Exemple de données dans MongoDB

### Collection `generatedimages`
```json
[
  {
    "_id": "67890abcdef12345",
    "userId": "user123",
    "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    "prompt": "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
    "style": "professional",
    "brandName": "lela",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "67890abcxyz67890",
    "userId": "user123",
    "url": "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg",
    "prompt": "sports fitness athletic training gym workout exercise Nike running colorful vibrant bright",
    "style": "colorful",
    "brandName": "Nike",
    "createdAt": "2024-01-14T15:20:00.000Z",
    "updatedAt": "2024-01-14T15:20:00.000Z"
  }
]
```

### Collection `contentblocks`
```json
[
  {
    "_id": "post123abc",
    "userId": "user123",
    "brandId": "brand456",
    "planId": "plan789",
    "title": "lela - The Art of Natural Beauty",
    "description": "Discover the secrets of natural beauty with our premium cosmetics line.",
    "contentType": "promo",
    "platform": "instagram",
    "format": "post",
    "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    "status": "idea",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  {
    "_id": "post456def",
    "userId": "user123",
    "brandId": "brand789",
    "planId": "plan789",
    "title": "Nike - Just Do It",
    "description": "Push your limits with our new running shoes.",
    "contentType": "promo",
    "platform": "tiktok",
    "format": "reel",
    "imageUrl": "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg",
    "status": "scheduled",
    "scheduledAt": "2024-01-20T14:00:00.000Z",
    "createdAt": "2024-01-14T15:00:00.000Z",
    "updatedAt": "2024-01-14T15:25:00.000Z"
  }
]
```

---

## ✅ Conclusion

Les images sont sauvegardées de manière **intelligente et économique** :
- ✅ URLs stockées dans MongoDB (pas les fichiers)
- ✅ Images hébergées gratuitement sur Unsplash/Pexels
- ✅ 2 collections : historique + posts
- ✅ Performance optimale avec CDN
- ✅ 100% gratuit et légal

**Aucun serveur de fichiers nécessaire !** 🎉
