<template>
  <div>
    <TopBar :current-step="currentStep" :steps="visionSteps" @goto="gotoStep"
      :store-room="vision.room" :store-connected="vision.connected" :store-leave="vision.leaveRoom" />
    <VisionStepIntro      v-if="currentStep === 0" @next="nextStep" />
    <VisionStepTemplate   v-if="currentStep === 1" @next="nextStep" />
    <VisionStepContribute v-if="currentStep === 2" />
    <VisionStepVote       v-if="currentStep === 3" />
    <VisionStepSynthesis  v-if="currentStep === 4" />
    <VisionStepOutput     v-if="currentStep === 5" @finish="finish" />
    <BottomBar :current-step="currentStep" :max-step="5" @prev="prevStep" @next="nextStep" />
    <div class="toast" :class="{ show: toast.visible }">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useVisionStore } from '../stores/vision'
import { useHistoryStore } from '../stores/history'
import TopBar             from '../components/TopBar.vue'
import BottomBar          from '../components/BottomBar.vue'
import VisionStepIntro    from '../components/VisionStepIntro.vue'
import VisionStepTemplate from '../components/VisionStepTemplate.vue'
import VisionStepContribute from '../components/VisionStepContribute.vue'
import VisionStepVote     from '../components/VisionStepVote.vue'
import VisionStepSynthesis from '../components/VisionStepSynthesis.vue'
import VisionStepOutput   from '../components/VisionStepOutput.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const vision = useVisionStore()
const historyStore = useHistoryStore()

const currentStep = ref(0)
const toast = ref({ visible: false, msg: '' })

const visionSteps = ['① Intro', '② Template', '③ Contribuer', '④ Voter', '⑤ Synthèse', '⑥ Vision']

function showToast(msg) {
  toast.value = { visible: true, msg }
  setTimeout(() => toast.value.visible = false, 2500)
}
function gotoStep(step) {
  currentStep.value = step
  vision.setStep(step)
  window.scrollTo(0, 0)
}
function nextStep() {
  if (currentStep.value < 5) gotoStep(currentStep.value + 1)
  else finish()
}
function prevStep() {
  if (currentStep.value > 0) gotoStep(currentStep.value - 1)
}

function finish() {
  historyStore.addSession({
    id: Date.now(),
    roomCode: vision.room?.code,
    format: 'vision',
    formatName: `Vision — ${vision.template?.name || 'Produit'}`,
    participantCount: Object.keys(vision.room?.participants || {}).length,
    participants: Object.keys(vision.room?.participants || {}),
    noteCount: vision.totalContributions,
    actionCount: 0,
    summary: null,
    actions: [],
    createdAt: Date.now(),
  })
  showToast('Vision produit finalisée ! 🎯')
  setTimeout(() => router.push('/'), 800)
}

watch(() => vision.room?.step, (s) => { if (s != null && s !== currentStep.value) currentStep.value = s })
watch(() => vision.error, (e) => { if (e) { showToast(e); vision.clearError() } })

watch(() => vision.room?.code, (code) => {
  if (!code) return
  historyStore.addSession({
    id: Date.now(),
    roomCode: code,
    format: 'vision',
    formatName: `Vision — ${vision.template?.name || 'Produit'}`,
    participantCount: Object.keys(vision.room?.participants || {}).length,
    participants: Object.keys(vision.room?.participants || {}),
    noteCount: 0,
    actionCount: 0,
    piData: null,
    createdAt: Date.now(),
  })
}, { once: true })

onMounted(() => {
  vision.initSocket(auth.token)
  const action   = route.query.action
  const roomCode = route.query.room
  if (action === 'create') vision.createRoom()
  else if (roomCode)       vision.joinRoom(roomCode)
})
</script>

<style>
.toast { position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(8px);background:#2a2a32;border:1px solid rgba(255,255,255,.13);border-radius:20px;padding:7px 16px;font-size:12px;color:#aaa9a0;opacity:0;transition:all .3s;pointer-events:none;z-index:500;white-space:nowrap; }
.toast.show { opacity:1;transform:translateX(-50%) translateY(0); }
</style>
