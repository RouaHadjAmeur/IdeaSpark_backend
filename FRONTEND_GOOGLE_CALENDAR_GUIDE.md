# 🎨 Guide Frontend - Intégration Google Calendar

## 📋 Vue d'ensemble

Ce guide explique comment intégrer Google Calendar dans votre application frontend (React, Flutter, ou autre).

---

## 🔧 Configuration Backend

### URLs de l'API (Port 3001)

```
Base URL: http://localhost:3001
```

**Endpoints disponibles :**
- `GET /google-calendar/auth-url` - Obtenir l'URL d'autorisation Google
- `GET /google-calendar/callback` - Callback OAuth (géré automatiquement)
- `POST /google-calendar/sync-entry` - Synchroniser une entrée
- `POST /google-calendar/sync-plan` - Synchroniser un plan complet

---

## 🎯 Flux d'Intégration

```
1. Utilisateur clique sur "Connecter Google Calendar"
   ↓
2. Frontend appelle GET /google-calendar/auth-url
   ↓
3. Frontend ouvre l'URL dans une popup/nouvelle fenêtre
   ↓
4. Utilisateur autorise l'accès sur Google
   ↓
5. Google redirige vers /google-calendar/callback
   ↓
6. Backend retourne les tokens (access_token, refresh_token)
   ↓
7. Frontend sauvegarde les tokens
   ↓
8. Utilisateur peut synchroniser ses calendriers
```

---

## 💻 Implémentation React/TypeScript

### 1. Service API

Créez un fichier `services/googleCalendar.service.ts` :

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CalendarEntry {
  _id: string;
  planId: string;
  contentBlockId: string;
  platform: string;
  scheduledDate: string;
  scheduledTime: string;
}

export interface SyncResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

class GoogleCalendarService {
  private tokens: GoogleTokens | null = null;

