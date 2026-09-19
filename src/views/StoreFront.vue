<template>
  <div
    class="store-front"
    :style="{ '--theme-color': store?.theme_color || '#e85d04' }"
  >
    <!-- TELA DE CARREGAMENTO -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-mark" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
      <p>Carregando cardápio...</p>
    </div>

    <!-- TELA DE ERRO OU LOJA NÃO ENCONTRADA -->
    <div v-else-if="error || !store" class="error-screen">
      <div class="error-card">
        <div class="error-symbol" aria-hidden="true">×</div>
        <p class="eyebrow">Cardápio Indisponível</p>
        <h1>Não foi possível carregar a loja</h1>
        <p>Verifique o endereço ou tente novamente em alguns instantes.</p>
      </div>
    </div>

    <!-- CONTEÚDO PRINCIPAL DA LOJA -->
    <div v-else class="store-container">
      <!-- BARRA SUPERIOR (TOPBAR) -->
      <header class="topbar">
        <div class="page-shell topbar-inner">
          <div class="brand-cluster">
            <div class="brand-logo">
              <img
                v-if="store.logo_url"
                :src="store.logo_url"
                :alt="store.name"
              />
              <span v-else>{{ store.name?.charAt(0) || 'L' }}</span>
            </div>

            <div class="brand-copy">
              <strong>{{ store.name }}</strong>
              <div class="store-status" :class="{ closed: !store.is_open }">
                <span class="status-indicator"></span>
                <span>{{ store.is_open ? 'Aberto agora' : 'Fechado' }}</span>
              </div>
            </div>
          </div>

          <!-- BOTÃO MOSTRAR PEDIDO / CARRINHO -->
          <button
            class="cart-button"
            type="button"
            @click="openCart"
            aria-label="Abrir carrinho"
          >
            <span class="cart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="20" r="1"></circle>
                <circle cx="18" cy="20" r="1"></circle>
                <path d="M2 3h3l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6.4"></path>
              </svg>
            </span>
            <span class="cart-label">Mostrar pedido</span>
            <span v-if="cartTotalItems > 0" class="cart-count">
              {{ cartTotalItems }}
            </span>
          </button>
        </div>
      </header>

      <!-- AVISO DE LOJA FECHADA -->
      <div v-if="!store.is_open" class="closed-notice-wrap">
        <div class="page-shell">
          <div class="closed-notice">
            <span class="closed-notice-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v5l3 2"></path>
              </svg>
            </span>
            <div>
              <strong>Estamos fechados no momento</strong>
              <span>Você pode explorar o cardápio e preparar seu pedido para o horário de funcionamento.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- HERO / BANNER -->
      <section class="hero-section">
        <div class="page-shell">
          <div
            class="hero"
            :style="{ backgroundImage: `url(${store.banner_url || placeholderBanner})` }"
          >
            <div class="hero-shade"></div>
            <div class="hero-content">
              <span class="hero-kicker">{{ store.name }}</span>
              <h1>Faça seu pedido online.</h1>
              <p>Escolha seus itens favoritos e receba onde estiver ou retire no local.</p>
            </div>

            <div class="hero-bottom-line">
              <span>
                <span class="hero-dot"></span>
                {{ store.is_open ? 'Aceitando pedidos' : 'Apenas consulta de cardápio' }}
              </span>
              <span class="hero-scroll-hint">Deslize para ver o cardápio</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SEÇÃO DO CARDÁPIO E NAVEGAÇÃO -->
      <main class="page-shell main-content">
        <div class="layout-grid">
          <!-- COLUNA DO CARDÁPIO -->
          <div class="catalog-column">
            <!-- NAVEGAÇÃO DE CATEGORIAS -->
            <div v-if="categories.length > 0" class="category-nav">
              <div class="category-nav-head">
                <span class="category-title">Categorias</span>
                <span class="category-count">{{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'item' : 'itens' }}</span>
              </div>

              <div class="category-scroller-wrap">
                <div class="category-scroller" role="tablist" aria-label="Categorias">
                  <button
                    type="button"
                    :class="['category-link', { active: selectedCategory === '' }]"
                    @click="selectedCategory = ''"
                  >
                    Todas
                  </button>

                  <button
                    v-for="cat in categories"
                    :key="cat.id"
                    :class="['category-link', { active: selectedCategory === cat.id }]"
                    @click="selectedCategory = cat.id"
                  >
                    {{ cat.name }}
                  </button>
                </div>
              </div>
            </div>

            <!-- LISTAGEM DE PRODUTOS -->
            <section class="products-section">
              <div class="section-heading">
                <div>
                  <span class="section-kicker">Cardápio</span>
                  <h2>{{ selectedCategory ? 'Produtos da categoria' : 'Mais Pedidos' }}</h2>
                </div>
                <span class="section-meta">{{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'item' : 'itens' }}</span>
              </div>

              <div v-if="filteredProducts.length === 0" class="empty-products">
                <div class="empty-illustration" aria-hidden="true">🍽️</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Selecione outra categoria para visualizar mais opções.</p>
              </div>

              <div v-else class="products-grid">
                <article
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="product-card"
                  @click="handleProductClick(product)"
                >
                  <div class="product-body">
                    <div class="product-copy">
                      <h3>{{ product.name }}</h3>
                      <p>
                        {{ product.description || 'Delicioso prato preparado com ingredientes selecionados.' }}
                      </p>
                    </div>

                    <div class="product-bottom">
                      <div class="product-price" aria-label="Preço">
                        <small>A partir de</small>
                        <strong>R$ {{ Number(product.price || 0).toFixed(2).replace('.', ',') }}</strong>
                      </div>

                      <button
                        type="button"
                        class="add-button"
                        :disabled="!store.is_open"
                        @click.stop="handleProductClick(product)"
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                        </svg>
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  <div class="product-media">
                    <img
                      :src="product.image_url || placeholderImage"
                      :alt="product.name"
                      loading="lazy"
                    />
                  </div>
                </article>
              </div>
            </section>
          </div>

          <!-- COLUNA DE PRÉVIA DO PEDIDO (DESKTOP) -->
          <aside class="cart-preview-column">
            <div class="cart-preview-card">
              <div class="preview-header">
                <h3>Seu Pedido</h3>
                <span class="preview-badge" v-if="cartTotalItems > 0">{{ cartTotalItems }}</span>
              </div>

              <div v-if="!cartStore.items || cartStore.items.length === 0" class="preview-empty">
                <p>Seu carrinho está vazio</p>
                <small>Adicione itens do cardápio para começar</small>
              </div>

              <div v-else class="preview-body">
                <ul class="preview-items-list">
                  <li v-for="(item, idx) in cartStore.items" :key="idx" class="preview-item">
                    <div class="preview-item-info">
                      <span class="preview-item-qty">{{ item.quantity }}x</span>
                      <span class="preview-item-name">{{ item.name }}</span>
                    </div>
                    <span class="preview-item-price">
                      R$ {{ ((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',') }}
                    </span>
                  </li>
                </ul>

                <div class="preview-summary">
                  <div class="preview-subtotal">
                    <span>Subtotal</span>
                    <strong>R$ {{ cartTotalPrice.toFixed(2).replace('.', ',') }}</strong>
                  </div>

                  <button type="button" class="preview-checkout-btn" @click="openCart">
                    Ver e Concluir Pedido
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <!-- BARRA FLUTUANTE MOBILE (CARRINHO) -->
      <button
        v-if="cartTotalItems > 0"
        type="button"
        class="mobile-cart-bar"
        @click="openCart"
      >
        <span class="mobile-cart-left">
          <span class="mobile-cart-count">{{ cartTotalItems }}</span>
          <span>{{ cartTotalItems === 1 ? '1 item no carrinho' : `${cartTotalItems} itens no carrinho` }}</span>
        </span>
        <span class="mobile-cart-action">
          Ver pedido
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

      <!-- MODAL DO CARRINHO -->
      <CartSidebar
        v-model:isOpen="isCartOpen"
        :store="store"
      />

      <!-- MODAL DE OPÇÕES DO PRODUTO -->
      <ProductModal
        :product="selectedProduct"
        @close="selectedProduct = null"
      />

      <!-- WIDGET DE STATUS DO PEDIDO -->
      <OrderStatusWidget />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/composables/useStore'
import { useProducts, type Product } from '@/composables/useProducts'
import { useCategories } from '@/composables/useCategories'
import { useCartStore } from '@/stores/cart'

import CartSidebar from '@/components/storefront/CartSidebar.vue'
import OrderStatusWidget from '@/components/storefront/OrderStatusWidget.vue'
import ProductModal from '@/components/storefront/ProductModal.vue'

const route = useRoute()
const router = useRouter()
const { store, fetchStoreBySlug, loading, error } = useStore()

const activeSlug = computed(() => {
  if (route.params.slug) return route.params.slug as string;

  const host = window.location.hostname;
  if (host === 'purpleacai.com.br' || host === 'www.purpleacai.com.br') {
    return 'purpleacai';
  }

  return '';
});

const storeId = computed(() => store.value?.id ?? '')

const { products, fetchProducts, subscribeToProducts } = useProducts(storeId.value)
const { categories, fetchCategories } = useCategories(storeId.value)
const cartStore = useCartStore()

const isCartOpen = ref(false)

const openCart = () => {
  isCartOpen.value = true
}

const cartTotalItems = computed(() => {
  if (Array.isArray(cartStore.items)) {
    return cartStore.items.reduce((acc, item) => acc + (item.quantity || 1), 0)
  }
  return 0
})

const cartTotalPrice = computed(() => {
  if (!Array.isArray(cartStore.items)) return 0
  return cartStore.items.reduce((acc, item) => {
    const price = Number(item.price || 0)
    const qty = Number(item.quantity || 1)
    return acc + price * qty
  }, 0)
})

const selectedCategory = ref('')
const selectedProduct = ref<Product | null>(null)

const placeholderBanner = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85'
const placeholderImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85'

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value
  return products.value.filter((p) => p.category_id === selectedCategory.value)
})

