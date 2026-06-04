<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="template-badge" v-if="store.template"
          :style="{ color: store.template.color, borderColor: store.template.colorB, background: store.template.colorDim }">
          {{ store.template.emoji }} {{ store.template.name }}
        </div>
        <div class="title">Synthèse</div>
        <div class="sub">Composez la vision à partir des idées les plus votées · Chaque modification est partagée en temps réel</div>
      </div>
      <div class="progress">
        <span class="prog-num">{{ filledCount }}/{{ store.sections.length }}</span>
        <span class="prog-label">sections rédigées</span>
        <div class="prog-bar">
          <div class="prog-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>
    </div>

    <div v-if="!store.sections.length" class="empty-state">
      <p>Aucun template sélectionné.</p>
    </div>

    <div v-else class="sections-grid">
      <!-- Section tabs -->
      <div class="section-tabs">
        <button v-for="section in store.sections" :key="section.key"
          class="section-tab" :class="{ active: activeSection === section.key, filled: !!synthesis[section.key] }"
          :style="activeSection === section.key ? { borderColor: section.border, color: section.color, background: section.dim } : {}"
          @click="activeSection = section.key">
          <span>{{ section.label }}</span>
          <span v-if="synthesis[section.key]" class="tab-check" :style="{ color: section.color }">✓</span>
        </button>
      </div>

      <!-- Active section -->
      <div v-if="currentSection" class="section-panel">
        <div class="panel-header" :style="{ borderLeftColor: currentSection.color }">
          <h2 :style="{ color: currentSection.color }">{{ currentSection.label }}</h2>
          <p>{{ currentSection.question }}</p>
        </div>

        <!-- Top voted ideas -->
        <div class="top-ideas" v-if="store.topContribs(currentSection.key).length">
          <div class="ideas-label">💡 Idées les plus votées</div>
          <div v-for="c in store.topContribs(currentSection.key)" :key="c.id"
            class="idea-row" :class="{ first: store.voteCount(currentSection.key, c.id) === maxVotes }"
            @click="appendToSynthesis(c.text)">
            <div class="idea-votes" :style="{ color: currentSection.color }">
              {{ store.voteCount(currentSection.key, c.id) > 0 ? '★'.repeat(Math.min(store.voteCount(currentSection.key, c.id), 5)) : '○' }}
            </div>
            <div class="idea-text">{{ c.text }}</div>
            <button class="idea-use" :style="{ color: currentSection.color }" title="Ajouter à la synthèse">+</button>
          </div>
        </div>
        <div v-else class="no-ideas">Aucune contribution pour cette section.</div>

        <!-- Synthesis textarea -->
        <div class="synth-area">
          <div class="synth-label">
            <span>✏️ Synthèse de la section</span>
            <span class="synth-count">{{ (synthesis[currentSection.key] || '').length }} car.</span>
          </div>
          <textarea
            class="synth-input"
            :style="{ '--focus-color': currentSection.colorB || currentSection.border }"
            :placeholder="`Composez ici la synthèse pour « ${currentSection.label} »…`"
            :value="synthesis[currentSection.key] || ''"
            rows="5"
            @input="onSynthesisInput($event, currentSection.key)"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVisionStore } from '../stores/vision'

const store = useVisionStore()

const synthesis    = ref({ ...store.room?.synthesis })
const activeSection = ref(store.sections[0]?.key || null)

watch(() => store.sections, (secs) => {
  if (secs.length && !activeSection.value) activeSection.value = secs[0].key
}, { immediate: true })

watch(() => store.room?.synthesis, (s) => {
  if (s) synthesis.value = { ...s }
}, { deep: true })

const currentSection = computed(() =>
  store.sections.find(s => s.key === activeSection.value) || null
)

const maxVotes = computed(() => {
  if (!currentSection.value) return 0
  const contribs = store.contributionsBySection(currentSection.value.key)
  return Math.max(0, ...contribs.map(c => store.voteCount(currentSection.value.key, c.id)))
})

const filledCount = computed(() =>
  store.sections.filter(s => !!synthesis.value[s.key]?.trim()).length
)
const progressPct = computed(() =>
  store.sections.length ? Math.round(filledCount.value / store.sections.length * 100) : 0
)

let debounceTimer = null
function onSynthesisInput(e, sectionKey) {
  synthesis.value[sectionKey] = e.target.value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setSynthesis(sectionKey, e.target.value)
  }, 400)
}

function appendToSynthesis(text) {
  if (!currentSection.value) return
  const key  = currentSection.value.key
  const current = synthesis.value[key] || ''
  const newText = current ? `${current} ${text}` : text
  synthesis.value[key] = newText
  store.setSynthesis(key, newText)
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.template-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; border: 1px solid; border-radius: 20px; padding: 3px 10px; margin-bottom: 6px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }

.progress { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.prog-num { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #e879f9; }
.prog-label { font-size: 10px; color: var(--muted); }
.prog-bar { width: 120px; height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
.prog-fill { height: 100%; background: #e879f9; border-radius: 2px; transition: width .4s; }

.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); font-size: 13px; }

.sections-grid { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }

.section-tabs { display: flex; flex-direction: column; gap: 5px; }
.section-tab { background: var(--surface); border: 1px solid var(--border); border-radius: var(--rs); padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.section-tab:hover:not(.active) { border-color: var(--border2); }
.section-tab.active { font-family: 'Syne', sans-serif; }
.tab-check { font-size: 12px; }

.section-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.panel-header { border-left: 3px solid; padding-left: 12px; }
.panel-header h2 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.panel-header p { font-size: 12px; color: var(--muted2); line-height: 1.5; }

.ideas-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
.idea-row { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); padding: 8px 12px; cursor: pointer; transition: all .15s; }
.idea-row:hover { border-color: var(--border2); }
.idea-row.first { border-color: rgba(250,204,21,0.3); }
.idea-votes { font-size: 11px; flex-shrink: 0; letter-spacing: 1px; }
.idea-text { flex: 1; font-size: 12px; line-height: 1.4; }
.idea-use { background: none; border: none; font-size: 16px; font-weight: 700; cursor: pointer; opacity: 0; transition: opacity .15s; padding: 0; }
.idea-row:hover .idea-use { opacity: 1; }
.no-ideas { font-size: 12px; color: var(--muted); font-style: italic; }
.top-ideas { display: flex; flex-direction: column; gap: 5px; }

.synth-area { display: flex; flex-direction: column; gap: 7px; }
.synth-label { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--muted2); font-weight: 600; }
.synth-count { font-size: 11px; color: var(--muted); }
.synth-input { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--rs); padding: 11px 13px; font-size: 13px; line-height: 1.7; width: 100%; resize: vertical; min-height: 100px; transition: border-color .2s; font-family: 'DM Sans', sans-serif; }
.synth-input:focus { border-color: var(--focus-color, rgba(232,121,249,0.4)); outline: none; }
.synth-input::placeholder { color: var(--muted); }

@media (max-width: 680px) { .sections-grid { grid-template-columns: 1fr; } .section-tabs { flex-direction: row; flex-wrap: wrap; } }
</style>
