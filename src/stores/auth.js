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

  // ── Logout ───────────────────────────────────────────────────────────────
  function logout() {
    setToken('')
    user.value = null
  }

  // Auto-fetch user if token exists on load
  if (token.value) fetchMe()

  return {
    token, user, loading, error, isAuthenticated,
    setToken, fetchMe,
    loginWithGoogle, loginWithGithub,
    handleCallback, logout,
  }
})
