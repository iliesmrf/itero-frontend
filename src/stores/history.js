import { defineStore } from 'pinia'
import { ref } from 'vue'

const HISTORY_KEY = 'itero_history'
const MAX_HISTORY = 20

export const useHistoryStore = defineStore('history', () => {
  const sessions = ref([])

  // Load from localStorage
  function load() {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        sessions.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load history', e)
      sessions.value = []
    }
  }

  // Save to localStorage
  function save() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.value))
    } catch (e) {
      console.error('Failed to save history', e)
    }
  }

  // Add a session to history
  function addSession(session) {
    const entry = {
      id: session.id || Date.now(),
      roomCode: session.roomCode,
      format: session.format,
      formatName: session.formatName,
      participantCount: session.participantCount,
      participants: session.participants || [],
      noteCount: session.noteCount || 0,
      actionCount: session.actionCount || 0,
      summary: session.summary || null,
      actions: session.actions || [],
      createdAt: session.createdAt || Date.now(),
    }

    // Remove duplicates (same room code and similar timestamp)
    sessions.value = sessions.value.filter(s =>
      !(s.roomCode === entry.roomCode && Math.abs(s.createdAt - entry.createdAt) < 60000)
    )

    // Add to beginning
    sessions.value.unshift(entry)

    // Keep only recent sessions
    if (sessions.value.length > MAX_HISTORY) {
      sessions.value = sessions.value.slice(0, MAX_HISTORY)
    }

    save()
  }

  // Remove a session
  function removeSession(id) {
    sessions.value = sessions.value.filter(s => s.id !== id)
    save()
  }

  // Clear all history
  function clear() {
    sessions.value = []
    localStorage.removeItem(HISTORY_KEY)
  }

  // Auto-load on init
  load()

  return {
    sessions,
    addSession,
    removeSession,
    clear,
  }
})
