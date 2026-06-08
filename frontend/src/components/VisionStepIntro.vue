<template>
  <div class="screen">
    <div class="grid">
      <div>
        <div class="badge"><span class="ldot"></span> Atelier en direct</div>
        <h1>Vision<br><em>Produit</em></h1>
        <p>Un atelier collaboratif pour aligner l'équipe sur une vision commune, claire et inspirante — en 5 étapes guidées.</p>
        <div class="rules">
          <div class="rule" v-for="r in rules" :key="r.title">
            <span class="ico">{{ r.ico }}</span>
            <div><h4>{{ r.title }}</h4><p>{{ r.desc }}</p></div>
          </div>
        </div>
      </div>

      <div>
        <div class="box">
          <div class="tlrow" v-for="s in schedule" :key="s.name">
            <div class="tlnum">{{ s.n }}</div>
            <div class="tlbody"><strong>{{ s.name }}</strong><span>{{ s.desc }}</span></div>
            <div class="tldur">{{ s.dur }}</div>
          </div>
          <div class="share">
            <p>Partager le code :</p>
            <div class="code" @click="copyLink">{{ store.room?.code }}</div>
            <p class="hint">Cliquer pour copier le lien</p>
          </div>
        </div>

        <!-- Template preview cards -->
        <div class="templates-preview">
          <div class="tp-label">5 frameworks disponibles</div>
          <div class="tp-list">
            <div v-for="t in templateList" :key="t.id" class="tp-chip"
              :style="{ borderColor: t.colorB, color: t.color, background: t.colorDim }">
              {{ t.emoji }} {{ t.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <button class="btn-start" @click="$emit('next')">Choisir un framework →</button>
  </div>
</template>

<script setup>
import { useVisionStore } from '../stores/vision'
import { TEMPLATE_LIST } from '../vision-templates.js'

const store = useVisionStore()
const templateList = TEMPLATE_LIST
defineEmits(['next'])

const rules = [
  { ico: '💡', title: 'Diverger puis converger', desc: 'D\'abord toutes les idées, puis on vote et on synthétise.' },
  { ico: '🗣️', title: 'Toutes les voix comptent', desc: 'Chaque contribution est visible de tous.' },
  { ico: '✏️', title: 'Synthèse collective',      desc: 'L\'équipe compose la vision ensemble.' },
  { ico: '⏱️', title: 'Timebox',                   desc: '~60 min pour une vision actionnabe.' },
]
const schedule = [
  { n: 1, name: 'Template',    desc: 'Choisir le framework',       dur: '5 min' },
  { n: 2, name: 'Contribuer', desc: 'Idées par section',           dur: '15 min' },
  { n: 3, name: 'Voter',      desc: 'Faire émerger les meilleures', dur: '10 min' },
  { n: 4, name: 'Synthèse',   desc: 'Composer la vision',          dur: '20 min' },
  { n: 5, name: 'Vision',     desc: 'Output final et export',       dur: '10 min' },
]

function copyLink() {
  const url = `${location.origin}/vision?room=${store.room?.code}`
  navigator.clipboard.writeText(url).catch(() => {})
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #e879f9; border: 1px solid rgba(232,121,249,0.3); border-radius: 20px; padding: 4px 12px; margin-bottom: 16px; }
.ldot { width: 6px; height: 6px; border-radius: 50%; background: #e879f9; animation: pulse 1.5s infinite; }
h1 { font-size: clamp(28px,3.5vw,46px); font-weight: 800; line-height: 1.05; margin-bottom: 12px; }
h1 em { font-style: normal; color: #e879f9; }
.screen > .grid > div > p { font-size: 14px; color: var(--muted2); line-height: 1.7; margin-bottom: 18px; }
.rules { display: flex; flex-direction: column; gap: 8px; }
.rule { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--rs); }
.ico { font-size: 16px; flex-shrink: 0; }
.rule h4 { font-size: 13px; font-weight: 700; margin-bottom: 1px; }
.rule p { font-size: 12px; color: var(--muted2); line-height: 1.5; }
.box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 14px; }
.tlrow { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
.tlnum { width: 22px; height: 22px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.tlbody { flex: 1; }
.tlbody strong { font-size: 12px; font-weight: 700; }
.tlbody span { font-size: 11px; color: var(--muted2); display: block; }
.tldur { font-family: 'Syne', sans-serif; font-size: 11px; color: #e879f9; }
.share { padding: 14px 16px; border-top: 1px solid var(--border); }
.share p { font-size: 11px; color: var(--muted2); margin-bottom: 8px; }
.code { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: .28em; text-align: center; background: var(--surface2); border: 1px dashed rgba(232,121,249,0.3); border-radius: var(--rs); padding: 10px; color: #e879f9; cursor: pointer; }
.code:hover { background: var(--surface3); }
.hint { font-size: 11px; color: var(--muted); text-align: center; margin-top: 6px; }
.templates-preview { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; }
.tp-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
.tp-list { display: flex; flex-wrap: wrap; gap: 6px; }
.tp-chip { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid; }
.btn-start { background: #e879f9; color: #fff; border: none; border-radius: var(--rs); padding: 11px 28px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
.btn-start:hover { opacity: .85; transform: translateY(-1px); }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
@media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
</style>
