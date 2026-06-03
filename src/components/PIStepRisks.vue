<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">Risques du PI</div>
        <div class="sub">Identifie les menaces · {{ store.riskList.length }} risque{{ store.riskList.length !== 1 ? 's' : '' }} recensé{{ store.riskList.length !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <!-- Add risk form -->
    <div class="add-form">
      <div class="form-row">
        <input v-model="form.title" class="risk-input" placeholder="Description du risque…" maxlength="200"
          @keydown.enter="submitRisk" />
        <div class="level-btns">
          <button v-for="l in levels" :key="l.value"
            class="level-btn" :class="{ active: form.level === l.value }"
            :style="form.level === l.value ? { background: l.dim, borderColor: l.border, color: l.color } : {}"
            @click="form.level = l.value">
            {{ l.label }}
          </button>
        </div>
      </div>
      <div class="form-row">
        <input v-model="form.mitigation" class="risk-input" placeholder="Plan de mitigation (optionnel)…" maxlength="200" />
        <button class="btn-add-risk" :disabled="!form.title.trim()" @click="submitRisk">
          + Ajouter
        </button>
      </div>
    </div>

    <div v-if="!store.riskList.length" class="empty-state">
      <div class="empty-ico">🎉</div>
      <h3>Aucun risque identifié</h3>
      <p>Bonne nouvelle ! Ou proposez les risques que vous anticipez pour ce PI.</p>
    </div>

    <div v-else class="risk-groups">
      <div v-for="lvl in levels" :key="lvl.value">
        <div v-if="risksByLevel[lvl.value]?.length" class="risk-group">
          <div class="group-header" :style="{ borderLeftColor: lvl.color }">
            <span class="group-ico">{{ lvl.ico }}</span>
            <span class="group-label" :style="{ color: lvl.color }">{{ lvl.name }}</span>
            <span class="group-count">{{ risksByLevel[lvl.value].length }}</span>
          </div>
          <div class="risk-list">
            <div v-for="risk in risksByLevel[lvl.value]" :key="risk.id" class="risk-card"
              :style="{ borderLeft: `3px solid ${lvl.color}`, background: lvl.dim }">
              <div class="risk-body">
                <div class="risk-title">{{ risk.title }}</div>
                <div v-if="risk.mitigation" class="risk-mitigation">
                  <span class="mit-label">Mitigation :</span> {{ risk.mitigation }}
                </div>
                <div class="risk-author">par {{ risk.author }}</div>
              </div>
              <button class="risk-del" @click="store.deleteRisk(risk.id)" title="Supprimer">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePIStore } from '../stores/pi'

const store = usePIStore()

const levels = [
  { value: 'high',   name: 'Élevé',  ico: '🔴', label: '🔴 Élevé',  color: '#f87171', dim: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.3)' },
  { value: 'medium', name: 'Moyen',  ico: '🟡', label: '🟡 Moyen',  color: '#facc15', dim: 'rgba(250,204,21,0.06)',   border: 'rgba(250,204,21,0.3)' },
  { value: 'low',    name: 'Faible', ico: '🟢', label: '🟢 Faible', color: '#4ade80', dim: 'rgba(74,222,128,0.06)',   border: 'rgba(74,222,128,0.3)' },
]

const form = ref({ title: '', level: 'medium', mitigation: '' })

const risksByLevel = computed(() => {
  const map = {}
  for (const lvl of levels) {
    map[lvl.value] = store.riskList.filter(r => r.level === lvl.value)
  }
  return map
})

function submitRisk() {
  if (!form.value.title.trim()) return
  store.addRisk(form.value.title.trim(), form.value.level, form.value.mitigation.trim())
  form.value.title = ''
  form.value.mitigation = ''
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 900px; margin: 0 auto; }
.header { margin-bottom: 24px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.add-form { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; }
.form-row { display: flex; gap: 10px; flex-wrap: wrap; }
.risk-input { flex: 1; background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 9px 12px; font-size: 13px; min-width: 200px; }
.risk-input:focus { border-color: rgba(248,113,113,0.4); outline: none; }

.level-btns { display: flex; gap: 6px; }
.level-btn { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 8px 12px; font-size: 12px; color: var(--muted2); transition: all .2s; white-space: nowrap; }
.level-btn:hover:not(.active) { border-color: var(--border2); color: var(--text); }

.btn-add-risk { background: var(--stop); color: #fff; border: none; border-radius: var(--rs); padding: 9px 18px; font-size: 13px; font-weight: 700; white-space: nowrap; }
.btn-add-risk:not(:disabled):hover { opacity: .85; }
.btn-add-risk:disabled { opacity: .3; cursor: not-allowed; }

.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.empty-state p { font-size: 13px; max-width: 400px; margin: 0 auto; line-height: 1.6; }

.risk-groups { display: flex; flex-direction: column; gap: 20px; }
.risk-group {}
.group-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-left: 3px solid; border-radius: 0 var(--rs) var(--rs) 0; background: var(--surface); margin-bottom: 10px; }
.group-ico { font-size: 14px; }
.group-label { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; flex: 1; }
.group-count { font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 2px 8px; color: var(--muted2); }

.risk-list { display: flex; flex-direction: column; gap: 7px; }
.risk-card { display: flex; align-items: flex-start; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--rs); padding: 12px 14px; animation: pop .2s ease; }
.risk-body { flex: 1; }
.risk-title { font-size: 13px; line-height: 1.5; margin-bottom: 4px; }
.risk-mitigation { font-size: 11px; color: var(--muted2); margin-bottom: 3px; }
.mit-label { color: var(--muted); }
.risk-author { font-size: 10px; color: var(--muted); }
.risk-del { background: none; border: none; color: var(--muted); font-size: 13px; opacity: 0; transition: opacity .15s; flex-shrink: 0; padding: 0 2px; }
.risk-card:hover .risk-del { opacity: 1; }
.risk-del:hover { color: var(--stop); }

@keyframes pop { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
