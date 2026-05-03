<template>
  <div class="dashboard">
    <div v-if="auth.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="container">
      <!-- Header -->
      <div class="dash-header">
        <div class="header-left">
          <div class="logo">ITERO</div>
          <h1>Tableau de bord</h1>
        </div>
        <div v-if="auth.isAuthenticated" class="user-badge">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="avatar-sm" :alt="auth.user.name" />
          <div v-else class="avatar-sm-placeholder">{{ auth.user?.name?.[0]?.toUpperCase() }}</div>
          <span class="user-name-sm">{{ auth.user?.name }}</span>
          <button class="logout-btn-sm" @click="handleLogout">Déconnexion</button>
        </div>
      </div>

      <!-- Anonymous name input (if not authenticated) -->
      <div v-if="!auth.isAuthenticated" class="auth-card">
        <h2>Commencer</h2>
        <p>Entre ton nom pour démarrer ou rejoindre une session :</p>
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

      <!-- Actions (if authenticated) -->
      <div v-else class="actions-section">
        <div class="action-card accent-card" @click="createRoom">
          <div class="action-icon">✦</div>
          <div class="action-content">
            <div class="action-title">Créer une nouvelle session</div>
            <div class="action-desc">Démarre une rétrospective collaborative</div>
          </div>
        </div>

        <div class="action-card">
          <div class="action-icon">🔗</div>
          <div class="action-content">
            <div class="action-title">Rejoindre une session</div>
            <div class="join-input-row">
              <input
                v-model="code"
                placeholder="Code"
                maxlength="6"
                class="join-code-input"
                @input="code = code.toUpperCase()"
                @keydown.enter="joinRoom"
              />
              <button class="btn-join-sm" @click="joinRoom" :disabled="code.length < 4">Rejoindre</button>
            </div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="auth.isAuthenticated && history.sessions.length" class="history-section">
        <div class="section-header">
          <h2>Sessions passées</h2>
          <span class="count-badge">{{ history.sessions.length }}</span>
        </div>

        <div class="history-grid">
          <div v-for="session in history.sessions" :key="session.id" class="history-card" @click="toggleSession(session.id)">
            <div class="hcard-header">
              <div class="hcard-format">
                <span class="format-emoji">{{ getFormatEmoji(session.format) }}</span>
                <span class="format-name">{{ session.formatName || session.format }}</span>
              </div>
              <button class="hcard-delete" @click.stop="deleteSession(session.id)" title="Supprimer">×</button>
            </div>

            <div class="hcard-meta">
              <span class="meta-item">📅 {{ formatDate(session.createdAt) }}</span>
              <span class="meta-item">👥 {{ session.participantCount }} participant{{ session.participantCount > 1 ? 's' : '' }}</span>
            </div>

            <div class="hcard-stats">
              <div class="stat-pill">{{ session.noteCount }} notes</div>
              <div class="stat-pill">{{ session.actionCount }} actions</div>
            </div>

            <!-- Expanded content -->
            <div v-if="expandedSession === session.id" class="hcard-body" @click.stop>
              <div v-if="session.participants?.length" class="participants-list">
                <div class="label-sm">Participants</div>
                <div class="participants-tags">
                  <span v-for="p in session.participants" :key="p" class="p-tag">{{ p }}</span>
                </div>
              </div>

              <div v-if="session.summary?.text" class="summary-preview">
                <div class="label-sm">Résumé</div>
                <div class="summary-text" v-html="renderSummary(session.summary.text)"></div>
              </div>

              <div v-if="session.actions?.length" class="actions-preview">
                <div class="label-sm">Actions ({{ session.actions.length }})</div>
                <div class="actions-list">
                  <div v-for="action in session.actions.slice(0, 5)" :key="action.id" class="action-item">
                    <span class="action-prio" :class="`prio-${action.priority}`">{{ getPrioEmoji(action.priority) }}</span>
                    <span class="action-text">{{ action.text }}</span>
                    <span v-if="action.owner" class="action-owner">→ {{ action.owner }}</span>
                  </div>
                  <div v-if="session.actions.length > 5" class="more-actions">
                    +{{ session.actions.length - 5 }} autres actions
                  </div>
                </div>
              </div>
            </div>

            <button class="expand-btn" @click.stop="toggleSession(session.id)">
              {{ expandedSession === session.id ? '▲ Réduire' : '▼ Voir les détails' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="auth.isAuthenticated" class="empty-history">
        <div class="empty-icon">📝</div>
        <h3>Aucune session enregistrée</h3>
        <p>Les sessions terminées apparaîtront ici avec leur résumé et actions.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHistoryStore } from '../stores/history'
import { RETRO_FORMATS } from '../retro-formats.js'
import LoginView from '../components/LoginView.vue'

const router = useRouter()
const auth = useAuthStore()
const history = useHistoryStore()

const anonymousName = ref('')
const code = ref('')
const expandedSession = ref(null)

async function handleAnonymousLogin() {
  if (!anonymousName.value.trim()) return
  await auth.loginAnonymous(anonymousName.value.trim())
}

async function handleLogout() {
  await auth.logout()
}

function createRoom() {
  router.push('/retro?action=create')
}

function joinRoom() {
  if (code.value.length < 4) return
  router.push(`/retro?room=${code.value}`)
}

function toggleSession(id) {
  expandedSession.value = expandedSession.value === id ? null : id
}

function deleteSession(id) {
  if (confirm('Supprimer cette session de l\'historique ?')) {
    history.removeSession(id)
  }
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getFormatEmoji(formatId) {
  return RETRO_FORMATS[formatId]?.emoji || '🔄'
}

function getPrioEmoji(priority) {
  return { high: '🔴', medium: '🟡', low: '🟢' }[priority] || '⚪'
}

function renderSummary(text) {
  if (!text) return ''
  // Simple markdown rendering
  return text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .slice(0, 500) + (text.length > 500 ? '...' : '')
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(167,139,250,.06) 0%, transparent 60%);
  padding: 24px;
}
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

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo {
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .2em;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-b);
  padding: 6px 12px;
  border-radius: var(--rs);
}
h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--rs);
  padding: 6px 10px 6px 6px;
}
.avatar-sm, .avatar-sm-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar-sm {
  object-fit: cover;
}
.avatar-sm-placeholder {
  background: var(--accent-dim);
  border: 1px solid var(--accent-b);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}
