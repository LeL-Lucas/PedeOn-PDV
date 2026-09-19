<template>
  <div class="order-manager">
    <header class="orders-header">
      <div>
        <div class="eyebrow">Operação</div>
        <h2>Pedidos</h2>
        <p>Acompanhe e atualize os pedidos em tempo real.</p>
      </div>

      <button class="refresh-button" @click="fetchOrders" :disabled="isLoading">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8.1 8.1 0 0 0-14.9-3.9L3 10"></path>
          <path d="M3 4v6h6"></path>
          <path d="M4 13a8.1 8.1 0 0 0 14.9 3.9L21 14"></path>
          <path d="M21 20v-6h-6"></path>
        </svg>
        <span>{{ isLoading ? 'Atualizando...' : 'Atualizar' }}</span>
      </button>
    </header>

    <section class="ops-strip">
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>Tempo real ativo</span>
      </div>
      <span class="ops-divider"></span>
      <span>{{ orders.length }} pedido{{ orders.length === 1 ? '' : 's' }}</span>
    </section>

    <div v-if="isLoading && orders.length === 0" class="state-box loading-state">
      <div class="state-icon">↻</div>
      <strong>Carregando pedidos</strong>
      <p>Estamos buscando os pedidos mais recentes.</p>
    </div>

    <div v-else-if="errorMessage" class="state-box error-state">
      <div class="state-icon">!</div>
      <strong>Não foi possível carregar os pedidos</strong>
      <p>{{ errorMessage }}</p>
      <button class="secondary-button" @click="fetchOrders">Tentar novamente</button>
    </div>

    <div v-else-if="orders.length > 0" class="orders-layout">
      <div class="orders-grid">
        <article v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-card-top">
            <div class="order-number">
              <span>Pedido</span>
              <strong>#{{ order.code || order.order_number || (order.id ? order.id.toString().slice(0, 5) : '---')
                }}</strong>
            </div>

            <div class="order-top-meta">
              <span :class="['status-pill', order.status]">{{ formatStatusText(order.status) }}</span>
              <time>{{ formatTime(order.created_at) }}</time>
            </div>
          </div>

          <div class="customer-block">
            <div class="customer-avatar">
              {{ (order.customer_name || 'C').charAt(0).toUpperCase() }}
            </div>
            <div class="customer-copy">
              <strong>{{ order.customer_name || 'Cliente sem nome' }}</strong>
              <span v-if="order.customer_phone">{{ order.customer_phone }}</span>
              <span v-else>Cliente</span>
            </div>
          </div>

          <div class="order-info-grid">
            <div v-if="order.payment_method" class="info-item">
              <span class="info-label">Pagamento</span>
              <strong>{{ order.payment_method }}</strong>
            </div>

            <div v-if="order.address" class="info-item info-item-wide">
              <span class="info-label">Entrega</span>
              <strong>{{ order.address }}</strong>
            </div>
          </div>

          <button class="items-button" @click="openItemsModal(order)">
            <span class="items-button-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h12v16H6z"></path>
                <path d="M9 8h6M9 12h6M9 16h4"></path>
              </svg>
            </span>
            <span>Ver itens do pedido</span>
            <span class="items-count">{{ parseItems(order).length }}</span>
            <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>

          <div v-if="order.notes" class="notes-box">
            <span class="notes-label">Observação</span>
            <p>{{ order.notes }}</p>
          </div>

          <div v-if="order.status !== 'concluido' && order.status !== 'cancelado'" class="prep-box">
            <div>
              <span class="info-label">Tempo estimado</span>
              <strong>Preparo</strong>
            </div>

            <label class="prep-input-wrap">
              <input type="number" v-model.number="order.prep_time"
                @change="updatePrepTime(order.id, order.prep_time || 0)" min="5" step="5"
                aria-label="Tempo estimado em minutos" />
              <span>min</span>
            </label>
          </div>

          <div class="status-section">
            <div class="status-section-head">
              <span>Atualizar status</span>
              <span class="status-hint">A alteração é salva automaticamente</span>
            </div>

            <select v-model="order.status" @change="handleStatusChange(order)"
              :disabled="order.status === 'concluido' || order.status === 'cancelado'"
              :class="['status-select', order.status]">
              <option value="pendente">Pendente</option>
              <option value="preparo">Em preparo</option>
              <option value="saiu">Saiu p/ entrega</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <footer class="order-card-footer">
            <div>
              <span>Total do pedido</span>
              <strong>R$ {{ getOrderTotal(order).toFixed(2) }}</strong>
            </div>

            <button class="print-button" @click="sendToNodePrinter(order)" title="Imprimir cupom">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9V3h12v6"></path>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <path d="M6 14h12v7H6z"></path>
              </svg>
              <span>Imprimir</span>
            </button>
          </footer>
        </article>
      </div>
    </div>

    <div v-else class="state-box empty-state">
      <div class="empty-illustration">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect x="10" y="16" width="44" height="34" rx="8"></rect>
          <path d="M20 27h24M20 35h15M20 43h10"></path>
        </svg>
      </div>
      <strong>Nenhum pedido por aqui</strong>
      <p>Quando um novo pedido chegar, ele aparecerá automaticamente nesta tela.</p>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <div>
            <span class="modal-kicker">Detalhes do pedido</span>
            <h3>#{{ selectedOrder?.code || selectedOrder?.order_number || selectedOrder?.id?.toString().slice(0, 5) }}
            </h3>
          </div>

          <button class="close-button" @click="closeModal" aria-label="Fechar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <div v-if="selectedOrder?.customer_name" class="modal-customer">
            <div class="customer-avatar large">
              {{ selectedOrder.customer_name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <strong>{{ selectedOrder.customer_name }}</strong>
              <span>{{ formatTime(selectedOrder.created_at) }}</span>
            </div>
          </div>

          <div class="modal-items">
            <div v-for="(item, idx) in parseItems(selectedOrder)" :key="idx" class="modal-item-row">
              <div class="modal-item-main">
                <div class="modal-item-title">
                  <strong>{{ item.quantity || item.qtd || item.qnt || 1 }}×</strong>
                  <span>{{ item.name || item.title || item.nome || item.product_name || 'Produto' }}</span>
                </div>
                <strong>R$ {{ (Number(item.price || item.valor || 0) * Number(item.quantity || item.qtd || item.qnt ||
                  1)).toFixed(2) }}</strong>
              </div>

              <div v-if="hasComplements(item)" class="modal-complements">
                <span v-for="(comp, cIdx) in getComplements(item)" :key="cIdx">
                  + {{ typeof comp === 'string' ? comp : (comp.name || comp.nome || comp.title || '') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div>
            <span>Total</span>
            <strong>R$ {{ selectedOrder ? getOrderTotal(selectedOrder).toFixed(2) : '0.00' }}</strong>
          </div>
          <button class="modal-close-button" @click="closeModal">Fechar</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { supabase } from '../../services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ComplementItem {
  name?: string
  nome?: string
  title?: string
}

interface OrderItem {
  id?: string
  order_id?: string
  name?: string
  title?: string
  nome?: string
  product_name?: string
  quantity?: number
  qtd?: number
  qnt?: number
  price?: number
  valor?: number
  complements?: (string | ComplementItem)[]
  adicionais?: (string | ComplementItem)[]
  opcoes?: (string | ComplementItem)[]
  options?: (string | ComplementItem)[]
}

interface Order {
  id: string
  store_id?: string
  code?: string
  order_number?: string
  customer_name: string
  customer_phone?: string
  address?: string
  payment_method?: string
  notes?: string
  total?: number
  total_amount?: number
  status: string
  prep_time?: number
  created_at: string
  items?: unknown
  order_items?: OrderItem[]
  cart?: unknown
  products?: unknown
}

const props = defineProps<{
  storeId: string
}>()

const orders = ref<Order[]>([])
const storeName = ref('Purple Açaí')
const isLoading = ref(false)
const errorMessage = ref('')
let realtimeChannel: RealtimeChannel | null = null

const isModalOpen = ref(false)
const selectedOrder = ref<Order | null>(null)

const openItemsModal = (order: Order) => {
  selectedOrder.value = order
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedOrder.value = null
}

// Extração e Normalização segura dos Itens do Pedido
const parseItems = (orderObj: Order | null): OrderItem[] => {
  if (!orderObj) return []

  let raw: unknown = orderObj.order_items
  if (!raw || (Array.isArray(raw) && raw.length === 0)) {
    raw = orderObj.items || orderObj.cart || orderObj.products
  }

  if (!raw) return []

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as OrderItem[]) : []
    } catch (e) {
      console.error('❌ Erro ao fazer JSON.parse dos itens:', e)
      return []
    }
  }
  return Array.isArray(raw) ? (raw as OrderItem[]) : []
}

