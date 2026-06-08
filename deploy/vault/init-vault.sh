#!/bin/sh
set -e

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
sleep 5

# Check if Vault is accessible
until vault status > /dev/null 2>&1; do
  echo "⏳ Vault not ready yet, waiting..."
  sleep 2
done

echo "✅ Vault is ready!"

# Enable KV v2 secrets engine if not already enabled
echo "🔧 Enabling KV v2 secrets engine..."
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "ℹ️  KV v2 already enabled"

# Initialize secrets for Itero
echo "📝 Initializing Itero secrets..."

# MongoDB secrets
vault kv put secret/itero/mongodb \
  username="${MONGO_USER:-itero}" \
  password="${MONGO_PASSWORD:-itero_password_2024}" \
  database="${MONGO_DB:-itero}" \
  host="mongodb" \
  port="27017"

echo "✅ MongoDB secrets initialized"

# JWT secrets
vault kv put secret/itero/jwt \
  secret="${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}" \
  expiration="7d"

echo "✅ JWT secrets initialized"

# Google OAuth secrets
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
  vault kv put secret/itero/oauth/google \
    client_id="$GOOGLE_CLIENT_ID" \
    client_secret="$GOOGLE_CLIENT_SECRET" \
    redirect_uri="${GOOGLE_CALLBACK_URL:-http://localhost:3000/auth/google/callback}"
  echo "✅ Google OAuth secrets initialized"
else
  echo "⚠️  Google OAuth secrets not provided (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)"
fi

# GitHub OAuth secrets
if [ -n "$GITHUB_CLIENT_ID" ] && [ -n "$GITHUB_CLIENT_SECRET" ]; then
  vault kv put secret/itero/oauth/github \
    client_id="$GITHUB_CLIENT_ID" \
    client_secret="$GITHUB_CLIENT_SECRET" \
    redirect_uri="${GITHUB_CALLBACK_URL:-http://localhost:3000/auth/github/callback}"
  echo "✅ GitHub OAuth secrets initialized"
else
  echo "⚠️  GitHub OAuth secrets not provided (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)"
fi

# Anthropic API key
if [ -n "$ANTHROPIC_API_KEY" ]; then
  vault kv put secret/itero/anthropic \
    api_key="$ANTHROPIC_API_KEY"
  echo "✅ Anthropic API key initialized"
else
  echo "⚠️  Anthropic API key not provided (ANTHROPIC_API_KEY)"
fi

echo "🎉 Vault initialization complete!"
echo ""
echo "Access Vault UI at: http://localhost:8200/ui"
echo "Token: ${VAULT_DEV_ROOT_TOKEN_ID:-myroot}"
echo ""