const handleProductClick = (product: Product) => {
  if (!store.value?.is_open) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodAny = product as any
  const hasComplements =
    (Array.isArray(prodAny.complement_groups) && prodAny.complement_groups.length > 0) ||
    (Array.isArray(prodAny.options_config) && prodAny.options_config.length > 0)

  if (hasComplements) {
    selectedProduct.value = product
  } else {
    cartStore.addItem({ ...product, quantity: 1 })
  }
}

watch(
  () => activeSlug.value,
  async (newSlug) => {
    if (newSlug) {
      selectedCategory.value = ''
      await fetchStoreBySlug(newSlug)
      const currentStoreId = store.value?.id
      if (currentStoreId) {
        await Promise.all([
          fetchProducts(currentStoreId, true),
          fetchCategories(currentStoreId)
        ])
        if (typeof subscribeToProducts === 'function') {
          subscribeToProducts()
        }
      }
    }
  }
)

onMounted(async () => {
  const slug = activeSlug.value
  if (!slug) {
    router.push('/unauthorized')
    return
  }

  await fetchStoreBySlug(slug)

  const currentStoreId = store.value?.id
  if (error.value || !currentStoreId) {
    router.push('/unauthorized')
    return
  }

  await Promise.all([
    fetchProducts(currentStoreId, true),
    fetchCategories(currentStoreId)
  ])

  if (typeof subscribeToProducts === 'function') {
    subscribeToProducts()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.store-front {
  --ink: #1f1c19;
  --muted: #7f7972;
  --paper: #fffdfa;
  --line: #e9e2da;
  --theme: var(--theme-color, #e85d04);
  --shadow-soft: 0 12px 40px rgba(46, 37, 29, 0.07);
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% -10%, color-mix(in srgb, var(--theme) 9%, transparent), transparent 34rem),
    linear-gradient(180deg, #fffdf9 0%, #f8f4ee 100%);
  color: var(--ink);
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  padding-bottom: 6rem;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.store-front *,
.store-front *::before,
.store-front *::after {
  box-sizing: border-box;
}

/* BLINDAGEM DE LARGURA PARA EVITAR TRANSBORDAMENTO EM QUALQUER TELA */
.page-shell {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
}

/* TOPBAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 253, 249, 0.88);
  border-bottom: 1px solid rgba(56, 44, 33, 0.07);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.topbar-inner {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.brand-logo {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  overflow: hidden;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--paper);
  border: 1px solid var(--line);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.brand-copy strong {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2e7d32;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1;
}

.store-status.closed {
  color: #c62828;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.cart-button {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 42px;
  padding: 0 0.9rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  color: var(--ink);
  cursor: pointer;
  font-weight: 700;
  transition: all 180ms ease;
  flex-shrink: 0;
}

.cart-button:hover {
  transform: translateY(-1px);
  border-color: var(--theme);
}

.cart-icon svg {
  width: 19px;
  height: 19px;
}

.cart-count {
  background: var(--theme);
  color: white;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 99px;
  font-size: 0.7rem;
  display: grid;
  place-items: center;
}

/* AVISO DE FECHADO */
.closed-notice-wrap {
  padding-top: 12px;
}

.closed-notice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border: 1px solid #ead5c7;
  border-radius: 16px;
  background: #fff8f2;
  color: #6c5549;
}

.closed-notice-icon {
  width: 35px;
  height: 35px;
  border-radius: 10px;
  background: #f3dfd2;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.closed-notice-icon svg {
  width: 18px;
  height: 18px;
}

/* HERO */
.hero-section {
  padding-top: 18px;
}

.hero {
  position: relative;
  min-height: 280px;
  border-radius: 28px;
  background-position: center;
  background-size: cover;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%);
}

.hero-content {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 60px;
  color: white;
}

.hero-kicker {
  padding: 0.3rem 0.6rem;
  border-radius: 99px;
  background: rgba(255,255,255,0.2);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.hero h1 {
  margin: 8px 0 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(1.8rem, 4vw, 3.8rem);
  font-weight: 800;
  line-height: 1.1;
}

.hero p {
  margin: 6px 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.hero-bottom-line {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 16px;
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,0.8);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.hero-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme);
  margin-right: 6px;
}

/* MAIN CONTENT */
.main-content {
  padding-top: 24px;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

/* CATEGORIAS COM SCROLL LATERAL BLINDADO */
.category-nav {
  position: sticky;
  top: 74px;
  z-index: 25;
  padding: 10px 0;
  background: rgba(255, 253, 249, 0.95);
  backdrop-filter: blur(10px);
}

.category-nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--ink);
}

.category-count {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 600;
}

.category-scroller-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.category-scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 2px 4px 6px 4px;
}

.category-scroller::-webkit-scrollbar {
  display: none;
}

.category-link {
  flex-shrink: 0;
  padding: 0.55rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: white;
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 180ms ease;
}

.category-link.active {
  background: var(--ink);
  color: white;
  border-color: var(--ink);
}

/* PRODUTOS — DESIGN BLINDADO CONTRA TRANSBORDAMENTO */
.products-section {
  width: 100%;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-kicker {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.section-heading h2 {
  margin: 2px 0 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--ink);
}

.section-meta {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 600;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.product-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(45, 35, 25, 0.08);
  border-radius: 18px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.product-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-copy {
  min-width: 0;
}

.product-copy h3 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-copy p {
  margin: 4px 0 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #625c55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
  min-width: 0;
}

.product-price {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-price small {
  font-size: 0.65rem;
  color: #857b72;
}

.product-price strong {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--ink);
  white-space: nowrap;
}

.add-button {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--theme) 12%, transparent);
  color: var(--theme);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.add-button span {
  display: none;
}

.add-button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.product-media {
  width: 88px;
  height: 88px;
  min-width: 88px;
  max-width: 88px;
  border-radius: 12px;
  overflow: hidden;
  background: #f4f0eb;
  flex-shrink: 0;
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* MODALS E COMPONENTES AUXILIARES */
:deep(.modal-overlay),
:deep(.overlay),
:deep(.dialog-overlay),
:deep(.backdrop) {
  background: rgba(24, 18, 13, .54) !important;
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}

:deep(.modal),
:deep(.modal-card),
:deep(.dialog),
:deep(.drawer),
:deep(.panel) {
  border: 1px solid rgba(40, 31, 23, .10) !important;
  border-radius: 24px !important;
  background: #fffdfa !important;
  box-shadow: 0 28px 80px rgba(27, 20, 14, .20) !important;
}

/* PRÉVIA DO PEDIDO (DESKTOP) */
.cart-preview-column {
  display: none;
}

.cart-preview-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-soft);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.preview-header h3 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
}

.preview-badge {
  background: var(--theme);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 99px;
}

.preview-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--muted);
}

