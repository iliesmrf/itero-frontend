<template>
  <div class="screen">
    <div class="header">
      <div class="title">Choisir le framework</div>
      <div class="sub">Sélectionne la méthode qui correspond le mieux à votre contexte</div>
    </div>

    <div class="grid">
      <div v-for="tpl in templateList" :key="tpl.id"
        class="tpl-card" :class="{ selected: selectedId === tpl.id }"
        :style="selectedId === tpl.id ? { borderColor: tpl.colorB, background: tpl.colorDim } : {}"
        @click="select(tpl.id)">

        <div class="tpl-top">
          <span class="tpl-emoji">{{ tpl.emoji }}</span>
          <div class="tpl-check" v-if="selectedId === tpl.id"
            :style="{ background: tpl.color }">✓</div>
        </div>

        <h3>{{ tpl.name }}</h3>
        <div class="tpl-author">par {{ tpl.author }}</div>
        <p>{{ tpl.description }}</p>

        <div class="sections-preview">
          <span v-for="s in tpl.sections" :key="s.key" class="section-chip"
            :style="{ background: s.dim, borderColor: s.border, color: s.color }">
            {{ s.label }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="selectedId" class="selection-bar">
      <div class="sel-info">
        <span class="sel-emoji">{{ selectedTpl?.emoji }}</span>
        <span>{{ selectedTpl?.name }}</span>
        <span class="sel-sections">{{ selectedTpl?.sections.length }} sections</span>
      </div>
      <button class="btn-confirm" :style="{ background: selectedTpl?.color }" @click="$emit('next')">
        Démarrer avec {{ selectedTpl?.name }} →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVisionStore } from '../stores/vision'
import { TEMPLATE_LIST } from '../vision-templates.js'

defineEmits(['next'])

const store = useVisionStore()
const templateList = TEMPLATE_LIST

const selectedId = ref(store.room?.templateId || null)
const selectedTpl = computed(() => templateList.find(t => t.id === selectedId.value))

watch(() => store.room?.templateId, (id) => { if (id) selectedId.value = id })

function select(id) {
  selectedId.value = id
  store.setTemplate(id)
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1100px; margin: 0 auto; }
.header { margin-bottom: 28px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-bottom: 100px; }

.tpl-card { background: var(--surface); border: 2px solid var(--border); border-radius: var(--r); padding: 20px; cursor: pointer; transition: all .2s; }
.tpl-card:hover:not(.selected) { border-color: var(--border2); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.1); }
.tpl-card.selected { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.15); }

.tpl-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.tpl-emoji { font-size: 30px; }
.tpl-check { width: 24px; height: 24px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

h3 { font-size: 16px; font-weight: 700; margin-bottom: 3px; }
.tpl-author { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
p { font-size: 12px; color: var(--muted2); line-height: 1.6; margin-bottom: 14px; }

.sections-preview { display: flex; flex-wrap: wrap; gap: 5px; }
.section-chip { font-size: 10px; padding: 3px 9px; border-radius: 20px; border: 1px solid; white-space: nowrap; }

.selection-bar { position: fixed; bottom: 54px; left: 0; right: 0; background: rgba(14,14,16,.96); backdrop-filter: blur(16px); border-top: 1px solid var(--border2); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; z-index: 90; }
.sel-info { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; }
.sel-emoji { font-size: 20px; }
.sel-sections { font-size: 11px; color: var(--muted2); background: var(--surface2); border-radius: 20px; padding: 2px 10px; }
.btn-confirm { color: #fff; border: none; border-radius: var(--rs); padding: 10px 22px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
.btn-confirm:hover { opacity: .85; transform: translateY(-1px); }
</style>
