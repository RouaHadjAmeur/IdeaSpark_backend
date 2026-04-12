# 📸 Guide API - Générateur d'Images (Flutter)

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser l'API de génération d'images **GRATUITES** avec Unsplash et Pexels depuis votre application Flutter.

---

## 🔑 Authentification

Toutes les requêtes nécessitent un token JWT dans le header :

```dart
headers: {
  'Authorization': 'Bearer $token',
  'Content-Type': 'application/json',
}
```

---

## 📡 Endpoints disponibles

### 1. Générer une image

**Endpoint** : `POST /ai-images/generate`

**Description** : Génère une image pertinente pour votre marque en utilisant Unsplash (priorité) ou Pexels (fallback).

**Body** :
```json
{
  "description": "lela - The Art of Natural Beauty",
  "style": "professional",
  "brandName": "lela",
  "category": "cosmetics"
}
```

**Paramètres** :

| Champ | Type | Requis | Description | Valeurs possibles |
|-------|------|--------|-------------|-------------------|
| `description` | string | ✅ Oui | Description du contenu (2 premiers mots utilisés) | Texte libre |
| `style` | string | ✅ Oui | Style visuel de l'image | `minimalist`, `colorful`, `professional`, `fun` |
| `brandName` | string | ❌ Non | Nom de la marque | Texte libre |
| `category` | string | ❌ Non | **IMPORTANT** : Catégorie du produit (priorité absolue) | `cosmetics`, `beauty`, `sports`, `fashion`, `food`, `technology`, `lifestyle` |

