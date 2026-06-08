<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">Definition of Done</div>
        <div class="sub">Critères validés par l'équipe · {{ acceptedCount }} retenu{{ acceptedCount > 1 ? 's' : '' }}</div>
      </div>
      <div class="header-actions">
        <button class="btn-copy" @click="copyDod" :class="{ copied }">
          {{ copied ? '✓ Copié !' : '📋 Copier la DoD' }}
        </button>
        <button class="btn-finish" @click="$emit('finish')">Terminer ✓</button>
      </div>
    </div>

    <div v-if="!hasAnyNote" class="empty-state">
      <div class="empty-ico">📋</div>
      <h3>Aucun critère proposé</h3>
      <p>Retournez à l'étape précédente pour ajouter des critères.</p>
    </div>

    <div v-else class="dod-document">
      <!-- Accepted criteria by category -->
      <div v-if="acceptedGroups.length" class="section">
        <div class="section-header">
          <span class="section-icon">✅</span>
          <span class="section-title">Critères retenus dans la DoD</span>
          <span class="section-count">{{ acceptedCount }}</span>
        </div>

        <div v-for="group in acceptedGroups" :key="group.col.key" class="category-block">
          <div class="cat-header" :style="{ borderLeft: `3px solid ${group.col.color}` }">
            <span class="cat-dot" :style="{ background: group.col.color }"></span>
            <span class="cat-label" :style="{ color: group.col.color }">{{ group.col.label }}</span>
            <span class="cat-count">{{ group.notes.length }}</span>
          </div>
          <div class="criteria-list">
            <div v-for="note in group.notes" :key="note.id" class="criterion accepted">
              <span class="crit-check" :style="{ color: group.col.color }">✓</span>
              <span class="crit-text">{{ note.text }}</span>
              <span class="crit-votes" :title="totalVotes(note.id) + ' validation(s)'">
                {{ totalVotes(note.id) > 0 ? '★'.repeat(Math.min(totalVotes(note.id), 3)) : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejected criteria -->
      <div v-if="rejectedNotes.length" class="section section-rejected">
        <div class="section-header">
          <span class="section-icon">💬</span>
          <span class="section-title">Non retenus (0 validation)</span>
          <span class="section-count muted">{{ rejectedNotes.length }}</span>
        </div>
        <div class="criteria-list">
          <div v-for="note in rejectedNotes" :key="note.id" class="criterion rejected">
            <span class="crit-check muted">○</span>
            <span class="crit-text muted">{{ note.text }}</span>
            <span class="crit-col muted">{{ colLabel(note.col) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Participants -->
    <div v-if="participantNames.length" class="participants-section">
      <div class="label-sm">Participants ({{ participantNames.length }})</div>
      <div class="p-tags">
        <span v-for="p in participantNames" :key="p" class="p-tag">{{ p }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRetroStore } from '../stores/retro'
import { RETRO_FORMATS } from '../retro-formats.js'

const store = useRetroStore()
const dodCols = computed(() => store.cols.length ? store.cols : RETRO_FORMATS['dod'].cols)
defineEmits(['finish'])

const copied = ref(false)

const allVotes = computed(() => store.room?.votes || {})

function totalVotes(noteId) {
  return Object.values(allVotes.value).reduce((sum, uv) => sum + (uv[noteId] || 0), 0)
}

const allNotes = computed(() => Object.values(store.room?.notes || {}))
const hasAnyNote = computed(() => allNotes.value.length > 0)

const acceptedNotes = computed(() =>
  allNotes.value.filter(n => totalVotes(n.id) > 0).sort((a, b) => totalVotes(b.id) - totalVotes(a.id))
)
const rejectedNotes = computed(() =>
  allNotes.value.filter(n => totalVotes(n.id) === 0)
)
const acceptedCount = computed(() => acceptedNotes.value.length)

const acceptedGroups = computed(() =>
  dodCols.value
    .map(col => ({
      col,
      notes: acceptedNotes.value.filter(n => n.col === col.key),
    }))
    .filter(g => g.notes.length > 0)
)

const participantNames = computed(() =>
  Object.keys(store.room?.participants || {})
)

function colLabel(key) {
  return dodCols.value.find(c => c.key === key)?.label || key
}

function copyDod() {
  const lines = [`Definition of Done — ${store.room?.code || ''}`, `Généré le ${new Date().toLocaleDateString('fr-FR')}`, '']

  for (const group of acceptedGroups.value) {
    lines.push(`${group.col.label}`)
    for (const note of group.notes) {
      lines.push(`  • ${note.text}`)
    }
    lines.push('')
  }

  if (rejectedNotes.value.length) {
    lines.push('--- Non retenus ---')
    for (const note of rejectedNotes.value) {
      lines.push(`  ○ ${note.text}`)
    }
  }

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {})
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 860px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

.btn-copy {
  display: flex; align-items: center; gap: 6px;
  background: var(--surface2); color: var(--text);
  border: 1px solid var(--border2); border-radius: var(--rs);
  padding: 9px 18px; font-size: 13px; font-weight: 600;
  transition: all .2s;
}
.btn-copy:hover { border-color: var(--accent-b); color: var(--accent); }
.btn-copy.copied { background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.3); color: var(--start); }

.btn-finish {
  display: flex; align-items: center; gap: 6px;
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--rs); padding: 9px 20px;
  font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif;
}
.btn-finish:hover { opacity: .85; transform: translateY(-1px); }

.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.empty-state p { font-size: 13px; max-width: 360px; margin: 0 auto; line-height: 1.6; }

.dod-document { display: flex; flex-direction: column; gap: 24px; }

.section {}
.section-rejected { opacity: .7; }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
.section-icon { font-size: 16px; }
.section-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; flex: 1; }
.section-count { font-size: 11px; background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-b); border-radius: 20px; padding: 2px 10px; font-weight: 700; }
.section-count.muted { background: var(--surface2); color: var(--muted2); border-color: var(--border2); }

.category-block { margin-bottom: 16px; }
.cat-header { display: flex; align-items: center; gap: 8px; padding: 7px 12px; margin-bottom: 8px; border-radius: 0 var(--rs) var(--rs) 0; background: var(--surface); }
.cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.cat-label { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
.cat-count { font-size: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 1px 7px; color: var(--muted); margin-left: auto; }

.criteria-list { display: flex; flex-direction: column; gap: 5px; padding-left: 12px; }
.criterion { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--rs); padding: 9px 13px; font-size: 13px; }
.criterion.accepted { border-color: var(--border2); }
.criterion.rejected { opacity: .6; }
.crit-check { font-size: 14px; font-weight: 700; flex-shrink: 0; }
.crit-text { flex: 1; }
.crit-text.muted { color: var(--muted2); }
.crit-votes { font-size: 11px; color: var(--accent); letter-spacing: .05em; flex-shrink: 0; }
.crit-col { font-size: 10px; color: var(--muted); background: var(--surface2); border-radius: 20px; padding: 2px 8px; flex-shrink: 0; }

.participants-section { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); }
.label-sm { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
.p-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.p-tag { background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 3px 10px; font-size: 11px; }
</style>
