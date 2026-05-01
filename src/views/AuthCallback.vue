<template>
  <div class="callback">
    <div v-if="error" class="err-card">
      <div class="ico">⚠️</div>
      <h2>Erreur d'authentification</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/')">Réessayer</button>
    </div>
    <div v-else class="loading">
      <div class="spinner"></div>
      <p>Connexion en cours…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const error  = ref('')

onMounted(async () => {
  const params = new URLSearchParams(location.search)
  const token  = params.get('token')

  if (!token) {
    error.value = 'Aucun token reçu. Réessaie la connexion.'
    return
  }

  await auth.handleCallback(token)

  if (auth.isAuthenticated) {
    // Clean URL then redirect
    const roomCode = localStorage.getItem('itero_pending_room')
    localStorage.removeItem('itero_pending_room')
    router.replace(roomCode ? `/retro?room=${roomCode}` : '/retro')
  } else {
    error.value = auth.error || 'Connexion échouée.'
  }
})
</script>

<style scoped>
.callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
}
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--muted2);
  font-size: 14px;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--surface2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.err-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 40px;
  text-align: center;
  max-width: 360px;
}
.ico { font-size: 32px; margin-bottom: 12px; }
h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
p  { font-size: 13px; color: var(--muted2); margin-bottom: 20px; }
button {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
}
button:hover { opacity: .85; }
</style>
