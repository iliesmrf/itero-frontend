<template>
  <div>
    <TopBar :current-step="currentStep" :steps="dodSteps" @goto="gotoStep" />
    <DodStepIntro    v-if="currentStep === 0" @next="nextStep" />
    <DodStepBrainstorm v-if="currentStep === 1" />
    <DodStepVote     v-if="currentStep === 2" />
    <DodStepResult   v-if="currentStep === 3" @finish="finish" />
    <BottomBar :current-step="currentStep" :max-step="3" @prev="prevStep" @next="nextStep" />
    <div class="toast" :class="{ show: toast.visible }">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRetroStore } from '../stores/retro'
import { useHistoryStore } from '../stores/history'
import TopBar          from '../components/TopBar.vue'
import BottomBar       from '../components/BottomBar.vue'
import DodStepIntro    from '../components/DodStepIntro.vue'
import DodStepBrainstorm from '../components/DodStepBrainstorm.vue'
import DodStepVote     from '../components/DodStepVote.vue'
import DodStepResult   from '../components/DodStepResult.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const retro  = useRetroStore()
const historyStore = useHistoryStore()

const currentStep = ref(0)
const toast = ref({ visible: false, msg: '' })

const dodSteps = ['① Intro', '② Brainstormer', '③ Valider', '④ Résultat']

function showToast(msg) {
  toast.value = { visible: true, msg }
  setTimeout(() => toast.value.visible = false, 2500)
}
function gotoStep(step) {
  currentStep.value = step
  retro.setStep(step)
  window.scrollTo(0, 0)
}
function nextStep() {
  if (currentStep.value < 3) gotoStep(currentStep.value + 1)
  else finish()
}
function prevStep() {
  if (currentStep.value > 0) gotoStep(currentStep.value - 1)
}

function finish() {
  historyStore.addSession({
    id: Date.now(),
    roomCode: retro.room?.code,
    format: 'dod',
    formatName: 'Definition of Done',
    participantCount: Object.keys(retro.room?.participants || {}).length,
    participants: Object.keys(retro.room?.participants || {}),
    noteCount: Object.keys(retro.room?.notes || {}).length,
    actionCount: 0,
    summary: null,
    actions: [],
    createdAt: Date.now(),
  })
  showToast('Atelier DoD terminé ! ✅')
  setTimeout(() => router.push('/'), 800)
}

let formatSet = false
watch(() => retro.room, (room) => {
  if (room && !formatSet && route.query.action === 'create') {
    formatSet = true
    retro.setFormat('dod')
  }
})

watch(() => retro.room?.step, (s) => { if (s != null && s !== currentStep.value) currentStep.value = s })
watch(() => retro.error, (e) => { if (e) { showToast(e); retro.clearError() } })

onMounted(() => {
  retro.initSocket(auth.token)
  const action   = route.query.action
  const roomCode = route.query.room
  if (action === 'create') retro.createRoom()
  else if (roomCode)       retro.joinRoom(roomCode)
})
</script>

<style>
.toast { position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(8px);background:#2a2a32;border:1px solid rgba(255,255,255,.13);border-radius:20px;padding:7px 16px;font-size:12px;color:#aaa9a0;opacity:0;transition:all .3s;pointer-events:none;z-index:500;white-space:nowrap; }
.toast.show { opacity:1;transform:translateX(-50%) translateY(0); }
</style>
