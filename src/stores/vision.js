import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'
import { VISION_TEMPLATES } from '../vision-templates.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export const useVisionStore = defineStore('vision', () => {
  const room      = ref(null)
  const me        = ref(null)
  const connected = ref(false)
  const error     = ref('')
  let   socket    = null

  // ── Socket ──────────────────────────────────────────────────────────────
  function initSocket(token) {
    if (socket) socket.disconnect()
    socket = io(`${BACKEND_URL}/vision`, {
      autoConnect: false, reconnection: true,
      reconnectionAttempts: 5, reconnectionDelay: 1000,
      auth: { token },
    })

    socket.on('connect',    () => { connected.value = true })
    socket.on('disconnect', () => { connected.value = false })
    socket.on('error',      (d) => { error.value = d.message })

    socket.on('room:joined', (d) => {
      room.value = {
        code: d.room.code,
        step: d.room.step || 0,
        participants: d.room.participants || {},
        templateId:    d.room.templateId    || null,
        contributions: d.room.contributions || {},
        votes:         d.room.votes         || {},
        synthesis:     d.room.synthesis     || {},
      }
      me.value = d.me
      error.value = ''
    })

    socket.on('participant:joined', (p) => { if (room.value) room.value.participants[p.name] = p })
    socket.on('participant:left',   (d) => { if (room.value) delete room.value.participants[d.name] })
    socket.on('step:changed',       (d) => { if (room.value) room.value.step = d.step })

    // Vision-specific events (backend must handle & broadcast)
    socket.on('vision:template:updated',     (d) => { if (room.value) { room.value.templateId = d.templateId; room.value.contributions = {}; room.value.votes = {}; room.value.synthesis = {} } })
    socket.on('vision:contribution:added',   (d) => {
      if (!room.value) return
      if (!room.value.contributions[d.sectionKey]) room.value.contributions[d.sectionKey] = {}
      room.value.contributions[d.sectionKey][d.contribution.id] = d.contribution
    })
    socket.on('vision:contribution:deleted', (d) => {
      if (!room.value?.contributions[d.sectionKey]) return
      delete room.value.contributions[d.sectionKey][d.contribId]
    })
    socket.on('vision:votes:updated',        (d) => { if (room.value) room.value.votes = d.votes })
    socket.on('vision:synthesis:updated',    (d) => {
      if (!room.value) return
      if (!room.value.synthesis) room.value.synthesis = {}
      room.value.synthesis[d.sectionKey] = d.text
    })

    socket.connect()
  }

  function createRoom()   { socket?.emit('room:create') }
  function joinRoom(code) { socket?.emit('room:join', { code }) }
  function setStep(step)  { socket?.emit('step:set', { step }); if (room.value) room.value.step = step }

  function leaveRoom() {
    if (!socket) return
    socket.emit('room:leave')
    socket.disconnect()
    room.value = null; me.value = null; connected.value = false
  }

  function setTemplate(templateId) {
    if (!room.value) return
    room.value.templateId    = templateId
    room.value.contributions = {}
    room.value.votes         = {}
    room.value.synthesis     = {}
    socket?.emit('vision:template:set', { templateId })
  }

  function addContribution(sectionKey, text) {
    if (!room.value || !text.trim()) return
    const contribution = {
      id:        `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text:      text.trim(),
      author:    me.value?.name || 'Anonyme',
      createdAt: Date.now(),
    }
    if (!room.value.contributions[sectionKey]) room.value.contributions[sectionKey] = {}
    room.value.contributions[sectionKey][contribution.id] = contribution
    socket?.emit('vision:contribute', { sectionKey, contribution })
  }

  function deleteContribution(sectionKey, contribId) {
    if (!room.value?.contributions[sectionKey]) return
    delete room.value.contributions[sectionKey][contribId]
    socket?.emit('vision:contribute:delete', { sectionKey, contribId })
  }

  function toggleVote(sectionKey, contribId) {
    if (!room.value || !me.value) return
    const name = me.value.name
    if (!room.value.votes[sectionKey]) room.value.votes[sectionKey] = {}
    if (!room.value.votes[sectionKey][contribId]) room.value.votes[sectionKey][contribId] = []
    const arr = room.value.votes[sectionKey][contribId]
    const idx = arr.indexOf(name)
    if (idx === -1) arr.push(name)
    else arr.splice(idx, 1)
    socket?.emit('vision:vote:toggle', { sectionKey, contribId })
  }

  function setSynthesis(sectionKey, text) {
    if (!room.value) return
    if (!room.value.synthesis) room.value.synthesis = {}
    room.value.synthesis[sectionKey] = text
    socket?.emit('vision:synthesis:set', { sectionKey, text })
  }

  function clearError() { error.value = '' }

  // ── Computed ─────────────────────────────────────────────────────────────
  const template = computed(() =>
    room.value?.templateId ? VISION_TEMPLATES[room.value.templateId] : null
  )

  const sections = computed(() => template.value?.sections || [])

  function contributionsBySection(sectionKey) {
    const contribs = Object.values(room.value?.contributions?.[sectionKey] || {})
    return contribs.sort((a, b) => {
      const va = (room.value?.votes?.[sectionKey]?.[a.id] || []).length
      const vb = (room.value?.votes?.[sectionKey]?.[b.id] || []).length
      return vb - va || a.createdAt - b.createdAt
    })
  }

  function voteCount(sectionKey, contribId) {
    return (room.value?.votes?.[sectionKey]?.[contribId] || []).length
  }

  function hasVoted(sectionKey, contribId) {
    return (room.value?.votes?.[sectionKey]?.[contribId] || []).includes(me.value?.name || '')
  }

  function topContribs(sectionKey, n = 3) {
    return contributionsBySection(sectionKey).slice(0, n)
  }

  const totalContributions = computed(() =>
    Object.values(room.value?.contributions || {})
      .reduce((sum, sec) => sum + Object.keys(sec).length, 0)
  )

  const participantList = computed(() => Object.values(room.value?.participants || {}))

  return {
    room, me, connected, error,
    template, sections, totalContributions, participantList,
    initSocket, createRoom, joinRoom, leaveRoom, setStep,
    setTemplate, addContribution, deleteContribution, toggleVote, setSynthesis,
    contributionsBySection, voteCount, hasVoted, topContribs,
    clearError,
  }
})
