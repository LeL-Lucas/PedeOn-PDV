import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { supabase } from '@/services/supabase'

const routes: Array<RouteRecordRaw> = [
  // Seleção de Comércios
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/StoreSelector.vue')
  },

  // Tela de Login
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },

  // Rota para atalho genérico /stores
  {
    path: '/stores',
    redirect: '/'
  },

  // Página de Acesso Negado / Não Encontrado
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/StoreSelector.vue')
  },

  // Painel de Gerenciamento - ADMIN (ex: /purpleacai/admin)
  {
    path: '/:slug/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboard.vue'),
    props: true,
    meta: { requiresAuth: true }
  },

  // Painel Exclusivo do Garçom - SALÃO (ex: /purpleacai/garcom)
  {
    path: '/:slug/garcom',
    name: 'WaiterView',
    component: () => import('@/views/WaiterView.vue'),
    props: true,
    meta: { requiresAuth: true }
  },

  // Vitrine / Frente de Loja (ex: /s/purpleacai)
  {
    path: '/s/:slug',
    name: 'StoreFront',
    component: () => import('@/views/StoreFront.vue'),
    props: true
  },

  // Fallback: Se acessar só /purpleacai, vai direto pro ADMIN (/purpleacai/admin)
  {
    path: '/:slug',
    redirect: to => {
      const reserved = ['login', 'unauthorized', 'admin', 'garcom', 's', 'stores']
      if (reserved.includes(to.params.slug as string)) {
        return { name: 'Home' }
      }
      return { name: 'AdminDashboard', params: { slug: to.params.slug } }
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de Autenticação (Sintaxe moderna Vue Router 4)
router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return { name: 'Login', query: { redirect: to.fullPath } }
    }
  }
})

export default router