  // Sauvegarder les tokens dans localStorage
  saveTokens(tokens: GoogleTokens) {
    this.tokens = tokens;
    localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));
  }

  // Charger les tokens depuis localStorage
  loadTokens(): GoogleTokens | null {
    const stored = localStorage.getItem('google_calendar_tokens');
    if (stored) {
      this.tokens = JSON.parse(stored);
      return this.tokens;
    }
    return null;
  }

  // Vérifier si l'utilisateur est connecté à Google Calendar
  isConnected(): boolean {
    return this.tokens !== null || this.loadTokens() !== null;
  }

  // Déconnecter Google Calendar
  disconnect() {
    this.tokens = null;
    localStorage.removeItem('google_calendar_tokens');
  }

  // Obtenir l'URL d'autorisation Google
  async getAuthUrl(jwtToken: string): Promise<string> {
    const response = await axios.get(`${API_BASE_URL}/google-calendar/auth-url`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data.authUrl;
  }

  // Gérer le callback OAuth (appelé après redirection)
  async handleCallback(code: string): Promise<GoogleTokens> {
    const response = await axios.get(
      `${API_BASE_URL}/google-calendar/callback?code=${code}`
    );
    
    const tokens: GoogleTokens = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
    
    this.saveTokens(tokens);
    return tokens;
  }

  // Synchroniser une entrée de calendrier
  async syncEntry(
    calendarEntryId: string,
    jwtToken: string
  ): Promise<SyncResult> {
    if (!this.tokens) {
      throw new Error('Not connected to Google Calendar');
    }

    const response = await axios.post(
      `${API_BASE_URL}/google-calendar/sync-entry`,
      {
        calendarEntryId,
        accessToken: this.tokens.accessToken,
        refreshToken: this.tokens.refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  }

  // Synchroniser tout un plan
  async syncPlan(planId: string, jwtToken: string): Promise<any> {
    if (!this.tokens) {
      throw new Error('Not connected to Google Calendar');
    }

    const response = await axios.post(
      `${API_BASE_URL}/google-calendar/sync-plan`,
      {
        planId,
        accessToken: this.tokens.accessToken,
        refreshToken: this.tokens.refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    return response.data;
  }
}

export default new GoogleCalendarService();
```

---

### 2. Hook React personnalisé

Créez `hooks/useGoogleCalendar.ts` :

```typescript
import { useState, useEffect } from 'react';
import googleCalendarService, { GoogleTokens } from '../services/googleCalendar.service';

export const useGoogleCalendar = (jwtToken: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsConnected(googleCalendarService.isConnected());
  }, []);

  const connectGoogleCalendar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtenir l'URL d'autorisation
      const authUrl = await googleCalendarService.getAuthUrl(jwtToken);

      // 2. Ouvrir une popup pour l'autorisation
      const popup = window.open(
        authUrl,
        'Google Calendar Authorization',
        'width=600,height=700'
      );

      // 3. Écouter le message de la popup (callback)
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_CALENDAR_CALLBACK') {
          const code = event.data.code;
          
          try {
            await googleCalendarService.handleCallback(code);
            setIsConnected(true);
            popup?.close();
          } catch (err: any) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Nettoyer l'écouteur après 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setIsLoading(false);
      }, 300000);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = () => {
    googleCalendarService.disconnect();
    setIsConnected(false);
  };

  const syncEntry = async (calendarEntryId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleCalendarService.syncEntry(calendarEntryId, jwtToken);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncPlan = async (planId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleCalendarService.syncPlan(planId, jwtToken);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncEntry,
    syncPlan,
  };
};
```

---

### 3. Page de Callback

Créez `pages/GoogleCalendarCallback.tsx` :

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCalendarCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le code depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // Envoyer le code à la fenêtre parente (popup)
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_CALENDAR_CALLBACK',
            code: code,
          },
          window.location.origin
        );
        window.close();
      } else {
        // Si pas de popup, rediriger vers la page principale
        navigate('/calendar');
      }
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>🔄 Connexion à Google Calendar...</h2>
      <p>Veuillez patienter...</p>
    </div>
  );
};

export default GoogleCalendarCallback;
```

---

### 4. Composant Bouton de Connexion

Créez `components/GoogleCalendarButton.tsx` :

```typescript
import React from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

interface Props {
  jwtToken: string;
}

const GoogleCalendarButton: React.FC<Props> = ({ jwtToken }) => {
  const {
    isConnected,
    isLoading,
    error,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendar(jwtToken);

  return (
    <div style={{ padding: '20px' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          ❌ Erreur : {error}
        </div>
      )}

      {isConnected ? (
        <div>
          <div style={{ color: 'green', marginBottom: '10px' }}>
            ✅ Connecté à Google Calendar
          </div>
          <button
            onClick={disconnectGoogleCalendar}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Déconnecter Google Calendar
          </button>
        </div>
      ) : (
        <button
          onClick={connectGoogleCalendar}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? '⏳ Connexion...' : '📅 Connecter Google Calendar'}
        </button>
      )}
    </div>
  );
};

export default GoogleCalendarButton;
```

---

### 5. Composant de Synchronisation

Créez `components/CalendarSyncButton.tsx` :

```typescript
import React, { useState } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

interface Props {
  planId: string;
  jwtToken: string;
}

const CalendarSyncButton: React.FC<Props> = ({ planId, jwtToken }) => {
  const { isConnected, syncPlan } = useGoogleCalendar(jwtToken);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const syncResult = await syncPlan(planId);
      setResult(syncResult);
      alert(`✅ Synchronisation réussie ! ${syncResult.synced}/${syncResult.total} entrées synchronisées`);
    } catch (error: any) {
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ color: '#888' }}>
        ⚠️ Connectez d'abord Google Calendar pour synchroniser
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{
          padding: '10px 20px',
          backgroundColor: '#34a853',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: syncing ? 'not-allowed' : 'pointer',
          opacity: syncing ? 0.6 : 1,
        }}
      >
        {syncing ? '⏳ Synchronisation...' : '🔄 Synchroniser avec Google Calendar'}
      </button>

      {result && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
          <strong>Résultat :</strong>
          <ul>
            <li>Total : {result.total}</li>
            <li>Synchronisées : {result.synced}</li>
            <li>Échouées : {result.failed}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalendarSyncButton;
```

---

### 6. Configuration des Routes

Dans votre `App.tsx` ou fichier de routes :

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GoogleCalendarCallback from './pages/GoogleCalendarCallback';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/google-calendar/callback" element={<GoogleCalendarCallback />} />
        <Route path="/calendar" element={<CalendarPage />} />
        {/* Autres routes... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### 7. Exemple d'Utilisation Complète

```typescript
import React from 'react';
import GoogleCalendarButton from '../components/GoogleCalendarButton';
import CalendarSyncButton from '../components/CalendarSyncButton';

const CalendarPage = () => {
  // Récupérer le JWT token depuis votre contexte d'authentification
  const jwtToken = localStorage.getItem('jwt_token') || '';
  const planId = '65f1234567890abcdef12345'; // ID du plan à synchroniser

  return (
    <div style={{ padding: '20px' }}>
      <h1>📅 Gestion du Calendrier</h1>

      {/* Bouton de connexion Google Calendar */}
      <GoogleCalendarButton jwtToken={jwtToken} />

      <hr style={{ margin: '30px 0' }} />

      {/* Bouton de synchronisation */}
      <h2>Synchroniser un Plan</h2>
      <CalendarSyncButton planId={planId} jwtToken={jwtToken} />
    </div>
  );
};

