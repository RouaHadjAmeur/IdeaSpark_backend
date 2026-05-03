# 📤 Télécharger et Partager les Images (Flutter)

## 🎯 Problème à résoudre

Actuellement, les images sont sauvegardées comme URLs (Unsplash/Pexels). Pour partager un post sur Instagram/TikTok/Facebook, l'utilisateur a besoin de :
1. ✅ L'image téléchargée sur son téléphone
2. ✅ Le caption (texte) copié dans le presse-papier
3. ✅ Ouvrir l'app de réseau social pour partager

---

## 📦 Packages Flutter nécessaires

Ajoutez ces packages dans `pubspec.yaml` :

```yaml
dependencies:
  # Téléchargement d'images
  http: ^1.1.0
  path_provider: ^2.1.1
  
  # Partage de fichiers
  share_plus: ^7.2.1
  
  # Permissions
  permission_handler: ^11.0.1
  
  # Galerie photo
  image_gallery_saver: ^2.0.3
```

Installez :
```bash
flutter pub get
```

---

## 🔧 Configuration Android

### 1. Permissions dans `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions pour télécharger et sauvegarder -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <application
        android:label="IdeaSpark"
        android:usesCleartextTraffic="true">
        
        <!-- Provider pour partager des fichiers -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
        
    </application>
</manifest>
```

### 2. Créez `android/app/src/main/res/xml/file_paths.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <cache-path name="cache" path="." />
    <external-path name="external" path="." />
    <external-files-path name="external_files" path="." />
</paths>
```

---

## 🔧 Configuration iOS

### Permissions dans `ios/Runner/Info.plist`

```xml
<dict>
    <!-- Permissions pour sauvegarder dans la galerie -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Nous avons besoin d'accéder à votre galerie pour sauvegarder les images générées</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Nous avons besoin d'accéder à votre galerie pour sauvegarder les images générées</string>
</dict>
```

---

## 💻 Service de téléchargement et partage

Créez `lib/services/image_download_service.dart` :

```dart
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:permission_handler/permission_handler.dart';

