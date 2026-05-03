<template>
  <div class="topbar">
    <div class="logo">ITERO</div>
    <div class="pills">
      <div v-for="(label, i) in steps" :key="i"
        class="pill"
        :class="{ active: currentStep === i, done: currentStep > i }"
        @click="$emit('goto', i)">{{ label }}</div>
    </div>
    <div class="right">
      <div class="presence">
        <div v-for="participant in participants" :key="participant.name" class="av" :title="participant.name"
          :style="{ background: participant.color, color: participant.textColor }">
          <img v-if="participant.avatar" :src="participant.avatar" :alt="participant.name" class="av-img" />
          <span v-else>{{ participant.name[0].toUpperCase() }}</span>
        </div>
      </div>
      <div class="chip" @click="copyLink()" title="Copier le lien">{{ room?.code }}</div>
      <div class="sync"><div class="dot" :class="{ live: connected, err: !connected }"></div></div>
      <div class="user-menu" @click="toggleUserMenu" v-click-outside="closeUserMenu">
        <div class="user-avatar" :style="{ background: currentUser?.color, color: currentUser?.textColor }">
          <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.name" class="av-img" />
          <span v-else>{{ currentUser?.name?.[0]?.toUpperCase() }}</span>
        </div>
        <div class="dropdown" v-show="showUserMenu">
          <div class="dropdown-item" @click="handleLeaveRoom">
            <span class="icon">🚪</span>
            Quitter la session
          </div>
          <div class="dropdown-item" @click="handleLogout">
            <span class="icon">❌</span>
            Se déconnecter
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRetroStore } from '../stores/retro'
import { useAuthStore } from '../stores/auth'

const store = useRetroStore()
const auth = useAuthStore()
const router = useRouter()
defineProps({ currentStep: Number })
defineEmits(['goto'])

const showUserMenu = ref(false)

const room      = computed(() => store.room)
const connected = computed(() => store.connected)
const participants = computed(() => {
  if (!room.value?.participants) return []
  return Object.values(room.value.participants).filter(p => p.name !== auth.user?.name)
})

const currentUser = computed(() => auth.user || null)

const steps = ['① Intro', '② Format', '③ Collecter', '④ Grouper', '⑤ Voter', '⑥ Actions', '⑦ Résumé']

function copyLink() {
  const url = `${location.origin}${location.pathname}?room=${store.room?.code}`
  navigator.clipboard.writeText(url).then(() => {}).catch(() => {})
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

async function handleLeaveRoom() {
  closeUserMenu()
  store.leaveRoom()
  router.push('/')
}

async function handleLogout() {
  closeUserMenu()
  await auth.logout()
}

// Fermer le menu quand on clique ailleurs
function handleClickOutside(event) {
  const userMenu = event.target.closest('.user-menu')
  if (!userMenu) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.topbar { position:fixed;top:0;left:0;right:0;z-index:200;height:54px;background:rgba(14,14,16,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:12px; }
.logo { font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;color:var(--accent);flex-shrink:0; }
.pills { display:flex;gap:3px;flex:1;justify-content:center;overflow-x:auto;scrollbar-width:none; }
.pills::-webkit-scrollbar { display:none; }
.pill { padding:4px 10px;border-radius:20px;font-size:11px;font-family:'Syne',sans-serif;border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0; }
.pill.active { background:var(--accent-dim);border-color:var(--accent-b);color:var(--accent); }
.pill.done { background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.18);color:var(--start); }
.right { display:flex;align-items:center;gap:8px;flex-shrink:0; }
.presence { display:flex; align-items:center; gap:6px; }
.av { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:'Syne',sans-serif;border:2px solid var(--bg);overflow:hidden; }
.av:hover { transform:scale(1.05); }
.av-img { width:100%;height:100%;object-fit:cover; }
.chip { font-size:11px;background:var(--surface2);border:1px solid var(--border2);border-radius:20px;padding:3px 10px;color:var(--muted2);cursor:pointer;letter-spacing:.1em;font-family:'Syne',sans-serif;font-weight:700; }
.chip:hover { border-color:var(--accent-b);color:var(--accent); }
.sync { display:flex;align-items:center; }
.dot { width:5px;height:5px;border-radius:50%;background:var(--muted);transition:background .3s; }
.dot.live { background:var(--start);animation:pulse 1.5s infinite; }
.dot.err  { background:var(--stop); }
.user-menu { position:relative;cursor:pointer; }
.user-avatar { width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;border:2px solid var(--bg);transition:transform .2s;overflow:hidden; }
.user-avatar:hover { transform:scale(1.1); }
.dropdown { position:absolute;top:100%;right:0;margin-top:8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:4px 0;min-width:140px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.15); }
.dropdown-item { display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:13px;color:var(--text);cursor:pointer;transition:background .2s; }
.dropdown-item:hover { background:var(--surface2); }
.dropdown-item .icon { font-size:14px; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
</style>
