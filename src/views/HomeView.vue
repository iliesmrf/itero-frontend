<template>
  <div>
    <div v-if="auth.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Authenticated: join or create room -->
    <div v-else class="home">
      <div class="card">
        <!-- User info (if authenticated) -->
        <div v-if="auth.isAuthenticated" class="user-row">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="avatar" :alt="auth.user.name" />
          <div v-else class="avatar-placeholder">{{ auth.user?.name?.[0]?.toUpperCase() }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.name }}</div>
            <div class="user-email">{{ auth.user?.email || 'Anonyme' }}</div>
          </div>
          <button class="logout-btn" @click="handleLogout">Déconnexion</button>
        </div>

        <div v-if="auth.isAuthenticated" class="divider-full"></div>

        <div class="logo">ITERO</div>
        <h1>Rétro<br><em>collaborative</em></h1>

        <!-- Anonymous name input -->
        <div v-if="!auth.isAuthenticated">
          <p>Entre ton nom pour continuer :</p>
          <div class="name-input-row">
            <input
              v-model="anonymousName"
              placeholder="Ton nom"
              maxlength="30"
              class="name-input"
              @keydown.enter="handleAnonymousLogin"
            />
            <button class="btn-start" @click="handleAnonymousLogin" :disabled="!anonymousName.trim()">
              Commencer
            </button>
          </div>

          <div class="divider"><span>ou se connecter avec</span></div>
          <LoginView />
        </div>

        <!-- Authenticated view -->
        <div v-else>
          <p>Crée une salle ou rejoins une session existante.</p>

          <button class="btn-acc" @click="goCreate">✦ Créer une nouvelle salle</button>

          <div class="divider"><span>ou rejoindre</span></div>

          <div class="join-row">
            <input
              v-model="code"
              placeholder="Code de salle"
              maxlength="6"
              class="code-input"
              @input="code = code.toUpperCase()"
              @keydown.enter="goJoin"
            />
            <button class="btn-join" @click="goJoin" :disabled="code.length < 4">Rejoindre →</button>
          </div>

          <p v-if="joinError" class="err">{{ joinError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../components/LoginView.vue'

const auth   = useAuthStore()
const router = useRouter()
const code   = ref(new URLSearchParams(location.search).get('room') || '')
const joinError = ref('')
const anonymousName = ref('')

async function handleAnonymousLogin() {
  if (!anonymousName.value.trim()) return
  await auth.loginAnonymous(anonymousName.value.trim())
}

async function handleLogout() {
  await auth.logout()
}

function goCreate() {
  router.push('/retro?action=create')
}
function goJoin() {
  if (code.value.length < 4) return
  router.push(`/retro?room=${code.value}`)
}
</script>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--surface2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.home {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(167,139,250,.08) 0%, transparent 60%);
}
.card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 32px;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent-b);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name  { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: var(--rs);
  padding: 4px 10px;
  font-size: 11px;
  flex-shrink: 0;
}
.logout-btn:hover { color: var(--stop); border-color: var(--stop-b); }
.divider-full { height: 1px; background: var(--border); margin-bottom: 24px; }
.logo {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .2em;
  color: var(--accent);
  margin-bottom: 12px;
}
h1 { font-size: 28px; font-weight: 800; line-height: 1.1; margin-bottom: 8px; }
h1 em { font-style: normal; color: var(--accent); }
p { font-size: 13px; color: var(--muted2); line-height: 1.6; margin-bottom: 20px; }
.btn-acc {
  width: 100%;
  padding: 11px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .02em;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  margin-bottom: 4px;
}
.btn-acc:hover { opacity: .85; transform: translateY(-1px); }
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
}
.divider span { font-size: 12px; color: var(--muted); white-space: nowrap; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.join-row { display: flex; gap: 8px; }
.code-input {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 10px 13px;
  font-size: 16px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  transition: border-color .2s;
}
.code-input:focus { border-color: var(--accent-b); }
.code-input::placeholder { color: var(--muted); letter-spacing: .05em; font-size: 13px; font-weight: 400; }
.btn-join {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.btn-join:not(:disabled):hover { background: var(--surface3); }
.btn-join:disabled { opacity: .3; cursor: not-allowed; }
.err { font-size: 12px; color: var(--stop); margin-top: 10px; }

/* Anonymous login */
.name-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
.name-input {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 10px 13px;
  font-size: 14px;
  transition: border-color .2s;
}
.name-input:focus { border-color: var(--accent-b); }
.name-input::placeholder { color: var(--muted); }
.btn-start {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.btn-start:not(:disabled):hover { opacity: .85; }
.btn-start:disabled { opacity: .3; cursor: not-allowed; }
</style>
