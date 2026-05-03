# 📱 Guide Complet Frontend - Images & Captions

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser les APIs de génération d'images et de captions dans votre app Flutter.

---

## 📸 1. Générateur d'Images

### Comment ça marche?

1. L'utilisateur clique sur "Générer Image" dans un post
2. L'app envoie le titre du post + nom de marque + style au backend
3. Le backend cherche une image pertinente sur Unsplash (gratuit)
4. L'image est sauvegardée dans MongoDB avec l'historique
5. L'URL de l'image est retournée à l'app

### API Endpoint

```
POST http://10.245.240.19:3000/ai-images/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Requête (Body)

```json
{
  "description": "running shoes",
  "style": "professional",
  "brandName": "Nike"
}
```

**Paramètres:**
- `description` (requis) - Titre du post ou description de l'image
- `style` (requis) - Style de l'image: `professional`, `minimalist`, `colorful`, `fun`
- `brandName` (optionnel) - Nom de la marque (Nike, Lela, etc.)

**Important:** Le `brandName` est utilisé dans la recherche pour trouver des images pertinentes à la marque!

### Réponse

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "url": "https://images.unsplash.com/photo-1234567890",
  "prompt": "Nike running shoes professional business corporate",
  "style": "professional",
  "brandName": "Nike",
  "createdAt": "2026-04-10T12:00:00.000Z",
  "updatedAt": "2026-04-10T12:00:00.000Z"
}
```

### Code Flutter - Service

```dart
// lib/services/image_generator_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ImageGeneratorService {
  static const String baseUrl = 'http://10.245.240.19:3000';
  
  /// Générer une image avec Unsplash (GRATUIT)
  static Future<Map<String, dynamic>> generateImage({
    required String description,
    required String style,
    String? brandName,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.post(
        Uri.parse('$baseUrl/ai-images/generate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'description': description,
          'style': style,
          'brandName': brandName,
        }),
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Historique des images générées
  static Future<Map<String, dynamic>> getHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.get(
        Uri.parse('$baseUrl/ai-images/history'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Supprimer une image de l'historique
  static Future<Map<String, dynamic>> deleteImage(String imageId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.delete(
        Uri.parse('$baseUrl/ai-images/$imageId'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}
```

### Code Flutter - Dialog de génération

```dart
// Dans votre screen (ex: plan_detail_screen.dart)

void _showGenerateImageDialog(ContentBlock post, String brandName) {
  String selectedStyle = 'professional';
  bool isGenerating = false;
  String? generatedImageUrl;
  
  showDialog(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text('Générer une image'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Description (titre du post)
              TextField(
                controller: TextEditingController(text: post.title),
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  hintText: 'Ex: running shoes, cosmetics...',
                ),
                maxLines: 2,
              ),
              SizedBox(height: 16),
              
              // Sélection du style
              DropdownButtonFormField<String>(
                value: selectedStyle,
                decoration: InputDecoration(
                  labelText: 'Style',
                  border: OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(
                    value: 'professional',
                    child: Row(
                      children: [
                        Icon(Icons.business, size: 20),
                        SizedBox(width: 8),
                        Text('Professionnel'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'minimalist',
                    child: Row(
                      children: [
                        Icon(Icons.minimize, size: 20),
                        SizedBox(width: 8),
                        Text('Minimaliste'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'colorful',
                    child: Row(
                      children: [
                        Icon(Icons.palette, size: 20),
                        SizedBox(width: 8),
                        Text('Coloré'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'fun',
                    child: Row(
                      children: [
                        Icon(Icons.celebration, size: 20),
                        SizedBox(width: 8),
                        Text('Amusant'),
                      ],
                    ),
                  ),
                ],
                onChanged: (value) {
                  setState(() => selectedStyle = value!);
                },
              ),
              SizedBox(height: 16),
              
              // Affichage de l'image générée
              if (generatedImageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    generatedImageUrl!,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: Center(
                          child: CircularProgressIndicator(
                            value: progress.expectedTotalBytes != null
                                ? progress.cumulativeBytesLoaded / 
                                  progress.expectedTotalBytes!
                                : null,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.broken_image, size: 48, color: Colors.grey),
                              SizedBox(height: 8),
                              Text('Erreur de chargement', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              
              // Indicateur de chargement
              if (isGenerating)
                Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 8),
                      Text('Génération en cours...'),
                    ],
                  ),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: isGenerating ? null : () async {
              setState(() => isGenerating = true);
              
              try {
                // 1. Générer l'image
                final result = await ImageGeneratorService.generateImage(
                  description: post.title,
                  style: selectedStyle,
                  brandName: brandName, // ← IMPORTANT: Nom de la marque
                );
                
                if (result['success']) {
                  final imageUrl = result['data']['url'];
                  
                  setState(() {
                    generatedImageUrl = imageUrl;
                    isGenerating = false;
                  });
                  
                  // 2. Sauvegarder dans le ContentBlock
                  final saveResult = await ContentBlockService.updateImage(
                    contentBlockId: post.id,
                    imageUrl: imageUrl,
                  );
                  
                  if (saveResult['success']) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('✅ Image générée et sauvegardée!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                    
                    // Fermer après 2 secondes
                    await Future.delayed(Duration(seconds: 2));
                    Navigator.pop(context);
                    
                    // Rafraîchir la liste des posts
                    // setState(() { ... });
                  } else {
                    throw Exception(saveResult['error']);
                  }
                } else {
                  throw Exception(result['error']);
                }
              } catch (e) {
                setState(() => isGenerating = false);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('❌ Erreur: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: Text(generatedImageUrl != null ? 'Sauvegarder' : 'Générer'),
          ),
        ],
      ),
    ),
  );
}
```

