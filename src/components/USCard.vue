<template>
  <div class="us-card" :class="{ expanded }" @click="expanded = !expanded">
    <div class="card-top">
      <span class="prio-dot" :style="{ background: prioColor }"></span>
      <span class="us-title">{{ story.title }}</span>
      <span class="us-pts">{{ story.points }}</span>
    </div>
    <div class="card-meta">
      <span class="us-author">{{ story.author[0].toUpperCase() }}{{ story.author.slice(1, 8) }}</span>
    </div>

    <!-- Expanded controls -->
    <div v-if="expanded" class="card-controls" @click.stop>
      <div class="ctrl-row">
        <label>Déplacer vers</label>
        <select class="ctrl-select" :value="story.sprintId || ''" @change="move($event.target.value)">
          <option value="">Backlog</option>
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div class="ctrl-row">
        <label>Points</label>
        <input type="number" min="0" max="200" class="ctrl-input" :value="story.points"
          @change="$emit('update', story.id, { points: Number($event.target.value) })" />
      </div>
      <div class="ctrl-row">
        <label>Priorité</label>
        <select class="ctrl-select" :value="story.priority"
          @change="$emit('update', story.id, { priority: $event.target.value })">
          <option value="high">🔴 Haute</option>
          <option value="medium">🟡 Moyenne</option>
          <option value="low">🟢 Faible</option>
        </select>
      </div>
      <button class="btn-delete" @click="$emit('delete', story.id)">Supprimer</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  story:   { type: Object, required: true },
  sprints: { type: Array, default: () => [] },
})
const emit = defineEmits(['update', 'delete'])

const expanded = ref(false)

const prioColor = computed(() => ({
  high: '#f87171', medium: '#facc15', low: '#4ade80'
})[props.story.priority] || '#facc15')

function move(sprintId) {
  emit('update', props.story.id, { sprintId: sprintId || null })
}
</script>

<style scoped>
.us-card { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); padding: 9px 10px; cursor: pointer; transition: all .15s; animation: pop .2s ease; }
.us-card:hover { border-color: var(--border2); }
.us-card.expanded { border-color: var(--cont-b); background: rgba(96,165,250,0.05); }
.card-top { display: flex; align-items: flex-start; gap: 7px; }
.prio-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.us-title { flex: 1; font-size: 12px; line-height: 1.4; }
.us-pts { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: var(--cont); background: var(--cont-dim); border: 1px solid var(--cont-b); border-radius: 20px; padding: 1px 7px; flex-shrink: 0; }
.card-meta { margin-top: 4px; }
.us-author { font-size: 10px; color: var(--muted); }

.card-controls { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 7px; }
.ctrl-row { display: flex; align-items: center; gap: 8px; }
.ctrl-row label { font-size: 10px; color: var(--muted); min-width: 72px; }
.ctrl-select, .ctrl-input { flex: 1; background: var(--surface); border: 1px solid var(--border2); border-radius: var(--rs); padding: 5px 8px; font-size: 11px; }
.ctrl-select:focus, .ctrl-input:focus { border-color: var(--cont-b); outline: none; }
.btn-delete { align-self: flex-end; background: var(--stop-dim); border: 1px solid var(--stop-b); color: var(--stop); border-radius: var(--rs); padding: 4px 10px; font-size: 10px; margin-top: 2px; }
.btn-delete:hover { background: var(--stop); color: #fff; }
@keyframes pop { from { transform: scale(.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
