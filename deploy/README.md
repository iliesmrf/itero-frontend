# Déploiement Itero

Ce répertoire contient tous les fichiers nécessaires pour déployer l'application Itero en production.

## Structure

```
deploy/
├── docker-compose.yml       # Orchestration des services
├── .env                     # Variables d'environnement (à créer)
├── .env.example            # Template des variables
├── caddy/
│   └── Caddyfile           # Configuration HTTPS reverse proxy
├── vault/
│   └── init-vault.sh       # Initialisation automatique des secrets
├── HTTPS_SETUP.md          # Documentation HTTPS/Caddy
└── VAULT_INTEGRATION.md    # Documentation Vault
```

## Prérequis

- Docker & Docker Compose installés
- Domaine pointant vers votre serveur
- Ports 80, 443, 8200, 8081 ouverts dans le firewall

## Installation rapide

### 1. Configuration

```bash
cd deploy

# Copier et éditer le fichier .env
cp .env.example .env
nano .env
```

**Variables critiques à configurer:**
```bash
# Domaine
FRONTEND_URL=https://votre-domaine.com

# MongoDB (générer des mots de passe forts)
MONGO_USER=itero
MONGO_PASSWORD=<générer-un-mot-de-passe-fort>
MONGO_DB=itero

# JWT (générer un secret fort)
JWT_SECRET=<générer-un-secret-jwt-fort>

# Vault
VAULT_TOKEN=<générer-un-token-vault>

# OAuth Google (optionnel)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://votre-domaine.com/auth/google/callback

# OAuth GitHub (optionnel)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://votre-domaine.com/auth/github/callback

# Anthropic API (optionnel - pour résumés IA)
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Génération des secrets

```bash
# Mot de passe MongoDB (20 caractères aléatoires)
openssl rand -base64 20

# JWT Secret (128 caractères hex)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Vault Token (16 caractères aléatoires)
openssl rand -base64 16
```

### 3. Configuration DNS

Assurez-vous que votre domaine pointe vers l'IP de votre serveur:

```bash
# Vérifier
dig votre-domaine.com +short
# Doit retourner l'IP du serveur
```

### 4. Configuration OAuth (optionnel)

**Google Cloud Console:**
1. https://console.cloud.google.com
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `https://votre-domaine.com/auth/google/callback`

**GitHub:**
1. https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `https://votre-domaine.com/auth/github/callback`

### 5. Déploiement

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier que tous les conteneurs sont en cours d'exécution
docker-compose ps
```

### 6. Vérification

**Services disponibles:**
- Application: https://votre-domaine.com
- Vault UI: https://votre-domaine.com/vault/ (via Caddy HTTPS)
- Vault UI direct: http://votre-serveur-ip:8200/ (HTTP, dev uniquement)
- Mongo Express: http://votre-serveur-ip:8081

**Vérifier HTTPS:**
```bash
curl -I https://votre-domaine.com
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains; preload
```

**Vérifier les logs:**
```bash
# Tous les services
docker-compose logs

# Service spécifique
docker logs itero-backend
docker logs itero-caddy
docker logs itero-vault
```

## Services

| Service       | Conteneur          | Port(s)      | Description                    | URL HTTPS              |
|---------------|-------------------|--------------|--------------------------------|------------------------|
| Caddy         | itero-caddy       | 80, 443      | Reverse proxy HTTPS            | -                      |
| Backend       | itero-backend     | 3000 (int)   | API NestJS                     | /auth/*, /socket.io/*  |
| Frontend      | itero-frontend    | 80 (int)     | SPA Vue.js                     | /                      |
| MongoDB       | itero-mongodb     | 27017        | Base de données                | -                      |
| Mongo Express | itero-mongo-express| 8081        | Interface web MongoDB          | -                      |
| Vault         | itero-vault       | 8200         | Gestion des secrets            | /vault/                |

**(int) = Port interne uniquement, non exposé publiquement**

## Gestion

### Démarrer les services

```bash
docker-compose up -d
```

### Arrêter les services

```bash
docker-compose down
```

### Redémarrer un service

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart caddy
```

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
```

### Rebuild après modifications du code

```bash
# Rebuild et redémarrer le backend
docker-compose up -d --build backend

# Rebuild et redémarrer le frontend
docker-compose up -d --build frontend
```

### Mise à jour de la configuration

**Modifier le Caddyfile:**
```bash
nano caddy/Caddyfile

# Recharger sans downtime
docker exec itero-caddy caddy reload --config /etc/caddy/Caddyfile
```

**Modifier les variables d'environnement:**
```bash
nano .env

