<template>
  <div class="screen">
    <div class="header-row">
      <div>
        <div class="title">Planning Board</div>
        <div class="sub">Place tes US dans les sprints · {{ storyList.length }} US · {{ totalPoints }} pts</div>
      </div>
      <div class="header-actions">
        <button class="btn-import" @click="showImport = !showImport" v-if="pastPISessions.length">
          {{ showImport ? '✕' : '📥 Importer' }}
        </button>
        <button class="btn-add-us" @click="showForm = !showForm">
          {{ showForm ? '✕ Fermer' : '+ Ajouter une US' }}
        </button>
      </div>
    </div>

    <!-- Import panel -->
    <div v-if="showImport" class="import-panel">
      <div class="import-title">Importer des US depuis une session précédente</div>
      <div class="import-list">
        <div v-for="session in pastPISessions" :key="session.id" class="import-row"
          :class="{ selected: importSelected === session.id }"
          @click="importSelected = importSelected === session.id ? null : session.id">
          <div class="import-info">
            <span class="import-name">{{ session.formatName }}</span>
            <span class="import-meta">{{ fmtImportDate(session.createdAt) }} · {{ session.piData.stories.length }} US</span>
          </div>
          <span class="import-check" v-if="importSelected === session.id">✓</span>
        </div>
      </div>
      <div v-if="importSelected" class="import-preview">
        <div class="import-preview-label">{{ selectedImportStories.length }} US à importer :</div>
        <div v-for="s in selectedImportStories" :key="s.id" class="import-us-row">
          <span class="import-prio" :style="{ background: prioColor(s.priority) }"></span>
          <span class="import-us-title">{{ s.title }}</span>
          <span class="import-pts">{{ s.points }} pts</span>
        </div>
        <button class="btn-do-import" @click="doImport">Importer ces US →</button>
      </div>
    </div>

    <!-- Add US Form -->
    <div v-if="showForm" class="add-form">
      <input v-model="form.title" placeholder="Titre de la User Story…" class="form-input flex-1" maxlength="120"
        @keydown.enter="submitStory" />
      <input v-model.number="form.points" type="number" min="0" max="200" placeholder="Pts" class="form-input pts-input" />
      <select v-model="form.priority" class="form-select">
        <option value="high">🔴 Haute</option>
        <option value="medium">🟡 Moyenne</option>
        <option value="low">🟢 Faible</option>
      </select>
      <select v-model="form.sprintId" class="form-select sprint-select">
        <option value="">Backlog</option>
        <option v-for="s in store.sprints" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <button class="btn-submit" @click="submitStory" :disabled="!form.title.trim()">Ajouter</button>
    </div>

    <div v-if="!store.sprints.length" class="empty-state">
      <div class="empty-ico">⚙️</div>
      <p>Configure les sprints avant de planifier les US.</p>
    </div>

    <div v-else class="board">
      <!-- Backlog column -->
      <div class="col">
        <div class="col-header backlog-header">
          <div class="col-title">Backlog</div>
          <div class="col-count">{{ store.backlogStories.length }}</div>
        </div>
        <div class="col-stats">
          <span class="stat">{{ backlogPoints }} pts</span>
          <span class="stat muted">non planifiés</span>
        </div>
        <div class="cards"
          :class="{ 'drag-target': dragTarget === 'backlog' }"
          @dragover.prevent="dragTarget = 'backlog'"
          @dragleave="dragTarget = null"
          @drop.prevent="dropIn(null)">
          <div v-for="story in store.backlogStories" :key="story.id"
            class="drag-wrap"
            :class="{ dragging: draggingId === story.id }"
            draggable="true"
            @dragstart="draggingId = story.id"
            @dragend="draggingId = null; dragTarget = null">
            <USCard
              :story="story" :sprints="store.sprints"
              @update="(id, u) => store.updateStory(id, u)"
              @delete="store.deleteStory"
            />
          </div>
        </div>
      </div>

      <!-- Sprint columns -->
      <div v-for="sprint in store.sprints" :key="sprint.id" class="col">
        <div class="col-header sprint-header">
          <div class="col-title">{{ sprint.name }}</div>
          <div class="col-count">{{ (store.storiesBySprint[sprint.id] || []).length }}</div>
        </div>
        <div class="col-dates">{{ fmtRange(sprint.startDate, sprint.endDate) }}</div>
        <div class="col-capacity">
          <div class="cap-bar-wrap">
            <div class="cap-bar">
              <div class="cap-fill"
                :style="{ width: capPct(sprint.id) + '%', background: capColor(sprint.id) }">
              </div>
            </div>
            <span class="cap-label" :style="{ color: capColor(sprint.id) }">
              {{ store.sprintPoints[sprint.id] || 0 }} pts / {{ store.sprintCapacity[sprint.id] || 0 }}j
            </span>
          </div>
        </div>
        <div class="cards"
          :class="{ 'drag-target': dragTarget === sprint.id }"
          @dragover.prevent="dragTarget = sprint.id"
          @dragleave="dragTarget = null"
          @drop.prevent="dropIn(sprint.id)">
          <div v-for="story in store.storiesBySprint[sprint.id] || []" :key="story.id"
            class="drag-wrap"
            :class="{ dragging: draggingId === story.id }"
            draggable="true"
            @dragstart="draggingId = story.id"
            @dragend="draggingId = null; dragTarget = null">
            <USCard
              :story="story" :sprints="store.sprints"
              @update="(id, u) => store.updateStory(id, u)"
              @delete="store.deleteStory"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePIStore } from '../stores/pi'