.preview-empty p {
  margin: 0;
  font-weight: 600;
}

.preview-empty small {
  font-size: 0.75rem;
}

.preview-items-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  max-height: 280px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 0.85rem;
}

.preview-item-info {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: hidden;
}

.preview-item-qty {
  font-weight: 700;
  color: var(--theme);
}

.preview-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-item-price {
  font-weight: 700;
  white-space: nowrap;
}

.preview-summary {
  border-top: 1px solid var(--line);
  padding-top: 14px;
}

.preview-subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  margin-bottom: 14px;
}

.preview-checkout-btn {
  width: 100%;
  padding: 12px;
  background: var(--ink);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: opacity 180ms ease;
}

.preview-checkout-btn:hover {
  opacity: 0.9;
}

/* MOBILE BAR - BOTÃO FLUTUANTE ELEGANTE */
.mobile-cart-bar {
  display: none;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 24px;
  z-index: 60;
  width: calc(100% - 32px);
  max-width: 360px;
  padding: 14px 18px;
  border-radius: 99px;
  background: var(--theme);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--theme), transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mobile-cart-bar:active {
  transform: translateX(-50%) scale(0.97);
}

.mobile-cart-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.mobile-cart-count {
  background: white;
  color: var(--theme);
  padding: 3px 9px;
  border-radius: 99px;
  font-weight: 800;
  font-size: 0.8rem;
}

