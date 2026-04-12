# 📤 Documentation Backend - Partage d'Images sur Réseaux Sociaux

## 🎯 Vue d'ensemble

**Message clé** : Le partage sur les réseaux sociaux est géré **100% côté frontend**. Le backend n'a **AUCUNE modification à faire** !

Le backend fournit uniquement les URLs des images (Unsplash/Pexels). Le frontend Flutter se charge de :
- ✅ Télécharger l'image sur le téléphone
- ✅ Sauvegarder dans la galerie
- ✅ Copier le caption dans le presse-papier
- ✅ Ouvrir Instagram/TikTok/Facebook

---

## 📡 Endpoints utilisés (déjà implémentés)

### 1. Génération d'image
```
POST /ai-images/generate
```

**Body** :
```json
{
  "description": "lela - The Art of Natural Beauty",
  "style": "professional",
  "brandName": "lela",
  "category": "cosmetics"
}
```

**Réponse** :
```json
{
  "_id": "67890abcdef",
  "userId": "user123",
  "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "prompt": "cosmetics makeup skincare beauty products...",
  "style": "professional",
  "brandName": "lela",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Utilisé pour** : Générer une image pertinente pour la marque

---

### 2. Sauvegarde dans un post
```
PATCH /content-blocks/:id/image
```

**Body** :
```json
{
  "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348"
}
```

**Réponse** :
```json
{
  "_id": "post123",
  "title": "lela - The Art of Natural Beauty",
  "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "status": "idea",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

**Utilisé pour** : Associer une image à un ContentBlock (post)

---

### 3. Historique des images
```
GET /ai-images/history
```

**Réponse** :
```json
[
  {
    "_id": "67890abcdef",
    "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    "prompt": "cosmetics makeup skincare...",
    "style": "professional",
    "brandName": "lela",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Utilisé pour** : Afficher l'historique des images générées

---

## 🔄 Workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User génère une image dans Flutter                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /ai-images/generate                                 │
│    Flutter → Backend NestJS                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend appelle Unsplash API                             │
│    Backend → Unsplash                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Unsplash retourne l'URL de l'image                       │
│    Unsplash → Backend                                       │
│    "https://images.unsplash.com/photo-123..."               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend sauvegarde dans MongoDB (generatedimages)        │
│    et retourne l'URL au frontend                            │
│    Backend → Flutter                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Flutter affiche l'image                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. User clique "Partager sur Instagram"                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Flutter télécharge l'image depuis Unsplash               │
│    Flutter → Unsplash (direct, pas via backend)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Flutter sauvegarde l'image dans la galerie du téléphone  │
│    (100% frontend, pas de backend)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Flutter copie le caption dans le presse-papier          │
│     (100% frontend, pas de backend)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Flutter ouvre Instagram                                 │
│     (100% frontend, pas de backend)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. User crée un post Instagram avec l'image de la galerie  │
│     et colle le caption (Ctrl+V)                            │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ Important** : Les étapes 8-12 sont gérées 100% par Flutter, sans aucune interaction avec le backend !

---

## 💾 Données MongoDB

### Collection `generatedimages`
```javascript
{
  _id: ObjectId("67890abcdef"),
  userId: "user123",
  url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  prompt: "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
  style: "professional",
  brandName: "lela",
  createdAt: ISODate("2024-01-15T10:30:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:30:00.000Z")
}
```

### Collection `contentblocks`
```javascript
{
  _id: ObjectId("post123abc"),
  userId: "user123",
  brandId: "brand456",
  planId: "plan789",
  title: "lela - The Art of Natural Beauty",
  description: "Discover the secrets of natural beauty with our premium cosmetics line.",
  imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  status: "idea",
  createdAt: ISODate("2024-01-15T10:00:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:35:00.000Z")
}
```

---

## 🔐 Authentification

Toutes les requêtes nécessitent un token JWT dans le header :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Le backend vérifie le token avec `JwtAuthGuard` et extrait le `userId` :

```typescript
@UseGuards(JwtAuthGuard)
@Post('generate')
generate(@Body() dto: GenerateImageDto, @Request() req: any) {
  const userId = req.user._id || req.user.id;
  return this.service.generateImage(userId, dto);
}
```

---

## 🌐 URLs des images

### Format Unsplash
```
https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80
```

### Format Pexels
```
https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2
```

**⚠️ Important** : Ces URLs sont **publiques** et accessibles directement depuis Flutter sans proxy ni authentification !

Le backend n'a pas besoin de :
- ❌ Télécharger les images
- ❌ Stocker les fichiers
- ❌ Créer un proxy
- ❌ Gérer les permissions CORS

Flutter peut télécharger directement depuis Unsplash/Pexels !

---

## 📤 Workflow de partage (100% Frontend)

### Ce que fait Flutter (sans backend)

1. **Téléchargement de l'image**
```dart
// Flutter télécharge directement depuis Unsplash
final response = await http.get(Uri.parse(imageUrl));
final bytes = response.bodyBytes;
```

2. **Sauvegarde dans la galerie**
```dart
// Flutter sauvegarde dans la galerie du téléphone
await ImageGallerySaver.saveImage(
  Uint8List.fromList(bytes),
  quality: 100,
);
```

3. **Copie du caption**
```dart
// Flutter copie dans le presse-papier
await Clipboard.setData(ClipboardData(text: caption));
```

4. **Ouverture d'Instagram**
```dart
// Flutter ouvre l'app Instagram
await launchUrl(Uri.parse('instagram://'));
```

**Aucune de ces opérations ne nécessite le backend !**

---

## 📊 Logs à surveiller

### Logs backend (NestJS)

```bash
# Génération d'image
[Image Search] Category: cosmetics
[Image Search] Brand: Lela
[Image Search] Query: "cosmetics makeup skincare beauty products lipstick foundation eyeshadow Lela lela - professional high quality studio"
[Nest] 12345  - 01/15/2024, 10:30:00 AM     LOG [AiImageGeneratorService] Creating ContentBlock "lela - The Art of Natural Beauty" for user user123 with status idea

# Sauvegarde dans un post
[Nest] 12345  - 01/15/2024, 10:35:00 AM     LOG [ContentBlocksService] ContentBlock post123 image updated: https://images.unsplash.com/photo-1596462502278-27bfdc403348
```

### Logs Flutter (console)

```bash
# Génération
🔍 [Flutter] Calling backend...
📍 [Flutter] URL: http://192.168.1.24:3000/ai-images/generate
📦 [Flutter] Body: {"description":"lela - The Art...","style":"professional","brandName":"lela","category":"cosmetics"}
🔑 [Flutter] Token: Present (eyJhbGciOiJIUzI1NiIs...)
✅ [Flutter] Response status: 200
📄 [Flutter] Response body: {"url":"https://images.unsplash.com/...","prompt":"cosmetics makeup..."}

# Partage (100% frontend, pas de logs backend)
📥 [Download] Starting download: https://images.unsplash.com/photo-123...
✅ [Download] Image saved: /data/user/0/com.example.app/cache/ideaspark_1705315800000.jpg
💾 [Gallery] Requesting permissions...
💾 [Gallery] Downloading image...
✅ [Gallery] Image saved: {isSuccess: true, filePath: /storage/emulated/0/Pictures/ideaspark_1705315800000.jpg}
📤 [Social] Image saved to gallery
📤 [Social] Caption copied to clipboard
```

**⚠️ Important** : Les logs de partage (Download, Gallery, Social) n'apparaissent PAS dans les logs backend car tout est géré par Flutter !

---

## ⚠️ Erreurs possibles

### 1. Erreur 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Cause** : Token JWT manquant ou invalide

**Solution** : Vérifier que le token est envoyé dans le header `Authorization: Bearer ...`

---

### 2. Erreur 404 Not Found (ContentBlock)
```json
{
  "statusCode": 404,
  "message": "ContentBlock post123 not found"
}
```

**Cause** : Le ContentBlock n'existe pas ou n'appartient pas à l'utilisateur

**Solution** : Vérifier que l'ID du ContentBlock est correct et appartient à l'utilisateur authentifié

---

### 3. Erreur 503 Service Unavailable
```json
{
  "statusCode": 503,
  "message": "No image API configured or quota exceeded"
}
```

**Cause** : Quota API Unsplash/Pexels dépassé ou clés API manquantes

**Solution** :
- Vérifier que `UNSPLASH_ACCESS_KEY` et `PEXELS_API_KEY` sont dans `.env`
- Attendre 1 heure pour que le quota se réinitialise
- Unsplash : 50 requêtes/heure
- Pexels : 200 requêtes/heure

---

### 4. Erreur 429 Too Many Requests (Unsplash/Pexels)
```json
{
  "statusCode": 503,
  "message": "Failed to generate image from both Unsplash and Pexels"
}
```

**Cause** : Quota API dépassé

**Solution** : Attendre 1 heure ou upgrader vers un plan payant

---

## 📊 Statistiques et limites

### Fréquence des requêtes

| Endpoint | Fréquence typique | Limite |
|----------|------------------|--------|
| `POST /ai-images/generate` | 1-5 par minute | 250/heure (Unsplash + Pexels) |
| `PATCH /content-blocks/:id/image` | 1-2 par minute | Illimité (MongoDB) |
| `GET /ai-images/history` | 1 par page load | Illimité (MongoDB) |

### Limites API externes

| API | Limite gratuite | Coût dépassement |
|-----|----------------|------------------|
| Unsplash | 50 requêtes/heure | Gratuit (pas de plan payant) |
| Pexels | 200 requêtes/heure | Gratuit (pas de plan payant) |
| **Total** | **250 images/heure** | **100% GRATUIT** |

**⚠️ Important** : Si les deux API échouent, le backend retourne une erreur 503. Le frontend doit gérer cette erreur et afficher un message à l'utilisateur.

---

## ⚙️ Configuration backend

### Variables d'environnement (.env)

```env
# API Keys (GRATUITES)
UNSPLASH_ACCESS_KEY=VI9DMMy0GnthKS537o74cNt_IzP6NTL1w6vNvdGEt1I
PEXELS_API_KEY=is7UtaKZpxYgRNLHRFtk047RhfXgAaUVp2gEhygo796frviQU6HA2TeL

# MongoDB
MONGODB_URI=mongodb+srv://rouahadjameur_db_user:u8kt1379YXWd4zCZ@spark.wwnh1wj.mongodb.net/ideaspark

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
```

### Modules NestJS

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AiImageGeneratorModule,  // ← Module de génération d'images
    ContentBlocksModule,     // ← Module de posts
    // ...
  ],
})
export class AppModule {}
```

---

## 🧪 Tests avec curl

### 1. Générer une image

```bash
curl -X POST http://192.168.1.24:3000/ai-images/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "lela - The Art of Natural Beauty",
    "style": "professional",
    "brandName": "lela",
    "category": "cosmetics"
  }'
```

**Réponse attendue** :
```json
{
  "_id": "67890abcdef",
  "userId": "user123",
  "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "prompt": "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
  "style": "professional",
  "brandName": "lela",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Sauvegarder dans un post

```bash
curl -X PATCH http://192.168.1.24:3000/content-blocks/POST_ID/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348"
  }'
