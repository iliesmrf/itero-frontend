<template>
  <div class="screen">
    <div class="header">
      <div class="title">Capacité par sprint</div>
      <div class="sub">Chaque membre déclare ses jours disponibles · Les totaux se mettent à jour en temps réel</div>
    </div>

    <div v-if="!store.sprints.length" class="empty-state">
      <div class="empty-ico">⚙️</div>
      <h3>Aucun sprint configuré</h3>
      <p>Reviens à l'étape de configuration pour définir les dates du PI.</p>
    </div>

    <div v-else class="table-wrap">
      <table class="cap-table">
        <thead>
          <tr>
            <th class="th-name">Participant</th>
            <th v-for="sprint in store.sprints" :key="sprint.id" class="th-sprint">
              <div class="sprint-hd">{{ sprint.name }}</div>
              <div class="sprint-dates">{{ fmtRange(sprint.startDate, sprint.endDate) }}</div>
              <div class="sprint-wd">{{ workingDays(sprint.startDate, sprint.endDate) }}j (hors fériés)</div>
            </th>
            <th class="th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in allParticipants" :key="p" :class="{ 'my-row': p === myName }">
            <td class="td-name">
              <span class="pav" :style="{ background: colorOf(p) }">{{ p[0].toUpperCase() }}</span>
              {{ p }}
              <span v-if="p === myName" class="me-badge">moi</span>
            </td>
            <td v-for="sprint in store.sprints" :key="sprint.id" class="td-cell">
              <input
                v-if="p === myName"
                type="number" min="0" :max="workingDays(sprint.startDate, sprint.endDate)"
                class="cap-input"
                :value="getCapacity(p, sprint.id)"
                @change="store.setCapacity(sprint.id, $event.target.value)"
                placeholder="0"
              />
              <span v-else class="cap-val">{{ getCapacity(p, sprint.id) || '—' }}</span>
            </td>
            <td class="td-total">{{ userTotal(p) }}</td>
          </tr>

          <!-- Team total row -->
          <tr class="total-row">
            <td class="td-name total-label">Total équipe</td>
            <td v-for="sprint in store.sprints" :key="sprint.id" class="td-cell">
              <div class="total-cell">
                <span class="total-val">{{ store.sprintCapacity[sprint.id] || 0 }}j</span>
                <div class="cap-bar">
                  <div class="cap-fill"
                    :style="{ width: capFillPct(sprint.id) + '%', background: capColor(sprint.id) }">
                  </div>
                </div>
                <span class="cap-pts">{{ store.sprintPoints[sprint.id] || 0 }} pts</span>
              </div>
            </td>
            <td class="td-total">{{ grandTotal }}j</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.sprints.length" class="legend">
      <div class="legend-item"><span class="ldot green"></span> Capacité suffisante</div>
      <div class="legend-item"><span class="ldot yellow"></span> Attention (>80% chargé)</div>
      <div class="legend-item"><span class="ldot red"></span> Sur-capacité</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePIStore } from '../stores/pi'
import { workingDays } from '../working-days.js'

const store = usePIStore()

const myName = computed(() => store.me?.name)

const allParticipants = computed(() => {
  const participants = Object.keys(store.room?.participants || {})
  if (myName.value && !participants.includes(myName.value)) return [myName.value, ...participants]
  return participants
})

function getCapacity(user, sprintId) {
  return store.room?.capacity?.[user]?.[sprintId] || 0
}

function userTotal(user) {
  if (!store.room?.capacity?.[user]) return 0
  return Object.values(store.room.capacity[user]).reduce((sum, d) => sum + (d || 0), 0)
}

const grandTotal = computed(() =>
  allParticipants.value.reduce((sum, p) => sum + userTotal(p), 0)
)

function capFillPct(sprintId) {
  const cap  = store.sprintCapacity[sprintId] || 0
  const pts  = store.sprintPoints[sprintId]   || 0
  if (!cap) return 0
  return Math.min(Math.round(pts / cap * 100), 100)
}

function capColor(sprintId) {
  const pct = capFillPct(sprintId)
  if (pct > 100) return 'var(--stop)'
  if (pct > 80)  return '#facc15'
  return 'var(--start)'
}


function fmtRange(s, e) {
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  return `${fmt(s)} – ${fmt(e)}`
}

const PALETTE = [
  '#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24',
]
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1200px; margin: 0 auto; }
.header { margin-bottom: 24px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.empty-state p { font-size: 13px; max-width: 360px; margin: 0 auto; line-height: 1.6; }

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--r); }

.cap-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.cap-table th, .cap-table td { border-bottom: 1px solid var(--border); }
.cap-table tr:last-child td { border-bottom: none; }

th { background: var(--surface); padding: 10px 14px; text-align: left; font-weight: 600; white-space: nowrap; }
.th-name { min-width: 160px; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.th-sprint { min-width: 120px; text-align: center; }
.sprint-hd { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: var(--cont); }
.sprint-dates { font-size: 10px; color: var(--muted2); font-weight: 400; margin-top: 2px; }
.sprint-wd { font-size: 10px; color: var(--muted); font-weight: 400; }
.th-total { min-width: 80px; text-align: center; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

td { padding: 10px 14px; }
.td-name { display: flex; align-items: center; gap: 8px; }
.pav { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
.me-badge { font-size: 10px; background: var(--cont-dim); color: var(--cont); border: 1px solid var(--cont-b); border-radius: 20px; padding: 1px 6px; }

.td-cell { text-align: center; }
.cap-input { width: 56px; background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 5px 8px; font-size: 12px; text-align: center; transition: border-color .2s; }
.cap-input:focus { border-color: var(--cont-b); }
.cap-val { font-size: 13px; color: var(--muted2); }

.td-total { text-align: center; font-family: 'Syne', sans-serif; font-weight: 700; color: var(--cont); }

.my-row { background: rgba(96,165,250,0.04); }
.my-row td { border-bottom-color: rgba(96,165,250,0.12); }

.total-row { background: var(--surface); }
.total-row td { border-top: 2px solid var(--border2); }
.total-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

.total-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.total-val { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text); }
.cap-bar { width: 60px; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.cap-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
.cap-pts { font-size: 10px; color: var(--muted); }

.legend { display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted2); }
.ldot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ldot.green  { background: var(--start); }
.ldot.yellow { background: #facc15; }
.ldot.red    { background: var(--stop); }
</style>