.mobile-cart-action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.85rem;
}

.empty-products {
  text-align: center;
  padding: 48px;
  color: var(--muted);
}

/* MEDIA QUERIES RESPONSIVAS */
@media (min-width: 1024px) {
  .layout-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
  .cart-preview-column {
    display: block;
    position: sticky;
    top: 90px;
  }
  .page-shell {
    padding-left: 20px;
    padding-right: 20px;
  }
  .product-card {
    padding: 18px;
    gap: 16px;
  }
  .product-media {
    width: 120px;
    height: 120px;
    min-width: 120px;
    max-width: 120px;
  }
  .add-button {
    width: auto;
    height: 34px;
    min-width: unset;
    min-height: 34px;
    padding: 0 16px;
    border-radius: 999px;
  }
  .add-button span {
    display: inline;
  }
  .add-button svg {
    margin: 0;
  }
}

@media (max-width: 768px) {
  .cart-label {
    display: none;
  }
  .mobile-cart-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* AJUSTE DE POSIÇÃO DO WIDGET DE STATUS PARA NÃO COBRIR O CARRINHO */
:deep(.floating-container) {
  bottom: 94px !important;
  z-index: 50 !important;
}

@media (max-width: 480px) {
  :deep(.floating-container) {
    left: 12px !important;
    right: 12px !important;
    width: auto !important;
    bottom: 94px !important;
  }
}
</style>