# Redémarrer les services concernés
docker-compose restart backend frontend
```

## Sauvegarde et restauration

### Sauvegarde MongoDB

```bash
# Backup
docker exec itero-mongodb mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --authenticationDatabase=admin \
  --out=/backup

# Copier le backup hors du conteneur
docker cp itero-mongodb:/backup ./backup-$(date +%Y%m%d)

# Compresser
tar -czf backup-$(date +%Y%m%d).tar.gz ./backup-$(date +%Y%m%d)
```

### Restauration MongoDB

```bash
# Copier le backup dans le conteneur
docker cp ./backup-20261201 itero-mongodb:/backup

# Restaurer
docker exec itero-mongodb mongorestore \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --authenticationDatabase=admin \
  /backup
```

### Sauvegarde Vault

```bash
# Backup
docker exec itero-vault cat /vault/file/vault.db > vault-backup-$(date +%Y%m%d).db
```

## Monitoring

### Vérifier l'état des services

```bash
docker-compose ps
```

### Ressources utilisées

```bash
docker stats
```

### Espace disque

```bash
# Volumes Docker
docker system df -v

# Cleanup des images inutilisées
docker image prune -a

# Cleanup complet (⚠️ attention)
docker system prune -a
```

## Dépannage

### MongoDB - Erreur d'authentification

**Symptôme:** `MongoServerError: Authentication failed`

**Solution:**
```bash
# Supprimer les volumes et réinitialiser
docker-compose down
docker volume rm deploy_mongodb_data deploy_mongodb_config
docker-compose up -d
```

### Caddy - Certificat HTTPS non émis

**Symptôme:** ERR_SSL_PROTOCOL_ERROR

**Solutions:**
```bash
# 1. Vérifier DNS
dig votre-domaine.com +short

# 2. Vérifier les logs Caddy
docker logs itero-caddy | grep -i "certificate"

# 3. Vérifier le firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. Test manuel Let's Encrypt
docker exec itero-caddy caddy validate --config /etc/caddy/Caddyfile
```

### Backend - Ne démarre pas

**Vérifier les logs:**
```bash
docker logs itero-backend
```

**Problèmes courants:**
- MongoDB non accessible → Vérifier que mongodb est healthy
- Vault non accessible → Vérifier que vault est healthy
- Variables d'environnement manquantes → Vérifier .env

### WebSocket - Connexion refusée

**Vérifier la configuration Caddy:**
```bash
docker exec itero-caddy cat /etc/caddy/Caddyfile | grep -A5 "socket.io"
```

**Doit contenir:**
```caddyfile
handle /socket.io/* {
    reverse_proxy backend:3000 {
        header_up Connection {>Connection}
        header_up Upgrade {>Upgrade}
    }
}
```

## Sécurité

### Checklist de sécurité

- [ ] Mots de passe forts pour MongoDB
- [ ] JWT Secret fort (128+ caractères)
- [ ] Vault Token sécurisé
- [ ] Fichier .env non commité dans git
- [ ] HTTPS activé (Caddy)
- [ ] Firewall configuré (seulement 80, 443, 22)
- [ ] OAuth credentials valides
- [ ] Mongo Express protégé par mot de passe
- [ ] Vault UI accessible seulement en interne

### Hardening additionnel

**Firewall (UFW):**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Limiter l'accès à Vault et Mongo Express:**
```yaml
# Dans docker-compose.yml
vault:
  ports:
    - "127.0.0.1:8200:8200"  # Seulement localhost

mongo-express:
  ports:
    - "127.0.0.1:8081:8081"  # Seulement localhost
```

## Mise à jour

### Mettre à jour l'application

```bash
# 1. Pull les derniers changements
cd /path/to/itero
git pull

# 2. Rebuild les images
cd deploy
docker-compose build --no-cache

# 3. Redémarrer
docker-compose up -d

# 4. Vérifier
docker-compose ps
docker-compose logs -f
```

### Mettre à jour les dépendances

```bash
# Backend
cd ../backend
npm update
npm audit fix

# Frontend
cd ../frontend
npm update
npm audit fix

# Rebuild
cd ../deploy
docker-compose up -d --build
```

## Documentation complète

- [HTTPS_SETUP.md](./HTTPS_SETUP.md) - Configuration HTTPS avec Caddy
- [VAULT_INTEGRATION.md](./VAULT_INTEGRATION.md) - Intégration Vault

## Support

En cas de problème:
1. Vérifier les logs: `docker-compose logs -f`
2. Vérifier l'état des services: `docker-compose ps`
3. Consulter la documentation HTTPS et Vault
4. Créer une issue sur le dépôt Git
