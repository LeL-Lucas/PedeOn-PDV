<template>
  <div v-if="isVisible && currentOrder" class="status-widget">
    <div class="widget-header">
      <div>
        <span class="eyebrow">Acompanhamento</span>
        <h3>Pedido #{{ currentOrder.order_number || currentOrder.code || currentOrder.id.slice(0, 5) }}</h3>
      </div>
      <button @click="isVisible = false" class="btn-minimize" aria-label="Minimizar acompanhamento">−</button>
    </div>

    <!-- Status: Aguardando Pagamento -->
    <div v-if="isPaymentPending" class="status-body warning">
      <div class="status-badge">01</div>
      <div>
        <strong>⏳ Aguardando Pagamento</strong>
        <p>Realize o pagamento via Pix para enviarmos o seu pedido para a cozinha.</p>
      </div>
    </div>

    <!-- Status: Em preparo / Pronto / Saiu / Concluído -->
    <div v-else class="status-body" :class="statusBadgeClass">
      <div class="status-badge">{{ stepNumber }}</div>
      <div>
        <strong>{{ statusIcon }} {{ statusText }}</strong>
        <p>{{ statusDescription }}</p>
      </div>
    </div>

    <button @click="isVisible = false" class="btn-hide">Ocultar acompanhamento</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

interface Order {
  id: string
  order_number?: number | string
  code?: string
  status: string
}

const currentOrder = ref<Order | null>(null)
const isVisible = ref(false)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

const fetchOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!error && data) {
    currentOrder.value = data as Order
    const st = (data.status || '').toLowerCase()

    // Se o pedido já tiver sido concluído ou cancelado há algum tempo, não mostra
    if (['concluido', 'cancelado'].includes(st)) {
      isVisible.value = false
    } else {
      isVisible.value = true
    }

    listenToOrderUpdates(data.id)
  }
}

const listenToOrderUpdates = (orderId: string) => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }

  realtimeChannel = supabase
    .channel(`order-status-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        const updated = payload.new as Order
        currentOrder.value = updated
        const st = (updated.status || '').toLowerCase()

        if (['concluido', 'cancelado'].includes(st)) {
          // Mantém visível por 5 segundos para o cliente ver e oculta em seguida
          setTimeout(() => {
            isVisible.value = false
          }, 5000)
        } else {
          isVisible.value = true
        }
      }
    )
    .subscribe()
}

const checkActiveOrder = () => {
  const savedId = localStorage.getItem('active_order_id')
  if (savedId) {
    fetchOrder(savedId)
  }
}

const isPaymentPending = computed(() => {
  const st = (currentOrder.value?.status || '').toUpperCase()
  return st === 'AGUARDANDO_PAGAMENTO'
})

const stepNumber = computed(() => {
  const st = (currentOrder.value?.status || '').toLowerCase()
  switch (st) {
    case 'pendente':
    case 'pending':
      return '01'
    case 'preparo':
    case 'preparando':
      return '02'
    case 'pronto':
    case 'ready':
      return '03'
    case 'saiu':
    case 'saiu_para_entrega':
      return '04'
    case 'concluido':
      return '✔'
    default:
      return '01'
  }
})

const statusBadgeClass = computed(() => {
  const st = (currentOrder.value?.status || '').toLowerCase()
  if (st === 'cancelado') return 'danger'
  return 'success'
})

const statusIcon = computed(() => {
  const st = (currentOrder.value?.status || '').toLowerCase()
  switch (st) {
    case 'pendente':
    case 'pending':
      return '📥'
    case 'preparo':
    case 'preparando':
      return '👨‍🍳'
    case 'pronto':
    case 'ready':
      return '🛎️'
    case 'saiu':
    case 'saiu_para_entrega':
      return '🛵'
    case 'concluido':
      return '✅'
    case 'cancelado':
      return '❌'
    default:
      return '⏳'
  }
})

const statusText = computed(() => {
  const st = (currentOrder.value?.status || '').toLowerCase()
  switch (st) {
    case 'pendente':
    case 'pending':
      return 'Pedido Enviado'
    case 'preparo':
    case 'preparando':
      return 'Na Cozinha / Em Preparo'
    case 'pronto':
    case 'ready':
      return 'Pedido Pronto!'
    case 'saiu':
    case 'saiu_para_entrega':
      return 'Saiu para Entrega'
    case 'concluido':
      return 'Pedido Concluído'
    case 'cancelado':
      return 'Pedido Cancelado'
    default:
      return 'Processando Pedido'
  }
})

const statusDescription = computed(() => {
  const st = (currentOrder.value?.status || '').toLowerCase()
  switch (st) {
    case 'pendente':
    case 'pending':
      return 'O seu pedido foi enviado ao restaurante e aguarda a fila da cozinha.'
    case 'preparo':
    case 'preparando':
      return 'A cozinha já recebeu e está a preparar a sua refeição.'
    case 'pronto':
    case 'ready':
      return 'O seu pedido já está pronto para recolha ou a aguardar o estafeta.'
    case 'saiu':
    case 'saiu_para_entrega':
      return 'O estafeta já saiu e está a caminho da sua morada!'
    case 'concluido':
      return 'Pedido entregue com sucesso. Bom apetite!'
    case 'cancelado':
      return 'O pedido foi cancelado pelo restaurante.'
    default:
      return 'A acompanhar a evolução do pedido em tempo real.'
  }
})

onMounted(() => {
  checkActiveOrder()
  window.addEventListener('order-created', checkActiveOrder)
})

onUnmounted(() => {
  window.removeEventListener('order-created', checkActiveOrder)
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})
</script>

<style scoped>
.status-widget {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 350px;
  background: #fff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid #eee;
  animation: slide-up 0.25s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  color: #888;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.widget-header h3 {
  margin: 3px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #111;
}

.btn-minimize {
  border: 1px solid #ddd;
  background: #f9f9f9;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.status-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px;
  border-radius: 13px;
}

.status-body.warning {
  background: #fffbeb;
  border: 1px solid #fef3c7;
}

.status-body.success {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
}

.status-body.danger {
  background: #fef2f2;
  border: 1px solid #fee2e2;
}

.status-badge {
  background: #111;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.status-body strong {
  font-size: 13.5px;
  display: block;
  margin-bottom: 2px;
  color: #111;
}

.status-body p {
  font-size: 12px;
  color: #555;
  margin: 0;
  line-height: 1.4;
}

.btn-hide {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  background: #fafafa;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #555;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-hide:hover {
  background: #f0f0f0;
  color: #111;
}
</style>