class ImageDownloadService {
  /// Télécharge une image depuis une URL et retourne le chemin local
  static Future<String> downloadImage(String imageUrl) async {
    try {
      print('📥 [Download] Starting download: $imageUrl');
      
      // Télécharger l'image
      final response = await http.get(Uri.parse(imageUrl));
      
      if (response.statusCode != 200) {
        throw Exception('Failed to download image: ${response.statusCode}');
      }
      
      // Obtenir le répertoire temporaire
      final tempDir = await getTemporaryDirectory();
      final fileName = 'ideaspark_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${tempDir.path}/$fileName';
      
      // Sauvegarder le fichier
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);
      
      print('✅ [Download] Image saved: $filePath');
      return filePath;
    } catch (e) {
      print('❌ [Download] Error: $e');
      throw Exception('Failed to download image: $e');
    }
  }
  
  /// Sauvegarde une image dans la galerie du téléphone
  static Future<bool> saveToGallery(String imageUrl) async {
    try {
      print('💾 [Gallery] Requesting permissions...');
      
      // Demander les permissions
      if (Platform.isAndroid) {
        final androidInfo = await DeviceInfoPlugin().androidInfo;
        if (androidInfo.version.sdkInt <= 32) {
          final status = await Permission.storage.request();
          if (!status.isGranted) {
            throw Exception('Storage permission denied');
          }
        } else {
          final status = await Permission.photos.request();
          if (!status.isGranted) {
            throw Exception('Photos permission denied');
          }
        }
      } else if (Platform.isIOS) {
        final status = await Permission.photos.request();
        if (!status.isGranted) {
          throw Exception('Photos permission denied');
        }
      }
      
      print('💾 [Gallery] Downloading image...');
      
      // Télécharger l'image
      final response = await http.get(Uri.parse(imageUrl));
      if (response.statusCode != 200) {
        throw Exception('Failed to download image');
      }
      
      // Sauvegarder dans la galerie
      final result = await ImageGallerySaver.saveImage(
        Uint8List.fromList(response.bodyBytes),
        quality: 100,
        name: 'ideaspark_${DateTime.now().millisecondsSinceEpoch}',
      );
      
      print('✅ [Gallery] Image saved: $result');
      return result['isSuccess'] ?? false;
    } catch (e) {
      print('❌ [Gallery] Error: $e');
      return false;
    }
  }
  
  /// Partage une image avec du texte (caption)
  static Future<void> shareImageWithCaption({
    required String imageUrl,
    required String caption,
  }) async {
    try {
      print('📤 [Share] Downloading image for sharing...');
      
      // Télécharger l'image
      final imagePath = await downloadImage(imageUrl);
      
      // Partager avec le caption
      await Share.shareXFiles(
        [XFile(imagePath)],
        text: caption,
        subject: 'IdeaSpark Post',
      );
      
      print('✅ [Share] Share dialog opened');
    } catch (e) {
      print('❌ [Share] Error: $e');
      throw Exception('Failed to share image: $e');
    }
  }
  
  /// Copie le caption dans le presse-papier et ouvre le partage d'image
  static Future<void> shareToSocialMedia({
    required String imageUrl,
    required String caption,
    String? platform, // 'instagram', 'tiktok', 'facebook'
  }) async {
    try {
      print('📤 [Social] Preparing to share to $platform');
      
      // 1. Télécharger et sauvegarder l'image dans la galerie
      final saved = await saveToGallery(imageUrl);
      if (!saved) {
        throw Exception('Failed to save image to gallery');
      }
      
      // 2. Copier le caption dans le presse-papier
      await Clipboard.setData(ClipboardData(text: caption));
      
      print('✅ [Social] Image saved to gallery');
      print('✅ [Social] Caption copied to clipboard');
      
      // 3. Ouvrir l'app de réseau social (optionnel)
      if (platform != null) {
        await _openSocialMediaApp(platform);
      }
    } catch (e) {
      print('❌ [Social] Error: $e');
      throw Exception('Failed to share to social media: $e');
    }
  }
  
  /// Ouvre l'app de réseau social (optionnel)
  static Future<void> _openSocialMediaApp(String platform) async {
    try {
      String url;
      switch (platform.toLowerCase()) {
        case 'instagram':
          url = 'instagram://';
          break;
        case 'tiktok':
          url = 'tiktok://';
          break;
        case 'facebook':
          url = 'fb://';
          break;
        default:
          return;
      }
      
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      }
    } catch (e) {
      print('⚠️ [Social] Could not open app: $e');
    }
  }
}
```

---

## 🎨 Interface utilisateur

### 1. Bouton de partage dans le dialog de génération

Modifiez `lib/views/strategic_content_manager/plan_detail_screen.dart` :

```dart
// Dans le dialog après génération d'image
if (generatedImageUrl != null) ...[
  const SizedBox(height: 16),
  
  // Image générée
  Image.network(
    generatedImageUrl!,
    height: 200,
    fit: BoxFit.cover,
  ),
  
  const SizedBox(height: 16),
  
  // Boutons d'action
  Row(
    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
    children: [
      // Sauvegarder dans la galerie
      ElevatedButton.icon(
        onPressed: () async {
          try {
            final saved = await ImageDownloadService.saveToGallery(
              generatedImageUrl!,
            );
            
            if (saved) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✅ Image sauvegardée dans la galerie'),
                  backgroundColor: Colors.green,
                ),
              );
            } else {
              throw Exception('Failed to save');
            }
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('❌ Erreur: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        icon: const Icon(Icons.download),
        label: const Text('Galerie'),
      ),
      
      // Partager avec caption
      ElevatedButton.icon(
        onPressed: () async {
          try {
            // Générer un caption (ou utiliser celui existant)
            final caption = _plan.description ?? 'Check out this post!';
            
            await ImageDownloadService.shareImageWithCaption(
              imageUrl: generatedImageUrl!,
              caption: caption,
            );
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('❌ Erreur: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        icon: const Icon(Icons.share),
        label: const Text('Partager'),
      ),
    ],
  ),
],
```

---

### 2. Menu de partage sur réseaux sociaux

Ajoutez un menu pour choisir la plateforme :

```dart
// Bouton avec menu déroulant
PopupMenuButton<String>(
  icon: const Icon(Icons.share),
  tooltip: 'Partager sur...',
  onSelected: (platform) async {
    try {
      final caption = _plan.description ?? 'Check out this post!';
      
      await ImageDownloadService.shareToSocialMedia(
        imageUrl: generatedImageUrl!,
        caption: caption,
        platform: platform,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '✅ Image sauvegardée et caption copié!\n'
            'Ouvrez $platform et collez le texte.',
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 5),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  },
  itemBuilder: (context) => [
    const PopupMenuItem(
      value: 'instagram',
      child: Row(
        children: [
          Icon(Icons.camera_alt, color: Colors.purple),
          SizedBox(width: 8),
          Text('Instagram'),
        ],
      ),
    ),
    const PopupMenuItem(
      value: 'tiktok',
      child: Row(
        children: [
          Icon(Icons.music_note, color: Colors.black),
          SizedBox(width: 8),
          Text('TikTok'),
        ],
      ),
    ),
    const PopupMenuItem(
      value: 'facebook',
      child: Row(
        children: [
          Icon(Icons.facebook, color: Colors.blue),
          SizedBox(width: 8),
          Text('Facebook'),
        ],
      ),
    ),
  ],
)
```

---

## 🔄 Flux complet de partage

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User génère une image                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Image affichée dans le dialog                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User clique "Partager sur Instagram"                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. App demande les permissions (galerie)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. App télécharge l'image depuis Unsplash/Pexels            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. App sauvegarde l'image dans la galerie du téléphone      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. App copie le caption dans le presse-papier               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. App ouvre Instagram (optionnel)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. User crée un post Instagram avec l'image de la galerie   │
│    et colle le caption (Ctrl+V)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Fonctionnalités implémentées

### 1. Sauvegarder dans la galerie
```dart
await ImageDownloadService.saveToGallery(imageUrl);
```
- ✅ Demande les permissions
- ✅ Télécharge l'image
- ✅ Sauvegarde dans la galerie du téléphone

### 2. Partager avec caption
```dart
await ImageDownloadService.shareImageWithCaption(
  imageUrl: imageUrl,
  caption: caption,
);
```
- ✅ Télécharge l'image
- ✅ Ouvre le dialog de partage natif
- ✅ Inclut le caption dans le texte

### 3. Partager sur réseau social spécifique
```dart
await ImageDownloadService.shareToSocialMedia(
  imageUrl: imageUrl,
  caption: caption,
  platform: 'instagram',
);
```
- ✅ Sauvegarde l'image dans la galerie
- ✅ Copie le caption dans le presse-papier
- ✅ Ouvre l'app du réseau social (optionnel)

---

## 📱 Expérience utilisateur

### Scénario 1 : Partage rapide
1. User génère une image
2. Clique sur "Partager"
3. Choisit l'app (WhatsApp, Email, etc.)
4. ✅ Image + caption envoyés

### Scénario 2 : Instagram/TikTok
1. User génère une image
2. Clique sur "Partager sur Instagram"
3. ✅ Image sauvegardée dans la galerie
4. ✅ Caption copié dans le presse-papier
5. Instagram s'ouvre automatiquement
6. User crée un post avec l'image de la galerie
7. User colle le caption (Ctrl+V)

---

## ⚠️ Limitations et solutions

### Limitation 1 : Instagram ne permet pas le partage direct
**Problème** : L'API Instagram ne permet pas de créer un post directement depuis une app tierce.

**Solution** :
1. Sauvegarder l'image dans la galerie
2. Copier le caption dans le presse-papier
3. Ouvrir Instagram
4. User crée le post manuellement

### Limitation 2 : Permissions refusées
**Problème** : User refuse les permissions de galerie.

**Solution** :
```dart
if (!status.isGranted) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Permission requise'),
      content: const Text(
        'Pour sauvegarder l\'image, nous avons besoin d\'accéder à votre galerie. '
        'Veuillez activer la permission dans les paramètres.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: () {
            openAppSettings();
            Navigator.pop(context);
          },
          child: const Text('Paramètres'),
        ),
      ],
    ),
  );
}
```

---

## 🧪 Tests

### Test 1 : Sauvegarder dans la galerie
```dart
// Tester sur un vrai téléphone
final saved = await ImageDownloadService.saveToGallery(
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
);
print('Saved: $saved');

