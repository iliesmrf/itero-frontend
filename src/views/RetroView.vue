<template>
  <div>
    <TopBar         :current-step="currentStep" @goto="gotoStep" />
    <StepFormatPicker v-if="currentStep === 0" @next="nextStep" />
    <StepIntro        v-if="currentStep === 1" @next="nextStep" />
    <StepCollect      v-if="currentStep === 2" />
    <StepGroup        v-if="currentStep === 3" />
    <StepVote         v-if="currentStep === 4" />
    <StepActions      v-if="currentStep === 5" />
    <StepSummary      v-if="currentStep === 6" />
    <BottomBar :current-step="currentStep" :max-step="6" @prev="prevStep" @next="nextStep" />
    <div class="toast" :class="{ show: toast.visible }">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRetroStore } from '../stores/retro'
import { useHistoryStore } from '../stores/history'
import { RETRO_FORMATS } from '../retro-formats.js'
import TopBar          from '../components/TopBar.vue'
import StepFormatPicker from '../components/StepFormatPicker.vue'
import StepIntro       from '../components/StepIntro.vue'
import StepCollect     from '../components/StepCollect.vue'
import StepGroup       from '../components/StepGroup.vue'
import StepVote        from '../components/StepVote.vue'
import StepActions     from '../components/StepActions.vue'
import StepSummary     from '../components/StepSummary.vue'
import BottomBar       from '../components/BottomBar.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const retro  = useRetroStore()
const historyStore = useHistoryStore()
const currentStep = ref(0)
const toast = ref({ visible: false, msg: '' })

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
  if (currentStep.value < 6) {
    gotoStep(currentStep.value + 1)
  } else {
    // Last step - save and redirect to dashboard
    finishRetro()
  }
}
function prevStep() {
  if (currentStep.value > 0) gotoStep(currentStep.value - 1)
}

function finishRetro() {
  // Save session to history
  if (retro.room?.summary) {
    const format = RETRO_FORMATS[retro.room.format]
    historyStore.addSession({
      id: Date.now(),
      roomCode: retro.room.code,
      format: retro.room.format,
      formatName: format?.name || retro.room.format,
      participantCount: Object.keys(retro.room.participants || {}).length,
      participants: Object.keys(retro.room.participants || {}),
      noteCount: Object.keys(retro.room.notes || {}).length,
      actionCount: Object.keys(retro.room.actions || {}).length,
      summary: retro.room.summary,
      actions: Object.values(retro.room.actions || {}),
      createdAt: retro.room.summary.generatedAt || Date.now(),
    })
  }

  // Show success toast
  showToast('Rétro terminée ! 🎉')

  // Redirect to dashboard after a short delay
  setTimeout(() => {
    router.push('/')
  }, 800)
}

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
