<template>
  <div v-if="isVisible && currentOrder" class="status-widget">
    <div class="widget-header">
      <div>
        <span class="eyebrow">Acompanhamento</span>
        <h3>Pedido #{{ currentOrder.order_number || currentOrder.id.slice(0, 5) }}</h3>
      </div>
      <button @click="isVisible = false" class="btn-minimize">−</button>
    </div>

    <!-- Status: Aguardando Pagamento -->
    <div v-if="currentOrder.status === 'AGUARDANDO_PAGAMENTO'" class="status-body warning">
      <div class="status-badge">01</div>
      <div>
        <strong>⏳ Aguardando Pagamento</strong>
        <p>Realize o pagamento via Pix para enviarmos o seu pedido para a cozinha.</p>
      </div>
    </div>

    <!-- Status: Pago / Em Preparo / Outros -->
    <div v-else class="status-body success">
      <div class="status-badge">02</div>
      <div>
        <strong>👨‍🍳 {{ statusText }}</strong>
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
  status: string
}

const currentOrder = ref<Order | null>(null)
const isVisible = ref(false)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

const fetchOrder = async (orderId: string) => {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (data) {
    currentOrder.value = data
    isVisible.value = true
    listenToOrderUpdates(data.id)
  }
}

const listenToOrderUpdates = (orderId: string) => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)

  realtimeChannel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`
    }, (payload) => {
      currentOrder.value = payload.new as Order
    })
    .subscribe()
}

const checkActiveOrder = () => {
  const savedId = localStorage.getItem('active_order_id')
  if (savedId) fetchOrder(savedId)
}

const statusText = computed(() => {
  switch (currentOrder.value?.status) {
    case 'pago': case 'recebido': return 'Pedido Recebido'
    case 'preparando': return 'Em Preparação'
    case 'pronto': return 'Pedido Pronto'
    case 'saiu_para_entrega': return 'Saiu para Entrega'
    default: return 'Processando Pedido'
  }
})

const statusDescription = computed(() => {
  switch (currentOrder.value?.status) {
    case 'pago': case 'recebido': return 'Seu pedido foi confirmado e enviado para a cozinha!'
    case 'preparando': return 'Sua refeição já está sendo preparada.'
    case 'pronto': return 'Seu pedido está pronto para retirada/envio.'
    default: return 'Acompanhe a atualização do seu pedido.'
  }
})

onMounted(() => {
  checkActiveOrder()
  window.addEventListener('order-created', checkActiveOrder)
})

onUnmounted(() => {
  window.removeEventListener('order-created', checkActiveOrder)
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<style scoped>
.status-widget { position: fixed; bottom: 20px; left: 20px; width: 340px; background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 9999; display: flex; flex-direction: column; gap: 16px; border: 1px solid #eee; }
.widget-header { display: flex; justify-content: space-between; align-items: flex-start; }
.eyebrow { font-size: 10px; text-transform: uppercase; color: #888; font-weight: 700; }
.widget-header h3 { margin: 2px 0 0; font-size: 18px; }
.btn-minimize { border: 1px solid #ddd; background: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; }
.status-body { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 12px; }
.status-body.warning { background: #fffbeb; border: 1px solid #fef3c7; }
.status-body.success { background: #f0fdf4; border: 1px solid #dcfce7; }
.status-badge { background: #111; color: #fff; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; shrink: 0; }
.status-body strong { font-size: 14px; display: block; margin-bottom: 2px; }
.status-body p { font-size: 12px; color: #666; margin: 0; line-height: 1.3; }
.btn-hide { width: 100%; padding: 10px; border: 1px solid #ddd; background: #fff; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
</style>