.user-name-sm {
  font-size: 13px;
  font-weight: 500;
}
.logout-btn-sm {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: var(--rs);
  padding: 4px 10px;
  font-size: 11px;
}
.logout-btn-sm:hover {
  color: var(--stop);
  border-color: var(--stop-b);
}

/* Auth Card */
.auth-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  margin: 0 auto 40px;
}
.auth-card h2 {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
}
.auth-card p {
  font-size: 13px;
  color: var(--muted2);
  margin-bottom: 20px;
}
.name-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.name-input {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 10px 13px;
  font-size: 14px;
  transition: border-color .2s;
}
.name-input:focus {
  border-color: var(--accent-b);
}
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
.btn-start:not(:disabled):hover {
  opacity: .85;
}
.btn-start:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
}
.divider span {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* Actions */
.actions-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}
.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 24px;
  cursor: pointer;
  transition: all .2s;
}
.action-card:hover {
  border-color: var(--accent-b);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.accent-card {
  background: var(--accent-dim);
  border-color: var(--accent-b);
}
.accent-card:hover {
  background: var(--accent);
  color: #fff;
}
.action-icon {
  font-size: 32px;
  flex-shrink: 0;
}
.action-content {
  flex: 1;
}
.action-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}
.action-desc {
  font-size: 12px;
  color: var(--muted2);
}

.join-input-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.join-code-input {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 8px 12px;
  font-size: 14px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.join-code-input:focus {
  border-color: var(--accent-b);
}
.btn-join-sm {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
}
.btn-join-sm:not(:disabled):hover {
  opacity: .85;
}
.btn-join-sm:disabled {
  opacity: .3;
  cursor: not-allowed;
}

/* History */
.history-section {
  margin-top: 48px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}
.count-badge {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-b);
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
}

.history-grid {
  display: grid;
  gap: 16px;
}
.history-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 20px;
  cursor: pointer;
  transition: all .2s;
}
.history-card:hover {
  border-color: var(--border2);
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

.hcard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.hcard-format {
  display: flex;
  align-items: center;
  gap: 8px;
}
.format-emoji {
  font-size: 20px;
}
.format-name {
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
}
.hcard-delete {
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}
.hcard-delete:hover {
  background: var(--stop-dim);
  border-color: var(--stop-b);
  color: var(--stop);
}

.hcard-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.meta-item {
  font-size: 12px;
  color: var(--muted2);
}

.hcard-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.stat-pill {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--muted2);
}

.expand-btn {
  width: 100%;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--rs);
  padding: 8px;
  font-size: 11px;
  color: var(--muted);
  margin-top: 12px;
}
.expand-btn:hover {
  background: var(--surface2);
}

.hcard-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.label-sm {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 8px;
}

.participants-list {
  margin-bottom: 16px;
}
.participants-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.p-tag {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  color: var(--text);
}

.summary-preview {
  margin-bottom: 16px;
}
.summary-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted2);
}
.summary-text :deep(h2),
.summary-text :deep(h3),
.summary-text :deep(h4) {
  font-size: 13px;
  font-weight: 700;
  margin: 8px 0 4px;
  color: var(--text);
}
.summary-text :deep(ul) {
  padding-left: 18px;
  margin: 4px 0;
}
.summary-text :deep(strong) {
  color: var(--text);
  font-weight: 600;
}

.actions-preview {
  margin-bottom: 8px;
}
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface2);
  border-radius: var(--rs);
  padding: 8px 10px;
  font-size: 12px;
}
.action-prio {
  font-size: 12px;
  flex-shrink: 0;
}
.action-text {
  flex: 1;
}
.action-owner {
  font-size: 11px;
  color: var(--accent);
}
.more-actions {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  padding: 6px;
}

/* Empty state */
.empty-history {
  text-align: center;
  padding: 60px 24px;
  color: var(--muted2);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-history h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.empty-history p {
  font-size: 13px;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.6;
}
</style>
