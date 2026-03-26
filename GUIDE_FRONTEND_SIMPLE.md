# 📱 Guide Frontend Simple - Google Calendar IdeaSpark

## 🎯 Objectif

Intégrer Google Calendar dans votre application Flutter pour synchroniser les publications planifiées.

---

## 🔧 Configuration Backend

### Endpoints Disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/google-calendar/auth-url` | GET | Obtenir l'URL d'autorisation Google |
| `/google-calendar/callback` | GET | Callback OAuth (automatique) |
| `/google-calendar/create-test-event` | POST | Créer un événement de test |
| `/google-calendar/events` | GET | Lire tous les événements |
| `/google-calendar/sync-entry` | POST | Synchroniser une entrée |
| `/google-calendar/sync-plan` | POST | Synchroniser un plan complet |

**URL Backend** : `http://localhost:3001` (développement)

---

## 📱 Intégration Flutter

### 1. Installation des Packages

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  url_launcher: ^6.2.1
  shared_preferences: ^2.2.2
```

```bash
flutter pub get
```

---

### 2. Service Google Calendar

Créez `lib/services/google_calendar_service.dart` :

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';

class GoogleCalendarService {
  static const String baseUrl = 'http://localhost:3001'; // Changez en production
  
  // Tokens stockés localement
  String? _accessToken;
  String? _refreshToken;

  // 1. Obtenir l'URL d'autorisation et ouvrir le navigateur
  Future<void> authorizeGoogleCalendar() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/google-calendar/auth-url'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final authUrl = data['authUrl'];
        
        // Ouvrir le navigateur pour autoriser
        if (await canLaunchUrl(Uri.parse(authUrl))) {
          await launchUrl(Uri.parse(authUrl), mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      print('Erreur autorisation: $e');
      rethrow;
    }
  }

  // 2. Sauvegarder les tokens (après callback)
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('google_access_token', accessToken);
    await prefs.setString('google_refresh_token', refreshToken);
  }

  // 3. Charger les tokens sauvegardés
  Future<void> loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('google_access_token');
    _refreshToken = prefs.getString('google_refresh_token');
  }

  // 4. Vérifier si l'utilisateur est connecté
  bool isConnected() {
    return _accessToken != null && _refreshToken != null;
  }

  // 5. Créer un événement
  Future<Map<String, dynamic>> createEvent({
    required String title,
    required String date,
    required String time,
  }) async {
    if (!isConnected()) {
      throw Exception('Non connecté à Google Calendar');
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/google-calendar/create-test-event'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'accessToken': _accessToken,
          'refreshToken': _refreshToken,
          'title': title,
          'date': date,
          'time': time,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Erreur création événement: ${response.body}');
      }
    } catch (e) {
      print('Erreur: $e');
      rethrow;
    }
  }

  // 6. Lire les événements
  Future<List<dynamic>> getEvents({int maxResults = 50}) async {
    if (!isConnected()) {
      throw Exception('Non connecté à Google Calendar');
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/google-calendar/events'),
        headers: {'Content-Type': 'application/json'},
      );

      // Note: GET avec body nécessite une configuration spéciale
      // Alternativement, utilisez POST ou passez les tokens en query params

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['events'] ?? [];
      } else {
        throw Exception('Erreur lecture événements: ${response.body}');
      }
    } catch (e) {
      print('Erreur: $e');
      rethrow;
    }
  }

  // 7. Synchroniser un plan complet
  Future<Map<String, dynamic>> syncPlan({
    required String planId,
    required String userId,
  }) async {
    if (!isConnected()) {
      throw Exception('Non connecté à Google Calendar');
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/google-calendar/sync-plan'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN', // Token d'authentification IdeaSpark
        },
        body: jsonEncode({
          'planId': planId,
          'accessToken': _accessToken,
          'refreshToken': _refreshToken,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Erreur sync plan: ${response.body}');
      }
    } catch (e) {
      print('Erreur: $e');
      rethrow;
    }
  }

  // 8. Déconnexion
  Future<void> disconnect() async {
    _accessToken = null;
    _refreshToken = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('google_access_token');
    await prefs.remove('google_refresh_token');
  }
}
```