import { useHistoryStore } from '../stores/history'
import USCard from './USCard.vue'

const store   = usePIStore()
const history = useHistoryStore()

const showForm     = ref(false)
const showImport   = ref(false)
const importSelected = ref(null)
const draggingId   = ref(null)
const dragTarget   = ref(null)

const form = ref({ title: '', points: 5, priority: 'medium', sprintId: '' })

const storyList   = computed(() => Object.values(store.room?.stories || {}))
const totalPoints = computed(() => storyList.value.reduce((s, us) => s + (us.points || 0), 0))
const backlogPoints = computed(() => store.backlogStories.reduce((s, us) => s + (us.points || 0), 0))

const pastPISessions = computed(() =>
  history.sessions.filter(s => s.format === 'pi' && s.piData?.stories?.length)
)
const selectedImportStories = computed(() => {
  const session = pastPISessions.value.find(s => s.id === importSelected.value)
  return session?.piData?.stories || []
})

function submitStory() {
  if (!form.value.title.trim()) return
  store.addStory(form.value.title.trim(), form.value.points, form.value.sprintId || null, form.value.priority)
  form.value.title = ''
  form.value.points = 5
  form.value.sprintId = ''
}

function dropIn(sprintId) {
  if (draggingId.value) {
    store.updateStory(draggingId.value, { sprintId: sprintId || null })
  }
  draggingId.value = null
  dragTarget.value = null
}

function doImport() {
  for (const s of selectedImportStories.value) {
    store.addStory(s.title, s.points, null, s.priority)
  }
  showImport.value   = false
  importSelected.value = null
}

function fmtImportDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function prioColor(p) { return { high: '#f87171', medium: '#facc15', low: '#4ade80' }[p] || '#facc15' }

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
function fmtRange(s, e) {
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  return `${fmt(s)} – ${fmt(e)}`
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 100%; margin: 0 auto; }
.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }

.header-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-add-us { background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 9px 18px; font-size: 13px; font-weight: 700; white-space: nowrap; }
.btn-add-us:hover { opacity: .85; }
.btn-import { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); border-radius: var(--rs); padding: 9px 18px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.btn-import:hover { border-color: var(--cont-b); color: var(--cont); }

/* Import panel */
.import-panel { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 16px; margin-bottom: 16px; }
.import-title { font-size: 12px; font-weight: 700; color: var(--muted2); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 12px; }
.import-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.import-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--rs); cursor: pointer; transition: all .15s; }
.import-row:hover { border-color: var(--cont-b); background: rgba(96,165,250,0.04); }
.import-row.selected { border-color: var(--cont-b); background: rgba(96,165,250,0.08); }
.import-info { display: flex; flex-direction: column; gap: 2px; }
.import-name { font-size: 13px; font-weight: 600; }
.import-meta { font-size: 11px; color: var(--muted2); }
.import-check { color: var(--cont); font-weight: 700; }
.import-preview { border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.import-preview-label { font-size: 11px; color: var(--muted2); margin-bottom: 4px; }
.import-us-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.import-prio { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.import-us-title { flex: 1; }
.import-pts { font-size: 11px; color: var(--cont); font-weight: 700; }
.btn-do-import { align-self: flex-start; background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 8px 18px; font-size: 13px; font-weight: 700; margin-top: 8px; }
.btn-do-import:hover { opacity: .85; }

/* Add form */
.add-form { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 14px; }
.form-input { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 8px 12px; font-size: 13px; transition: border-color .2s; }
.form-input:focus { border-color: var(--cont-b); }
.flex-1 { flex: 1; min-width: 200px; }
.pts-input { width: 72px; }
.form-select { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 8px 10px; font-size: 12px; }
.form-select:focus { border-color: var(--cont-b); }
.sprint-select { min-width: 110px; }
.btn-submit { background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 8px 18px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.btn-submit:not(:disabled):hover { opacity: .85; }
.btn-submit:disabled { opacity: .3; cursor: not-allowed; }

.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state p { font-size: 13px; }

.board { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; }

.col { min-width: 220px; max-width: 260px; flex-shrink: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.col-header { display: flex; align-items: center; justify-content: space-between; }
.col-title { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
.col-count { font-size: 10px; background: var(--surface2); color: var(--muted2); border-radius: 20px; padding: 1px 7px; }
.backlog-header .col-title { color: var(--muted2); }
.sprint-header .col-title { color: var(--cont); }
.col-stats { display: flex; gap: 8px; }
.stat { font-size: 11px; color: var(--muted2); }
.stat.muted { color: var(--muted); }
.col-dates { font-size: 10px; color: var(--muted); }
.col-capacity { margin: 2px 0; }
.cap-bar-wrap { display: flex; align-items: center; gap: 6px; }
.cap-bar { flex: 1; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.cap-fill { height: 100%; border-radius: 2px; transition: width .4s; }
.cap-label { font-size: 10px; white-space: nowrap; }

.cards { display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 80px; border-radius: var(--rs); padding: 4px; transition: background .15s, border .15s; }
.cards.drag-target { background: rgba(96,165,250,0.07); outline: 1px dashed var(--cont-b); }

.drag-wrap { cursor: grab; border-radius: var(--rs); transition: opacity .15s, transform .15s; }
.drag-wrap:active { cursor: grabbing; }
.drag-wrap.dragging { opacity: .35; transform: scale(.97); }
</style>
