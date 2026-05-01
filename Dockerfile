# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Argument pour l'URL du backend
ARG VITE_BACKEND_URL=https://itero.mantiq.fr
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Production stage avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés depuis le builder vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer les ports
EXPOSE 80 443

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
