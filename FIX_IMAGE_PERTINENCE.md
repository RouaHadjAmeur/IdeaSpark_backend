# 🎯 Fix: Images plus pertinentes pour les marques

## ❌ Problème

Avant, pour "Lela - Unlock Your Inner Radiance: The lela Ritual Begins", on obtenait des images d'église car Unsplash cherchait "ritual" et "radiance" (mots spirituels).

## ✅ Solution

Ajout d'un champ `category` pour spécifier le type de produit.

---

## 📱 Utilisation dans Flutter

### Avant (images non pertinentes):

```dart
final result = await ImageGeneratorService.generateImage(
  description: "Unlock Your Inner Radiance: The lela Ritual Begins",
  style: "professional",
  brandName: "Lela",
);
// ❌ Retourne: image d'église (à cause de "ritual", "radiance")
```

### Maintenant (images pertinentes):

```dart
final result = await ImageGeneratorService.generateImage(
  description: "Unlock Your Inner Radiance: The lela Ritual Begins",
  style: "professional",
  brandName: "Lela",
  category: "cosmetics", // ← NOUVEAU: Spécifie le type de produit
);
// ✅ Retourne: image de cosmétiques/beauté Lela
```

---

## 🏷️ Catégories disponibles

- `cosmetics` - Maquillage, soins de la peau, produits de beauté
- `beauty` - Spa, bien-être, soins
- `sports` - Fitness, athlétisme, entraînement
- `fashion` - Vêtements, mode, style
- `food` - Nourriture, cuisine, restaurant
- `technology` - Tech, gadgets, appareils
- `lifestyle` - Style de vie, moderne

---

## 🔧 Mise à jour du service Flutter

```dart
// lib/services/image_generator_service.dart

class ImageGeneratorService {
  static const String baseUrl = 'http://10.245.240.19:3000';
  
  static Future<Map<String, dynamic>> generateImage({
    required String description,
    required String style,
    String? brandName,
    String? category, // ← NOUVEAU paramètre
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
          'category': category, // ← NOUVEAU
        }),
      );
      
      // ... reste du code
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
```

---

## 🎨 Mise à jour du Dialog

```dart
void _showGenerateImageDialog(ContentBlock post, String brandName) {
  String selectedStyle = 'professional';
  String? selectedCategory; // ← NOUVEAU
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
              // Description
              TextField(
                controller: TextEditingController(text: post.title),
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              SizedBox(height: 16),
              
              // Catégorie (NOUVEAU)
              DropdownButtonFormField<String>(
                value: selectedCategory,
                decoration: InputDecoration(
                  labelText: 'Catégorie',
                  border: OutlineInputBorder(),
                  hintText: 'Sélectionnez une catégorie',
                ),
                items: [
                  DropdownMenuItem(value: null, child: Text('Aucune')),
                  DropdownMenuItem(value: 'cosmetics', child: Text('💄 Cosmétiques')),
                  DropdownMenuItem(value: 'beauty', child: Text('✨ Beauté & Spa')),
                  DropdownMenuItem(value: 'sports', child: Text('⚽ Sports')),
                  DropdownMenuItem(value: 'fashion', child: Text('👗 Mode')),
                  DropdownMenuItem(value: 'food', child: Text('🍔 Nourriture')),
                  DropdownMenuItem(value: 'technology', child: Text('💻 Technologie')),
                  DropdownMenuItem(value: 'lifestyle', child: Text('🏠 Lifestyle')),
                ],
                onChanged: (value) {
                  setState(() => selectedCategory = value);
                },
              ),
              SizedBox(height: 16),
              
              // Style
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
              
              // Image générée
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
              
              if (isGenerating)
                Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
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
                final result = await ImageGeneratorService.generateImage(
                  description: post.title,
                  style: selectedStyle,
                  brandName: brandName,
                  category: selectedCategory, // ← NOUVEAU
                );
                
                if (result['success']) {
                  final imageUrl = result['data']['url'];
                  setState(() {
                    generatedImageUrl = imageUrl;
                    isGenerating = false;
                  });
                  
                  // Sauvegarder dans ContentBlock
                  await ContentBlockService.updateImage(
                    contentBlockId: post.id,
                    imageUrl: imageUrl,
                  );
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('✅ Image générée!')),
                  );
                  
                  await Future.delayed(Duration(seconds: 2));
                  Navigator.pop(context);
                } else {
                  throw Exception(result['error']);
                }
              } catch (e) {
                setState(() => isGenerating = false);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('❌ Erreur: $e')),
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

---

## 🎯 Exemples de recherche

### Lela (cosmétiques):
```dart
ImageGeneratorService.generateImage(
  description: "Unlock Your Inner Radiance",
  style: "professional",
  brandName: "Lela",
  category: "cosmetics",
);
```
**Recherche Unsplash:** `"cosmetics makeup skincare beauty products Lela Unlock Your professional"`
**Résultat:** Images de produits cosmétiques professionnels ✅

### Nike (sports):
```dart
ImageGeneratorService.generateImage(
  description: "New Running Shoes",
  style: "professional",
  brandName: "Nike",
  category: "sports",
);
```
**Recherche Unsplash:** `"sports fitness athletic training Nike New Running professional"`
**Résultat:** Images de chaussures de sport Nike ✅

---

## 💡 Conseils

1. **Toujours spécifier la catégorie** pour les marques spécialisées (cosmétiques, sports, etc.)
2. **Garder la description courte** - seuls les 3 premiers mots sont utilisés
3. **La catégorie a la priorité** sur la description pour éviter les ambiguïtés

---

## 🚀 Testez maintenant!

1. Mettez à jour votre service Flutter
2. Ajoutez le dropdown de catégorie dans le dialog
3. Régénérez l'image pour "Lela" avec `category: "cosmetics"`
4. Vous devriez obtenir une image de cosmétiques! 💄✨
