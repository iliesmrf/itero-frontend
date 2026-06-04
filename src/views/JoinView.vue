<template>
  <div class="join-screen">
    <div v-if="phase === 'detecting'" class="state-card">
      <div class="spinner"></div>
      <p>Connexion à la session…</p>
    </div>

    <div v-else-if="phase === 'error'" class="state-card">
      <div class="ico">⚠️</div>
      <h2>Session introuvable</h2>
      <p>{{ errorMsg }}</p>
      <button class="btn-back" @click="router.push('/')">Retour</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

const TYPE_ROUTES = { retro: '/retro', dod: '/dod', pi: '/pi', vision: '/vision' }

const route  = useRoute()
const router = useRouter()

const phase    = ref('detecting')
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.room?.toUpperCase()
  if (!code) { router.replace('/'); return }

  try {
    const res = await fetch(`${BACKEND_URL}/rooms/${code}`)
    if (!res.ok) {
      phase.value    = 'error'
      errorMsg.value = res.status === 404 ? 'Session introuvable ou expirée.' : 'Erreur serveur.'
      return
    }
    const { type } = await res.json()
    router.replace(`${TYPE_ROUTES[type] || '/retro'}?room=${code}`)
  } catch {
    phase.value    = 'error'
    errorMsg.value = 'Impossible de joindre le serveur. Vérifie ta connexion.'
  }
})
</script>

<style scoped>
.join-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 360px;
  padding: 40px;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--r);
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

.state-card p { font-size: 13px; color: var(--muted2); }
.ico { font-size: 32px; }
.state-card h2 { font-size: 18px; font-weight: 700; }

.btn-back {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.btn-back:hover { background: var(--surface3); }
</style>
