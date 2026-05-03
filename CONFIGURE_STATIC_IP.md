# Configuration IP Statique pour le Backend

## Étapes pour configurer une IP fixe sur Windows

### 1. Ouvrir les Paramètres Réseau
1. Cliquez sur l'icône WiFi dans la barre des tâches
2. Cliquez sur "Paramètres réseau et Internet"
3. Cliquez sur "WiFi" puis "Propriétés du matériel"

### 2. Configurer l'IP Statique
1. Sous "Paramètres IP", cliquez sur "Modifier"
2. Changez de "Automatique (DHCP)" à "Manuel"
3. Activez "IPv4"
4. Entrez ces valeurs:

```
Adresse IP: 192.168.1.100
Masque de sous-réseau: 255.255.255.0
Passerelle: 192.168.1.1
DNS préféré: 8.8.8.8
DNS auxiliaire: 8.8.4.4
```

5. Cliquez sur "Enregistrer"

### 3. Vérifier la Configuration
Ouvrez PowerShell et tapez:
```bash
ipconfig
```

Vous devriez voir:
```
Adresse IPv4. . . . . . . . . . . . . .: 192.168.1.100
```

### 4. Redémarrer le Backend
```bash
npm start
```

### 5. Tester depuis le Téléphone
Ouvrez le navigateur de votre téléphone et allez sur:
```
http://192.168.1.100:3000
```

### 6. Mettre à Jour l'App Flutter
Dans votre code Flutter, utilisez:
```dart
final String baseUrl = 'http://192.168.1.100:3000';
```

---

## Alternative: Utiliser l'IP actuelle du PC

Si vous ne voulez pas configurer d'IP statique, trouvez l'IP actuelle de votre PC:

```bash
ipconfig | Select-String "192.168.1"
```

Et utilisez cette IP dans votre app Flutter.

---

## Note Importante

⚠️ Vous ne pouvez PAS utiliser `192.168.1.24` pour votre PC car c'est déjà l'IP de votre téléphone!

Choisissez une IP différente comme:
- `192.168.1.100`
- `192.168.1.50`
- `192.168.1.200`

Tant qu'elle est dans la plage 192.168.1.2 à 192.168.1.254 (sauf 192.168.1.24 qui est prise par votre téléphone).