---

### 3. Interface Utilisateur

Créez `lib/screens/google_calendar_screen.dart` :

```dart
import 'package:flutter/material.dart';
import '../services/google_calendar_service.dart';

class GoogleCalendarScreen extends StatefulWidget {
  @override
  _GoogleCalendarScreenState createState() => _GoogleCalendarScreenState();
}

class _GoogleCalendarScreenState extends State<GoogleCalendarScreen> {
  final GoogleCalendarService _calendarService = GoogleCalendarService();
  bool _isConnected = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    await _calendarService.loadTokens();
    setState(() {
      _isConnected = _calendarService.isConnected();
    });
  }

  Future<void> _connectToGoogle() async {
    setState(() => _isLoading = true);
    
    try {
      await _calendarService.authorizeGoogleCalendar();
      
      // Après autorisation, l'utilisateur doit copier les tokens
      // Dans une vraie app, utilisez un deep link pour récupérer automatiquement
      _showTokenDialog();
    } catch (e) {
      _showError('Erreur de connexion: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showTokenDialog() {
    final accessController = TextEditingController();
    final refreshController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Entrez les tokens'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: accessController,
              decoration: InputDecoration(labelText: 'Access Token'),
            ),
            SizedBox(height: 10),
            TextField(
              controller: refreshController,
              decoration: InputDecoration(labelText: 'Refresh Token'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              await _calendarService.saveTokens(
                accessController.text,
                refreshController.text,
              );
              setState(() => _isConnected = true);
              Navigator.pop(context);
              _showSuccess('Connecté à Google Calendar !');
            },
            child: Text('Sauvegarder'),
          ),
        ],
      ),
    );
  }

  Future<void> _createTestEvent() async {
    setState(() => _isLoading = true);
    
    try {
      final result = await _calendarService.createEvent(
        title: '📱 Test depuis Flutter',
        date: '2026-03-10',
        time: '14:00',
      );
      
      _showSuccess('Événement créé ! ID: ${result['eventId']}');
    } catch (e) {
      _showError('Erreur: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _disconnect() async {
    await _calendarService.disconnect();
    setState(() => _isConnected = false);
    _showSuccess('Déconnecté de Google Calendar');
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Google Calendar'),
      ),
      body: Center(
        child: _isLoading
            ? CircularProgressIndicator()
            : Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 100,
                      color: _isConnected ? Colors.green : Colors.grey,
                    ),
                    SizedBox(height: 20),
                    Text(
                      _isConnected
                          ? 'Connecté à Google Calendar'
                          : 'Non connecté',
                      style: TextStyle(fontSize: 20),
                    ),
                    SizedBox(height: 40),
                    if (!_isConnected)
                      ElevatedButton.icon(
                        onPressed: _connectToGoogle,
                        icon: Icon(Icons.login),
                        label: Text('Connecter Google Calendar'),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            horizontal: 30,
                            vertical: 15,
                          ),
                        ),
                      ),
                    if (_isConnected) ...[
                      ElevatedButton.icon(
                        onPressed: _createTestEvent,
                        icon: Icon(Icons.add),
                        label: Text('Créer un événement test'),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            horizontal: 30,
                            vertical: 15,
                          ),
                        ),
                      ),
                      SizedBox(height: 10),
                      TextButton.icon(
                        onPressed: _disconnect,
                        icon: Icon(Icons.logout),
                        label: Text('Déconnecter'),
                      ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
```

---

### 4. Utilisation dans votre App

