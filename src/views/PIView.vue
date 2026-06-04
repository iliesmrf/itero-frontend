<template>
  <div>
    <TopBar :current-step="currentStep" :steps="piSteps" @goto="gotoStep"
      :store-room="pi.room" :store-connected="pi.connected" :store-leave="pi.leaveRoom" />
    <PIStepIntro      v-if="currentStep === 0" @next="nextStep" />
    <PIStepConfig     v-if="currentStep === 1" />
    <PIStepCapacity   v-if="currentStep === 2" />
    <PIStepPlan       v-if="currentStep === 3" />
    <PIStepRisks      v-if="currentStep === 4" />
    <PIStepConfidence v-if="currentStep === 5" />
    <PIStepSummary    v-if="currentStep === 6" @finish="finish" />
    <BottomBar :current-step="currentStep" :max-step="6" @prev="prevStep" @next="nextStep" />
    <div class="toast" :class="{ show: toast.visible }">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePIStore } from '../stores/pi'
import { useHistoryStore } from '../stores/history'
import TopBar          from '../components/TopBar.vue'
import BottomBar       from '../components/BottomBar.vue'
import PIStepIntro     from '../components/PIStepIntro.vue'
import PIStepConfig    from '../components/PIStepConfig.vue'
import PIStepCapacity  from '../components/PIStepCapacity.vue'
import PIStepPlan      from '../components/PIStepPlan.vue'
import PIStepRisks     from '../components/PIStepRisks.vue'
import PIStepConfidence from '../components/PIStepConfidence.vue'
import PIStepSummary   from '../components/PIStepSummary.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const pi     = usePIStore()
const historyStore = useHistoryStore()

const currentStep = ref(0)
const toast = ref({ visible: false, msg: '' })

const piSteps = ['① Intro', '② Config', '③ Capacité', '④ Planning', '⑤ Risques', '⑥ Confiance', '⑦ Plan final']

function showToast(msg) {
  toast.value = { visible: true, msg }
  setTimeout(() => toast.value.visible = false, 2500)
}
function gotoStep(step) {
  currentStep.value = step
  pi.setStep(step)
  window.scrollTo(0, 0)
}
function nextStep() {
  if (currentStep.value < 6) gotoStep(currentStep.value + 1)
  else finish()
}
function prevStep() {
  if (currentStep.value > 0) gotoStep(currentStep.value - 1)
}

function finish() {
  historyStore.addSession({
    id: Date.now(),
    roomCode: pi.room?.code,
    format: 'pi',
    formatName: pi.room?.config?.name || 'PI Planning',
    participantCount: Object.keys(pi.room?.participants || {}).length,
    participants: Object.keys(pi.room?.participants || {}),
    noteCount: Object.keys(pi.room?.stories || {}).length,
    actionCount: Object.keys(pi.room?.risks || {}).length,
    summary: null,
    actions: [],
    piData: {
      stories: Object.values(pi.room?.stories || {}),
      risks:   Object.values(pi.room?.risks   || {}),
      config:  pi.room?.config  || null,
      sprints: pi.room?.sprints || [],
    },
    createdAt: Date.now(),
  })
  showToast('PI Planning terminé ! 🚀')
  setTimeout(() => router.push('/'), 800)
}

watch(() => pi.room?.step, (s) => { if (s != null && s !== currentStep.value) currentStep.value = s })
watch(() => pi.error, (e) => { if (e) { showToast(e); pi.clearError() } })

onMounted(() => {
  pi.initSocket(auth.token)
  const action   = route.query.action
  const roomCode = route.query.room
  if (action === 'create') pi.createRoom()
  else if (roomCode)       pi.joinRoom(roomCode)
})
</script>

<style>
.toast { position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(8px);background:#2a2a32;border:1px solid rgba(255,255,255,.13);border-radius:20px;padding:7px 16px;font-size:12px;color:#aaa9a0;opacity:0;transition:all .3s;pointer-events:none;z-index:500;white-space:nowrap; }
.toast.show { opacity:1;transform:translateX(-50%) translateY(0); }
</style>
