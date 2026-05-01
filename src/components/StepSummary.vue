<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">Résumé</div>
        <div class="sub">Synthèse de la session · Historisée dans la salle</div>
      </div>
      <button class="btn-gen" @click="store.generateSummary()"
        :disabled="store.summaryGenerating || !!store.room?.summary">
        <span v-if="store.summaryGenerating">
          <span class="spinner-inline"></span> Génération…
        </span>
        <span v-else-if="store.room?.summary">✓ Résumé généré</span>
        <span v-else>✨ Générer le résumé IA</span>
      </button>
    </div>

    <!-- Generating state -->
    <div v-if="store.summaryGenerating" class="generating">
      <div class="spinner"></div>
      <p>Analyse de la rétro en cours…</p>
    </div>

    <!-- Summary -->
    <div v-else-if="store.room?.summary" class="summary-block">
      <div class="summary-meta">
        <span class="meta-chip">{{ formatName }}</span>
        <span class="meta-chip">{{ participantCount }} participant{{ participantCount > 1 ? 's' : '' }}</span>
        <span class="meta-chip">{{ noteCount }} notes</span>
        <span class="meta-chip">{{ actionCount }} actions</span>
        <span class="meta-date">{{ generatedAt }}</span>
      </div>

      <!-- AI text (markdown rendered simply) -->
      <div class="summary-text" v-html="renderedSummary"></div>

      <!-- Top voted -->
      <div v-if="topVoted.length" class="top-voted">
        <div class="section-label">Points les plus votés</div>
        <div class="voted-list">
          <div v-for="(item, i) in topVoted" :key="i" class="voted-row">
            <span class="voted-rank">#{{ i + 1 }}</span>
            <span class="voted-text">{{ item.text }}</span>
            <span class="voted-col">{{ colLabel(item.col) }}</span>
            <span class="voted-score">{{ item.votes }} ★</span>
          </div>
        </div>
      </div>

      <!-- Finish button -->
      <div class="finish-section">
        <button class="btn-finish" @click="finishRetro">
          ✓ Terminer et retourner à l'accueil
        </button>
      </div>
    </div>

    <!-- No summary yet -->
    <div v-else class="empty-state">
      <div class="empty-ico">📋</div>
      <h3>Résumé non encore généré</h3>
      <p>Clique sur "Générer le résumé IA" pour obtenir une synthèse de la session avec les points clés et les actions décidées.</p>
    </div>

    <!-- History -->
    <div class="history-section" v-if="history.length">
      <div class="section-label">Historique de la salle ({{ history.length }} session{{ history.length > 1 ? 's' : '' }})</div>
      <div class="history-list">
        <div v-for="entry in history" :key="entry.id" class="history-card"
          :class="{ current: entry.id === currentHistoryId }"
          @click="toggleEntry(entry.id)">
          <div class="history-head">
            <span class="history-fmt">{{ formatEmoji(entry.format) }} {{ formatLabel(entry.format) }}</span>
            <span class="history-date">{{ formatDate(entry.createdAt) }}</span>
            <span class="history-stats">{{ entry.noteCount }} notes · {{ entry.actionCount }} actions</span>
            <span class="history-chevron">{{ openEntryId === entry.id ? '▲' : '▼' }}</span>
          </div>
          <div class="history-participants">
            {{ entry.participantNames.join(', ') }}
          </div>

          <!-- Expanded -->
          <div v-if="openEntryId === entry.id" class="history-body" @click.stop>
            <div v-if="entry.summary?.text" class="history-summary" v-html="renderMd(entry.summary.text)"></div>
            <div v-if="entry.actions.length" class="history-actions">
              <div class="section-label" style="margin-bottom:8px">Actions</div>
              <div v-for="a in entry.actions" :key="a.id" class="haction">
                <span class="hprio" :class="`hp-${a.priority}`">{{ prioLabel(a.priority) }}</span>
                <span class="htext">{{ a.text }}</span>
                <span v-if="a.owner" class="howner">→ {{ a.owner }}</span>
                <span v-if="a.date" class="hdate">{{ a.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRetroStore } from '../stores/retro'
import { useHistoryStore } from '../stores/history'
import { RETRO_FORMATS } from '../retro-formats.js'

const router = useRouter()
const store = useRetroStore()
const historyStore = useHistoryStore()
const openEntryId = ref(null)

const history = computed(() => store.room?.history || [])
const currentHistoryId = computed(() => history.value[0]?.id)

const formatName      = computed(() => RETRO_FORMATS[store.room?.format]?.name || '')
const participantCount = computed(() => Object.keys(store.room?.participants || {}).length)
const noteCount       = computed(() => Object.keys(store.room?.notes || {}).length)
const actionCount     = computed(() => store.room?.summary?.actionCount || 0)
const topVoted        = computed(() => store.room?.summary?.topVotedNotes?.filter(n => n.votes > 0) || [])
const generatedAt     = computed(() => {
  const ts = store.room?.summary?.generatedAt
  return ts ? new Date(ts).toLocaleString('fr-FR') : ''
})

function colLabel(key) {
  const col = store.cols.find(c => c.key === key)
  return col?.label || key
}

// Simple markdown → HTML (bold, headers, lists)
function renderMd(text) {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^# (.+)$/gm,   '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/^- (.+)$/gm,   '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '$1')
    .trim()
}
const renderedSummary = computed(() => renderMd(store.room?.summary?.text || ''))

function toggleEntry(id) { openEntryId.value = openEntryId.value === id ? null : id }

function formatDate(ts)  { return new Date(ts).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
function formatEmoji(id) { return RETRO_FORMATS[id]?.emoji || '🔄' }
function formatLabel(id) { return RETRO_FORMATS[id]?.name || id }
function prioLabel(p)    { return { high:'🔴 Haute', medium:'🟡 Moyenne', low:'🟢 Faible' }[p] || p }

function finishRetro() {
  // Save session to history
  if (store.room?.summary) {
    const format = RETRO_FORMATS[store.room.format]
    historyStore.addSession({
      id: Date.now(),
      roomCode: store.room.code,
      format: store.room.format,
      formatName: format?.name || store.room.format,
      participantCount: Object.keys(store.room.participants || {}).length,
      participants: Object.keys(store.room.participants || {}),
      noteCount: Object.keys(store.room.notes || {}).length,
      actionCount: Object.keys(store.room.actions || {}).length,
      summary: store.room.summary,
      actions: Object.values(store.room.actions || {}),
      createdAt: store.room.summary.generatedAt || Date.now(),
    })
  }

  // Redirect to dashboard
  router.push('/')
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 900px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.btn-gen {
  display: flex; align-items: center; gap: 8px;
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--rs); padding: 10px 20px;
  font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif;
  flex-shrink: 0; white-space: nowrap;
}
.btn-gen:not(:disabled):hover { opacity: .85; }
.btn-gen:disabled { opacity: .4; cursor: not-allowed; }
.spinner-inline { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Generating */
.generating { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px; color: var(--muted2); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--surface2); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }

/* Summary */
.summary-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 24px; margin-bottom: 24px; }
.summary-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.meta-chip { font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 3px 10px; color: var(--muted2); }
.meta-date { font-size: 11px; color: var(--muted); margin-left: auto; }
.summary-text { font-size: 14px; line-height: 1.8; color: var(--text); }
.summary-text :deep(h2) { font-size: 16px; font-weight: 700; margin: 16px 0 8px; }
.summary-text :deep(h3) { font-size: 15px; font-weight: 700; margin: 14px 0 6px; color: var(--accent); }
.summary-text :deep(h4) { font-size: 13px; font-weight: 700; margin: 12px 0 4px; }
.summary-text :deep(ul) { padding-left: 18px; margin: 6px 0; }
.summary-text :deep(li) { margin: 3px 0; }
.summary-text :deep(strong) { color: var(--text); font-weight: 600; }
.summary-text :deep(p) { margin: 6px 0; }

/* Top voted */
.top-voted { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
.section-label { font-size: 11px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 12px; }
.voted-list { display: flex; flex-direction: column; gap: 6px; }
.voted-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--surface2); border-radius: var(--rs); font-size: 12px; }
.voted-rank { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--muted); min-width: 24px; }
.voted-text { flex: 1; }
.voted-col { font-size: 10px; color: var(--muted); background: var(--surface3); border-radius: 20px; padding: 2px 8px; }
.voted-score { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--accent); }

