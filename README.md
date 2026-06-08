# ITERO — Rétro Collaborative

NestJS + Vue 3 · WebSockets · OAuth Google & GitHub

## Structure

```
itero/
├── backend/   → NestJS + Socket.IO + Passport OAuth
└── frontend/  → Vue 3 + Pinia + Vue Router + Vite
```

---

## 🚀 Démarrage rapide

### Backend

```bash
cd backend
npm install
cp .env.example .env   # puis remplis les clés OAuth
npm run start:dev      # → http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # → http://itero.mantiq.fr:5173
```

---

## 🔑 Configuration OAuth

### Google

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → **Create OAuth 2.0 Client ID**
3. Application type : **Web application**
4. Authorized redirect URIs : `http://localhost:3000/auth/google/callback`
5. Copie `Client ID` et `Client Secret` dans `backend/.env`

### GitHub

1. Va sur [github.com/settings/developers](https://github.com/settings/developers)
2. **New OAuth App**
3. Homepage URL : `http://itero.mantiq.fr:5173`
4. Authorization callback URL : `http://localhost:3000/auth/github/callback`
5. Copie `Client ID` et génère un `Client Secret` dans `backend/.env`

---

## ⚙️ Variables d'environnement

### `backend/.env`
```
PORT=3000
FRONTEND_URL=http://itero.mantiq.fr:5173
JWT_SECRET=change-this-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### `frontend/.env`
```
VITE_BACKEND_URL=http://localhost:3000
```

---

## 📡 Architecture

```
Browser → OAuth Provider (Google/GitHub)
       ↓
NestJS /auth/callback → JWT signé
       ↓
Frontend stocke JWT dans localStorage
       ↓
Socket.IO handshake avec JWT dans auth.token
       ↓
Gateway vérifie JWT → connecte à la room
```

### Événements WebSocket

| Client → Serveur | Description |
|---|---|
| `room:create` | Créer une salle (pas de payload — user vient du JWT) |
| `room:join { code }` | Rejoindre une salle |
| `step:set { step }` | Changer d'étape |
| `note:add { text, col }` | Ajouter une note |
| `note:delete { noteId }` | Supprimer sa note |
| `vote:cast { noteId }` | Voter |
| `vote:remove { noteId }` | Retirer un vote |
| `action:add { text, owner, date, priority }` | Ajouter une action |
| `action:delete { actionId }` | Supprimer une action |

---

## 🌐 Déploiement

### Backend → Railway / Render
```bash
npm run build
# Start: node dist/main.js
# Ajouter les variables d'env dans le dashboard
# Mettre à jour GOOGLE_CALLBACK_URL et GITHUB_CALLBACK_URL avec la prod URL
```

### Frontend → Netlify / Vercel
```bash
npm run build   # → dist/
# VITE_BACKEND_URL=https://ton-backend.railway.app
```

