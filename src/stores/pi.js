import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export function generateSprints(startDate, endDate, durationWeeks) {
  const sprints = []
  let current = new Date(startDate + 'T00:00:00')
  const end   = new Date(endDate   + 'T00:00:00')
  let i = 1
  while (current <= end) {
    const sprintEnd = new Date(current)
    sprintEnd.setDate(sprintEnd.getDate() + Number(durationWeeks) * 7 - 1)
    if (sprintEnd > end) sprintEnd.setTime(end.getTime())
    sprints.push({
      id: `sprint-${i}`,
      name: `Sprint ${i}`,
      startDate: current.toISOString().split('T')[0],
      endDate:   sprintEnd.toISOString().split('T')[0],
    })
    current = new Date(sprintEnd)
    current.setDate(current.getDate() + 1)
    i++
  }
  return sprints
}

export const usePIStore = defineStore('pi', () => {
  const room      = ref(null)
  const me        = ref(null)
  const connected = ref(false)
  const error     = ref('')
  let   socket    = null

  function initSocket(token) {
    if (socket) socket.disconnect()
    socket = io(BACKEND_URL, {
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
        config:     d.room.config     || null,
        sprints:    d.room.sprints    || [],
        capacity:   d.room.capacity   || {},
        stories:    d.room.stories    || {},
        risks:      d.room.risks      || {},
        confidence: d.room.confidence || {},
      }
      me.value = d.me
      error.value = ''
    })

    socket.on('participant:joined', (p) => { if (room.value) room.value.participants[p.name] = p })
    socket.on('participant:left',   (d) => { if (room.value) delete room.value.participants[d.name] })
    socket.on('step:changed',       (d) => { if (room.value) room.value.step = d.step })

    // PI-specific events (backend must broadcast these to room participants)
    socket.on('pi:config:updated',     (d) => { if (room.value) { room.value.config = d.config; room.value.sprints = d.sprints } })
    socket.on('pi:capacity:updated',   (d) => { if (room.value) room.value.capacity = d.capacity })
    socket.on('pi:story:added',        (s) => { if (room.value) room.value.stories[s.id] = s })
    socket.on('pi:story:updated',      (s) => { if (room.value && room.value.stories[s.id]) Object.assign(room.value.stories[s.id], s) })
    socket.on('pi:story:deleted',      (d) => { if (room.value) delete room.value.stories[d.storyId] })
    socket.on('pi:risk:added',         (r) => { if (room.value) room.value.risks[r.id] = r })
    socket.on('pi:risk:deleted',       (d) => { if (room.value) delete room.value.risks[d.riskId] })
    socket.on('pi:confidence:updated', (d) => { if (room.value) room.value.confidence = d.confidence })

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

  function setConfig(name, startDate, endDate, sprintDuration) {
    const config  = { name, startDate, endDate, sprintDuration: Number(sprintDuration) }
    const sprints = generateSprints(startDate, endDate, sprintDuration)
    if (room.value) {
      room.value.config   = config
      room.value.sprints  = sprints
      room.value.capacity = {}
      room.value.stories  = {}
    }
    socket?.emit('pi:config:set', { config, sprints })
  }

  function setCapacity(sprintId, days) {
    if (!room.value || !me.value) return
    const name = me.value.name
    if (!room.value.capacity[name]) room.value.capacity[name] = {}
    room.value.capacity[name][sprintId] = Number(days) || 0
    socket?.emit('pi:capacity:set', { sprintId, days: Number(days) || 0 })
  }

  function addStory(title, points, sprintId, priority) {
    if (!room.value) return null
    const story = {
      id:       `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title, points: Number(points) || 0,
      sprintId: sprintId || null,
      priority: priority || 'medium',
      author:   me.value?.name || 'Anonyme',
      createdAt: Date.now(),
    }
    room.value.stories[story.id] = story
    socket?.emit('pi:story:add', story)
    return story
  }

  function updateStory(storyId, updates) {
    if (!room.value?.stories[storyId]) return
    Object.assign(room.value.stories[storyId], updates)
    socket?.emit('pi:story:update', { storyId, ...updates })
  }

  function deleteStory(storyId) {
    if (!room.value) return
    delete room.value.stories[storyId]
    socket?.emit('pi:story:delete', { storyId })
  }

  function addRisk(title, level, mitigation) {
    if (!room.value) return
    const risk = {
      id:         `risk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title, level: level || 'medium',
      mitigation: mitigation || '',
      author:     me.value?.name || 'Anonyme',
      createdAt:  Date.now(),
    }
    room.value.risks[risk.id] = risk
    socket?.emit('pi:risk:add', risk)
  }

  function deleteRisk(riskId) {
    if (!room.value) return
    delete room.value.risks[riskId]
    socket?.emit('pi:risk:delete', { riskId })
  }

  function voteConfidence(vote) {
    if (!room.value || !me.value) return
    room.value.confidence[me.value.name] = vote
    socket?.emit('pi:confidence:vote', { vote })
  }

  function clearError() { error.value = '' }

  // ── Computed ─────────────────────────────────────────────────────────────
  const sprints = computed(() => room.value?.sprints || [])

  const storyList = computed(() =>
    Object.values(room.value?.stories || {}).sort((a, b) => a.createdAt - b.createdAt)
  )

  const backlogStories = computed(() => storyList.value.filter(s => !s.sprintId))

  const storiesBySprint = computed(() => {
    const map = {}
    for (const sprint of sprints.value) {
      map[sprint.id] = storyList.value.filter(s => s.sprintId === sprint.id)
    }
    return map
  })

  const sprintPoints = computed(() => {
    const map = {}
    for (const sprint of sprints.value) {
      map[sprint.id] = (storiesBySprint.value[sprint.id] || []).reduce((sum, s) => sum + (s.points || 0), 0)
    }
    return map
  })

  const sprintCapacity = computed(() => {
    const map = {}
    for (const sprint of sprints.value) {
      map[sprint.id] = Object.values(room.value?.capacity || {})
        .reduce((sum, userCap) => sum + (userCap[sprint.id] || 0), 0)
    }
    return map
  })

  const riskList = computed(() => {
    const order = { high: 0, medium: 1, low: 2 }
    return Object.values(room.value?.risks || {})
      .sort((a, b) => (order[a.level] ?? 1) - (order[b.level] ?? 1))
  })

  const confidenceAvg = computed(() => {
    const votes = Object.values(room.value?.confidence || {})
    if (!votes.length) return null
    return (votes.reduce((a, b) => a + b, 0) / votes.length).toFixed(1)
  })

  const participantList = computed(() => Object.values(room.value?.participants || {}))

  return {
    room, me, connected, error,
    sprints, storyList, backlogStories, storiesBySprint, sprintPoints, sprintCapacity,
    riskList, confidenceAvg, participantList,
    initSocket, createRoom, joinRoom, leaveRoom, setStep,
    setConfig, setCapacity, addStory, updateStory, deleteStory,
    addRisk, deleteRisk, voteConfidence, clearError,
  }
})
