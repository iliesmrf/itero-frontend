<template>
  <div class="screen">
    <div class="header">
      <div>
        <div class="template-badge" v-if="store.template"
          :style="{ color: store.template.color, borderColor: store.template.colorB, background: store.template.colorDim }">
          {{ store.template.emoji }} {{ store.template.name }}
        </div>
        <div class="title">Voter</div>
        <div class="sub">Upvote les idées que tu trouves les plus pertinentes · Votes illimités · Visible en temps réel</div>
      </div>
    </div>

    <div v-if="!store.sections.length" class="empty-state">
      <div class="empty-ico">⚙️</div>
      <p>Aucun template sélectionné.</p>
    </div>

    <div v-else class="sections-list">
      <div v-for="section in store.sections" :key="section.key" class="section-block">
        <div class="section-header" :style="{ borderLeftColor: section.color }">
          <span class="sh-dot" :style="{ background: section.color }"></span>
          <span class="sh-label" :style="{ color: section.color }">{{ section.label }}</span>
          <span class="sh-question">{{ section.question }}</span>
          <span class="sh-count">{{ store.contributionsBySection(section.key).length }}</span>
        </div>

        <div v-if="!store.contributionsBySection(section.key).length" class="sec-empty">
          Aucune contribution pour cette section.
        </div>

        <div v-else class="contrib-list">
          <div v-for="c in store.contributionsBySection(section.key)" :key="c.id"
            class="contrib-row" :class="{ top: isTopVoted(section.key, c.id) }">

            <div class="contrib-content">
              <span v-if="isTopVoted(section.key, c.id)" class="top-badge">★</span>
              <span class="contrib-text">{{ c.text }}</span>
              <div class="voters">
                <div v-for="voter in getVoters(section.key, c.id)" :key="voter"
                  class="voter-av" :style="{ background: colorOf(voter) }" :title="voter">
                  {{ voter[0].toUpperCase() }}
                </div>
              </div>
            </div>

            <div class="vote-ctrl">
              <span class="vote-count" :style="{ color: section.color }">{{ store.voteCount(section.key, c.id) }}</span>
              <button class="vote-btn"
                :class="{ voted: store.hasVoted(section.key, c.id) }"
                :style="store.hasVoted(section.key, c.id) ? { background: section.dim, borderColor: section.border, color: section.color } : {}"
                @click="store.toggleVote(section.key, c.id)">
                {{ store.hasVoted(section.key, c.id) ? '▲' : '△' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useVisionStore } from '../stores/vision'

const store = useVisionStore()

function getVoters(sectionKey, contribId) {
  return store.room?.votes?.[sectionKey]?.[contribId] || []
}

function isTopVoted(sectionKey, contribId) {
  const contribs = store.contributionsBySection(sectionKey)
  if (!contribs.length) return false
  const maxVotes = Math.max(...contribs.map(c => store.voteCount(sectionKey, c.id)))
  return maxVotes > 0 && store.voteCount(sectionKey, contribId) === maxVotes
}

const PALETTE = ['#a78bfa','#4ade80','#f87171','#60a5fa','#fb923c','#e879f9','#34d399','#fbbf24']
function colorOf(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}
</script>

<style scoped>
.screen { padding: 72px 24px 80px; max-width: 920px; margin: 0 auto; }
.header { margin-bottom: 24px; }
.template-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; border: 1px solid; border-radius: 20px; padding: 3px 10px; margin-bottom: 6px; }
.title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
.sub { font-size: 13px; color: var(--muted2); margin-top: 4px; }
.empty-state { text-align: center; padding: 60px 24px; color: var(--muted2); }
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-state p { font-size: 13px; }

.sections-list { display: flex; flex-direction: column; gap: 20px; }

.section-block {}
.section-header { display: flex; align-items: center; gap: 8px; border-left: 3px solid; padding: 8px 12px; background: var(--surface); border-radius: 0 var(--rs) var(--rs) 0; margin-bottom: 10px; }
.sh-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sh-label { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; }
.sh-question { flex: 1; font-size: 11px; color: var(--muted2); margin-left: 4px; }
.sh-count { font-size: 10px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 20px; padding: 1px 7px; color: var(--muted); }

.sec-empty { font-size: 12px; color: var(--muted); padding: 12px 16px; background: var(--surface); border-radius: var(--rs); font-style: italic; }

.contrib-list { display: flex; flex-direction: column; gap: 6px; }
.contrib-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 12px 14px; transition: border-color .2s; }
.contrib-row.top { border-color: var(--border2); background: var(--surface2); }
.contrib-row:hover { border-color: var(--border2); }
.contrib-content { flex: 1; display: flex; align-items: center; gap: 10px; }
.top-badge { color: #facc15; font-size: 14px; flex-shrink: 0; }
.contrib-text { flex: 1; font-size: 13px; line-height: 1.4; }
.voters { display: flex; gap: 3px; flex-shrink: 0; }
.voter-av { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; }
.vote-ctrl { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.vote-count { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; min-width: 22px; text-align: center; }
.vote-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.vote-btn:hover { background: var(--surface3); }
.vote-btn.voted { transform: scale(1.05); }
</style>
