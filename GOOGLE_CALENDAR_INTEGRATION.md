# Guide d'intégration Google Calendar - Frontend

## Vue d'ensemble

Cette intégration permet aux utilisateurs de synchroniser leur calendrier de publications IdeaSpark avec Google Calendar.

## Configuration Google Cloud (Backend déjà configuré)

Le backend est déjà configuré avec les endpoints nécessaires. Vous devez juste obtenir vos identifiants Google:

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activer l'API Google Calendar
3. Créer des identifiants OAuth 2.0
4. Configurer les URI de redirection

## Endpoints API disponibles

### 1. Obtenir l'URL d'autorisation
```http
GET http://localhost:3000/google-calendar/auth-url
Authorization: Bearer <jwt-token>
```

**Réponse:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

### 2. Callback OAuth (géré automatiquement)
```http
GET http://localhost:3000/google-calendar/callback?code=<authorization-code>
```

### 3. Synchroniser une entrée
```http
POST http://localhost:3000/google-calendar/sync-entry
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "calendarEntryId": "65f1234567890abcdef12345",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0gHdP9..."
}
```

### 4. Synchroniser un plan complet
```http
POST http://localhost:3000/google-calendar/sync-plan
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "planId": "65f1234567890abcdef12345",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0gHdP9..."
}
```

## Implémentation Frontend (React/Next.js)

### Étape 1: Créer un bouton de connexion

```tsx
import { useState } from 'react';

function GoogleCalendarConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokens, setTokens] = useState(null);

  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    
    try {
      // 1. Obtenir l'URL d'autorisation
      const response = await fetch('http://localhost:3000/google-calendar/auth-url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { authUrl } = await response.json();
      
      // 2. Ouvrir dans une popup
      const popup = window.open(
        authUrl,
        'Google Calendar Authorization',
        'width=600,height=700'
      );
      
      // 3. Écouter le message de la popup
      window.addEventListener('message', (event) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          setTokens(event.data.tokens);
          popup?.close();
          
          // Sauvegarder les tokens
          localStorage.setItem('googleAccessToken', event.data.tokens.accessToken);
          localStorage.setItem('googleRefreshToken', event.data.tokens.refreshToken);
        }
      });
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button 
      onClick={connectGoogleCalendar}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google Calendar Icon */}
        <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
      </svg>
      {isConnecting ? 'Connexion...' : 'Connecter Google Calendar'}
    </button>
  );
}
```

### Étape 2: Créer une page de callback

```tsx
// pages/google-calendar-callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GoogleCalendarCallback() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code) {
      // Envoyer le code au parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          tokens: {
            accessToken: 'token-from-backend',
            refreshToken: 'refresh-token'
          }
        }, '*');
      }
    }
  }, [code]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connexion à Google Calendar...</p>
      </div>
    </div>
  );
}
```

### Étape 3: Synchroniser un plan

```tsx
function SyncPlanButton({ planId }: { planId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const syncPlan = async () => {
    setSyncing(true);
    
    try {
      const accessToken = localStorage.getItem('googleAccessToken');
      const refreshToken = localStorage.getItem('googleRefreshToken');
      
      if (!accessToken) {
        alert('Veuillez d\'abord connecter votre compte Google Calendar');
        return;
      }

      const response = await fetch('http://localhost:3000/google-calendar/sync-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          accessToken,
          refreshToken
        })
      });

      const data = await response.json();
      setResult(data);
      
      alert(`✅ ${data.synced}/${data.total} publications synchronisées avec Google Calendar`);
      
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      alert('❌ Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={syncPlan}
      disabled={syncing}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
    >
      {syncing ? (
        <>
          <span className="animate-spin inline-block mr-2">⏳</span>
          Synchronisation...
        </>
      ) : (
        <>
          📅 Synchroniser avec Google Calendar
        </>
      )}
    </button>
  );
}
```

## Implémentation Frontend (Flutter)

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';

class GoogleCalendarService {
  final String baseUrl = 'http://localhost:3000';
  
  Future<String> getAuthUrl(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/google-calendar/auth-url'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    final data = json.decode(response.body);
    return data['authUrl'];
  }
  
  Future<Map<String, dynamic>> syncPlan({
    required String planId,
    required String token,
    required String accessToken,
    String? refreshToken,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/google-calendar/sync-plan'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'planId': planId,
        'accessToken': accessToken,
        'refreshToken': refreshToken,
      }),
    );
    
    return json.decode(response.body);
  }
}

class GoogleCalendarButton extends StatefulWidget {
  @override
  _GoogleCalendarButtonState createState() => _GoogleCalendarButtonState();
}

class _GoogleCalendarButtonState extends State<GoogleCalendarButton> {
  bool isConnecting = false;
  
  Future<void> connectGoogleCalendar() async {
    setState(() => isConnecting = true);
    
    try {
      final service = GoogleCalendarService();
      final authUrl = await service.getAuthUrl(userToken);
      
      // Ouvrir dans le navigateur
      if (await canLaunch(authUrl)) {
        await launch(authUrl);
      }
    } catch (e) {
      print('Erreur: $e');
    } finally {
      setState(() => isConnecting = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: isConnecting ? null : connectGoogleCalendar,
      icon: Icon(Icons.calendar_today),
      label: Text(isConnecting ? 'Connexion...' : 'Connecter Google Calendar'),
    );
  }
}
```

## Interface utilisateur recommandée

### Page de calendrier

```
┌─────────────────────────────────────────────────┐
│  📅 Calendrier de Publications                   │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔗 Connecter Google Calendar              │  │
│  │ Synchronisez automatiquement vos          │  │
│  │ publications avec votre calendrier Google │  │
│  │                                            │  │
│  │ [Connecter maintenant]                     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Février 2026                          [MO] [WK]│
│                                                  │
│  ● Toutes les marques                           │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔄 Rotation Intelligente            ON    │  │
│  │ Espacement IA actif - pas de promos       │  │
│  │ consécutives                               │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  M   T   W   T   F   S   S                      │
│  2   3   4   5   6   7   8                      │
│  9   10  11  12  13  14  15                     │
│  16  17  18  19  20  21  22                     │
│  23  24  25  26 [27] 28                         │
│                                                  │
│  [📤 Synchroniser tout avec Google Calendar]    │
└─────────────────────────────────────────────────┘
```

## Prochaines étapes

1. ✅ Backend configuré avec les endpoints
2. ⏳ Obtenir les identifiants Google Cloud
3. ⏳ Implémenter le frontend
4. ⏳ Tester le flux complet
5. ⏳ Ajouter la persistance des tokens en base de données

## Support

Pour toute question, consultez:
- [Documentation Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 pour applications web](https://developers.google.com/identity/protocols/oauth2/web-server)
