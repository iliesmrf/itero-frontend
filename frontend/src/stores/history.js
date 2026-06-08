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

  // Add or update a session in history.
  // When a roomCode is present, always replaces the existing entry for that room
  // so sessions saved on-join can be enriched later by finish().
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
      piData: session.piData || null,
      createdAt: session.createdAt || Date.now(),
    }

    if (entry.roomCode) {
      // Upsert by roomCode — keep the original createdAt if one already exists
      const existing = sessions.value.find(s => s.roomCode === entry.roomCode)
      if (existing) entry.createdAt = existing.createdAt
      sessions.value = sessions.value.filter(s => s.roomCode !== entry.roomCode)
    }

    sessions.value.unshift(entry)

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
