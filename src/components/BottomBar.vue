<template>
  <div class="bbar">
    <div class="left">Étape <span>{{ currentStep + 1 }}</span> / {{ maxStep + 1 }}</div>
    <div class="nav">
      <button v-if="currentStep > 0" class="bbp" @click="$emit('prev')">← Retour</button>
      <button class="bbn" @click="$emit('next')">
        {{ currentStep === maxStep ? 'Terminer ✓' : 'Suivant →' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({ currentStep: Number, maxStep: { type: Number, default: 6 } })
defineEmits(['prev', 'next'])
</script>

<style scoped>
.bbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(14,14,16,.94);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--border);
  padding: 11px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left { font-size: 12px; color: var(--muted); }
.left span { color: var(--text); font-weight: 500; }
.nav { display: flex; gap: 7px; }
.bbp {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--rs);
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 500;
}
.bbp:hover { background: var(--surface3); }
.bbn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--rs);
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  letter-spacing: .02em;
}
.bbn:hover { opacity: .85; }
</style>