// Cálculo seguro do Total do Pedido
const getOrderTotal = (order: Order): number => {
  const directTotal = Number(order.total || order.total_amount || 0)
  if (directTotal > 0) return directTotal

  const items = parseItems(order)
  return items.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qtd || item.qnt || 1)
    const price = Number(item.price || item.valor || 0)
    return sum + (price * qty)
  }, 0)
}

// Buscar pedidos filtrando por store_id
const fetchOrders = async () => {
  if (!props.storeId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Busca os pedidos da loja (filtrando para ignorar os que estão aguardando pagamento)
    const { data: fetchedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', props.storeId)
      .neq('status', 'AGUARDANDO_PAGAMENTO')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Erro na tabela orders:', ordersError)
      errorMessage.value = `Erro no banco de dados: ${ordersError.message}`
      orders.value = []
      return
    }

    if (!fetchedOrders || fetchedOrders.length === 0) {
      orders.value = []
      return
    }

    const orderIds = fetchedOrders.map(o => o.id)

    // 2. Busca os itens vinculados aos pedidos encontrados
    const { data: fetchedItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsError) {
      console.warn('⚠️ Erro/Aviso ao carregar itens de order_items:', itemsError)
    }

    // 3. Monta a lista combinada
    orders.value = fetchedOrders.map(order => ({
      ...order,
      order_items: (fetchedItems || []).filter(item => item.order_id === order.id)
    })) as Order[]

  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('❌ Erro inesperado ao carregar pedidos:', errorObj)
    errorMessage.value = 'Ocorreu um erro de conexão ao carregar os pedidos.'
  } finally {
    isLoading.value = false
  }
}

