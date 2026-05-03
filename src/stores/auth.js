import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
const TOKEN_KEY   = 'itero_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user  = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // ── Persist token ───────────────────────────────────────────────────────
  function setToken(t) {
    token.value = t
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else    localStorage.removeItem(TOKEN_KEY)
  }

  // ── Fetch current user from /auth/me ────────────────────────────────────
  async function fetchMe() {
    if (!token.value) return
    loading.value = true
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (!res.ok) throw new Error('Token invalide')
      user.value = await res.json()
      error.value = ''
    } catch (e) {
      // Token expired or invalid — clear it
      setToken('')
      user.value = null
      error.value = 'Session expirée, reconnecte-toi.'
    } finally {
      loading.value = false
    }
  }

  // ── OAuth redirect ───────────────────────────────────────────────────────
  function loginWithGoogle() {
    window.location.href = `${BACKEND_URL}/auth/google`
  }

  function loginWithGithub() {
    window.location.href = `${BACKEND_URL}/auth/github`
  }

  // ── Called by /auth/callback route with ?token= ──────────────────────────
  async function handleCallback(t) {
    setToken(t)
    await fetchMe()
  }

  // ── Anonymous login ──────────────────────────────────────────────────────
  async function loginAnonymous(name) {
    loading.value = true
    try {
      const res = await fetch(`${BACKEND_URL}/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Erreur création utilisateur anonyme')
      const data = await res.json()
      setToken(data.token)
      await fetchMe()
      error.value = ''
    } catch (e) {
      error.value = 'Erreur lors de la connexion anonyme'
    } finally {
      loading.value = false
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async function logout() {
    try {
      // Call backend logout endpoint for OAuth cleanup
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } catch (e) {
      // Ignore errors - logout should work even if backend is unreachable
      console.warn('Backend logout failed:', e)
    }

    // Clear local state
    setToken('')
    user.value = null
    error.value = ''

    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  // Auto-fetch user if token exists on load
  if (token.value) fetchMe()

  return {
    token, user, loading, error, isAuthenticated,
    setToken, fetchMe,
    loginWithGoogle, loginWithGithub, loginAnonymous,
    handleCallback, logout,
  }
})
