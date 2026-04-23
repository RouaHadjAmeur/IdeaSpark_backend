# 🎨 Intégration Générateur d'Images - Backend & Frontend

## ✅ Backend Complété

### 1. Module AI Image Generator
- **Service**: `src/ai-image-generator/ai-image-generator.service.ts`
- **Controller**: `src/ai-image-generator/ai-image-generator.controller.ts`
- **Schema**: `src/ai-image-generator/schemas/generated-image.schema.ts`

### 2. ContentBlock mis à jour
- Nouveau champ `imageUrl` ajouté au schéma
- Méthode `updateImageUrl()` ajoutée au service
- Endpoint `PATCH /content-blocks/:id/image` ajouté

### 3. APIs disponibles

#### Générer une image
```http
POST /ai-images/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "description": "coffee latte",
  "style": "professional",
  "brandName": "Nike"
}
```

**Styles disponibles:**
- `professional` - Images professionnelles et corporate
- `minimalist` - Images minimalistes et épurées
- `colorful` - Images colorées et vibrantes
- `fun` - Images amusantes et créatives

**Réponse:**
```json
{
  "userId": "...",
  "url": "https://images.unsplash.com/photo-...",
  "prompt": "coffee latte professional business corporate",
  "style": "professional",
  "createdAt": "2026-04-10T..."
}
```

#### Historique des images
```http
GET /ai-images/history
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Supprimer une image
```http
DELETE /ai-images/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Sauvegarder l'image dans un ContentBlock
```http
PATCH /content-blocks/:id/image
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "imageUrl": "https://images.unsplash.com/photo-..."
}
```

---

## 🔧 Configuration requise

### 1. Obtenir une clé Unsplash (GRATUIT)
1. Allez sur: https://unsplash.com/developers
2. Créez un compte (gratuit)
3. Cliquez sur "Register as a developer"
4. Créez une nouvelle application
5. Copiez votre **Access Key**

**Limites gratuites:**
- ✅ 50 requêtes par heure
- ✅ Images haute qualité
- ✅ Pas de carte bancaire requise

### 2. Ajouter la clé dans `.env`
```bash
UNSPLASH_ACCESS_KEY=votre_access_key_ici
```

### 3. Redémarrer le serveur
```bash
npm start
```

---

## 📱 Intégration Frontend (Flutter)

### 1. Service déjà créé
Le fichier `image_generator_service.dart` existe déjà avec:
- `generateImage()` - Génère une image
- `getHistory()` - Récupère l'historique
- `deleteImage()` - Supprime une image

### 2. Utilisation dans plan_detail_screen.dart

```dart
// Générer une image pour un post
final result = await ImageGeneratorService.generateImage(
  description: post.title,
  style: 'professional', // ou 'minimalist', 'colorful', 'fun'
  brandName: brandName,
);

if (result['success']) {
  final imageUrl = result['data']['url'];
  
  // Sauvegarder dans le ContentBlock
  await ContentBlockService.updateImage(
    contentBlockId: post.id,
    imageUrl: imageUrl,
  );
  
  // Mettre à jour l'UI
  setState(() {
    post.imageUrl = imageUrl;
  });
}
```

### 3. Affichage de l'image

```dart
// Dans le widget du post
if (post.imageUrl != null && post.imageUrl!.isNotEmpty)
  ClipRRect(
    borderRadius: BorderRadius.circular(12),
    child: Image.network(
      post.imageUrl!,
      height: 200,
      width: double.infinity,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Container(
          height: 200,
          color: Colors.grey[200],
          child: Center(child: CircularProgressIndicator()),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return Container(
          height: 200,
          color: Colors.grey[200],
          child: Icon(Icons.broken_image, size: 48),
        );
      },
    ),
  ),
```

---

## 🎯 Workflow complet

1. **Utilisateur clique sur "Générer Image"** dans un post
2. **Dialog s'ouvre** avec:
   - Titre du post pré-rempli
   - Sélection du style
3. **Appel API** `POST /ai-images/generate`
4. **Image générée** depuis Unsplash (gratuit)
5. **Sauvegarde** dans ContentBlock via `PATCH /content-blocks/:id/image`
6. **Affichage** de l'image dans l'UI

---

## 🚀 Prochaines étapes

1. ✅ Backend créé et configuré
2. ⏳ Ajouter votre clé Unsplash dans `.env`
3. ⏳ Redémarrer le serveur
4. ⏳ Tester depuis le frontend Flutter
5. ⏳ Vérifier que les images s'affichent correctement

---

## 📝 Notes importantes

- Les images Unsplash sont **libres de droits** pour usage commercial
- Qualité professionnelle haute résolution
- Parfait pour votre démo et production
- Alternative: Pexels (200 req/heure) si besoin de plus de quota

---

## 🐛 Troubleshooting

### L'endpoint n'apparaît pas dans Swagger
→ Redémarrez le serveur avec `npm start`

### Erreur "No image API configured"
→ Vérifiez que `UNSPLASH_ACCESS_KEY` est bien dans `.env`

### Erreur 429 (Too Many Requests)
→ Quota dépassé (50/heure), attendez 1 heure ou ajoutez une clé Pexels

### Image ne s'affiche pas dans Flutter
→ Vérifiez que `imageUrl` est bien sauvegardé dans le ContentBlock