const setupRealtime = () => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  if (!props.storeId) return

  realtimeChannel = supabase
    .channel(`public:orders:store_id=${props.storeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${props.storeId}`
      },
      () => {
        console.log('🚨 Atualização de pedidos recebida via Realtime!')
        fetchOrders()
      }
    )
    .subscribe()
}

// Observa mudanças em storeId e carrega quando a prop estiver disponível
watch(
  () => props.storeId,
  (newStoreId) => {
    if (newStoreId) {
      fetchOrders()
      setupRealtime()
    }
  },
  { immediate: true }
)

const hasComplements = (item: OrderItem) => {
  const comps = item.complements || item.adicionais || item.opcoes || item.options
  return comps && Array.isArray(comps) && comps.length > 0
}

const getComplements = (item: OrderItem): (string | ComplementItem)[] => {
  return item.complements || item.adicionais || item.opcoes || item.options || []
}

const updatePrepTime = async (orderId: string, newTime: number) => {
  await supabase
    .from('orders')
    .update({ prep_time: newTime })
    .eq('id', orderId)
    .eq('store_id', props.storeId)
}

const handleStatusChange = async (order: Order) => {
  const newStatus = order.status

  if (newStatus === 'concluido' || newStatus === 'cancelado') {
    const confirmMsg = `Tem certeza que deseja marcar o pedido #${order.code || order.order_number || order.id.toString().slice(0, 5)} como ${formatStatusText(newStatus)}? Esta ação é definitiva.`

    if (!window.confirm(confirmMsg)) {
      fetchOrders()
      return
    }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', order.id)
    .eq('store_id', props.storeId)

  if (error) {
    console.error('❌ Erro ao atualizar status:', error)
    alert('Erro ao atualizar o status do pedido.')
    fetchOrders()
  } else {
    fetchOrders()
  }
}

const sendToNodePrinter = async (order: Order) => {
  try {
    const parsedItems = parseItems(order)

    const printPayload = {
      storeName: storeName.value,
      order: {
        ...order,
        items: parsedItems
      }
    }

    const response = await fetch('http://localhost:3000/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printPayload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro no servidor de impressão.')
    }

    console.log('✅ Cupom enviado com sucesso!')
  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('❌ Erro ao enviar para impressora:', errorObj.message || errorObj)
  }
}

