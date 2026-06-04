<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">{{ store.room?.config?.name || 'Plan final du PI' }}</div>
        <div class="sub" v-if="store.room?.config">
          {{ fmtDate(store.room.config.startDate) }} → {{ fmtDate(store.room.config.endDate) }}
          · {{ store.sprints.length }} sprints
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-copy" :class="{ copied }" @click="copyPlan">
          {{ copied ? '✓ Copié !' : '📋 Exporter' }}
        </button>
        <button class="btn-finish" @click="$emit('finish')">Terminer ✓</button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-block">
        <div class="stat-num">{{ store.storyList.length }}</div>
        <div class="stat-label">User Stories</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ totalPoints }}</div>
        <div class="stat-label">Points total</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ totalCapacity }}</div>
        <div class="stat-label">Jours dispo</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ store.riskList.length }}</div>
        <div class="stat-label">Risques</div>
      </div>
      <div class="stat-block" v-if="store.confidenceAvg">
        <div class="stat-num" :style="{ color: avgColor }">{{ store.confidenceAvg }}</div>
        <div class="stat-label">Confiance /5</div>
      </div>
    </div>

    <!-- Sprint breakdown -->
    <div class="section">
      <div class="section-title">Sprints</div>
      <div class="sprint-grid">
        <div v-for="sprint in store.sprints" :key="sprint.id" class="sprint-card">
          <div class="sc-header">
            <span class="sc-name">{{ sprint.name }}</span>
            <span class="sc-dates">{{ fmtRange(sprint.startDate, sprint.endDate) }}</span>
          </div>
          <div class="sc-capacity">
            <div class="sc-bar-wrap">
              <div class="sc-bar">
                <div class="sc-fill" :style="{ width: capPct(sprint.id) + '%', background: capColor(sprint.id) }"></div>
              </div>
            </div>
            <span class="sc-pts" :style="{ color: capColor(sprint.id) }">
              {{ store.sprintPoints[sprint.id] || 0 }} pts / {{ store.sprintCapacity[sprint.id] || 0 }}j
            </span>
          </div>
          <div class="sc-stories">
            <div v-if="!(store.storiesBySprint[sprint.id] || []).length" class="sc-empty">Aucune US</div>
            <div v-for="us in (store.storiesBySprint[sprint.id] || [])" :key="us.id"
              class="sc-us clickable" @click="selectedUS = selectedUS?.id === us.id ? null : us">
              <span class="us-prio" :style="{ background: prioColor(us.priority) }"></span>
              <span class="us-title">{{ us.title }}</span>
              <span class="us-pts-badge">{{ us.points }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backlog -->
    <div v-if="store.backlogStories.length" class="section">
      <div class="section-title">Backlog non planifié ({{ store.backlogStories.length }})</div>
      <div class="backlog-list">
        <div v-for="us in store.backlogStories" :key="us.id" class="sc-us">
          <span class="us-prio" :style="{ background: prioColor(us.priority) }"></span>
          <span class="us-title">{{ us.title }}</span>
          <span class="us-pts-badge">{{ us.points }}</span>
        </div>
      </div>
    </div>

    <!-- Risks -->
    <div v-if="store.riskList.length" class="section">
      <div class="section-title">Risques ({{ store.riskList.length }})</div>
      <div class="risks-grid">
        <div v-for="risk in store.riskList" :key="risk.id" class="risk-chip"
          :style="{ borderLeftColor: riskColor(risk.level), background: riskDim(risk.level) }">
          <span class="risk-level-dot" :style="{ background: riskColor(risk.level) }"></span>
          <span class="risk-title">{{ risk.title }}</span>
        </div>
      </div>
    </div>

    <!-- Confidence -->
    <div v-if="Object.keys(store.room?.confidence || {}).length" class="section">
      <div class="section-title">Vote de confiance — moyenne {{ store.confidenceAvg }} / 5</div>
      <div class="conf-list">
        <div v-for="(vote, user) in store.room.confidence" :key="user" class="conf-row">
          <div class="conf-av" :style="{ background: colorOf(user) }">{{ user[0].toUpperCase() }}</div>
          <span class="conf-user">{{ user }}</span>
          <span class="conf-vote" :style="{ color: voteColor(vote) }">{{ vote }}/5</span>
        </div>
      </div>
    </div>

    <!-- Participants -->
    <div class="section">
      <div class="section-title">Participants</div>
      <div class="p-tags">
        <span v-for="p in contributorNames" :key="p" class="p-tag">{{ p }}</span>
      </div>
    </div>
  </div>

  <!-- US Detail drawer -->
  <transition name="drawer">
    <div v-if="selectedUS" class="us-drawer" @click.self="selectedUS = null">
      <div class="us-drawer-card">
        <div class="usd-header">
          <div class="usd-prio-badge" :style="{ background: prioDim(selectedUS.priority), borderColor: prioColor(selectedUS.priority) }">
            <span class="usd-prio-dot" :style="{ background: prioColor(selectedUS.priority) }"></span>
            {{ prioLabel(selectedUS.priority) }}
          </div>
          <button class="usd-close" @click="selectedUS = null">✕</button>
        </div>
        <div class="usd-title">{{ selectedUS.title }}</div>
        <div class="usd-meta">
          <div class="usd-row">
            <span class="usd-label">Points</span>
            <span class="usd-val pts-val">{{ selectedUS.points }} pts</span>
          </div>
          <div class="usd-row">
            <span class="usd-label">Auteur</span>
            <span class="usd-val">{{ selectedUS.author }}</span>
          </div>
          <div class="usd-row">
            <span class="usd-label">Sprint</span>
            <span class="usd-val">{{ sprintName(selectedUS.sprintId) }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePIStore } from '../stores/pi'

const store = usePIStore()
defineEmits(['finish'])

const copied     = ref(false)
const selectedUS = ref(null)

const totalPoints   = computed(() => store.storyList.reduce((s, us) => s + (us.points || 0), 0))
const totalCapacity = computed(() =>
  Object.values(store.room?.capacity || {}).reduce((sum, cap) =>
    sum + Object.values(cap).reduce((s, d) => s + (d || 0), 0), 0)
)

// Show all contributors: current participants + any past author still in stories
const contributorNames = computed(() => {
  const names = new Set(Object.keys(store.room?.participants || {}))
  for (const s of store.storyList) if (s.author) names.add(s.author)
  return [...names]
})

function sprintName(sprintId) {
  if (!sprintId) return 'Backlog'
  const sprint = store.sprints.find(s => s.id === sprintId)
  return sprint?.name || sprintId
}
function prioLabel(p) { return { high: '🔴 Haute', medium: '🟡 Moyenne', low: '🟢 Faible' }[p] || 'Moyenne' }
function prioDim(p)   { return { high: 'rgba(248,113,113,0.08)', medium: 'rgba(250,204,21,0.08)', low: 'rgba(74,222,128,0.08)' }[p] || '' }

const avgColor = computed(() => {
  const avg = Number(store.confidenceAvg)
  if (avg >= 4) return '#4ade80'
  if (avg >= 3) return '#facc15'
  if (avg >= 2) return '#fb923c'
  return '#f87171'
})

function capPct(sprintId) {
  const cap = store.sprintCapacity[sprintId] || 0
  const pts = store.sprintPoints[sprintId]   || 0
  if (!cap) return 0
  return Math.min(Math.round(pts / cap * 100), 100)
}
function capColor(sprintId) {
  const pct = capPct(sprintId)
  if (pct > 100) return 'var(--stop)'
  if (pct > 80)  return '#facc15'
  return 'var(--start)'
}
function prioColor(p) { return { high: '#f87171', medium: '#facc15', low: '#4ade80' }[p] || '#facc15' }
function riskColor(l)  { return { high: '#f87171', medium: '#facc15', low: '#4ade80' }[l]  || '#facc15' }
function riskDim(l)    { return { high: 'rgba(248,113,113,0.06)', medium: 'rgba(250,204,21,0.06)', low: 'rgba(74,222,128,0.06)' }[l] || '' }
function voteColor(v)  {
  if (v >= 4) return '#4ade80'
  if (v >= 3) return '#facc15'
  if (v >= 2) return '#fb923c'
  return '#f87171'
}

function fmtDate(d) { return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }
function fmtRange(s, e) {
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  return `${fmt(s)} – ${fmt(e)}`
}

const PALETTE = ['#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24']
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}

