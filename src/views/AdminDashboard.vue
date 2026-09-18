<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand-mark">P</div>
        <div v-if="store" class="brand-copy">
          <strong>{{ store.name }}</strong>
          <span>/{{ store.slug }}</span>
        </div>
      </div>

      <div class="store-state">
        <div class="state-label">Status da loja</div>
        <button
          :class="['status-control', store?.is_open ? 'open' : 'closed']"
          @click="toggleStoreStatus"
        >
          <span class="state-dot"></span>
          <span>{{ store?.is_open ? 'Aberto agora' : 'Fechado' }}</span>
          <span class="state-arrow">⌄</span>
        </button>
      </div>

      <div class="nav-section">
        <span class="nav-title">Operação</span>
        <nav class="admin-nav">
          <button
            v-for="tab in tabs.slice(0, 2)"
            :key="tab.key"
            :class="['nav-item', { active: currentTab === tab.key }]"
            @click="currentTab = tab.key"
          >
            <span class="nav-icon">{{ tab.key === 'orders' ? '⌁' : '▦' }}</span>
            <span>{{ tab.key === 'orders' ? 'Pedidos' : 'Salão e mesas' }}</span>
            <span v-if="tab.key === 'orders' && orders.length" class="nav-count">{{ orders.length }}</span>
          </button>
        </nav>
      </div>

      <div class="nav-section">
        <span class="nav-title">Catálogo</span>
        <nav class="admin-nav">
          <button
            v-for="tab in tabs.slice(2, 4)"
            :key="tab.key"
            :class="['nav-item', { active: currentTab === tab.key }]"
            @click="currentTab = tab.key"
          >
            <span class="nav-icon">{{ tab.key === 'products' ? '◈' : '☷' }}</span>
            <span>{{ tab.key === 'products' ? 'Cardápio' : 'Categorias' }}</span>
          </button>
        </nav>
      </div>

      <div class="nav-section">
        <span class="nav-title">Gestão</span>
        <nav class="admin-nav">
          <button
            v-for="tab in tabs.slice(4)"
            :key="tab.key"
            :class="['nav-item', { active: currentTab === tab.key }]"
            @click="currentTab = tab.key"
          >
            <span class="nav-icon">{{ tab.key === 'finance' ? '↗' : '⚙' }}</span>
            <span>{{ tab.key === 'finance' ? 'Financeiro' : 'Configurações' }}</span>
          </button>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="store-link">
          <span class="mini-avatar">{{ store?.name?.charAt(0) || 'P' }}</span>
          <div>
            <small>Loja ativa</small>
            <strong>{{ store?.slug ? `/${store.slug}` : 'Carregando...' }}</strong>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" aria-label="Sair">
          <span>↪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="mobile-brand">
          <div class="brand-mark">P</div>
          <div v-if="store">
            <strong>{{ store.name }}</strong>
            <span>{{ currentTab === 'orders' ? 'Pedidos' : tabs.find(t => t.key === currentTab)?.label }}</span>
          </div>
        </div>

        <div v-if="loadingStore" class="loading-text">Carregando estabelecimento…</div>

        <div class="topbar-right">
          <a
            v-if="store?.slug"
            class="store-preview"
            :href="`/loja/${store.slug}`"
            target="_blank"
            rel="noreferrer"
          >
            <span>Ver vitrine</span>
            <span>↗</span>
          </a>
          <button class="mobile-menu-btn" @click="currentTab = currentTab" aria-label="Menu">
            ☰
          </button>
        </div>
      </header>

      <main class="admin-content">
        <div class="page-heading">
          <div>
            <span class="eyebrow">Painel de controle</span>
            <h1>{{ tabs.find(t => t.key === currentTab)?.label.replace(/^[^\p{L}]*/u, '') }}</h1>
            <p v-if="currentTab === 'orders'">Acompanhe e organize os pedidos da sua operação.</p>
            <p v-else-if="currentTab === 'tables'">Controle o salão e o atendimento de cada mesa.</p>
            <p v-else-if="currentTab === 'products'">Gerencie produtos, preços e disponibilidade.</p>
            <p v-else-if="currentTab === 'categories'">Organize o cardápio em categorias fáceis de navegar.</p>
            <p v-else-if="currentTab === 'finance'">Tenha uma visão clara dos números da sua operação.</p>
            <p v-else>Configure os detalhes da sua loja.</p>
          </div>

          <div class="heading-status" v-if="store">
            <span :class="['live-pill', { closed: !store.is_open }]">
              <span></span>
              {{ store.is_open ? 'Operação ativa' : 'Loja fechada' }}
            </span>
          </div>
        </div>

        <div v-if="errorStore" class="error-banner">
          <div class="error-symbol">!</div>
          <div>
            <strong>Não foi possível carregar a loja.</strong>
            <span>{{ errorStore }}</span>
          </div>
        </div>

        <section class="content-panel">
          <OrderManager v-if="currentTab === 'orders'" :orders="orders" :store-id="storeId" />
          <TableManager v-else-if="currentTab === 'tables'" :store-id="storeId" />
          <ProductManager v-else-if="currentTab === 'products'" :store-id="storeId" />
          <CategoryManager v-else-if="currentTab === 'categories'" :store-id="storeId" />
          <FinancialManager v-else-if="currentTab === 'finance'" :store-id="storeId" />
          <StoreSettings v-else-if="currentTab === 'settings'" :store="store" @updated="refreshStore" />
        </section>
      </main>

      <nav class="mobile-nav" aria-label="Navegação principal">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['mobile-nav-item', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          <span class="mobile-nav-icon">{{ tab.key === 'orders' ? '⌁' : tab.key === 'tables' ? '▦' : tab.key === 'products' ? '◈' : tab.key === 'categories' ? '☷' : tab.key === 'finance' ? '↗' : '⚙' }}</span>
          <span>{{ tab.key === 'orders' ? 'Pedidos' : tab.key === 'tables' ? 'Mesas' : tab.key === 'products' ? 'Cardápio' : tab.key === 'categories' ? 'Categorias' : tab.key === 'finance' ? 'Financeiro' : 'Ajustes' }}</span>
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { useStore } from '@/composables/useStore'
import { useOrders } from '@/composables/useOrders'
import { useAuth } from '@/composables/useAuth'
import type { RealtimeChannel } from '@supabase/supabase-js'

import TableManager from '@/components/admin/TableManager.vue'
import OrderManager from '@/components/admin/OrderManager.vue'
import ProductManager from '@/components/admin/ProductManager.vue'
import CategoryManager from '@/components/admin/CategoryManager.vue'
import StoreSettings from '@/components/admin/StoreSettings.vue'
import FinancialManager from '@/components/admin/FinancialManager.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const { currentStore: store, loading: loadingStore, error: errorStore, fetchStoreBySlug } = useStore()

const storeId = ref('')
const { orders, fetchOrders, subscribeToOrders } = useOrders(storeId)

const currentTab = ref('orders')
const tabs = [
  { key: 'orders', label: '📦 Pedidos' },
  { key: 'tables', label: '🍽️ Salão/Mesas' },
  { key: 'products', label: '🍔 Cardápio' },
  { key: 'categories', label: '📂 Categorias' },
  { key: 'finance', label: '💰 Financeiro & Inteligência' },
  { key: 'settings', label: '⚙️ Configurações' }
]

let ordersChannel: RealtimeChannel | null = null

watch(
  () => store.value?.id,
  async (newId) => {
    if (newId) {
      storeId.value = newId
      await fetchOrders()
      if (ordersChannel) supabase.removeChannel(ordersChannel)
      ordersChannel = subscribeToOrders(() => {})
    }
  },
  { immediate: true }
)

onMounted(async () => {
  const slug = route.params.slug as string
  if (slug) {
    await fetchStoreBySlug(slug)
  }
})

onUnmounted(() => {
  if (ordersChannel) {
    supabase.removeChannel(ordersChannel)
  }
})

const toggleStoreStatus = async () => {
  if (!store.value) return
  const newStatus = !store.value.is_open

  const { error } = await supabase
    .from('stores')
    .update({ is_open: newStatus })
    .eq('id', store.value.id)

  if (!error) {
    store.value.is_open = newStatus
  }
}

const refreshStore = async (newSlug?: string) => {
  const currentSlugParam = route.params.slug as string
  const targetSlug = newSlug || currentSlugParam

  if (newSlug && newSlug !== currentSlugParam) {
    await router.replace({ params: { ...route.params, slug: newSlug } })
  }

  await fetchStoreBySlug(targetSlug)
}

watch(
  () => route.params.slug,
  async (newSlug) => {
    if (newSlug && store.value?.slug !== newSlug) {
      await fetchStoreBySlug(newSlug as string)
    }
  }
)

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

:global(*) { box-sizing: border-box; }

.admin-layout {
  --bg: #f4f1ec;
  --panel: #ffffff;
  --ink: #171717;
  --muted: #77746f;
  --line: #e9e5de;
  --accent: #1f8f5b;
  --accent-soft: #eaf6ef;
  --warm: #faf8f4;
  min-height: 100vh;
  width: 100%;
  display: flex;
  background: var(--bg);
  color: var(--ink);
  font-family: 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.01em;
}

.sidebar {
  width: 250px;
  min-width: 250px;
  min-height: 100vh;
  background: #171716;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 22px 14px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-top {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 10px 22px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #fff;
  color: #171716;
  display: grid;
  place-items: center;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 17px;
}

.brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.brand-copy strong {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-copy span {
  font-size: 11px;
  color: #92908b;
  margin-top: 2px;
}

.store-state {
  padding: 14px 10px 18px;
  border-top: 1px solid rgba(255,255,255,.08);
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.state-label, .nav-title {
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 9px;
  font-weight: 700;
  color: #7f7c76;
}

.status-control {
  width: 100%;
  margin-top: 9px;
  border: 0;
  border-radius: 11px;
  padding: 10px 11px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #222220;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
}

.status-control.open .state-dot { background: #4bd58c; box-shadow: 0 0 0 4px rgba(75,213,140,.08); }
.status-control.closed .state-dot { background: #ff706b; box-shadow: 0 0 0 4px rgba(255,112,107,.08); }

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.state-arrow {
  margin-left: auto;
  color: #74716c;
}

.nav-section { padding: 20px 4px 0; }
.nav-title { display: block; padding: 0 8px 7px; }

.admin-nav { display: grid; gap: 3px; }

.nav-item {
  border: 0;
  width: 100%;
  min-height: 40px;
  border-radius: 10px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: #a8a59f;
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  transition: .18s ease;
}

.nav-item:hover { background: rgba(255,255,255,.045); color: #fff; }
.nav-item.active { background: #fff; color: #171716; }
.nav-icon {
  width: 22px;
  text-align: center;
  font-size: 17px;
  line-height: 1;
}
.nav-count {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #eaf6ef;
  color: #1f8f5b;
  font-size: 10px;
  font-weight: 800;
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,.08);
  padding: 15px 6px 0;
  display: grid;
  gap: 11px;
}

.store-link {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #252523;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
}

.store-link div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.store-link small {
  color: #77746e;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.store-link strong {
  margin-top: 3px;
  font-size: 11px;
  color: #d1ceca;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  border: 1px solid rgba(255,255,255,.08);
  background: transparent;
  color: #a8a59f;
  border-radius: 10px;
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}
.logout-btn:hover { background: rgba(255,255,255,.05); color: #fff; }

.workspace {
  min-width: 0;
  flex: 1;
  min-height: 100vh;
}

.topbar {
  height: 70px;
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.mobile-brand { display: none; }

.loading-text {
  color: #77746f;
  font-size: 12px;
}

.topbar-right { display: flex; align-items: center; gap: 10px; }
.store-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #4f4b45;
  font-size: 12px;
  font-weight: 700;
  background: #fff;
  border: 1px solid var(--line);
  padding: 9px 12px;
  border-radius: 9px;
}
.store-preview:hover { border-color: #d9d3ca; color: #151515; }

.mobile-menu-btn { display: none; }

.admin-content {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding: 34px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}

.eyebrow {
  display: inline-block;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: .09em;
  font-size: 9px;
  font-weight: 800;
  margin-bottom: 7px;
}

.page-heading h1 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(24px, 2.2vw, 34px);
  line-height: 1.06;
  letter-spacing: -.045em;
  font-weight: 800;
}

.page-heading p {
  margin: 8px 0 0;
  color: #78736d;
  font-size: 13px;
  max-width: 640px;
}

.heading-status { padding-bottom: 3px; }

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 10px;
  font-weight: 800;
}
.live-pill span {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
}
.live-pill.closed { background: #fff0ef; color: #c84841; }

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff6f5;
  border: 1px solid #f4d4d1;
  color: #8a3b35;
  border-radius: 14px;
  padding: 13px 15px;
  margin-bottom: 17px;
}
.error-symbol {
  width: 28px; height: 28px; border-radius: 8px; background: #fbe2df;
  display: grid; place-items: center; font-weight: 800;
}
.error-banner strong { display:block; font-size: 11px; }
.error-banner span { display:block; font-size: 10px; opacity: .8; margin-top: 2px; }

.content-panel {
  background: transparent;
  min-width: 0;
}

.mobile-nav { display: none; }

@media (max-width: 900px) {
  .sidebar { width: 218px; min-width: 218px; }
  .admin-content { padding: 28px 22px; }
  .topbar { padding: 0 22px; }
}

@media (max-width: 720px) {
  .admin-layout { display: block; }
  .sidebar { display: none; }
  .workspace { min-height: 100svh; padding-bottom: 80px; }

  .topbar {
    height: 62px;
    padding: 0 15px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .mobile-brand .brand-mark {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    font-size: 14px;
  }
  .mobile-brand > div:last-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .mobile-brand strong {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mobile-brand span {
    color: #88837c;
    font-size: 9px;
    margin-top: 2px;
  }
  .topbar-right { margin-left: auto; }
  .store-preview { display: none; }
  .mobile-menu-btn {
    display: grid;
    place-items: center;
    width: 35px;
    height: 35px;
    border: 1px solid var(--line);
    background: #fff;
    color: #272625;
    border-radius: 10px;
    font-size: 15px;
  }

  .admin-content { padding: 22px 14px; }

  .page-heading {
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .page-heading h1 { font-size: 25px; }
  .page-heading p { font-size: 11px; line-height: 1.45; }
  .heading-status { display: none; }

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 60;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    padding: 7px;
    background: rgba(23,23,22,.96);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 17px;
    box-shadow: 0 14px 35px rgba(0,0,0,.2);
    backdrop-filter: blur(16px);
  }

  .mobile-nav-item {
    min-width: 0;
    border: 0;
    background: transparent;
    color: #8d8a85;
    min-height: 50px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 8px;
    font-weight: 700;
  }

  .mobile-nav-item.active {
    color: #171716;
    background: #fff;
  }

  .mobile-nav-icon {
    font-size: 16px;
    line-height: 1;
  }
}

@media (max-width: 420px) {
  .mobile-nav { left: 6px; right: 6px; bottom: 6px; }
  .mobile-nav-item { font-size: 7.5px; }
}
</style>