```dart
// Dans votre écran de plan
import 'package:your_app/services/google_calendar_service.dart';

class PlanScreen extends StatelessWidget {
  final GoogleCalendarService _calendarService = GoogleCalendarService();

  Future<void> syncPlanToCalendar(String planId) async {
    try {
      await _calendarService.loadTokens();
      
      if (!_calendarService.isConnected()) {
        // Demander à l'utilisateur de se connecter
        await _calendarService.authorizeGoogleCalendar();
        return;
      }

      // Synchroniser le plan
      final result = await _calendarService.syncPlan(
        planId: planId,
        userId: 'USER_ID',
      );

      print('Plan synchronisé: ${result['synced']} événements');
    } catch (e) {
      print('Erreur: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Mon Plan')),
      body: Column(
        children: [
          // Votre contenu...
          ElevatedButton(
            onPressed: () => syncPlanToCalendar('PLAN_ID'),
            child: Text('Synchroniser avec Google Calendar'),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔐 Gestion des Tokens

### Amélioration : Deep Links (Recommandé)

Pour une meilleure UX, configurez des deep links pour récupérer automatiquement les tokens après autorisation.

**Configuration Android** (`android/app/src/main/AndroidManifest.xml`) :

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="ideaspark"
        android:host="callback" />
</intent-filter>
```

**Configuration iOS** (`ios/Runner/Info.plist`) :

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>ideaspark</string>
        </array>
    </dict>
</array>
```

---

## 🎯 Flux Complet

```
1. Utilisateur clique "Connecter Google Calendar"
   ↓
2. App ouvre le navigateur avec l'URL d'autorisation
   ↓
3. Utilisateur autorise sur Google
   ↓
4. Google redirige vers le callback backend
   ↓
5. Backend retourne les tokens
   ↓
6. App sauvegarde les tokens localement
   ↓
7. Utilisateur peut créer/synchroniser des événements
```

---

## 📱 Exemple d'Utilisation Complète

```dart
// 1. Connexion
await googleCalendarService.authorizeGoogleCalendar();
await googleCalendarService.saveTokens(accessToken, refreshToken);

// 2. Créer un événement
final event = await googleCalendarService.createEvent(
  title: '📱 Publication Nike - Instagram',
  date: '2026-03-05',
  time: '10:00',
);
print('Événement créé: ${event['eventLink']}');

// 3. Synchroniser un plan complet
final result = await googleCalendarService.syncPlan(
  planId: 'plan123',
  userId: 'user456',
);
print('${result['synced']} événements synchronisés');

// 4. Lire les événements
final events = await googleCalendarService.getEvents(maxResults: 20);
for (var event in events) {
  print('${event['summary']} - ${event['start']}');
}
```

---

## 🚀 Prochaines Étapes

1. **Testez** le service avec votre backend
2. **Implémentez** les deep links pour une meilleure UX
3. **Ajoutez** la gestion des erreurs et du refresh automatique des tokens
4. **Créez** une interface pour afficher les événements synchronisés

---

## 📚 Fichiers de Documentation Disponibles

- `FRONTEND_GOOGLE_CALENDAR_GUIDE.md` - Guide détaillé
- `EXEMPLES_CODE_FRONTEND.md` - Exemples de code
- `QUICK_START_FRONTEND.md` - Démarrage rapide
- `GOOGLE_CALENDAR_READ_EVENTS.md` - Lecture des événements

---

## 💡 Conseils

1. **Sécurité** : Ne stockez jamais les tokens en clair dans le code
2. **Expiration** : Les access tokens expirent après 1h, utilisez le refresh token
3. **Erreurs** : Gérez les cas où l'utilisateur refuse l'autorisation
4. **UX** : Affichez un indicateur de chargement pendant les opérations

---

## 🎉 Résultat Final

Votre application Flutter pourra :
- ✅ Connecter les utilisateurs à Google Calendar
- ✅ Créer des événements automatiquement
- ✅ Synchroniser les plans marketing
- ✅ Lire les événements existants
- ✅ Afficher le calendrier dans l'app

Bonne intégration ! 🚀