function copyPlan() {
  const cfg = store.room?.config
  const lines = []
  lines.push(`=== ${cfg?.name || 'PI Planning'} ===`)
  if (cfg) lines.push(`${fmtDate(cfg.startDate)} → ${fmtDate(cfg.endDate)}`)
  lines.push(`${store.storyList.length} US · ${totalPoints.value} pts · ${store.riskList.length} risques`)
  lines.push('')
  for (const sprint of store.sprints) {
    const stories = store.storiesBySprint[sprint.id] || []
    lines.push(`[ ${sprint.name} | ${fmtRange(sprint.startDate, sprint.endDate)} ]`)
    lines.push(`Capacité : ${store.sprintPoints[sprint.id] || 0} pts / ${store.sprintCapacity[sprint.id] || 0}j`)
    if (stories.length) stories.forEach(us => lines.push(`  • [${us.points}pts] ${us.title}`))
    else lines.push('  (aucune US)')
    lines.push('')
  }
  if (store.backlogStories.length) {
    lines.push('[ Backlog ]')
    store.backlogStories.forEach(us => lines.push(`  • [${us.points}pts] ${us.title}`))
    lines.push('')
  }
  if (store.riskList.length) {
    lines.push('[ Risques ]')
    store.riskList.forEach(r => lines.push(`  ${r.level.toUpperCase()} — ${r.title}`))
    lines.push('')
  }
  if (store.confidenceAvg) lines.push(`Vote de confiance : ${store.confidenceAvg}/5`)

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {})
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1100px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn-copy { display: flex; align-items: center; gap: 6px; background: var(--surface2); color: var(--text); border: 1px solid var(--border2); border-radius: var(--rs); padding: 9px 16px; font-size: 13px; font-weight: 600; transition: all .2s; }
.btn-copy:hover { border-color: var(--cont-b); color: var(--cont); }
.btn-copy.copied { background: var(--start-dim); border-color: var(--start-b); color: var(--start); }
.btn-finish { background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 9px 20px; font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif; }
.btn-finish:hover { opacity: .85; transform: translateY(-1px); }

