# ⚡ Quick Start Frontend - Google Calendar

## 🎯 En 5 Minutes

### 1️⃣ Mettre à jour Google Cloud Console (OBLIGATOIRE)

```
https://console.cloud.google.com/apis/credentials
→ Sélectionner votre Client ID OAuth 2.0
→ Ajouter Redirect URI: http://localhost:3001/google-calendar/callback
→ Sauvegarder
```

### 2️⃣ Copier les Fichiers

Tous les exemples sont dans `EXEMPLES_CODE_FRONTEND.md`

**Copier dans votre projet :**
```
src/
├── config/
│   └── axios.config.ts                    ← Copier depuis EXEMPLES_CODE_FRONTEND.md
├── services/
│   ├── auth.service.ts                    ← Copier depuis EXEMPLES_CODE_FRONTEND.md
│   └── googleCalendar.service.ts          ← Copier depuis EXEMPLES_CODE_FRONTEND.md
├── hooks/
│   └── useGoogleCalendar.ts               ← Copier depuis EXEMPLES_CODE_FRONTEND.md
├── components/
│   ├── GoogleCalendarButton.tsx           ← Copier depuis EXEMPLES_CODE_FRONTEND.md
│   ├── GoogleCalendarButton.css           ← Copier depuis EXEMPLES_CODE_FRONTEND.md
│   ├── CalendarSyncButton.tsx             ← Copier depuis EXEMPLES_CODE_FRONTEND.md
│   └── CalendarSyncButton.css             ← Copier depuis EXEMPLES_CODE_FRONTEND.md
└── pages/
    ├── GoogleCalendarCallback.tsx         ← Copier depuis EXEMPLES_CODE_FRONTEND.md
    ├── CalendarPage.tsx                   ← Copier depuis EXEMPLES_CODE_FRONTEND.md
    └── CalendarPage.css                   ← Copier depuis EXEMPLES_CODE_FRONTEND.md
```

### 3️⃣ Installer les Dépendances

```bash
npm install axios react-router-dom
# ou
yarn add axios react-router-dom
```

### 4️⃣ Configurer les Routes

Dans `App.tsx` :

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
        {/* Vos autres routes... */}
      </Routes>
    </BrowserRouter>
  );
}
```

### 5️⃣ Créer le fichier .env

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=927555530226-og8d2denl0lm1bi5g2ce71ujdmk8naek.apps.googleusercontent.com
```

### 6️⃣ Démarrer et Tester

```bash
# Terminal 1 - Backend
cd IdeaSpark_backend
npm run start:dev

# Terminal 2 - Frontend
cd IdeaSpark_frontend
npm start
```

Ouvrir : http://localhost:3000/calendar

---

## 🎨 Utilisation Simple

### Dans n'importe quel composant :

```typescript
import GoogleCalendarButton from './components/GoogleCalendarButton';
import CalendarSyncButton from './components/CalendarSyncButton';

function MyComponent() {
  const planId = '65f1234567890abcdef12345';

  return (
    <div>
      <h1>Mon Calendrier</h1>
      
      {/* Bouton de connexion */}
      <GoogleCalendarButton />
      
      {/* Bouton de synchronisation */}
      <CalendarSyncButton planId={planId} planName="Ma Campagne" />
    </div>
  );
}
```

---

## 🧪 Tester

1. Cliquer sur "Connecter Google Calendar"
2. Autoriser dans la popup
3. Cliquer sur "Synchroniser le plan"
4. Vérifier dans Google Calendar : https://calendar.google.com

---

## 📚 Documentation Complète

- **Exemples de code** : `EXEMPLES_CODE_FRONTEND.md`
- **Guide complet** : `FRONTEND_GOOGLE_CALENDAR_GUIDE.md`
- **Tests backend** : `GOOGLE_CALENDAR_TEST.md`
- **Architecture** : `ARCHITECTURE_GOOGLE_CALENDAR.md`
- **Résumé** : `INTEGRATION_COMPLETE.md`

---

## 🆘 Problèmes Courants

### "Popup blocked"
→ Autoriser les popups pour localhost

### "Redirect URI mismatch"
→ Vérifier que vous avez ajouté `http://localhost:3001/google-calendar/callback` dans Google Cloud Console

### "Not connected to Google Calendar"
→ Cliquer d'abord sur "Connecter Google Calendar"

### "Network Error"
→ Vérifier que le backend tourne sur http://localhost:3001

---

## ✅ C'est tout !

Votre intégration Google Calendar est prête en 5 minutes ! 🎉
