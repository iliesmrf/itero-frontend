<template>
  <div class="screen">
    <div class="header">
      <div class="title">Vote de confiance</div>
      <div class="sub">Évalue ta confiance dans le plan PI · Technique du Fist of Five</div>
    </div>

    <div class="vote-section">
      <div class="vote-prompt">Quelle est ta confiance dans ce plan ?</div>

      <div class="fist-row">
        <button v-for="v in votes" :key="v.value"
          class="fist-btn" :class="{ selected: myVote === v.value }"
          :style="myVote === v.value ? { background: v.bg, borderColor: v.border } : {}"
          @click="castVote(v.value)">
          <span class="fist-num">{{ v.value }}</span>
          <span class="fist-ico">{{ v.ico }}</span>
          <span class="fist-label">{{ v.label }}</span>
        </button>
      </div>

      <div v-if="myVote" class="my-vote-badge">
        Tu as voté <strong>{{ myVote }}</strong> — {{ votes.find(v => v.value === myVote)?.desc }}
      </div>
    </div>

    <!-- Results -->
    <div v-if="hasVotes" class="results-section">
      <div class="results-header">
        <div class="section-label">Résultats ({{ voteCount }}/{{ participantCount }} votes)</div>
        <div class="avg-score" :style="{ color: avgColor }">
          <span class="avg-num">{{ store.confidenceAvg }}</span>
          <span class="avg-label">/ 5</span>
        </div>
      </div>

      <!-- Gauge -->
      <div class="gauge-wrap">
        <div class="gauge">
          <div class="gauge-fill" :style="{ width: avgPct + '%', background: avgColor }"></div>
        </div>
        <div class="gauge-labels">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>

      <!-- Vote list -->
      <div class="vote-list">
        <div v-for="(vote, user) in allVotes" :key="user" class="vote-row">
          <div class="voter-av" :style="{ background: colorOf(user) }">{{ user[0].toUpperCase() }}</div>
          <div class="voter-name">{{ user }}</div>
          <div class="voter-bar-wrap">
            <div class="voter-bar" :style="{ width: (vote / 5 * 100) + '%', background: voteColor(vote) }"></div>
          </div>
          <div class="voter-num" :style="{ color: voteColor(vote) }">{{ vote }}</div>
          <div class="voter-ico">{{ votes.find(v => v.value === vote)?.ico }}</div>
        </div>
      </div>

      <!-- Consensus indicator -->
      <div class="consensus" :class="consensusClass">
        <span class="cons-ico">{{ consensusIco }}</span>
        <span>{{ consensusMsg }}</span>
      </div>
    </div>

    <div v-else class="waiting">
      <div class="waiting-ico">⏳</div>
      <p>En attente des votes de l'équipe…</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePIStore } from '../stores/pi'

const store = usePIStore()

const votes = [
  { value: 5, ico: '✋', label: 'Aligné',   desc: 'Pleinement engagé, pas de réserves',       bg: 'rgba(74,222,128,0.15)',   border: 'rgba(74,222,128,0.5)' },
  { value: 4, ico: '🤚', label: 'Confiant', desc: 'Confiant, réserves mineures',               bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.3)' },
  { value: 3, ico: '✌️', label: 'Neutre',   desc: 'Des ajustements seraient bienvenus',        bg: 'rgba(250,204,21,0.12)',   border: 'rgba(250,204,21,0.4)' },
  { value: 2, ico: '☝️', label: 'Réservé',  desc: 'Des changements importants sont nécessaires', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.4)' },
  { value: 1, ico: '✊', label: 'Bloqué',   desc: 'Impossible de m\'engager sur ce plan',      bg: 'rgba(248,113,113,0.15)',  border: 'rgba(248,113,113,0.5)' },
]

const allVotes     = computed(() => store.room?.confidence || {})
const myVote       = computed(() => store.me?.name ? allVotes.value[store.me.name] : null)
const hasVotes     = computed(() => Object.keys(allVotes.value).length > 0)
const voteCount    = computed(() => Object.keys(allVotes.value).length)
const participantCount = computed(() => Object.keys(store.room?.participants || {}).length || 1)