/* Empty */
.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.empty-state p { font-size: 13px; max-width: 400px; margin: 0 auto; line-height: 1.6; }

/* History */
.history-section { margin-top: 32px; }
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; cursor: pointer; transition: border-color .2s; }
.history-card:hover { border-color: var(--border2); }
.history-card.current { border-color: var(--accent-b); }
.history-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; flex-wrap: wrap; }
.history-fmt { font-size: 13px; font-weight: 600; }
.history-date { font-size: 11px; color: var(--muted); }
.history-stats { font-size: 11px; color: var(--muted2); background: var(--surface2); border-radius: 20px; padding: 2px 8px; }
.history-chevron { font-size: 10px; color: var(--muted); margin-left: auto; }
.history-participants { padding: 0 16px 12px; font-size: 11px; color: var(--muted); }
.history-body { padding: 0 16px 16px; border-top: 1px solid var(--border); padding-top: 16px; }
.history-summary { font-size: 13px; line-height: 1.7; margin-bottom: 16px; color: var(--muted2); }
.history-summary :deep(h2,.h3,h4) { font-size: 13px; font-weight: 700; margin: 8px 0 4px; color: var(--text); }
.history-summary :deep(ul) { padding-left: 16px; }
.history-summary :deep(strong) { color: var(--text); }
.history-actions { display: flex; flex-direction: column; gap: 6px; }
.haction { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 7px 10px; background: var(--surface2); border-radius: var(--rs); }
.hprio { font-size: 10px; flex-shrink: 0; }
.htext { flex: 1; }
.howner { font-size: 11px; color: var(--accent); }
.hdate { font-size: 10px; color: var(--muted); }

/* Finish section */
.finish-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); text-align: center; }
.btn-finish {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--rs); padding: 12px 28px;
  font-size: 14px; font-weight: 700; font-family: 'Syne', sans-serif;
}
.btn-finish:hover { opacity: .85; transform: translateY(-1px); }
</style>