---

## 💬 2. Générateur de Captions

### Comment ça marche?

1. L'utilisateur génère une caption pour un post
2. L'app envoie les infos du post au backend
3. Le backend utilise Gemini AI pour générer 3 versions (courte, moyenne, longue)
4. La caption est sauvegardée dans MongoDB avec l'image associée
5. L'utilisateur peut voir l'historique et marquer des favoris

### API Endpoint

```
POST http://10.245.240.19:3000/caption-generator/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Requête (Body)

```json
{
  "postTitle": "Nouveau produit Nike",
  "platform": "Instagram",
  "format": "Reel",
  "pillar": "Promo",
  "ctaType": "hard",
  "language": "fr",
  "brandName": "Nike",
  "imageUrl": "https://images.unsplash.com/photo-..."
}
```

**Paramètres:**
- `postTitle` (requis) - Titre du post
- `platform` (requis) - `Instagram`, `TikTok`, `Facebook`, `LinkedIn`
- `format` (requis) - `Reel`, `Post`, `Story`, `Carousel`
- `pillar` (requis) - Type de contenu (Promo, Educational, etc.)
- `ctaType` (requis) - `hard`, `soft`, `educational`
- `language` (requis) - `fr`, `en`, `ar`
- `brandName` (requis) - Nom de la marque
- `imageUrl` (optionnel) - URL de l'image générée

### Réponse

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "postTitle": "Nouveau produit Nike",
  "platform": "Instagram",
  "format": "Reel",
  "pillar": "Promo",
  "ctaType": "hard",
  "language": "fr",
  "brandName": "Nike",
  "captions": {
    "short": "✨ Nouveau produit Nike — Innovation",
    "medium": "Découvrez le nouveau produit Nike...",
    "long": "Nouveau produit Nike 🚀\n\nChez Nike...",
    "hashtags": ["#Nike", "#Instagram", "#Promo", "#marketing", "#ideaspark"],
    "emojis": ["✨", "🚀", "💡", "🎯", "💪"],
    "cta": "👉 Achetez maintenant !"
  },
  "imageUrl": "https://images.unsplash.com/photo-...",
  "isFavorite": false,
  "createdAt": "2026-04-10T12:00:00.000Z",
  "updatedAt": "2026-04-10T12:00:00.000Z"
}
```

### Autres endpoints

```
GET /caption-generator/history - Historique des captions
PATCH /caption-generator/:id/favorite - Marquer comme favori
DELETE /caption-generator/:id - Supprimer
```

### Code Flutter - Service