const formatStatusText = (status: string) => {
  const map: Record<string, string> = {
    pendente: 'PENDENTE',
    PENDING: 'PENDENTE',
    preparo: 'EM PREPARO',
    PREPARING: 'EM PREPARO',
    saiu: 'SAIU P/ ENTREGA',
    READY: 'PRONTO',
    concluido: 'CONCLUÍDO',
    DELIVERED: 'ENTREGUE / CONCLUÍDO',
    cancelado: 'CANCELADO',
    CANCELLED: 'CANCELADO'
  }
  return map[status] || (status ? status.toUpperCase() : '')
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

.order-manager {
  --bg: #f5f5f2;
  --surface: #ffffff;
  --surface-soft: #fafaf8;
  --ink: #181816;
  --muted: #77766f;
  --line: #e8e7e2;
  --accent: #171716;
  min-height: 100vh;
  padding: 28px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'DM Sans', system-ui, sans-serif;
}

.order-manager *,
.order-manager *::before,
.order-manager *::after {
  box-sizing: border-box;
}

.orders-header {
  max-width: 1380px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #96948c;
}

.orders-header h2 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2rem, 3vw, 2.6rem);
  line-height: 1;
  letter-spacing: -.05em;
}

.orders-header p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: .95rem;
}

.refresh-button,
.secondary-button,
.modal-close-button,
.print-button,
.items-button {
  border: 0;
  font-family: inherit;
  cursor: pointer;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid #d9d8d3;
  border-radius: 12px;
  background: rgba(255, 255, 255, .8);
  color: #2c2c28;
  font-size: .86rem;
  font-weight: 700;
  transition: .2s ease;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #c8c6bf;
  box-shadow: 0 8px 22px rgba(23, 23, 22, .07);
}

.refresh-button:disabled {
  opacity: .55;
  cursor: wait;
}

.refresh-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ops-strip {
  max-width: 1380px;
  margin: 22px auto 26px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, .65);
  color: #66655e;
  font-size: .82rem;
  font-weight: 600;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #393a35;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #27a45d;
  box-shadow: 0 0 0 4px rgba(39, 164, 93, .1);
}

.ops-divider {
  width: 1px;
  height: 16px;
  background: #deddd8;
}

.orders-layout {
  max-width: 1380px;
  margin: 0 auto;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.order-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 8px 30px rgba(26, 26, 22, .045);
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  border-color: #dcdad3;
  box-shadow: 0 18px 42px rgba(26, 26, 22, .08);
}

.order-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0efe9;
}

.order-number {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.order-number span {
  color: #9a9890;
  font-size: .73rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.order-number strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.08rem;
  letter-spacing: -.03em;
}

.order-top-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.order-top-meta time {
  color: #8a887f;
  font-size: .78rem;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .07em;
}

.status-pill.pendente,
.status-pill.PENDING {
  color: #8a6417;
  background: #fff7dc;
}

.status-pill.preparo,
.status-pill.PREPARING {
  color: #185e93;
  background: #e9f4fd;
}

.status-pill.saiu,
.status-pill.READY {
  color: #6a4598;
  background: #f1eafd;
}

.status-pill.concluido,
.status-pill.DELIVERED {
  color: #25734a;
  background: #e8f6ed;
}

.status-pill.cancelado,
.status-pill.CANCELLED {
  color: #9b4643;
  background: #fdeceb;
}

.customer-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 0 14px;
}

