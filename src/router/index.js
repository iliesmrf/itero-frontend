import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/auth/callback',
      component: () => import('../views/AuthCallback.vue'),
    },
    {
      path: '/retro',
      component: () => import('../views/RetroView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Guard — redirect to / if not authenticated
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      // Save pending room code before redirecting to auth
      const roomCode = to.query.room
      if (roomCode) {
        localStorage.setItem('itero_pending_room', roomCode)
      }
      return '/'
    }
  }
})

export default router
