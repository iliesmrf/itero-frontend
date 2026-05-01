<template>
  <div class="screen">
    <div class="vhead">
      <div>
        <div class="title">Voter</div>
        <div class="sub">3 points à distribuer · Votes visibles en temps réel</div>
      </div>
      <div class="tokens">
        <div v-for="i in 3" :key="i" class="tok" :class="{ used: i > tokensLeft }">★</div>
      </div>
    </div>

    <div v-if="!sortedNotes.length" class="empty"><big>🗳️</big> Aucune note à voter.</div>

    <div v-else class="vlist">
      <div v-for="note in sortedNotes" :key="note.id" class="vrow">
        <span class="vtag" :class="`vtag-${note.col}`">{{ colLabel(note.col) }}</span>
        <span class="vtxt">{{ note.text }}</span>

        <div class="vbwrap">
          <div class="vbar" :style="{ width: barWidth(note.id) + '%' }"></div>
        </div>

        <!-- Voters avatars -->
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

        <span class="vtot">{{ totalVotes(note.id) }}</span>
        <div class="vbtns">
          <button class="vbtn" @click="store.castVote(note.id)" :disabled="tokensLeft <= 0">+</button>
          <button class="vbtn" @click="store.removeVote(note.id)" :disabled="!myVoteFor(note.id)">−</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRetroStore } from '../stores/retro'

const store = useRetroStore()

const allVotes  = computed(() => store.room?.votes || {})
const tokensLeft = computed(() => 3 - store.myVotesUsed)

const sortedNotes = computed(() => {
  return Object.values(store.room?.notes || {})
    .sort((a, b) => totalVotes(b.id) - totalVotes(a.id))
})

function totalVotes(noteId) {
  return Object.values(allVotes.value).reduce((sum, uv) => sum + (uv[noteId] || 0), 0)
}

function myVoteFor(noteId) {
  return (store.myVotes[noteId] || 0) > 0
}

const maxVotes = computed(() => {
  const all = sortedNotes.value.map(n => totalVotes(n.id))
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

function colLabel(col) {
  return { start: 'Start', stop: 'Stop', continue: 'Continue' }[col] || col
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.vhead { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 3px; }
.tokens { display: flex; gap: 5px; }
.tok { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: all .25s; }
.tok.used { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
.empty { text-align: center; padding: 60px; color: var(--muted); font-size: 14px; }
.empty big { display: block; font-size: 32px; margin-bottom: 8px; }
.vlist { display: flex; flex-direction: column; gap: 7px; }
.vrow { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 12px 16px; display: flex; align-items: center; gap: 12px; transition: border-color .2s; }
.vrow:hover { border-color: var(--border2); }
.vtag { font-size: 10px; padding: 3px 8px; border-radius: 20px; flex-shrink: 0; }
.vtag-start    { background: var(--start-dim); color: var(--start); }
.vtag-stop     { background: var(--stop-dim);  color: var(--stop); }
.vtag-continue { background: var(--cont-dim);  color: var(--cont); }
.vtxt { flex: 1; font-size: 13px; }
.vbwrap { width: 70px; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.vbar { height: 100%; background: var(--accent); border-radius: 2px; transition: width .4s ease; }
.vvoters { display: flex; gap: 3px; flex-wrap: wrap; min-width: 36px; }
.vav { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; font-family: 'Syne', sans-serif; color: #fff; }
.vtot { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; min-width: 24px; text-align: center; color: var(--accent); }
.vbtns { display: flex; gap: 4px; }
.vbtn { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.vbtn:not(:disabled):hover { background: var(--accent-dim); border-color: var(--accent-b); }
.vbtn:disabled { opacity: .2; cursor: not-allowed; }
</style>