**Réponse** (200 OK) :
```json
{
  "_id": "67890abcdef",
  "userId": "12345",
  "url": "https://images.unsplash.com/photo-1234567890",
  "prompt": "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
  "style": "professional",
  "brandName": "lela",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Erreurs** :
- `401 Unauthorized` : Token manquant ou invalide
- `400 Bad Request` : Paramètres manquants (description, style)
- `503 Service Unavailable` : Quota API dépassé ou clés non configurées

---

### 2. Récupérer l'historique

**Endpoint** : `GET /ai-images/history`

**Description** : Récupère les 50 dernières images générées par l'utilisateur.

**Réponse** (200 OK) :
```json
[
  {
    "_id": "67890abcdef",
    "userId": "12345",
    "url": "https://images.unsplash.com/photo-1234567890",
    "prompt": "cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio",
    "style": "professional",
    "brandName": "lela",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "67890abcxyz",
    "url": "https://images.pexels.com/photos/9876543",
    "prompt": "sports fitness athletic training gym workout exercise Nike running colorful vibrant bright",
    "style": "colorful",
    "brandName": "Nike",
    "createdAt": "2024-01-14T15:20:00.000Z"
  }
]
```

---

### 3. Supprimer une image

**Endpoint** : `DELETE /ai-images/:id`

**Description** : Supprime une image de l'historique.

**Paramètres URL** :
- `id` : ID de l'image à supprimer

**Réponse** (200 OK) :
```json
{
  "success": true
}
```

**Erreurs** :
- `404 Not Found` : Image introuvable ou n'appartient pas à l'utilisateur

---

### 4. Sauvegarder l'image dans un post

**Endpoint** : `PATCH /content-blocks/:id/image`

**Description** : Associe une image générée à un ContentBlock (post).

**Paramètres URL** :
- `id` : ID du ContentBlock

**Body** :
```json
{
  "imageUrl": "https://images.unsplash.com/photo-1234567890"
}
```

**Réponse** (200 OK) :
```json
{
  "_id": "post123",
  "title": "lela - The Art of Natural Beauty",
  "imageUrl": "https://images.unsplash.com/photo-1234567890",
  "status": "idea",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 🎨 Logique de recherche d'images

### ⚠️ IMPORTANT : Priorité de la catégorie

Le backend utilise une logique intelligente pour trouver des images pertinentes :

#### Avec catégorie (RECOMMANDÉ) :
```
Query = "catégorie_keywords + brandName + 2_premiers_mots_description + style_keywords"
```

**Exemple** :
```json
{
  "description": "lela - The Art of Natural Beauty: Demystifying",
  "style": "professional",
  "brandName": "lela",
  "category": "cosmetics"
}
```

**Query générée** :
```
"cosmetics makeup skincare beauty products lipstick foundation eyeshadow lela lela - professional high quality studio"
```

✅ **Résultat** : Images de produits cosmétiques (rouge à lèvres, fond de teint, etc.)

---

#### Sans catégorie (NON RECOMMANDÉ) :
```
Query = "brandName + description_complète + style_keywords"
```

**Exemple** :
```json
{
  "description": "lela - The Art of Natural Beauty: Demystifying",
  "style": "professional",
  "brandName": "lela"
}
```

**Query générée** :
```
"lela lela - The Art of Natural Beauty: Demystifying professional high quality studio"
```

❌ **Problème** : Les mots "Natural Beauty" peuvent donner des images de nature/paysages au lieu de cosmétiques !

---

### 📋 Catégories disponibles

| Catégorie | Mots-clés utilisés |
|-----------|-------------------|
| `cosmetics` | cosmetics, makeup, skincare, beauty products, lipstick, foundation, eyeshadow |
| `beauty` | spa, wellness, massage, salon, treatment, facial |
| `sports` | sports, fitness, athletic, training, gym, workout, exercise |
| `fashion` | fashion, clothing, apparel, style, outfit, wardrobe |
| `food` | food, cuisine, restaurant, meal, dish, culinary |
| `technology` | technology, gadget, device, software, digital, tech |
| `lifestyle` | lifestyle, modern, home, interior, design, living |

---

### 🎨 Styles disponibles

| Style | Mots-clés utilisés |
|-------|-------------------|
| `minimalist` | minimal, clean, simple, white background |
| `colorful` | colorful, vibrant, bright |
| `professional` | professional, high quality, studio |
| `fun` | fun, playful, creative |

---

## 💻 Exemple d'implémentation Flutter

### Service HTTP

```dart
class ImageGeneratorService {
  static const String baseUrl = 'http://192.168.1.24:3000';
  
  static Future<Map<String, dynamic>> generateImage({
    required String description,
    required ImageStyle style,
    String? brandName,
    String? category,
  }) async {
    final token = await AuthService.getToken();
    
    final response = await http.post(
      Uri.parse('$baseUrl/ai-images/generate'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'description': description,
        'style': style.name,
        'brandName': brandName,
        'category': category,
      }),
    ).timeout(
      const Duration(seconds: 30), // ⚠️ IMPORTANT : Timeout de 30s
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to generate image: ${response.body}');
    }
  }
  
  static Future<List<Map<String, dynamic>>> getHistory() async {
    final token = await AuthService.getToken();
    
    final response = await http.get(
      Uri.parse('$baseUrl/ai-images/history'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load history');
    }
  }
  
  static Future<void> deleteImage(String imageId) async {
    final token = await AuthService.getToken();
    
    final response = await http.delete(
      Uri.parse('$baseUrl/ai-images/$imageId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete image');
    }
  }
  
  static Future<void> saveImageToPost(String postId, String imageUrl) async {
    final token = await AuthService.getToken();
    
    final response = await http.patch(
      Uri.parse('$baseUrl/content-blocks/$postId/image'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'imageUrl': imageUrl,
      }),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to save image to post');
    }
  }
}

enum ImageStyle {
  minimalist,
  colorful,
  professional,
  fun,
}
```

---

### Utilisation dans un Widget

```dart
class ImageGeneratorDialog extends StatefulWidget {
  final String brandName;
  final String description;
  
  const ImageGeneratorDialog({
    required this.brandName,
    required this.description,
  });
  
  @override
  State<ImageGeneratorDialog> createState() => _ImageGeneratorDialogState();
}

class _ImageGeneratorDialogState extends State<ImageGeneratorDialog> {
  ImageStyle selectedStyle = ImageStyle.professional;
  String? selectedCategory;
  bool isLoading = false;
  String? generatedImageUrl;
  
  final categories = [
    {'value': 'cosmetics', 'label': '💄 Cosmétiques', 'icon': '💄'},
    {'value': 'beauty', 'label': '✨ Beauté', 'icon': '✨'},
    {'value': 'sports', 'label': '⚽ Sports', 'icon': '⚽'},
    {'value': 'fashion', 'label': '👗 Mode', 'icon': '👗'},
    {'value': 'food', 'label': '🍔 Alimentation', 'icon': '🍔'},
    {'value': 'technology', 'label': '💻 Technologie', 'icon': '💻'},
    {'value': 'lifestyle', 'label': '🏠 Lifestyle', 'icon': '🏠'},
  ];
  
  Future<void> _generateImage() async {
    if (selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une catégorie')),
      );
      return;
    }
    
    setState(() {
      isLoading = true;
      generatedImageUrl = null;
    });
    
    try {
      final result = await ImageGeneratorService.generateImage(
        description: widget.description,
        style: selectedStyle,
        brandName: widget.brandName,
        category: selectedCategory,
      );
      
      setState(() {
        generatedImageUrl = result['url'];
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Générer une image'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Sélection de la catégorie
            const Text('Catégorie du produit:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: categories.map((cat) {
                final isSelected = selectedCategory == cat['value'];
                return ChoiceChip(
                  label: Text('${cat['icon']} ${cat['label']}'),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      selectedCategory = selected ? cat['value'] as String : null;
                    });
                  },
                );
              }).toList(),
            ),
            
            const SizedBox(height: 16),
            
            // Sélection du style
            const Text('Style:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownButton<ImageStyle>(
              value: selectedStyle,
              isExpanded: true,
              items: ImageStyle.values.map((style) {
                return DropdownMenuItem(
                  value: style,
                  child: Text(style.name),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    selectedStyle = value;
                  });
                }
              },
            ),
            
            const SizedBox(height: 16),
            
            // Bouton générer
            ElevatedButton(
              onPressed: isLoading ? null : _generateImage,
              child: isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Générer'),
            ),
            
            // Affichage de l'image
            if (generatedImageUrl != null) ...[
              const SizedBox(height: 16),
              Image.network(
                generatedImageUrl!,
                height: 200,
                fit: BoxFit.cover,
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        if (generatedImageUrl != null)
          ElevatedButton(
            onPressed: () => Navigator.pop(context, generatedImageUrl),
            child: const Text('Utiliser'),
          ),
      ],
    );
  }
}
```

---

## 🐛 Debugging

### Logs côté Flutter

Ajoutez ces logs pour déboguer :

```dart
print('🔍 [Flutter] Calling backend...');
print('📍 [Flutter] URL: $baseUrl/ai-images/generate');
print('📦 [Flutter] Body: ${jsonEncode(body)}');
print('🔑 [Flutter] Token: Present (${token.substring(0, 20)}...)');

final response = await http.post(...);

print('✅ [Flutter] Response status: ${response.statusCode}');
print('📄 [Flutter] Response body: ${response.body}');
```

---

### Logs côté Backend

Le backend affiche automatiquement :

```
[Image Search] Category: cosmetics
[Image Search] Brand: Lela
[Image Search] Query: "cosmetics makeup skincare beauty products lipstick foundation eyeshadow Lela lela - professional high quality studio"
```

---

## ⚠️ Points d'attention

### 1. Timeout HTTP
Les API Unsplash/Pexels peuvent prendre 10-30 secondes. Configurez un timeout de **30 secondes minimum** :

```dart
.timeout(const Duration(seconds: 30))
```

### 2. Catégorie obligatoire
Pour des images pertinentes, **toujours spécifier la catégorie** :

```dart
// ✅ BON
category: 'cosmetics'  // Pour une marque de cosmétiques

// ❌ MAUVAIS
category: null  // Risque d'images non pertinentes
```

### 3. Gestion des erreurs
```dart
try {
  final result = await ImageGeneratorService.generateImage(...);
} on TimeoutException {
  // Timeout après 30s
  showError('La génération prend trop de temps, réessayez');
} on SocketException {
  // Pas de connexion internet
  showError('Vérifiez votre connexion internet');
} catch (e) {
  // Autre erreur
  showError('Erreur: $e');
}
```

---

## 📊 Limites des API

| API | Limite gratuite | Fallback |
|-----|----------------|----------|
| Unsplash | 50 requêtes/heure | Pexels |
| Pexels | 200 requêtes/heure | Erreur 503 |

Si les deux API échouent, le backend retourne une erreur `503 Service Unavailable`.

---

## ✅ Checklist d'intégration

- [ ] Service HTTP créé avec timeout de 30s
- [ ] Sélection de catégorie implémentée (obligatoire)
- [ ] Sélection de style implémentée
- [ ] Affichage de l'image générée
- [ ] Bouton "Utiliser" pour sauvegarder dans le post
- [ ] Écran d'historique avec grille d'images
- [ ] Bouton de suppression dans l'historique
- [ ] Gestion des erreurs (timeout, réseau, quota)
- [ ] Logs de debug pour tester

---

## 🎉 Résultat attendu

Avec la catégorie `cosmetics` pour la marque **Lela** :
- ✅ Images de rouge à lèvres, fond de teint, produits de maquillage
- ❌ PAS d'images de nature, paysages, ou eau

Avec la catégorie `sports` pour la marque **Nike** :
- ✅ Images de sport, fitness, entraînement
- ❌ PAS d'images de vêtements de mode ou lifestyle

---

**Besoin d'aide ?** Consultez les logs backend et frontend pour identifier le problème.