.stats-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
.stat-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px 20px; text-align: center; flex: 1; min-width: 90px; }
.stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; }
.stat-label { font-size: 10px; color: var(--muted2); margin-top: 4px; text-transform: uppercase; letter-spacing: .06em; }

.section { margin-bottom: 28px; }
.section-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; }

.sprint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.sprint-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
.sc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sc-name { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--cont); }
.sc-dates { font-size: 10px; color: var(--muted2); }
.sc-capacity { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sc-bar-wrap { flex: 1; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.sc-bar { height: 100%; }
.sc-fill { height: 100%; border-radius: 2px; transition: width .4s; }
.sc-pts { font-size: 10px; white-space: nowrap; }
.sc-stories { display: flex; flex-direction: column; gap: 4px; }
.sc-empty { font-size: 11px; color: var(--muted); font-style: italic; }
.sc-us { display: flex; align-items: center; gap: 7px; padding: 5px 8px; background: var(--surface2); border-radius: var(--rs); }
.us-prio { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.us-title { flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.us-pts-badge { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--cont); background: var(--cont-dim); border-radius: 20px; padding: 1px 6px; flex-shrink: 0; }

.backlog-list { display: flex; flex-direction: column; gap: 5px; }

.risks-grid { display: flex; flex-direction: column; gap: 6px; }
.risk-chip { display: flex; align-items: center; gap: 8px; border-left: 3px solid; border-radius: 0 var(--rs) var(--rs) 0; padding: 8px 12px; font-size: 12px; }
.risk-level-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.risk-title { flex: 1; }

.conf-list { display: flex; flex-direction: column; gap: 7px; }
.conf-row { display: flex; align-items: center; gap: 10px; }
.conf-av { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
.conf-user { flex: 1; font-size: 12px; }
.conf-vote { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }

.p-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.p-tag { background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 3px 10px; font-size: 11px; }

.sc-us.clickable { cursor: pointer; }
.sc-us.clickable:hover { background: var(--surface3); }

/* US Drawer */
.us-drawer { position: fixed; inset: 0; z-index: 600; display: flex; align-items: flex-end; justify-content: center; background: rgba(0,0,0,.4); backdrop-filter: blur(2px); padding: 0 0 80px; }
.us-drawer-card { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 20px; width: 100%; max-width: 480px; margin: 0 16px; }
.usd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.usd-prio-badge { display: inline-flex; align-items: center; gap: 6px; border: 1px solid; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
.usd-prio-dot { width: 6px; height: 6px; border-radius: 50%; }
.usd-close { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px 8px; }
.usd-close:hover { color: var(--text); }
.usd-title { font-size: 16px; font-weight: 700; line-height: 1.4; margin-bottom: 16px; }
.usd-meta { display: flex; flex-direction: column; gap: 8px; }
.usd-row { display: flex; align-items: center; gap: 12px; }
.usd-label { font-size: 11px; color: var(--muted2); min-width: 60px; text-transform: uppercase; letter-spacing: .04em; }
.usd-val { font-size: 13px; font-weight: 600; }
.pts-val { color: var(--cont); }

.drawer-enter-active, .drawer-leave-active { transition: opacity .2s, transform .2s; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(20px); }
</style>
