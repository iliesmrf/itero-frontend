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
import { useAuthStore } from '../stores/auth'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const phase    = ref('detecting')
const errorMsg = ref('')

function probe(namespace, code) {
  return new Promise((resolve, reject) => {
    const url    = namespace ? `${BACKEND_URL}/${namespace}` : BACKEND_URL
    const socket = io(url, { autoConnect: false, auth: { token: auth.token } })
    const timer  = setTimeout(() => { socket.disconnect(); reject() }, 5000)

    socket.on('room:joined', (d) => {
      clearTimeout(timer)
      socket.disconnect()
      resolve({ namespace, room: d.room })
    })
    socket.on('error', () => { clearTimeout(timer); socket.disconnect(); reject() })
    socket.on('connect_error', () => { clearTimeout(timer); socket.disconnect(); reject() })
    socket.on('connect', () => socket.emit('room:join', { code }))
    socket.connect()
  })
}

function routeFrom(namespace, room) {
  if (namespace === 'pi')     return '/pi'
  if (namespace === 'vision') return '/vision'
  return room?.format === 'dod' ? '/dod' : '/retro'
}

onMounted(async () => {
  const code = route.query.room?.toUpperCase()
  if (!code) { router.replace('/'); return }

  try {
    const { namespace, room } = await Promise.any([
      probe('',       code),
      probe('pi',     code),
      probe('vision', code),
    ])
    router.replace(`${routeFrom(namespace, room)}?room=${code}`)
  } catch {
    phase.value    = 'error'
    errorMsg.value = 'Session introuvable ou expirée.'
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