```dart
// lib/services/caption_generator_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CaptionGeneratorService {
  static const String baseUrl = 'http://10.245.240.19:3000';
  
  /// Générer une caption avec Gemini AI
  static Future<Map<String, dynamic>> generateCaption({
    required String postTitle,
    required String platform,
    required String format,
    required String pillar,
    required String ctaType,
    required String language,
    required String brandName,
    String? imageUrl,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.post(
        Uri.parse('$baseUrl/caption-generator/generate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'postTitle': postTitle,
          'platform': platform,
          'format': format,
          'pillar': pillar,
          'ctaType': ctaType,
          'language': language,
          'brandName': brandName,
          'imageUrl': imageUrl,
        }),
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Historique des captions
  static Future<Map<String, dynamic>> getHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.get(
        Uri.parse('$baseUrl/caption-generator/history'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  /// Marquer/démarquer comme favori
  static Future<Map<String, dynamic>> toggleFavorite(String captionId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.patch(
        Uri.parse('$baseUrl/caption-generator/$captionId/favorite'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {
          'success': false,
          'error': 'Erreur ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
}
```

---

## 🔄 3. Workflow Complet: Image + Caption

Voici comment combiner les deux fonctionnalités:

```dart
Future<void> generateImageAndCaption(ContentBlock post, String brandName) async {
  try {
    // 1. Générer l'image
    final imageResult = await ImageGeneratorService.generateImage(
      description: post.title,
      style: 'professional',
      brandName: brandName,
    );
    
    if (!imageResult['success']) {
      throw Exception('Erreur génération image');
    }
    
    final imageUrl = imageResult['data']['url'];
    
    // 2. Sauvegarder l'image dans le ContentBlock
    await ContentBlockService.updateImage(
      contentBlockId: post.id,
      imageUrl: imageUrl,
    );
    
    // 3. Générer la caption avec l'image
    final captionResult = await CaptionGeneratorService.generateCaption(
      postTitle: post.title,
      platform: 'Instagram',
      format: 'Reel',
      pillar: 'Promo',
      ctaType: 'hard',
      language: 'fr',
      brandName: brandName,
      imageUrl: imageUrl, // ← Image associée
    );
    
    if (captionResult['success']) {
      final captions = captionResult['data']['captions'];
      
      // Afficher les captions générées
      print('Short: ${captions['short']}');
      print('Medium: ${captions['medium']}');
      print('Long: ${captions['long']}');
      print('Hashtags: ${captions['hashtags']}');
    }
    
  } catch (e) {
    print('Erreur: $e');
  }
}
```

---

## 📊 4. Afficher l'image dans la liste des posts

```dart
Widget _buildPostCard(ContentBlock post) {
  return Card(
    margin: EdgeInsets.all(16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image si disponible
        if (post.imageUrl != null && post.imageUrl!.isNotEmpty)
          ClipRRect(
            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
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
                  child: Center(
                    child: Icon(Icons.broken_image, size: 48, color: Colors.grey),
                  ),
                );
              },
            ),
          ),
        
        // Contenu du post
        Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                post.title,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              if (post.description != null) ...[
                SizedBox(height: 8),
                Text(post.description!),
              ],
              SizedBox(height: 12),
              
              // Boutons d'action
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: () => _showGenerateImageDialog(post, brandName),
                    icon: Icon(Icons.image),
                    label: Text(
                      post.imageUrl != null ? 'Régénérer' : 'Générer Image'
                    ),
                  ),
                  SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () => _generateCaption(post, brandName),
                    icon: Icon(Icons.text_fields),
                    label: Text('Caption'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
```

---

## ⚠️ Points importants

### 1. Nom de la marque
**TOUJOURS** passer le `brandName` lors de la génération d'image pour avoir des résultats pertinents:
```dart
// ✅ BON
ImageGeneratorService.generateImage(
  description: 'running shoes',
  style: 'professional',
  brandName: 'Nike', // ← Important!
);

// ❌ MAUVAIS
ImageGeneratorService.generateImage(
  description: 'running shoes',
  style: 'professional',
  // Pas de brandName = images génériques
);
```

### 2. Gestion des erreurs
Toujours gérer les erreurs avec try/catch et afficher des messages clairs à l'utilisateur.

### 3. Loading states
Afficher un indicateur de chargement pendant la génération (peut prendre 2-5 secondes).

### 4. Quota Unsplash
- 50 images/heure GRATUIT
- Si quota dépassé, le backend essaie Pexels automatiquement (200/heure)

---

## 🎉 Résumé

1. **Générer Image** → Unsplash cherche avec `brandName + description + style`
2. **Sauvegarder** → Image sauvegardée dans ContentBlock
3. **Générer Caption** → Gemini AI crée 3 versions avec l'image associée
4. **Historique** → Tout est sauvegardé pour réutilisation

Le système est 100% gratuit et prêt à utiliser! 🚀