// Vérifier dans la galerie du téléphone
```

### Test 2 : Partager avec caption
```dart
await ImageDownloadService.shareImageWithCaption(
  imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
  caption: 'Test caption #ideaspark',
);

// Vérifier que le dialog de partage s'ouvre
```

### Test 3 : Partager sur Instagram
```dart
await ImageDownloadService.shareToSocialMedia(
  imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
  caption: 'Test Instagram post #ideaspark',
  platform: 'instagram',
);

// Vérifier :
// 1. Image dans la galerie
// 2. Caption dans le presse-papier (Ctrl+V)
// 3. Instagram s'ouvre
```

---

## ✅ Checklist d'implémentation

- [ ] Ajouter les packages dans `pubspec.yaml`
- [ ] Configurer les permissions Android (`AndroidManifest.xml`)
- [ ] Créer `file_paths.xml` pour Android
- [ ] Configurer les permissions iOS (`Info.plist`)
- [ ] Créer `ImageDownloadService`
- [ ] Ajouter les boutons de partage dans le dialog
- [ ] Tester sur un vrai téléphone Android
- [ ] Tester sur un vrai téléphone iOS
- [ ] Gérer les erreurs de permissions
- [ ] Ajouter des messages de feedback utilisateur

---

## 🎉 Résultat final

Après implémentation, l'utilisateur pourra :
1. ✅ Générer une image pertinente
2. ✅ Sauvegarder l'image dans sa galerie
3. ✅ Partager l'image avec le caption sur n'importe quelle app
4. ✅ Partager spécifiquement sur Instagram/TikTok/Facebook avec le caption copié

**Expérience utilisateur fluide et professionnelle !** 🚀
