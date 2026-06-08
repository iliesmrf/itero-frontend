#!/bin/bash

# Script de déploiement rapide sur Hostinger VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement d'Itero sur Hostinger VPS"
echo "=========================================="

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installation en cours..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installé. Veuillez re-exécuter le script."
    exit 0
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Installation en cours..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installé."
fi

echo "✅ Docker et Docker Compose détectés."

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo ""
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  Veuillez éditer .env avec vos valeurs sensibles:"
    echo "   nano .env"
    echo ""
    read -p "Appuyez sur Entrée quand vous avez terminé..."
fi

# Tirer les dernières images
echo ""
echo "📥 Récupération des dernières images Docker..."
docker pull mongo:7.0
docker pull nginx:alpine
docker pull node:20-alpine

# Build et démarrage
echo ""
echo "🔨 Construction et démarrage des conteneurs..."
docker-compose up -d --build

echo ""
echo "⏳ Attente que les services démarrent..."
sleep 10

# Vérifier le statut
echo ""
echo "📊 État des conteneurs:"
docker-compose ps

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📍 URLs d'accès:"
echo "   - Frontend: http://localhost/"
echo "   - Backend: http://localhost:3000"
echo "   - Mongo Express: http://localhost:8081 (admin/admin123)"
echo ""
echo "💡 Conseils:"
echo "   - Voir les logs: docker-compose logs -f"
echo "   - Arrêter: docker-compose down"
echo "   - Redémarrer: docker-compose restart"
echo ""
echo "🔐 N'oublie pas: Changer les mots de passe dans .env!"
