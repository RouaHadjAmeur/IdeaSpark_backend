# 📱 Guide Frontend Flutter - Générateur d'Images

## 🎯 Ce qui est déjà fait

✅ Service `ImageGeneratorService` créé  
✅ Dialog de génération d'image dans `plan_detail_screen.dart`  
✅ Bouton "Générer Image" ajouté pour chaque post  

## 🔧 Ce qu'il reste à faire

### 1. Ajouter la méthode pour sauvegarder l'image dans ContentBlock

Dans votre service `ContentBlockService` (ou créez-le si nécessaire):

```dart
// lib/services/content_block_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ContentBlockService {
  static const String baseUrl = 'http://10.245.240.19:3000'; // Votre IP backend
  
  /// Sauvegarder l'URL de l'image générée dans un ContentBlock
  static Future<Map<String, dynamic>> updateImage({
    required String contentBlockId,
    required String imageUrl,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.patch(
        Uri.parse('$baseUrl/content-blocks/$contentBlockId/image'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'imageUrl': imageUrl,
        }),
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

### 2. Mettre à jour le modèle ContentBlock

Ajoutez le champ `imageUrl` à votre modèle:

```dart
// lib/models/content_block.dart

class ContentBlock {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl; // ← NOUVEAU CHAMP
  // ... autres champs
  
  ContentBlock({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl, // ← NOUVEAU
    // ... autres champs
  });
  
  factory ContentBlock.fromJson(Map<String, dynamic> json) {
    return ContentBlock(
      id: json['id'] ?? json['_id'],
      title: json['title'],
      description: json['description'],
      imageUrl: json['imageUrl'], // ← NOUVEAU
      // ... autres champs
    );
  }
}
```

### 3. Utiliser dans le Dialog de génération

Dans `plan_detail_screen.dart`, après avoir généré l'image:

```dart
void _showGenerateImageDialog(ContentBlock post) {
  String selectedStyle = 'professional';
  bool isGenerating = false;
  String? generatedImageUrl;
  
  showDialog(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Text('Générer une image'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Champ de texte pré-rempli
            TextField(
              controller: TextEditingController(text: post.title),
              decoration: InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
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
                DropdownMenuItem(value: 'professional', child: Text('Professionnel')),
                DropdownMenuItem(value: 'minimalist', child: Text('Minimaliste')),
                DropdownMenuItem(value: 'colorful', child: Text('Coloré')),
                DropdownMenuItem(value: 'fun', child: Text('Amusant')),
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
                ),
              ),
            
            // Indicateur de chargement
            if (isGenerating)
              Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
          ],
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
                  brandName: 'Nike', // Remplacez par le vrai nom de marque
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
                    // 3. Mettre à jour l'UI locale
                    setState(() {
                      post.imageUrl = imageUrl;
                    });
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Image générée et sauvegardée!')),
                    );
                    
                    // Fermer le dialog après 2 secondes
                    await Future.delayed(Duration(seconds: 2));
                    Navigator.pop(context);
                  } else {
                    throw Exception(saveResult['error']);
                  }
                } else {
                  throw Exception(result['error']);
                }
              } catch (e) {
                setState(() => isGenerating = false);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erreur: $e')),
                );
              }
            },
            child: Text('Générer'),
          ),
        ],
      ),
    ),
  );
}
```

### 4. Afficher l'image dans la liste des posts

Dans le widget qui affiche chaque post:

```dart
Widget _buildPostCard(ContentBlock post) {
  return Card(
    margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              
              // Bouton Générer Image
              ElevatedButton.icon(
                onPressed: () => _showGenerateImageDialog(post),
                icon: Icon(Icons.image),
                label: Text(
                  post.imageUrl != null ? 'Régénérer Image' : 'Générer Image'
                ),
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

## 🚀 Résumé du workflow

1. **Utilisateur clique** sur "Générer Image"
2. **Dialog s'ouvre** avec titre pré-rempli et sélection de style
3. **Appel API** pour générer l'image (Unsplash gratuit)
4. **Image s'affiche** dans le dialog
5. **Sauvegarde automatique** dans le ContentBlock
6. **Mise à jour de l'UI** pour afficher l'image dans la liste

---

## 📝 Checklist

- [ ] Ajouter `imageUrl` au modèle `ContentBlock`
- [ ] Créer/mettre à jour `ContentBlockService.updateImage()`
- [ ] Mettre à jour le dialog de génération d'image
- [ ] Afficher l'image dans la liste des posts
- [ ] Tester avec un vrai post
- [ ] Vérifier que l'image persiste après rechargement

---

## 🐛 Troubleshooting

### L'image ne se génère pas
→ Vérifiez que la clé Unsplash est dans `.env` du backend

### L'image ne se sauvegarde pas
→ Vérifiez que l'endpoint `PATCH /content-blocks/:id/image` fonctionne dans Swagger

### L'image ne s'affiche pas
→ Vérifiez que `imageUrl` est bien dans le JSON retourné par l'API

### Erreur CORS
→ Le backend doit autoriser les requêtes depuis votre app mobile
