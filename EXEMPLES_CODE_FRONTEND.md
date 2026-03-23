# 💻 Exemples de Code Frontend - Prêts à Copier

## 🎯 Configuration Axios (React)

### `src/config/axios.config.ts`
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Instance Axios avec configuration par défaut
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Service d'Authentification

### `src/services/auth.service.ts`
```typescript
import api from '../config/axios.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { access_token } = response.data;
    
    // Sauvegarder le token
    localStorage.setItem('jwt_token', access_token);
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const { access_token } = response.data;
    
    // Sauvegarder le token
    localStorage.setItem('jwt_token', access_token);
    
    return response.data;
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    window.location.href = '/login';
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export default new AuthService();
```

---

## 📅 Service Google Calendar (Version Complète)

### `src/services/googleCalendar.service.ts`
```typescript
import api from '../config/axios.config';

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SyncEntryRequest {
  calendarEntryId: string;
  accessToken: string;
  refreshToken: string;
}

export interface SyncPlanRequest {
  planId: string;
  accessToken: string;
  refreshToken: string;
}

export interface SyncResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

export interface SyncPlanResult {
  total: number;
  synced: number;
  failed: number;
  details: Array<{
    entryId: string;
    success: boolean;
    eventId?: string;
    eventLink?: string;
    error?: string;
  }>;
}

class GoogleCalendarService {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'google_access_token',
    REFRESH_TOKEN: 'google_refresh_token',
  };

  // Sauvegarder les tokens
  saveTokens(tokens: GoogleTokens): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  // Charger les tokens
  loadTokens(): GoogleTokens | null {
    const accessToken = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    return null;
  }

  // Vérifier si connecté
  isConnected(): boolean {
    return this.loadTokens() !== null;
  }

  // Déconnecter
  disconnect(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Obtenir l'URL d'autorisation
  async getAuthUrl(): Promise<string> {
    const response = await api.get('/google-calendar/auth-url');
    return response.data.authUrl;
  }

  // Gérer le callback OAuth
  async handleCallback(code: string): Promise<GoogleTokens> {
    const response = await api.get(`/google-calendar/callback?code=${code}`);
    
    const tokens: GoogleTokens = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
    
    this.saveTokens(tokens);
    return tokens;
  }

  // Synchroniser une entrée
  async syncEntry(calendarEntryId: string): Promise<SyncResult> {
    const tokens = this.loadTokens();
    if (!tokens) {
      throw new Error('Not connected to Google Calendar');
    }

    const response = await api.post('/google-calendar/sync-entry', {
      calendarEntryId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    return response.data;
  }

  // Synchroniser un plan
  async syncPlan(planId: string): Promise<SyncPlanResult> {
    const tokens = this.loadTokens();
    if (!tokens) {
      throw new Error('Not connected to Google Calendar');
    }

    const response = await api.post('/google-calendar/sync-plan', {
      planId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    return response.data;
  }

  // Ouvrir la popup d'autorisation
  async openAuthPopup(): Promise<GoogleTokens> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getAuthUrl();
        
        // Ouvrir la popup
        const popup = window.open(
          authUrl,
          'Google Calendar Authorization',
          'width=600,height=700,left=200,top=100'
        );

        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // Écouter le message de la popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GOOGLE_CALENDAR_CALLBACK') {
            try {
              const tokens = await this.handleCallback(event.data.code);
              window.removeEventListener('message', handleMessage);
              popup.close();
              resolve(tokens);
            } catch (error) {
              window.removeEventListener('message', handleMessage);
              popup.close();
              reject(error);
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Timeout après 5 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authorization timeout'));
        }, 300000);

      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new GoogleCalendarService();
```

---

## 🪝 Hook React Personnalisé