.customer-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 13px;
  background: #eeede8;
  color: #373732;
  font-family: 'Manrope', sans-serif;
  font-size: .9rem;
  font-weight: 800;
}

.customer-avatar.large {
  width: 48px;
  height: 48px;
}

.customer-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.customer-copy strong {
  font-size: .96rem;
  font-weight: 800;
}

.customer-copy span {
  color: #8c8a81;
  font-size: .78rem;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.info-item {
  min-width: 0;
  padding: 11px 12px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.info-item-wide {
  grid-column: 1 / -1;
}

.info-label {
  display: block;
  margin-bottom: 4px;
  color: #a09e95;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.info-item strong {
  display: block;
  overflow: hidden;
  color: #42413b;
  font-size: .79rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.items-button {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 13px;
  border: 1px solid #e3e2dc;
  border-radius: 13px;
  background: #fff;
  color: #35352f;
  text-align: left;
  font-size: .82rem;
  font-weight: 800;
  transition: .2s ease;
}

.items-button:hover {
  border-color: #cfcdbf;
  background: #fcfcfa;
}

.items-button-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #f0efe9;
}

.items-button-icon svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.items-count {
  min-width: 24px;
  padding: 4px 7px;
  border-radius: 999px;
  background: #f1f0eb;
  color: #6c6a62;
  text-align: center;
  font-size: .7rem;
}

.chevron {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #a6a39b;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notes-box {
  margin-top: 12px;
  padding: 11px 12px;
  border-left: 3px solid #c78932;
  border-radius: 0 11px 11px 0;
  background: #fff9ef;
}

.notes-label {
  display: block;
  margin-bottom: 4px;
  color: #9a7240;
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.notes-box p {
  margin: 0;
  color: #6f5b3e;
  font-size: .79rem;
  line-height: 1.45;
}

.prep-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e7e5df;
  border-radius: 13px;
  background: #fafaf7;
}

.prep-box strong {
  font-size: .83rem;
}

.prep-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #d8d6cf;
  border-radius: 10px;
  background: #fff;
  color: #67655e;
  font-size: .78rem;
  font-weight: 700;
}

.prep-input-wrap input {
  width: 44px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #272722;
  text-align: center;
  font: 800 .85rem 'DM Sans', sans-serif;
}

.status-section {
  margin-top: 14px;
}

.status-section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 7px;
}

.status-section-head>span:first-child {
  color: #46453f;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.status-hint {
  color: #aba89f;
  font-size: .68rem;
}

.status-select {
  width: 100%;
  min-height: 45px;
  padding: 0 13px;
  appearance: none;
  border: 1px solid #dcdad3;
  border-radius: 12px;
  background: #fff;
  color: #383833;
  font: 700 .82rem 'DM Sans', sans-serif;
  outline: none;
  cursor: pointer;
  transition: .2s ease;
}

.status-select:focus {
  border-color: #aaa79e;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, .04);
}

.status-select.pendente {
  background: #fffcf4;
}

.status-select.preparo {
  background: #f8fcff;
}

.status-select.saiu {
  background: #faf7ff;
}

.status-select.concluido {
  background: #f7fcf8;
}

.status-select.cancelado {
  background: #fff9f8;
}

.status-select:disabled {
  opacity: .75;
  cursor: not-allowed;
}

.order-card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 17px;
  padding-top: 15px;
  border-top: 1px solid #efeee8;
}

.order-card-footer>div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-card-footer>div span {
  color: #9b998f;
  font-size: .67rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.order-card-footer>div strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.18rem;
  letter-spacing: -.04em;
}

.print-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid #dddcd6;
  border-radius: 11px;
  background: #f8f8f5;
  color: #42413b;
  font-size: .76rem;
  font-weight: 800;
  transition: .2s ease;
}

.print-button:hover {
  background: #efeee9;
  border-color: #cfcdc5;
}

.print-button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.state-box {
  max-width: 1380px;
  min-height: 340px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  border: 1px dashed #dcdad2;
  border-radius: 20px;
  background: rgba(255, 255, 255, .5);
  text-align: center;
}

