<template>
  <div class="screen">
    <div class="top">
      <div>
        <div class="template-badge" v-if="store.template"
          :style="{ color: store.template.color, borderColor: store.template.colorB, background: store.template.colorDim }">
          {{ store.template.emoji }} {{ store.template.name }}
        </div>
        <div class="title">Contribuer</div>
        <div class="sub">Propose tes idées dans chaque section · Visible par tous en temps réel</div>
      </div>
      <div class="timer-wrap">
        <div class="tring">
          <svg width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="22" fill="none" stroke="var(--surface2)" stroke-width="4"/>
            <circle cx="27" cy="27" r="22" fill="none" :stroke="timerColor" stroke-width="4"
              stroke-linecap="round"
              :style="{ strokeDasharray:'138.2', strokeDashoffset: dashOffset, transform:'rotate(-90deg)', transformOrigin:'center', transition:'stroke-dashoffset .9s linear' }"/>
          </svg>
          <div class="trtxt">{{ timerLabel }}</div>
        </div>
        <button class="tbtn" @click="toggleTimer">
          {{ timerRunning ? 'Pause' : timerSecs < TSECS ? 'Reprendre' : 'Démarrer' }}
        </button>
      </div>
    </div>

    <div v-if="!store.template" class="empty-state">
      <div class="empty-ico">⚙️</div>
      <p>Reviens à l'étape précédente pour choisir un template.</p>
    </div>

    <div v-else class="board" :style="boardCols">
      <div v-for="section in store.sections" :key="section.key" class="col"
        :style="{ borderTop: `3px solid ${section.color}` }">

        <div class="col-head">
          <span class="cdot" :style="{ background: section.color }"></span>
          <h3 :style="{ color: section.color }">{{ section.label }}</h3>
          <span class="ccnt">{{ store.contributionsBySection(section.key).length }}</span>
        </div>
        <p class="csub">{{ section.question }}</p>

        <div class="contribs">
          <div v-for="c in store.contributionsBySection(section.key)" :key="c.id"
            class="contrib" :style="{ background: section.dim, border: `1px solid ${section.border}` }">
            <div class="contrib-body">
              <span class="contrib-text">{{ c.text }}</span>
              <div class="contrib-meta">
                <span class="contrib-av" :style="{ background: colorOf(c.author) }">{{ c.author[0].toUpperCase() }}</span>
                <span class="contrib-author">{{ c.author }}</span>
              </div>
            </div>
            <button v-if="c.author === store.me?.name" class="contrib-del"
              @click="store.deleteContribution(section.key, c.id)">✕</button>
          </div>
        </div>

        <input class="col-input" :placeholder="`Ton idée… (Entrée)`"
          :style="{ '--focus-color': section.colorB || section.border }"
          @keydown.enter="addContrib($event, section.key)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useVisionStore } from '../stores/vision'

const store = useVisionStore()

const boardCols = computed(() => {
  const n = store.sections.length
  return { gridTemplateColumns: `repeat(${Math.min(n, 4)}, 1fr)` }
})

const TSECS = 900
const timerSecs    = ref(TSECS)
const timerRunning = ref(false)
let   timerInterval = null

const timerLabel = computed(() => {
  const m = Math.floor(timerSecs.value / 60), s = timerSecs.value % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})
const timerColor = computed(() =>
  timerSecs.value <= 120 ? 'var(--stop)' : timerSecs.value <= 240 ? '#facc15' : '#e879f9'
)
const dashOffset = computed(() => 138.2 * (1 - timerSecs.value / TSECS))

function toggleTimer() {
  if (timerRunning.value) {
    clearInterval(timerInterval); timerRunning.value = false
  } else {
    timerRunning.value = true
    timerInterval = setInterval(() => {
      timerSecs.value--
      if (timerSecs.value <= 0) { clearInterval(timerInterval); timerRunning.value = false }
    }, 1000)
  }
}
onUnmounted(() => clearInterval(timerInterval))

function addContrib(e, sectionKey) {
  const text = e.target.value.trim()
  if (!text) return
  store.addContribution(sectionKey, text)
  e.target.value = ''
}

const PALETTE = ['#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24']
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.top { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.template-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; border: 1px solid; border-radius: 20px; padding: 3px 10px; margin-bottom: 6px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.timer-wrap { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.tring { position: relative; width: 54px; height: 54px; }
.trtxt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; }
.tbtn { background: var(--surface2); color: var(--text); border: 1px solid var(--border); border-radius: var(--rs); padding: 6px 12px; font-size: 11px; }
.tbtn:hover { background: var(--surface3); }
.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state p { font-size: 13px; }
.board { display: grid; gap: 10px; flex: 1; }
.col { border-radius: var(--r); border: 1px solid var(--border); padding: 12px; display: flex; flex-direction: column; gap: 7px; min-height: 300px; }
.col-head { display: flex; align-items: center; gap: 7px; }
.cdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.col-head h3 { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
.ccnt { font-size: 10px; background: var(--surface2); color: var(--muted2); border-radius: 20px; padding: 1px 7px; margin-left: auto; }
.csub { font-size: 11px; color: var(--muted); line-height: 1.5; }
.contribs { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.contrib { padding: 9px 11px; border-radius: var(--rs); font-size: 12px; display: flex; align-items: flex-start; gap: 7px; animation: pop .2s ease; }
.contrib-body { flex: 1; }
.contrib-text { display: block; line-height: 1.5; }
.contrib-meta { display: flex; align-items: center; gap: 4px; margin-top: 3px; }
.contrib-av { width: 12px; height: 12px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff; }
.contrib-author { font-size: 10px; color: var(--muted); }
.contrib-del { background: none; border: none; color: var(--muted); font-size: 12px; opacity: 0; transition: opacity .15s; padding: 0; flex-shrink: 0; }
.contrib:hover .contrib-del { opacity: 1; }
.col-input { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); padding: 8px 11px; font-size: 12px; width: 100%; margin-top: auto; transition: border-color .2s; }
.col-input:focus { border-color: var(--focus-color, var(--accent-b)); }
.col-input::placeholder { color: var(--muted); }
@keyframes pop { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (max-width: 900px) { .board { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 540px) { .board { grid-template-columns: 1fr !important; } }
</style>
