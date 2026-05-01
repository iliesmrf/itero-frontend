<template>
  <div class="screen">
    <div class="title">Actions</div>
    <div class="sub">Actions concrètes issues du vote · Partagées avec toute l'équipe</div>

    <div class="atbl">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Responsable</th>
            <th>Deadline</th>
            <th>Priorité</th>
            <th>Par</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!sortedActions.length">
            <td colspan="6" class="empty-td">Aucune action pour l'instant.</td>
          </tr>
          <tr v-for="action in sortedActions" :key="action.id">
            <td>{{ action.text }}</td>
            <td>{{ action.owner || '—' }}</td>
            <td>{{ action.date || '—' }}</td>
            <td><span class="pbadge" :class="`p-${action.priority}`">{{ prioLabel(action.priority) }}</span></td>
            <td>
              <span class="by-badge" :style="{ background: colorOf(action.addedBy) }">
                {{ action.addedBy }}
              </span>
            </td>
            <td><button class="tdel" @click="store.deleteAction(action.id)">✕</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="aform">
      <div class="afg">
        <label>ACTION</label>
        <input class="afi" v-model="form.text" placeholder="Décrire l'action…" @keydown.enter="addAction" />
      </div>
      <div class="afg">
        <label>RESPONSABLE</label>
        <input class="afi" v-model="form.owner" placeholder="Prénom" />
      </div>
      <div class="afg">
        <label>DEADLINE</label>
        <input class="afi" v-model="form.date" type="date" />
      </div>
      <div class="afg">
        <label>PRIORITÉ</label>
        <select class="afi" v-model="form.priority">
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Faible</option>
        </select>
      </div>
      <button class="abtn" @click="addAction">+ Ajouter</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRetroStore } from '../stores/retro'

const store = useRetroStore()

const form = reactive({ text: '', owner: '', date: '', priority: 'medium' })

const PRIO_ORDER = { high: 0, medium: 1, low: 2 }
const sortedActions = computed(() =>
  Object.values(store.room?.actions || {})
    .sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority])
)

function addAction() {
  if (!form.text.trim()) return
  store.addAction(form.text.trim(), form.owner, form.date, form.priority)
  form.text = ''; form.owner = ''; form.date = ''
}

function prioLabel(p) {
  return { high: 'Haute', medium: 'Moyenne', low: 'Faible' }[p] || 'Moyenne'
}

const PALETTE = [
  '#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24',
]
function colorOf(name) {
  let h = 0
  for (const c of (name||'?')) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; margin-bottom: 18px; }
.atbl { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; margin-bottom: 18px; }
table { width: 100%; border-collapse: collapse; }
th { font-family: 'Syne', sans-serif; font-size: 10px; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-weight: 400; }
td { padding: 11px 14px; font-size: 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,.015); }
.empty-td { text-align: center; color: var(--muted); padding: 32px !important; }
.pbadge { font-size: 10px; padding: 3px 8px; border-radius: 20px; }
.p-high   { background: var(--stop-dim);  color: var(--stop); }
.p-medium { background: rgba(250,204,21,.1); color: #facc15; }
.p-low    { background: var(--start-dim); color: var(--start); }
.by-badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; color: #fff; }
.tdel { background: none; border: none; color: var(--muted); font-size: 13px; padding: 2px 6px; }
.tdel:hover { color: var(--stop); }
.aform { display: grid; grid-template-columns: 2fr 1fr 1fr 110px auto; gap: 9px; align-items: end; }
.afg { display: flex; flex-direction: column; gap: 4px; }
.afg label { font-size: 10px; color: var(--muted2); letter-spacing: .05em; }
.afi { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); padding: 8px 11px; font-size: 12px; width: 100%; transition: border-color .2s; }
.afi:focus { border-color: var(--accent-b); }
select.afi option { background: var(--surface2); }
.abtn { background: var(--accent); color: #fff; border: none; border-radius: var(--rs); padding: 8px 14px; font-size: 11px; font-weight: 700; font-family: 'Syne', sans-serif; white-space: nowrap; align-self: end; }
.abtn:hover { opacity: .85; }
@media (max-width: 680px) { .aform { grid-template-columns: 1fr 1fr; } }
</style>