export default CalendarPage;
```

---

## 📱 Implémentation Flutter/Dart

### 1. Service Google Calendar

Créez `lib/services/google_calendar_service.dart` :

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

class GoogleCalendarService {
  static const String baseUrl = 'http://localhost:3001';
  
  String? _accessToken;
  String? _refreshToken;

  // Charger les tokens depuis le stockage local
  Future<void> loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('google_access_token');
    _refreshToken = prefs.getString('google_refresh_token');
  }

  // Sauvegarder les tokens
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('google_access_token', accessToken);
    await prefs.setString('google_refresh_token', refreshToken);
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  // Vérifier si connecté
  bool isConnected() {
    return _accessToken != null && _refreshToken != null;
  }

  // Déconnecter
  Future<void> disconnect() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('google_access_token');
    await prefs.remove('google_refresh_token');
    _accessToken = null;
    _refreshToken = null;
  }

  // Obtenir l'URL d'autorisation
  Future<String> getAuthUrl(String jwtToken) async {
    final response = await http.get(
      Uri.parse('$baseUrl/google-calendar/auth-url'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['authUrl'];
    } else {
      throw Exception('Failed to get auth URL');
    }
  }

  // Ouvrir l'URL d'autorisation dans le navigateur
  Future<void> authorize(String jwtToken) async {
    final authUrl = await getAuthUrl(jwtToken);
    final uri = Uri.parse(authUrl);
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw Exception('Could not launch $authUrl');
    }
  }

  // Gérer le callback (à appeler depuis deep link)
  Future<void> handleCallback(String code) async {
    final response = await http.get(
      Uri.parse('$baseUrl/google-calendar/callback?code=$code'),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await saveTokens(data['accessToken'], data['refreshToken']);
    } else {
      throw Exception('Failed to exchange code for tokens');
    }
  }

  // Synchroniser une entrée
  Future<Map<String, dynamic>> syncEntry(
    String calendarEntryId,
    String jwtToken,
  ) async {
    if (!isConnected()) {
      throw Exception('Not connected to Google Calendar');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/google-calendar/sync-entry'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'calendarEntryId': calendarEntryId,
        'accessToken': _accessToken,
        'refreshToken': _refreshToken,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to sync entry');
    }
  }

  // Synchroniser un plan
  Future<Map<String, dynamic>> syncPlan(
    String planId,
    String jwtToken,
  ) async {
    if (!isConnected()) {
      throw Exception('Not connected to Google Calendar');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/google-calendar/sync-plan'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'planId': planId,
        'accessToken': _accessToken,
        'refreshToken': _refreshToken,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to sync plan');
    }
  }
}
```

---

### 2. Widget Bouton de Connexion

Créez `lib/widgets/google_calendar_button.dart` :

```dart
import 'package:flutter/material.dart';
import '../services/google_calendar_service.dart';

class GoogleCalendarButton extends StatefulWidget {
  final String jwtToken;

  const GoogleCalendarButton({Key? key, required this.jwtToken}) : super(key: key);

  @override
  _GoogleCalendarButtonState createState() => _GoogleCalendarButtonState();
}

class _GoogleCalendarButtonState extends State<GoogleCalendarButton> {
  final GoogleCalendarService _service = GoogleCalendarService();
  bool _isConnected = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    await _service.loadTokens();
    setState(() {
      _isConnected = _service.isConnected();
    });
  }

  Future<void> _connect() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await _service.authorize(widget.jwtToken);
      // L'utilisateur sera redirigé vers le navigateur
      // Le callback sera géré par deep link
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _disconnect() async {
    await _service.disconnect();
    setState(() {
      _isConnected = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isConnected) {
      return Column(
        children: [
          const Text(
            '✅ Connecté à Google Calendar',
            style: TextStyle(color: Colors.green),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _disconnect,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Déconnecter'),
          ),
        ],
      );
    }

    return ElevatedButton(
      onPressed: _isLoading ? null : _connect,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF4285F4),
      ),
      child: _isLoading
          ? const CircularProgressIndicator(color: Colors.white)
          : const Text('📅 Connecter Google Calendar'),
    );
  }
}
```

---

## 🔐 Configuration Google Cloud Console

### ⚠️ IMPORTANT : Mettre à jour la Redirect URI

1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre Client ID OAuth 2.0
3. Ajoutez cette URI de redirection :
   ```
   http://localhost:3001/google-calendar/callback
   ```
4. Sauvegardez

---

## 📦 Dépendances Requises

### React/TypeScript
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0"
  }
}
```

### Flutter
```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.0
  url_launcher: ^6.2.0
```

---

## ✅ Checklist d'Intégration Frontend

- [ ] Service API créé
- [ ] Hook/Service personnalisé créé
- [ ] Page de callback configurée
- [ ] Composants de connexion créés
- [ ] Composants de synchronisation créés
- [ ] Routes configurées
- [ ] Redirect URI mise à jour dans Google Cloud Console
- [ ] Tests effectués avec succès

---

## 🎉 Prochaines Améliorations

1. **Persistance des tokens côté backend** (dans la base de données)
2. **Refresh automatique des tokens** expirés
3. **Synchronisation bidirectionnelle** (Google → IdeaSpark)
4. **Gestion des conflits** d'événements
5. **Notifications** de synchronisation
6. **Interface de gestion** des événements synchronisés

---

## 📚 Documentation

- **Backend** : `src/google-calendar/README.md`
- **Tests** : `GOOGLE_CALENDAR_TEST.md`
- **API Swagger** : http://localhost:3001/api
