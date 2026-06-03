<template>
  <div class="screen">
    <div class="vhead">
      <div>
        <div class="title">Valider les critères</div>
        <div class="sub">3 validations à distribuer · Vote pour les critères à inclure dans la DoD</div>
      </div>
      <div class="tokens">
        <div v-for="i in 3" :key="i" class="tok" :class="{ used: i > tokensLeft }" title="Validation">✓</div>
      </div>
    </div>

    <div v-if="!groupedNotes.length" class="empty"><big>🗳️</big> Aucun critère à valider.</div>

    <div v-else class="groups">
      <div v-for="group in groupedNotes" :key="group.col.key" class="group">
        <div class="group-header" :style="{ borderLeft: `3px solid ${group.col.color}` }">
          <span class="group-dot" :style="{ background: group.col.color }"></span>
          <span class="group-label" :style="{ color: group.col.color }">{{ group.col.label }}</span>
          <span class="group-count">{{ group.notes.length }}</span>
        </div>

        <div class="vlist">
          <div v-for="note in group.notes" :key="note.id" class="vrow">
            <span class="vtxt">{{ note.text }}</span>

            <div class="vbwrap">
              <div class="vbar" :style="{ width: barWidth(note.id) + '%', background: group.col.color }"></div>
            </div>

            <div class="vvoters">
              <template v-for="(uv, user) in allVotes" :key="user">
                <div
                  v-if="uv[note.id]"
                  v-for="i in uv[note.id]"
                  :key="`${user}-${i}`"
                  class="vav"
                  :style="{ background: colorOf(user) }"
                  :title="user"
                >{{ user[0].toUpperCase() }}</div>
              </template>
            </div>

            <span class="vtot" :style="{ color: group.col.color }">{{ totalVotes(note.id) }}</span>
            <div class="vbtns">
              <button class="vbtn vbtn-add" @click="store.castVote(note.id)" :disabled="tokensLeft <= 0" title="Valider">✓</button>
              <button class="vbtn vbtn-rem" @click="store.removeVote(note.id)" :disabled="!myVoteFor(note.id)" title="Retirer">−</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRetroStore } from '../stores/retro'
import { RETRO_FORMATS } from '../retro-formats.js'

const store = useRetroStore()
const dodCols = computed(() => store.cols.length ? store.cols : RETRO_FORMATS['dod'].cols)

const allVotes   = computed(() => store.room?.votes || {})
const tokensLeft = computed(() => 3 - store.myVotesUsed)

const allNotes = computed(() =>
  Object.values(store.room?.notes || {})
)

const groupedNotes = computed(() => {
  return dodCols.value
    .map(col => ({
      col,
      notes: allNotes.value
        .filter(n => n.col === col.key)
        .sort((a, b) => totalVotes(b.id) - totalVotes(a.id)),
    }))
    .filter(g => g.notes.length > 0)
})

function totalVotes(noteId) {
  return Object.values(allVotes.value).reduce((sum, uv) => sum + (uv[noteId] || 0), 0)
}
function myVoteFor(noteId) {
  return (store.myVotes[noteId] || 0) > 0
}

const maxVotes = computed(() => {
  const all = allNotes.value.map(n => totalVotes(n.id))
  return Math.max(...all, 1)
})
function barWidth(noteId) {
  return Math.round(totalVotes(noteId) / maxVotes.value * 100)
}

const PALETTE = [
  ['#a78bfa','#1e1240'],['#4ade80','#0d2a1a'],['#f87171','#2a0d0d'],
  ['#60a5fa','#0d1e35'],['#fb923c','#2a1205'],['#e879f9','#280d2a'],
  ['#34d399','#052a1e'],['#fbbf24','#2a1a05'],
]
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h][0]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 900px; margin: 0 auto; }
.vhead { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.tokens { display: flex; gap: 5px; margin-left: auto; }
.tok { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; transition: all .25s; }
.tok.used { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
.empty { text-align: center; padding: 60px; color: var(--muted); font-size: 14px; }
.empty big { display: block; font-size: 32px; margin-bottom: 8px; }

.groups { display: flex; flex-direction: column; gap: 20px; }
.group-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 8px; border-radius: 0 var(--rs) var(--rs) 0; background: var(--surface); }
.group-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.group-label { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
.group-count { font-size: 10px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 1px 7px; color: var(--muted2); margin-left: auto; }

.vlist { display: flex; flex-direction: column; gap: 6px; }
.vrow { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 11px 14px; display: flex; align-items: center; gap: 10px; transition: border-color .2s; }
.vrow:hover { border-color: var(--border2); }
.vtxt { flex: 1; font-size: 13px; }
.vbwrap { width: 60px; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; flex-shrink: 0; }
.vbar { height: 100%; border-radius: 2px; transition: width .4s ease; }
.vvoters { display: flex; gap: 3px; flex-wrap: wrap; min-width: 30px; }
.vav { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; font-family: 'Syne', sans-serif; color: #fff; }
.vtot { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; min-width: 22px; text-align: center; }
.vbtns { display: flex; gap: 4px; }
.vbtn { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.vbtn-add:not(:disabled):hover { background: rgba(74,222,128,0.15); border-color: rgba(74,222,128,0.4); color: var(--start); }
.vbtn-rem:not(:disabled):hover { background: var(--stop-dim); border-color: var(--stop-b); color: var(--stop); }
.vbtn:disabled { opacity: .2; cursor: not-allowed; }
</style>
