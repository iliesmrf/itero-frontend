<template>
  <div class="screen">
    <div class="grid">
      <div>
        <div class="badge"><span class="ldot"></span> Atelier en direct</div>
        <h1>Definition<br><em>of Done</em></h1>
        <p>Un atelier collaboratif pour aligner l'équipe sur ce que signifie vraiment « terminé ».</p>
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
      </div>
    </div>
    <button class="btn-start" @click="$emit('next')">Démarrer →</button>
  </div>
</template>

<script setup>
import { useRetroStore } from '../stores/retro'
const store = useRetroStore()
defineEmits(['next'])

const rules = [
  { ico: '🎯', title: 'Objectif commun',  desc: 'Chaque critère doit être mesurable et objectif.' },
  { ico: '🤝', title: 'Consensus',        desc: 'On valide uniquement ce que l\'équipe accepte.' },
  { ico: '✏️', title: 'Brainstorm libre', desc: 'Propose tous tes critères, même évidents.' },
  { ico: '⏱️', title: 'Timebox',          desc: '~30 min en tout pour rester focus.' },
]
const schedule = [
  { n: 1, name: 'Intro',       desc: 'Contexte et règles',         dur: '5 min' },
  { n: 2, name: 'Brainstormer',desc: 'Proposer des critères',       dur: '10 min' },
  { n: 3, name: 'Valider',     desc: '3 votes pour inclure',        dur: '10 min' },
  { n: 4, name: 'Résultat',    desc: 'La DoD finale de l\'équipe',  dur: '5 min' },
]

function copyLink() {
  const url = `${location.origin}/dod?room=${store.room?.code}`
  navigator.clipboard.writeText(url).catch(() => {})
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 1000px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); border: 1px solid var(--accent-b); border-radius: 20px; padding: 4px 12px; margin-bottom: 16px; }
.ldot { width: 6px; height: 6px; border-radius: 50%; background: var(--start); animation: pulse 1.5s infinite; }
h1 { font-size: clamp(26px,3.5vw,44px); font-weight: 800; line-height: 1.1; margin-bottom: 12px; }
h1 em { font-style: normal; color: var(--accent); }
.screen > .grid > div > p { font-size: 14px; color: var(--muted2); line-height: 1.7; margin-bottom: 18px; }
.rules { display: flex; flex-direction: column; gap: 8px; }
.rule { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--rs); }
.ico { font-size: 16px; flex-shrink: 0; }
.rule h4 { font-size: 13px; font-weight: 700; margin-bottom: 1px; }
.rule p { font-size: 12px; color: var(--muted2); line-height: 1.5; }
.box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); }
.tlrow { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 1px solid var(--border); }
.tlnum { width: 22px; height: 22px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; flex-shrink: 0; }
.tlbody { flex: 1; }
.tlbody strong { font-size: 13px; font-weight: 700; }
.tlbody span { font-size: 12px; color: var(--muted2); display: block; }
.tldur { font-family: 'Syne', sans-serif; font-size: 12px; color: var(--accent); }
.share { padding: 14px 16px; border-top: 1px solid var(--border); }
.share p { font-size: 11px; color: var(--muted2); margin-bottom: 8px; }
.code { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: .28em; text-align: center; background: var(--surface2); border: 1px dashed rgba(167,139,250,.3); border-radius: var(--rs); padding: 10px; color: var(--accent); cursor: pointer; }
.code:hover { background: var(--surface3); }
.hint { font-size: 11px; color: var(--muted); text-align: center; margin-top: 6px; }
.btn-start { background: var(--accent); color: #fff; border: none; border-radius: var(--rs); padding: 11px 28px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .02em; }
.btn-start:hover { opacity: .85; transform: translateY(-1px); }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
@media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
</style>
