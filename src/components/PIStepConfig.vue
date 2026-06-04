<template>
  <div class="screen">
    <div class="header">
      <div class="title">Configuration du PI</div>
      <div class="sub">Définis les dates et la durée des sprints — les sprints sont générés automatiquement</div>
    </div>

    <div class="layout">
      <!-- Form -->
      <div class="form-card">
        <div class="field">
          <label>Nom du PI</label>
          <input v-model="form.name" placeholder="ex : PI 2024-Q2" maxlength="60" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Date de début</label>
            <input type="date" v-model="form.startDate" />
          </div>
          <div class="field">
            <label>Date de fin</label>
            <input type="date" v-model="form.endDate" />
          </div>
        </div>

        <div class="field">
          <label>Durée des sprints</label>
          <div class="dur-options">
            <button v-for="w in [1,2,3,4]" :key="w"
              class="dur-btn" :class="{ active: form.sprintDuration === w }"
              @click="form.sprintDuration = w">
              {{ w }} sem.
            </button>
          </div>
        </div>

        <div v-if="validationMsg" class="validation-msg">{{ validationMsg }}</div>

        <button class="btn-save" :disabled="!isValid" @click="save">
          ✓ Valider la configuration
        </button>

        <div v-if="store.room?.config" class="saved-state">
          <span class="saved-ico">✓</span>
          Config sauvegardée — {{ store.room.config.name }}
        </div>
      </div>

      <!-- Sprint preview -->
      <div class="preview-card">
        <div v-if="previewSprints.length" class="sprint-list">
          <div class="preview-title">
            <span>{{ previewSprints.length }} sprint{{ previewSprints.length > 1 ? 's' : '' }}</span>
            <span class="preview-total">{{ totalWorkingDays }} jours ouvrés</span>
          </div>
          <div v-for="s in previewSprints" :key="s.id" class="sprint-row">
            <div class="snum">{{ s.name }}</div>
            <div class="sdates">{{ fmtDate(s.startDate) }} → {{ fmtDate(s.endDate) }}</div>
            <div class="sdays">{{ workingDays(s.startDate, s.endDate) }}j</div>
          </div>
        </div>
        <div v-else class="preview-empty">
          <div class="empty-ico">📅</div>
          <p>Remplis les dates et la durée pour voir les sprints</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePIStore } from '../stores/pi'
import { generateSprints } from '../stores/pi'

const store = usePIStore()

const form = ref({
  name: store.room?.config?.name || '',
  startDate: store.room?.config?.startDate || '',
  endDate:   store.room?.config?.endDate   || '',
  sprintDuration: store.room?.config?.sprintDuration || 2,
})

watch(() => store.room?.config, (c) => {
  if (c) {
    form.value.name          = c.name
    form.value.startDate     = c.startDate
    form.value.endDate       = c.endDate
    form.value.sprintDuration = c.sprintDuration
  }
})

const previewSprints = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return []
  if (new Date(form.value.startDate) >= new Date(form.value.endDate)) return []
  return generateSprints(form.value.startDate, form.value.endDate, form.value.sprintDuration)
})

const validationMsg = computed(() => {
  if (form.value.startDate && form.value.endDate && new Date(form.value.startDate) >= new Date(form.value.endDate))
    return 'La date de fin doit être après la date de début.'
  if (previewSprints.value.length > 20) return 'Trop de sprints (max 20). Augmente la durée des sprints.'
  return ''
})

const isValid = computed(() =>
  form.value.name.trim() &&
  form.value.startDate &&
  form.value.endDate &&
  previewSprints.value.length > 0 &&
  previewSprints.value.length <= 20 &&
  !validationMsg.value
)

const totalWorkingDays = computed(() =>
  previewSprints.value.reduce((sum, s) => sum + workingDays(s.startDate, s.endDate), 0)
)

function workingDays(start, end) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end   + 'T00:00:00')
  let count = 0, cur = new Date(s)
  while (cur <= e) {
    const d = cur.getDay()
    if (d !== 0 && d !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function save() {
  if (!isValid.value) return
  store.setConfig(form.value.name.trim(), form.value.startDate, form.value.endDate, form.value.sprintDuration)
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 28px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.form-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 24px; display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 11px; color: var(--muted2); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.field input, .field select {
  background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs);
  padding: 9px 12px; font-size: 13px; width: 100%; transition: border-color .2s;
}
.field input:focus, .field select:focus { border-color: var(--cont-b); }
.field select option { background: var(--surface2); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.dur-options { display: flex; gap: 8px; }
.dur-btn { flex: 1; background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 8px; font-size: 12px; font-weight: 600; color: var(--muted2); transition: all .2s; }
.dur-btn.active { background: rgba(96,165,250,0.12); border-color: var(--cont-b); color: var(--cont); }
.dur-btn:hover:not(.active) { border-color: var(--border2); color: var(--text); }

.validation-msg { font-size: 12px; color: var(--stop); background: var(--stop-dim); border: 1px solid var(--stop-b); border-radius: var(--rs); padding: 8px 12px; }

.btn-save { background: var(--cont); color: #fff; border: none; border-radius: var(--rs); padding: 11px 20px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
.btn-save:not(:disabled):hover { opacity: .85; }
.btn-save:disabled { opacity: .3; cursor: not-allowed; }

.saved-state { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--start); background: var(--start-dim); border: 1px solid var(--start-b); border-radius: var(--rs); padding: 8px 12px; }
.saved-ico { font-size: 14px; }

/* Preview */
.preview-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; overflow: hidden; }
.preview-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; gap: 10px; color: var(--muted2); }
.empty-ico { font-size: 32px; }
.preview-empty p { font-size: 13px; text-align: center; max-width: 200px; line-height: 1.5; }

.preview-title { display: flex; justify-content: space-between; align-items: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
.preview-total { font-size: 11px; color: var(--muted2); font-family: 'DM Sans', sans-serif; }

.sprint-list { display: flex; flex-direction: column; gap: 5px; max-height: 380px; overflow-y: auto; }
.sprint-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--surface2); border-radius: var(--rs); font-size: 12px; }
.snum { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; color: var(--cont); min-width: 54px; }
.sdates { flex: 1; color: var(--muted2); }
.sdays { font-size: 11px; color: var(--muted); background: var(--surface3); border-radius: 20px; padding: 2px 8px; white-space: nowrap; }

@media (max-width: 700px) { .layout { grid-template-columns: 1fr; } }
</style>