### `src/hooks/useGoogleCalendar.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import googleCalendarService from '../services/googleCalendar.service';
import type { SyncResult, SyncPlanResult } from '../services/googleCalendar.service';

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier la connexion au montage
  useEffect(() => {
    setIsConnected(googleCalendarService.isConnected());
  }, []);

  // Connecter Google Calendar
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await googleCalendarService.openAuthPopup();
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Calendar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Déconnecter Google Calendar
  const disconnect = useCallback(() => {
    googleCalendarService.disconnect();
    setIsConnected(false);
  }, []);

  // Synchroniser une entrée
  const syncEntry = useCallback(async (calendarEntryId: string): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleCalendarService.syncEntry(calendarEntryId);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sync entry';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Synchroniser un plan
  const syncPlan = useCallback(async (planId: string): Promise<SyncPlanResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await googleCalendarService.syncPlan(planId);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sync plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    syncEntry,
    syncPlan,
  };
};
```

---

## 🎨 Composant Bouton de Connexion (Styled)

### `src/components/GoogleCalendarButton.tsx`
```typescript
import React from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import './GoogleCalendarButton.css';

const GoogleCalendarButton: React.FC = () => {
  const { isConnected, isLoading, error, connect, disconnect } = useGoogleCalendar();

  return (
    <div className="google-calendar-button-container">
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {isConnected ? (
        <div className="connected-state">
          <div className="success-message">
            ✅ Connecté à Google Calendar
          </div>
          <button
            onClick={disconnect}
            className="btn btn-disconnect"
          >
            Déconnecter
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isLoading}
          className="btn btn-connect"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Connexion en cours...
            </>
          ) : (
            <>
              📅 Connecter Google Calendar
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default GoogleCalendarButton;
```

### `src/components/GoogleCalendarButton.css`
```css
.google-calendar-button-container {
  padding: 20px;
  max-width: 400px;
}

.error-message {
  padding: 12px;
  margin-bottom: 15px;
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
  border-radius: 6px;
  font-size: 14px;
}

.success-message {
  padding: 12px;
  margin-bottom: 15px;
  background-color: #efe;
  color: #3a3;
  border: 1px solid #cfc;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-connect {
  background-color: #4285f4;
  color: white;
}

.btn-connect:hover:not(:disabled) {
  background-color: #357ae8;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 133, 244, 0.3);
}

.btn-disconnect {
  background-color: #dc3545;
  color: white;
}

.btn-disconnect:hover {
  background-color: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.connected-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

---

## 🔄 Composant de Synchronisation

### `src/components/CalendarSyncButton.tsx`
```typescript
import React, { useState } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import './CalendarSyncButton.css';

interface Props {
  planId: string;
  planName?: string;
}

const CalendarSyncButton: React.FC<Props> = ({ planId, planName }) => {
  const { isConnected, syncPlan } = useGoogleCalendar();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const syncResult = await syncPlan(planId);
      setResult(syncResult);
    } catch (error: any) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="sync-warning">
        ⚠️ Connectez d'abord Google Calendar pour synchroniser
      </div>
    );
  }

  return (
    <div className="calendar-sync-container">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn btn-sync"
      >
        {syncing ? (
          <>
            <span className="spinner"></span>
            Synchronisation...
          </>
        ) : (
          <>
            🔄 Synchroniser {planName ? `"${planName}"` : 'le plan'}
          </>
        )}
      </button>

      {result && (
        <div className="sync-result">
          <h4>✅ Synchronisation terminée</h4>
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Total :</span>
              <span className="stat-value">{result.total}</span>
            </div>
            <div className="stat success">
              <span className="stat-label">Réussies :</span>
              <span className="stat-value">{result.synced}</span>
            </div>
            {result.failed > 0 && (
              <div className="stat error">
                <span className="stat-label">Échouées :</span>
                <span className="stat-value">{result.failed}</span>
              </div>
            )}
          </div>

          {result.details && result.details.length > 0 && (
            <div className="result-details">
              <h5>Détails :</h5>
              <ul>
                {result.details.map((detail: any, index: number) => (
                  <li key={index} className={detail.success ? 'success' : 'error'}>
                    {detail.success ? '✅' : '❌'} Entrée {detail.entryId.slice(-6)}
                    {detail.eventLink && (
                      <a
                        href={detail.eventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-link"
                      >
                        Voir dans Google Calendar
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarSyncButton;
```

### `src/components/CalendarSyncButton.css`
```css
.calendar-sync-container {
  padding: 20px;
}

.sync-warning {
  padding: 12px;
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  font-size: 14px;
}

.btn-sync {
  background-color: #34a853;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background-color: #2d8e47;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 168, 83, 0.3);
}

.sync-result {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.sync-result h4 {
  margin: 0 0 15px 0;
  color: #28a745;
  font-size: 18px;
}

.result-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #495057;
}

.stat.success .stat-value {
  color: #28a745;
}

.stat.error .stat-value {
  color: #dc3545;
}

.result-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.result-details h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #495057;
}

.result-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-details li {
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 14px;
}

.result-details li.success {
  background-color: #d4edda;
  color: #155724;
}

.result-details li.error {
  background-color: #f8d7da;
  color: #721c24;
}

.event-link {
  margin-left: 10px;
  color: #007bff;
  text-decoration: none;
  font-size: 12px;
}

.event-link:hover {
  text-decoration: underline;
}
```

---

## 📄 Page de Callback

### `src/pages/GoogleCalendarCallback.tsx`
```typescript
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_CALENDAR_ERROR', error },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/calendar?error=' + error);
      }
      return;
    }

    if (code) {
      // Envoyer le code à la fenêtre parente
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_CALENDAR_CALLBACK', code },
          window.location.origin
        );
        // La fenêtre sera fermée par le parent
      } else {
        // Si pas de popup, rediriger
        navigate('/calendar?code=' + code);
      }
    }
  }, [searchParams, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.spinner}></div>
        <h2 style={styles.title}>🔄 Connexion à Google Calendar</h2>
        <p style={styles.text}>Veuillez patienter...</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
  },
  content: {
    textAlign: 'center' as const,
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4285f4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  title: {
    color: '#333',
    marginBottom: '10px',
  },
  text: {
    color: '#666',
    fontSize: '16px',
  },
};

export default GoogleCalendarCallback;
```

---

## 🎯 Utilisation Complète dans une Page

### `src/pages/CalendarPage.tsx`
```typescript
import React from 'react';
import GoogleCalendarButton from '../components/GoogleCalendarButton';
import CalendarSyncButton from '../components/CalendarSyncButton';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  // Exemple avec plusieurs plans
  const plans = [
    { id: '65f1234567890abcdef12345', name: 'Campagne Été 2026' },
    { id: '65f9876543210fedcba98765', name: 'Lancement Produit' },
  ];

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1>📅 Gestion du Calendrier</h1>
        <p>Synchronisez vos plans avec Google Calendar</p>
      </header>

      <section className="connection-section">
        <h2>Connexion Google Calendar</h2>
        <GoogleCalendarButton />
      </section>

      <section className="sync-section">
        <h2>Synchroniser vos Plans</h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <h3>{plan.name}</h3>
              <CalendarSyncButton planId={plan.id} planName={plan.name} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CalendarPage;
```

### `src/pages/CalendarPage.css`
```css
.calendar-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 16px;
  color: #666;
}

.connection-section,
.sync-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.connection-section h2,
.sync-section h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.plan-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.plan-card h3 {
  font-size: 18px;
  color: #495057;
  margin-bottom: 15px;
}
```

---

## ✅ Checklist d'Implémentation

Copiez ces fichiers dans votre projet :

- [ ] `src/config/axios.config.ts`
- [ ] `src/services/auth.service.ts`
- [ ] `src/services/googleCalendar.service.ts`
- [ ] `src/hooks/useGoogleCalendar.ts`
- [ ] `src/components/GoogleCalendarButton.tsx`
- [ ] `src/components/GoogleCalendarButton.css`
- [ ] `src/components/CalendarSyncButton.tsx`
- [ ] `src/components/CalendarSyncButton.css`
- [ ] `src/pages/GoogleCalendarCallback.tsx`
- [ ] `src/pages/CalendarPage.tsx`
- [ ] `src/pages/CalendarPage.css`

Puis configurez les routes dans votre `App.tsx` !