.state-icon,
.empty-illustration {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 17px;
  background: #ecebe5;
  color: #66645d;
  font-weight: 800;
}

.loading-state .state-icon {
  font-size: 1.5rem;
  animation: spin 1s linear infinite;
}

.empty-illustration svg {
  width: 29px;
  height: 29px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.state-box strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
}

.state-box p {
  max-width: 430px;
  margin: 7px 0 0;
  color: #8b8980;
  font-size: .82rem;
  line-height: 1.5;
}

.error-state {
  border-color: #ead8d5;
  background: #fffaf9;
}

.error-state .state-icon {
  background: #f8e8e5;
  color: #9b4c48;
}

.secondary-button {
  margin-top: 16px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 11px;
  background: #262622;
  color: #fff;
  font-size: .78rem;
  font-weight: 800;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(20, 20, 18, .38);
  backdrop-filter: blur(8px);
}

.modal-content {
  width: min(520px, 100%);
  max-height: min(760px, calc(100vh - 40px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .7);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 26px 80px rgba(0, 0, 0, .2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 18px;
  border-bottom: 1px solid #eceae4;
}

.modal-kicker {
  display: block;
  margin-bottom: 4px;
  color: #9d9a91;
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.modal-header h3 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  letter-spacing: -.04em;
}

.close-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #e5e3dd;
  border-radius: 11px;
  background: #fafaf8;
  color: #6f6d65;
  cursor: pointer;
}

.close-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.modal-body {
  overflow-y: auto;
  padding: 18px 22px 8px;
}

.modal-customer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 4px;
}

.modal-customer>div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal-customer strong {
  font-size: .92rem;
}

.modal-customer span {
  color: #96938a;
  font-size: .73rem;
}

.modal-items {
  display: flex;
  flex-direction: column;
}

.modal-item-row {
  padding: 15px 0;
  border-bottom: 1px solid #efeee8;
}

.modal-item-row:last-child {
  border-bottom: 0;
}

.modal-item-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  color: #363631;
  font-size: .86rem;
}

.modal-item-main>strong {
  white-space: nowrap;
}

.modal-item-title {
  display: flex;
  gap: 9px;
}

.modal-item-title strong {
  color: #9f7a2f;
}

.modal-complements {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-left: 26px;
}

.modal-complements span {
  color: #8a887f;
  font-size: .74rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px 20px;
  border-top: 1px solid #eceae4;
  background: #fcfcfa;
}

.modal-footer>div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal-footer>div span {
  color: #99968d;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.modal-footer>div strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  letter-spacing: -.03em;
}

.modal-close-button {
  min-height: 41px;
  padding: 0 16px;
  border-radius: 11px;
  background: #242420;
  color: #fff;
  font-size: .78rem;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1050px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .order-manager {
    padding: 18px 14px 28px;
  }

  .orders-header {
    align-items: flex-start;
  }

  .orders-header h2 {
    font-size: 2rem;
  }

  .orders-header p {
    font-size: .85rem;
    max-width: 260px;
  }

  .refresh-button {
    min-width: 44px;
    width: 44px;
    padding: 0;
    justify-content: center;
  }

  .refresh-button span {
    display: none;
  }

  .ops-strip {
    margin: 18px 0 18px;
  }

  .order-card {
    padding: 16px;
    border-radius: 18px;
  }

  .order-card-top {
    flex-direction: column;
    align-items: stretch;
  }

  .order-top-meta {
    justify-content: flex-start;
  }

  .order-info-grid {
    grid-template-columns: 1fr;
  }

  .info-item-wide {
    grid-column: auto;
  }

  .status-section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .order-card-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .print-button {
    width: 100%;
    justify-content: center;
  }

  .modal-overlay {
    padding: 10px;
    align-items: end;
  }

  .modal-content {
    max-height: calc(100vh - 20px);
    border-radius: 22px 22px 14px 14px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 17px;
    padding-right: 17px;
  }

  .modal-footer {
    padding-bottom: calc(15px + env(safe-area-inset-bottom));
  }
}
</style>
