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
    {
      path: '/dod',
      component: () => import('../views/DodView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pi',
      component: () => import('../views/PIView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vision',
      component: () => import('../views/VisionView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/join',
      component: () => import('../views/JoinView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Guard — redirect to / if not authenticated
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      // Save the full destination path so we can redirect back after auth
      // (e.g. /pi?room=XXXX → goes directly to PIView, not through JoinView)
      localStorage.setItem('itero_pending_url', to.fullPath)
      return '/'
    }
  }
})

export default router
