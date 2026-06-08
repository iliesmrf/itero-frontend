<template>
  <div class="screen">
    <div class="top">
      <div>
        <div class="title">Collecter</div>
        <div class="sub">Entrée pour valider · Visible par tous en temps réel</div>
      </div>
      <div class="timer-wrap">
        <div class="tring">
          <svg width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="22" fill="none" stroke="var(--surface2)" stroke-width="4"/>
            <circle cx="27" cy="27" r="22" fill="none" :stroke="timerColor" stroke-width="4"
              stroke-linecap="round"
              :style="{ strokeDasharray:'138.2', strokeDashoffset: dashOffset,
                        transform:'rotate(-90deg)', transformOrigin:'center', transition:'stroke-dashoffset .9s linear' }"/>
          </svg>
          <div class="trtxt">{{ timerLabel }}</div>
        </div>
        <button class="tbtn" @click="toggleTimer">
          {{ timerRunning ? 'Pause' : timerSecs < TSECS ? 'Reprendre' : 'Démarrer' }}
        </button>
      </div>
    </div>

    <div class="board" :style="{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }">
      <div v-for="col in cols" :key="col.key" class="col"
        :style="{ borderTop: `3px solid ${col.color}` }">
        <div class="colhead">
          <span class="cdot" :style="{ background: col.color }"></span>
          <h3 :style="{ color: col.color }">{{ col.label }}</h3>
          <span class="ccnt">{{ notesByCol(col.key).length }}</span>
        </div>
        <p class="csub">{{ col.sub }}</p>
        <div class="pits">
          <div v-for="note in notesByCol(col.key)" :key="note.id"
            class="pit" :style="{ background: col.dim, border: `1px solid ${col.border}` }">
            <div class="pit-body">
              {{ note.text }}
              <div class="pit-auth">
                <span class="pit-av" :style="{ background: note.authorColor }">
                  {{ note.author[0].toUpperCase() }}
                </span>
                {{ note.author }}
              </div>
            </div>
            <button v-if="note.author === store.me?.name" class="pit-del"
              @click="store.deleteNote(note.id)">✕</button>
          </div>
        </div>
        <input class="colin" :placeholder="`Ajouter… (Entrée)`"
          @keydown.enter="addNote($event, col.key)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRetroStore } from '../stores/retro'

const store = useRetroStore()
const cols  = computed(() => store.cols)

const TSECS = 600
const timerSecs    = ref(TSECS)
const timerRunning = ref(false)
let   timerInterval = null

const timerLabel = computed(() => {
  const m = Math.floor(timerSecs.value / 60), s = timerSecs.value % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})
const timerColor  = computed(() =>
  timerSecs.value <= 60 ? 'var(--stop)' : timerSecs.value <= 120 ? '#facc15' : 'var(--accent)'
)
const dashOffset  = computed(() => 138.2 * (1 - timerSecs.value / TSECS))

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

function notesByCol(col) {
  return Object.values(store.room?.notes || {})
    .filter(n => n.col === col)
    .sort((a, b) => a.createdAt - b.createdAt)
}
function addNote(e, col) {
  const text = e.target.value.trim()
  if (!text) return
  store.addNote(text, col)
  e.target.value = ''
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.top { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.timer-wrap { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.tring { position: relative; width: 54px; height: 54px; }
.trtxt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; }
.tbtn { background: var(--surface2); color: var(--text); border: 1px solid var(--border); border-radius: var(--rs); padding: 6px 12px; font-size: 11px; }
.tbtn:hover { background: var(--surface3); }
.board { display: grid; gap: 12px; flex: 1; }
.col { border-radius: var(--r); border: 1px solid var(--border); padding: 12px; display: flex; flex-direction: column; gap: 7px; min-height: 280px; }
.colhead { display: flex; align-items: center; gap: 7px; }
.cdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.colhead h3 { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
.ccnt { font-size: 10px; background: var(--surface2); color: var(--muted2); border-radius: 20px; padding: 2px 7px; margin-left: auto; }
.csub { font-size: 11px; color: var(--muted); }
.pits { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.pit { padding: 9px 11px; border-radius: var(--rs); font-size: 12px; line-height: 1.5; display: flex; align-items: flex-start; gap: 7px; animation: pop .2s ease; }
.pit-body { flex: 1; }
.pit-auth { font-size: 10px; color: var(--muted); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.pit-av { width: 12px; height: 12px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff; }
.pit-del { background: none; border: none; color: var(--muted); font-size: 12px; opacity: 0; transition: opacity .15s; flex-shrink: 0; padding: 0; }
.pit:hover .pit-del { opacity: 1; }
.colin { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); padding: 8px 11px; font-size: 12px; width: 100%; margin-top: auto; transition: border-color .2s; }
.colin:focus { border-color: var(--accent-b); }
.colin::placeholder { color: var(--muted); }
@keyframes pop { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (max-width: 768px) { .board { grid-template-columns: 1fr !important; } }
</style>