const avgPct       = computed(() => store.confidenceAvg ? ((store.confidenceAvg - 1) / 4 * 100) : 0)
const avgColor     = computed(() => {
  const avg = Number(store.confidenceAvg)
  if (avg >= 4) return '#4ade80'
  if (avg >= 3) return '#facc15'
  if (avg >= 2) return '#fb923c'
  return '#f87171'
})

const minVote      = computed(() => Math.min(...Object.values(allVotes.value)))
const consensusClass = computed(() => {
  if (!hasVotes.value) return ''
  if (minVote.value >= 3) return 'cons-green'
  if (minVote.value >= 2) return 'cons-yellow'
  return 'cons-red'
})
const consensusIco = computed(() => {
  if (!hasVotes.value) return ''
  if (minVote.value >= 3) return '✅'
  if (minVote.value >= 2) return '⚠️'
  return '🚫'
})
const consensusMsg = computed(() => {
  if (!hasVotes.value) return ''
  if (minVote.value >= 3) return 'Consensus atteint — le plan est validé !'
  if (minVote.value >= 2) return 'Des réserves existent — ajustements recommandés.'
  return 'Plan bloqué — discussion nécessaire avant de continuer.'
})

function castVote(v) { store.voteConfidence(v) }
function voteColor(v) {
  if (v >= 4) return '#4ade80'
  if (v >= 3) return '#facc15'
  if (v >= 2) return '#fb923c'
  return '#f87171'
}

const PALETTE = ['#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24']
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 780px; margin: 0 auto; }
.header { margin-bottom: 32px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.vote-section { margin-bottom: 32px; }
.vote-prompt { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.fist-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.fist-btn { flex: 1; min-width: 100px; background: var(--surface); border: 2px solid var(--border); border-radius: var(--r); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all .2s; }
.fist-btn:hover:not(.selected) { border-color: var(--border2); transform: translateY(-2px); }
.fist-btn.selected { transform: translateY(-3px); box-shadow: 0 4px 16px rgba(0,0,0,.2); }
.fist-num { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; }
.fist-ico { font-size: 22px; }
.fist-label { font-size: 10px; font-weight: 600; color: var(--muted2); text-transform: uppercase; letter-spacing: .06em; }

.my-vote-badge { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--rs); padding: 10px 14px; font-size: 13px; color: var(--muted2); }
.my-vote-badge strong { color: var(--text); }

/* Results */
.results-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; }
.results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.avg-score { display: flex; align-items: baseline; gap: 4px; }
.avg-num { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; line-height: 1; }
.avg-label { font-size: 16px; color: var(--muted2); }

.gauge-wrap { margin-bottom: 20px; }
.gauge { height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
.gauge-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }
.gauge-labels { display: flex; justify-content: space-between; padding: 0 2px; }
.gauge-labels span { font-size: 10px; color: var(--muted); }

.vote-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.vote-row { display: flex; align-items: center; gap: 10px; }
.voter-av { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
.voter-name { font-size: 12px; min-width: 80px; }
.voter-bar-wrap { flex: 1; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
.voter-bar { height: 100%; border-radius: 3px; transition: width .4s; }
.voter-num { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; min-width: 18px; text-align: center; }
.voter-ico { font-size: 16px; }

.consensus { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--rs); font-size: 13px; font-weight: 600; }
.cons-green  { background: var(--start-dim); border: 1px solid var(--start-b); color: var(--start); }
.cons-yellow { background: rgba(250,204,21,0.1); border: 1px solid rgba(250,204,21,0.3); color: #facc15; }
.cons-red    { background: var(--stop-dim); border: 1px solid var(--stop-b); color: var(--stop); }
.cons-ico    { font-size: 18px; }

.waiting { text-align: center; padding: 48px 24px; color: var(--muted2); }
.waiting-ico { font-size: 36px; margin-bottom: 12px; }
.waiting p { font-size: 13px; }
</style>
