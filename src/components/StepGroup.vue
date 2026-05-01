<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">Grouper</div>
        <div class="sub">Contributions similaires regroupées automatiquement · Discutez avant de voter</div>
      </div>
      <button class="btn-cluster" @click="runClustering" :disabled="clustering">
        <span v-if="clustering">⏳ Analyse…</span>
        <span v-else>✨ Regrouper automatiquement</span>
      </button>
    </div>

    <!-- Clustered view -->
    <div v-if="hasClusters" class="section">
      <div class="section-label">Groupes détectés ({{ clusterCount }} groupes, {{ mergedCount }} fusion{{ mergedCount > 1 ? 's' : '' }})</div>
      <div v-for="col in cols" :key="col.key">
        <div v-if="clustersByCol(col.key).length" class="col-section">
          <div class="col-title" :style="{ color: col.color }">
            <span class="col-dot" :style="{ background: col.color }"></span>
            {{ col.label }}
          </div>
          <div class="clusters-grid">
            <div v-for="cluster in clustersByCol(col.key)" :key="cluster.id" class="cluster-card"
              :style="{ borderTop: `2px solid ${col.color}` }">
              <div class="cluster-head">
                <span class="cluster-label">{{ cluster.label }}</span>
                <span class="cluster-count"
                  :style="{ background: col.dim, color: col.color, border: `1px solid ${col.border}` }">
                  {{ cluster.noteIds.length }} note{{ cluster.noteIds.length > 1 ? 's' : '' }}
                </span>
              </div>
              <div class="cluster-notes">
                <div v-for="noteId in cluster.noteIds" :key="noteId" class="cluster-note"
                  :style="{ background: col.dim, border: `1px solid ${col.border}` }">
                  {{ noteById(noteId)?.text }}
                  <span class="note-author">{{ noteById(noteId)?.author }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Raw view (no clusters yet) -->
    <div v-else class="section">
      <div class="section-label">Notes brutes — clique sur "Regrouper automatiquement" pour analyser</div>
      <div class="raw-grid">
        <div v-for="col in cols" :key="col.key" class="gcard">
          <div class="gcardh">
            <h3 :style="{ color: col.color }">{{ col.label }}</h3>
            <span class="gbadge">{{ notesByCol(col.key).length }}</span>
          </div>
          <div class="gitems">
            <div v-if="!notesByCol(col.key).length" class="empty-col">Aucune note</div>
            <div v-for="note in notesByCol(col.key)" :key="note.id" class="gitem">
              <span class="gdot" :style="{ background: col.color }"></span>
              {{ note.text }}
              <span class="gauth">{{ note.author }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRetroStore } from '../stores/retro'

const store = useRetroStore()
const cols  = computed(() => store.cols)
const clustering = ref(false)

const notes    = computed(() => store.room?.notes    || {})
const clusters = computed(() => store.room?.clusters || {})

const hasClusters  = computed(() => Object.keys(clusters.value).length > 0)
const clusterCount = computed(() => Object.keys(clusters.value).length)
const mergedCount  = computed(() =>
  Object.values(clusters.value).filter(c => c.noteIds.length > 1).length
)

function notesByCol(col) {
  return Object.values(notes.value).filter(n => n.col === col).sort((a,b) => a.createdAt - b.createdAt)
}
function clustersByCol(col) {
  return Object.values(clusters.value).filter(c => c.col === col)
}
function noteById(id) { return notes.value[id] }

async function runClustering() {
  clustering.value = true
  store.runAutoClusters()
  // Reset flag after a moment (server will broadcast clusters:updated)
  setTimeout(() => { clustering.value = false }, 3000)
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.btn-cluster {
  background: var(--accent-dim); color: var(--accent);
  border: 1px solid var(--accent-b); border-radius: var(--rs);
  padding: 9px 18px; font-size: 13px; font-weight: 500;
  white-space: nowrap; flex-shrink: 0;
}
.btn-cluster:not(:disabled):hover { background: rgba(167,139,250,0.2); }
.btn-cluster:disabled { opacity: .5; cursor: not-allowed; }
.section-label { font-size: 11px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 16px; }
.col-section { margin-bottom: 24px; }
.col-title { display: flex; align-items: center; gap: 8px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.col-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.clusters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.cluster-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
.cluster-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.cluster-label { font-size: 13px; font-weight: 600; flex: 1; }
.cluster-count { font-size: 10px; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
.cluster-notes { display: flex; flex-direction: column; gap: 5px; }
.cluster-note { font-size: 12px; padding: 6px 9px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; line-height: 1.4; }
.note-author { font-size: 10px; color: var(--muted); white-space: nowrap; }
/* Raw grid */
.raw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.gcard { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; }
.gcardh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.gcardh h3 { font-size: 14px; font-weight: 700; }
.gbadge { font-size: 10px; background: var(--accent-dim); color: var(--accent); border-radius: 20px; padding: 2px 9px; }
.gitems { display: flex; flex-direction: column; gap: 5px; }
.empty-col { font-size: 12px; color: var(--muted); font-style: italic; }
.gitem { font-size: 12px; background: var(--surface2); border-radius: 6px; padding: 7px 9px; display: flex; align-items: center; gap: 7px; color: var(--muted2); }
.gdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.gauth { font-size: 10px; color: var(--muted); margin-left: auto; white-space: nowrap; }
</style>
