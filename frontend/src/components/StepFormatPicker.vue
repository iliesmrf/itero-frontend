<template>
  <div class="screen">
    <div class="header">
      <div class="title">Choisir le format</div>
      <div class="sub">Sélectionne le type de rétrospective pour cette session</div>
    </div>

    <div class="grid">
      <div
        v-for="fmt in formats"
        :key="fmt.id"
        class="fmt-card"
        :class="{ selected: selectedId === fmt.id }"
        @click="select(fmt.id)"
      >
        <div class="fmt-top">
          <span class="fmt-emoji">{{ fmt.emoji }}</span>
          <span v-if="selectedId === fmt.id" class="fmt-check">✓</span>
        </div>
        <h3>{{ fmt.name }}</h3>
        <p>{{ fmt.description }}</p>

        <!-- Column preview -->
        <div class="cols-preview">
          <span
            v-for="col in fmt.cols"
            :key="col.key"
            class="col-chip"
            :style="{ background: col.dim, border: `1px solid ${col.border}`, color: col.color }"
          >{{ col.label }}</span>
        </div>
      </div>
    </div>

    <button class="btn-start" :disabled="!selectedId" @click="$emit('next')">
      Démarrer avec {{ currentFormat?.name }} →
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRetroStore } from '../stores/retro'
import { FORMAT_LIST } from '../retro-formats.js'

defineEmits(['next'])

const store   = useRetroStore()
const formats = FORMAT_LIST
const selectedId = ref(store.room?.format || 'start-stop-continue')

const currentFormat = computed(() => formats.find(f => f.id === selectedId.value))

function select(id) {
  selectedId.value = id
  store.setFormat(id)
}

// Sync from server
watch(() => store.room?.format, (f) => { if (f) selectedId.value = f })
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.header { margin-bottom: 28px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  margin-bottom: 32px;
}
.fmt-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r);
  padding: 20px;
  cursor: pointer;
  transition: all .2s;
  position: relative;
}
.fmt-card:hover { border-color: var(--border2); transform: translateY(-2px); }
.fmt-card.selected { border-color: var(--accent-b); background: var(--accent-dim); }
.fmt-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.fmt-emoji { font-size: 28px; }
.fmt-check {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
h3 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
p  { font-size: 12px; color: var(--muted2); line-height: 1.5; margin-bottom: 14px; }
.cols-preview { display: flex; flex-wrap: wrap; gap: 5px; }
.col-chip { font-size: 10px; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
.btn-start {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  padding: 12px 28px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .02em;
  transition: all .2s;
}
.btn-start:not(:disabled):hover { opacity: .85; transform: translateY(-1px); }
.btn-start:disabled { opacity: .35; cursor: not-allowed; }
</style>
