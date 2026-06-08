<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="title">Vision Produit</div>
        <div class="sub">
          <span v-if="store.template">{{ store.template.emoji }} {{ store.template.name }}</span>
          · {{ participantCount }} participant{{ participantCount > 1 ? 's' : '' }}
          · {{ new Date().toLocaleDateString('fr-FR') }}
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-copy" :class="{ copied }" @click="copyVision">
          {{ copied ? '✓ Copié !' : '📋 Exporter' }}
        </button>
        <button class="btn-finish" @click="$emit('finish')">Terminer ✓</button>
      </div>
    </div>

    <div v-if="!store.template" class="empty-state">
      <div class="empty-ico">📋</div>
      <p>Aucun template sélectionné.</p>
    </div>

    <template v-else>
      <!-- ── VISION BOARD ─────────────────────────────────────────────── -->
      <div v-if="store.template.id === 'vision-board'" class="output vision-board">
        <div class="vb-vision">
          <div class="vb-label" :style="{ color: s('vision').color }">{{ s('vision').label }}</div>
          <div class="vb-content">{{ syn('vision') }}</div>
        </div>
        <div class="vb-grid4">
          <div v-for="key in ['target','needs','product','goals']" :key="key"
            class="vb-cell" :style="{ borderTop: `3px solid ${s(key).color}`, background: s(key).dim }">
            <div class="vb-cell-label" :style="{ color: s(key).color }">{{ s(key).label }}</div>
            <div class="vb-cell-content">{{ syn(key) }}</div>
          </div>
        </div>
      </div>

      <!-- ── ELEVATOR PITCH ───────────────────────────────────────────── -->
      <div v-else-if="store.template.id === 'elevator-pitch'" class="output elevator">
        <div class="elev-sentence">
          <span class="elev-block" v-for="block in elevatorBlocks" :key="block.key"
            :style="{ color: block.color }">
            <em>{{ block.prefix }}</em>
            <span class="elev-value">{{ syn(block.key) || block.placeholder }}</span>
          </span>
        </div>
        <div class="elev-blocks">
          <div v-for="block in elevatorBlocks" :key="block.key"
            class="elev-card" :style="{ borderTop: `3px solid ${s(block.key).color}`, background: s(block.key).dim }">
            <div class="ec-label" :style="{ color: s(block.key).color }">{{ s(block.key).label }}</div>
            <div class="ec-value">{{ syn(block.key) }}</div>
          </div>
        </div>
      </div>

      <!-- ── GOLDEN CIRCLE ────────────────────────────────────────────── -->
      <div v-else-if="store.template.id === 'golden-circle'" class="output golden">
        <div class="circles-wrap">
          <div class="circle circle-what">
            <div class="circle-label" :style="{ color: s('what').color }">QUOI</div>
            <div class="circle-content">{{ syn('what') }}</div>
            <div class="circle-how">
              <div class="circle-label" :style="{ color: s('how').color }">COMMENT</div>
              <div class="circle-content">{{ syn('how') }}</div>
              <div class="circle-why">
                <div class="circle-label" :style="{ color: s('why').color }">POURQUOI</div>
                <div class="circle-content why-content">{{ syn('why') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="gc-list">
          <div v-for="key in ['why','how','what']" :key="key" class="gc-row"
            :style="{ borderLeft: `4px solid ${s(key).color}` }">
            <div class="gc-label" :style="{ color: s(key).color }">{{ s(key).label }}</div>
            <div class="gc-val">{{ syn(key) }}</div>
          </div>
        </div>
      </div>

      <!-- ── NABC ─────────────────────────────────────────────────────── -->
      <div v-else-if="store.template.id === 'nabc'" class="output nabc">
        <div class="nabc-grid">
          <div v-for="key in ['need','approach','benefits','competition']" :key="key"
            class="nabc-cell" :style="{ borderTop: `3px solid ${s(key).color}`, background: s(key).dim }">
            <div class="nabc-label" :style="{ color: s(key).color }">{{ s(key).label }}</div>
            <div class="nabc-content">{{ syn(key) }}</div>
          </div>
        </div>
      </div>

      <!-- ── PRESS RELEASE ────────────────────────────────────────────── -->
      <div v-else-if="store.template.id === 'press-release'" class="output press">
        <div class="press-header">
          <div class="press-date">{{ new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) }}</div>
          <div class="press-headline">{{ syn('headline') || 'Titre du communiqué…' }}</div>
          <div class="press-subheadline">{{ syn('subheadline') }}</div>
        </div>
        <div class="press-body">
          <div v-for="key in ['problem','solution','impact']" :key="key" class="press-section">
            <div class="press-section-label" :style="{ color: s(key).color }">{{ s(key).label }}</div>
            <div class="press-section-text">{{ syn(key) }}</div>
          </div>
          <div v-if="syn('quote')" class="press-quote">
            <span class="quote-mark">"</span>
            {{ syn('quote') }}
            <span class="quote-mark">"</span>
          </div>
        </div>
      </div>

      <!-- Participants & export -->
      <div class="meta-section">
        <div class="meta-label">Participants</div>
        <div class="p-tags">
          <span v-for="p in participantNames" :key="p" class="p-tag">{{ p }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVisionStore } from '../stores/vision'

const store = useVisionStore()
defineEmits(['finish'])

const copied = ref(false)

const participantNames  = computed(() => Object.keys(store.room?.participants || {}))
const participantCount  = computed(() => participantNames.value.length)

function s(key) {
  return store.sections.find(sec => sec.key === key) || { label: key, color: '#888', dim: 'transparent', border: '#888' }
}
function syn(key) {
  return store.room?.synthesis?.[key] || ''
}

// Elevator pitch blocks
const elevatorBlocks = [
  { key: 'for',        prefix: 'Pour ', placeholder: '…' },
  { key: 'who',        prefix: ', qui ', placeholder: '…' },
  { key: 'is',         prefix: ', notre produit est ', placeholder: '…' },
  { key: 'that',       prefix: ' qui permet de ', placeholder: '…' },
  { key: 'unlike',     prefix: '. Contrairement à ', placeholder: '…' },
  { key: 'difference', prefix: ', notre solution ', placeholder: '…' },
]

function copyVision() {
  const tpl = store.template
  if (!tpl) return
  const lines = [`VISION PRODUIT — ${tpl.name}`, `${new Date().toLocaleDateString('fr-FR')}`, '']

  if (tpl.id === 'elevator-pitch') {
    const parts = elevatorBlocks.map(b => `${b.prefix}${syn(b.key)}`).join('')
    lines.push('Pitch :')
    lines.push(parts)
    lines.push('')
  }

  for (const sec of store.sections) {
    lines.push(`[ ${sec.label.toUpperCase()} ]`)
    lines.push(syn(sec.key) || '(non renseigné)')
    lines.push('')
  }

  if (participantNames.value.length) {
    lines.push(`Participants : ${participantNames.value.join(', ')}`)
  }

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {})
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }
.header-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-copy { display: flex; align-items: center; gap: 6px; background: var(--surface2); color: var(--text); border: 1px solid var(--border2); border-radius: var(--rs); padding: 9px 16px; font-size: 13px; font-weight: 600; transition: all .2s; }
.btn-copy:hover { border-color: rgba(232,121,249,0.4); color: #e879f9; }
.btn-copy.copied { background: rgba(232,121,249,0.08); border-color: rgba(232,121,249,0.3); color: #e879f9; }
.btn-finish { background: #e879f9; color: #fff; border: none; border-radius: var(--rs); padding: 9px 20px; font-size: 13px; font-weight: 700; font-family: 'Syne', sans-serif; }
.btn-finish:hover { opacity: .85; transform: translateY(-1px); }
.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }

/* ── Vision Board ──────────────────────────────────────────── */
.output { margin-bottom: 28px; }
.vision-board { display: flex; flex-direction: column; gap: 12px; }
.vb-vision { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 20px; text-align: center; }
.vb-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px; }
.vb-content { font-size: 15px; font-weight: 600; line-height: 1.6; color: var(--text); }
.vb-grid4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.vb-cell { border-radius: var(--r); padding: 16px; min-height: 100px; }
.vb-cell-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.vb-cell-content { font-size: 13px; line-height: 1.6; color: var(--text); }

/* ── Elevator Pitch ────────────────────────────────────────── */
.elev-sentence { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--r); padding: 20px 24px; font-size: 14px; line-height: 2; margin-bottom: 14px; }
.elev-block em { font-style: normal; color: var(--muted2); font-size: 12px; }
.elev-value { font-weight: 600; }
.elev-blocks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.elev-card { border-radius: var(--rs); padding: 12px 14px; min-height: 80px; }
.ec-label { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.ec-value { font-size: 12px; line-height: 1.5; color: var(--text); }

/* ── Golden Circle ─────────────────────────────────────────── */
.golden { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.circles-wrap { display: flex; align-items: center; justify-content: center; }
.circle { border: 2px solid rgba(74,222,128,0.3); border-radius: 50%; width: 280px; height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; position: relative; background: rgba(74,222,128,0.04); }
.circle-how { border: 2px solid rgba(251,146,60,0.35); border-radius: 50%; width: 190px; height: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; text-align: center; background: rgba(251,146,60,0.04); }
.circle-why { border: 2px solid rgba(250,204,21,0.4); border-radius: 50%; width: 110px; height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; background: rgba(250,204,21,0.08); }
.circle-label { font-family: 'Syne', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 2px; }
.circle-content { font-size: 9px; color: var(--muted2); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.why-content { font-size: 8px; -webkit-line-clamp: 3; }
.gc-list { display: flex; flex-direction: column; gap: 10px; }
.gc-row { padding: 14px 16px; background: var(--surface); border-radius: 0 var(--r) var(--r) 0; }
.gc-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 5px; }
.gc-val { font-size: 13px; line-height: 1.6; color: var(--text); }

/* ── NABC ──────────────────────────────────────────────────── */
.nabc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.nabc-cell { border-radius: var(--r); padding: 18px; min-height: 120px; }
.nabc-label { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
.nabc-content { font-size: 13px; line-height: 1.6; color: var(--text); }

/* ── Press Release ─────────────────────────────────────────── */
.press { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; }
.press-header { background: var(--surface2); border-bottom: 1px solid var(--border2); padding: 24px; text-align: center; }
.press-date { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 12px; }
.press-headline { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
.press-subheadline { font-size: 14px; color: var(--muted2); line-height: 1.6; }
.press-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.press-section-label { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
.press-section-text { font-size: 13px; line-height: 1.7; color: var(--text); }
.press-quote { font-size: 15px; font-style: italic; color: var(--muted2); line-height: 1.7; text-align: center; padding: 16px 24px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--surface2); border-radius: var(--rs); }
.quote-mark { font-size: 24px; color: #e879f9; font-style: normal; }

/* Meta */
.meta-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.meta-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
.p-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.p-tag { background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 3px 10px; font-size: 11px; }

@media (max-width: 700px) {
  .vb-grid4, .elev-blocks, .nabc-grid, .golden { grid-template-columns: 1fr; }
}
</style>