```

**Réponse attendue** :
```json
{
  "_id": "post123",
  "title": "lela - The Art of Natural Beauty",
  "imageUrl": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
  "status": "idea",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

### 3. Récupérer l'historique

```bash
curl -X GET http://192.168.1.24:3000/ai-images/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse attendue** :
```json
[
  {
    "_id": "67890abcdef",
    "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348",
    "prompt": "cosmetics makeup skincare...",
    "style": "professional",
    "brandName": "lela",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

## ✅ Notes importantes

### 1. Pas de modification backend nécessaire
Le backend actuel est **100% fonctionnel** pour le partage sur les réseaux sociaux. Aucune modification n'est nécessaire !

### 2. URLs publiques (pas de proxy)
Les URLs Unsplash/Pexels sont publiques et accessibles directement depuis Flutter. Le backend n'a pas besoin de créer un proxy.

### 3. Pas de stockage d'images
Le backend ne stocke que les URLs, pas les fichiers. Les images restent hébergées sur Unsplash/Pexels gratuitement.

### 4. Permissions gérées par Flutter
Les permissions de galerie et de presse-papier sont gérées 100% par Flutter. Le backend n'a rien à faire.

### 5. Partage 100% frontend
Le téléchargement, la sauvegarde dans la galerie, la copie du caption et l'ouverture d'Instagram sont gérés 100% par Flutter sans interaction avec le backend.

---

## 🎯 Résumé pour le développeur backend

**Message clé** : Le backend n'a **RIEN À FAIRE** ! Tout fonctionne déjà ! 🎉

Le partage sur les réseaux sociaux est géré 100% côté frontend :
- ✅ Backend fournit les URLs des images (déjà implémenté)
- ✅ Flutter télécharge les images directement depuis Unsplash/Pexels
- ✅ Flutter sauvegarde dans la galerie du téléphone
- ✅ Flutter copie le caption dans le presse-papier
- ✅ Flutter ouvre Instagram/TikTok/Facebook

**Aucune modification backend nécessaire !** 🚀

---

## 📞 Support

Si vous rencontrez un problème :
1. Vérifiez les logs backend (NestJS)
2. Vérifiez les logs Flutter (console)
3. Testez les endpoints avec curl
4. Vérifiez que les clés API sont dans `.env`
5. Vérifiez que le quota API n'est pas dépassé (250/heure)

**Le backend fonctionne parfaitement, le partage est géré par Flutter !** ✅
