<template>
  <div class="screen">
    <div class="header-row">
      <div>
        <div class="title">Planning Board</div>
        <div class="sub">Place tes US dans les sprints · {{ storyList.length }} US · {{ totalPoints }} pts</div>
      </div>
      <button class="btn-add-us" @click="showForm = !showForm">
        {{ showForm ? '✕ Fermer' : '+ Ajouter une US' }}
      </button>
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
        <div class="cards">
          <USCard
            v-for="story in store.backlogStories" :key="story.id"
            :story="story" :sprints="store.sprints"
            @update="(id, u) => store.updateStory(id, u)"
            @delete="store.deleteStory"
          />
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
                :style="{
                  width: capPct(sprint.id) + '%',
                  background: capColor(sprint.id)
                }">
              </div>
            </div>
            <span class="cap-label" :style="{ color: capColor(sprint.id) }">
              {{ store.sprintPoints[sprint.id] || 0 }} pts / {{ store.sprintCapacity[sprint.id] || 0 }}j
            </span>
          </div>
        </div>
        <div class="cards">
          <USCard
            v-for="story in store.storiesBySprint[sprint.id] || []" :key="story.id"
            :story="story" :sprints="store.sprints"
            @update="(id, u) => store.updateStory(id, u)"
            @delete="store.deleteStory"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePIStore } from '../stores/pi'
import USCard from './USCard.vue'

const store = usePIStore()

const showForm = ref(false)
const form = ref({ title: '', points: 5, priority: 'medium', sprintId: '' })

const storyList = computed(() => Object.values(store.room?.stories || {}))
const totalPoints = computed(() => storyList.value.reduce((s, us) => s + (us.points || 0), 0))
const backlogPoints = computed(() => store.backlogStories.reduce((s, us) => s + (us.points || 0), 0))

function submitStory() {
  if (!form.value.title.trim()) return
  store.addStory(form.value.title.trim(), form.value.points, form.value.sprintId || null, form.value.priority)
  form.value.title = ''
  form.value.points = 5
  form.value.sprintId = ''
}

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

.btn-add-us { background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 9px 18px; font-size: 13px; font-weight: 700; white-space: nowrap; }
.btn-add-us:hover { opacity: .85; }

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

.cards { display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 80px; }
</style>
