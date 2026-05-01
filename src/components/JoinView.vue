<template>
  <div class="join">
    <div class="card">
      <div class="logo">RÉTRO COLLABORATIVE</div>
      <h1>Rejoindre</h1>
      <p>Créez une salle ou rejoignez-en une. Synchronisation en temps réel via WebSocket.</p>

      <div class="field">
        <label>VOTRE PRÉNOM</label>
        <input v-model="name" placeholder="Ex : Sophie" maxlength="20" @keydown.enter="createRoom" />
      </div>

      <button class="btn-acc" @click="createRoom" :disabled="!name.trim()">
        ✦ Créer une nouvelle salle
      </button>

      <div class="divider"><span>ou rejoindre avec un code</span></div>

      <div class="field">
        <label>CODE DE SALLE</label>
        <input
          v-model="code"
          placeholder="Ex : BRTX"
          maxlength="6"
          class="code-input"
          @input="code = code.toUpperCase()"
          @keydown.enter="joinRoom"
        />
      </div>

      <button class="btn-out" @click="joinRoom" :disabled="!name.trim() || code.length < 4">
        Rejoindre →
      </button>

      <p v-if="store.error" class="err">{{ store.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRetroStore } from '../stores/retro'

const store = useRetroStore()
const name  = ref('')
const code  = ref('')

// Pre-fill code from URL
const urlCode = new URLSearchParams(location.search).get('room')
if (urlCode) code.value = urlCode.toUpperCase()

function createRoom() {
  if (!name.value.trim()) return
  store.createRoom(name.value.trim())
}

function joinRoom() {
  if (!name.value.trim() || code.value.length < 4) return
  store.joinRoom(code.value.trim(), name.value.trim())
}
</script>

<style scoped>
.join {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(167,139,250,.08) 0%, transparent 60%);
}
.card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 36px;
}
.logo {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  letter-spacing: .14em;
  color: var(--accent);
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.logo::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}
h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
p { font-size: 13px; color: var(--muted2); line-height: 1.6; margin-bottom: 24px; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 11px; color: var(--muted2); letter-spacing: .05em; margin-bottom: 5px; }
.field input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--rs);
  padding: 10px 13px;
  font-size: 14px;
  transition: border-color .2s;
}
.field input:focus { border-color: var(--accent-b); }
.field input::placeholder { color: var(--muted); }
.code-input {
  text-transform: uppercase;
  letter-spacing: .18em;
  font-family: 'Syne', sans-serif !important;
  font-size: 17px !important;
  font-weight: 700;
}
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
}
.divider span { font-size: 12px; color: var(--muted); white-space: nowrap; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
button {
  width: 100%;
  padding: 11px;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .02em;
  border: none;
  border-radius: var(--rs);
}
button:disabled { opacity: .4; cursor: not-allowed; }
.btn-acc { background: var(--accent); color: #fff; margin-bottom: 12px; }
.btn-acc:not(:disabled):hover { opacity: .85; transform: translateY(-1px); }
.btn-out { background: transparent; color: var(--text); border: 1px solid var(--border2); }
.btn-out:not(:disabled):hover { background: var(--surface2); }
.err { font-size: 12px; color: var(--stop); text-align: center; margin-top: 12px; }
</style>
