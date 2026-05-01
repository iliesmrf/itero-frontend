import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'
import { RETRO_FORMATS } from '../retro-formats.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export const useRetroStore = defineStore('retro', () => {
  const room      = ref(null)
  const me        = ref(null)
  const connected = ref(false)
  const error     = ref('')
  const summaryGenerating = ref(false)
  let   socket    = null

  const format = computed(() => room.value ? RETRO_FORMATS[room.value.format] : null)
  const cols   = computed(() => format.value?.cols || [])

  const myVotes = computed(() => {
    if (!room.value || !me.value) return {}
    return room.value.votes?.[me.value.name] || {}
  })
  const myVotesUsed = computed(() =>
    Object.values(myVotes.value).reduce((a, b) => a + b, 0)
  )

  // ── Socket ─────────────────────────────────────────────────────────────
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

    socket.on('room:joined',        (d) => { room.value = d.room; me.value = d.me; error.value = '' })
    socket.on('participant:joined', (p) => { if (room.value) room.value.participants[p.name] = p })
    socket.on('participant:left',   (d) => { if (room.value) delete room.value.participants[d.name] })
    socket.on('step:changed',       (d) => { if (room.value) room.value.step = d.step })

    socket.on('format:changed', (d) => {
      if (room.value) { room.value.format = d.format; room.value.notes = {}; room.value.clusters = {} }
    })

    socket.on('note:added',   (n) => { if (room.value) room.value.notes[n.id] = n })
    socket.on('note:deleted', (d) => { if (room.value) delete room.value.notes[d.noteId] })

    socket.on('clusters:updated', (d) => {
      if (room.value) {
        room.value.clusters = d.clusters
        room.value.notes    = d.notes
      }
    })

    socket.on('votes:updated',   (v) => { if (room.value) room.value.votes = v })
    socket.on('action:added',    (a) => { if (room.value) room.value.actions[a.id] = a })
    socket.on('action:deleted',  (d) => { if (room.value) delete room.value.actions[d.actionId] })

    socket.on('summary:generating', () => { summaryGenerating.value = true })
    socket.on('summary:ready',      (s) => { summaryGenerating.value = false; if (room.value) room.value.summary = s })

    socket.connect()
  }

  function createRoom()    { socket?.emit('room:create') }
  function joinRoom(code)  { socket?.emit('room:join', { code }) }
  function setStep(step)   { socket?.emit('step:set', { step }); if (room.value) room.value.step = step }
  function setFormat(fmt)  { socket?.emit('format:set', { format: fmt }) }
  function addNote(text, col)  { socket?.emit('note:add', { text, col }) }
  function deleteNote(id)      { socket?.emit('note:delete', { noteId: id }) }
  function runAutoClusters()   { socket?.emit('cluster:auto') }
  function castVote(id)    { if (myVotesUsed.value >= 3) return; socket?.emit('vote:cast', { noteId: id }) }
  function removeVote(id)  { socket?.emit('vote:remove', { noteId: id }) }
  function addAction(text, owner, date, priority) { socket?.emit('action:add', { text, owner, date, priority }) }
  function deleteAction(id) { socket?.emit('action:delete', { actionId: id }) }
  function generateSummary() { socket?.emit('summary:generate') }
  function clearError()    { error.value = '' }

  return {
    room, me, connected, error, summaryGenerating,
    format, cols, myVotes, myVotesUsed,
    initSocket, createRoom, joinRoom, setStep, setFormat,
    addNote, deleteNote, runAutoClusters,
    castVote, removeVote, addAction, deleteAction,
    generateSummary, clearError,
  }
})
