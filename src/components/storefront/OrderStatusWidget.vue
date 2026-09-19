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
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (data) {
    currentOrder.value = data
    // Oculta se já foi concluído ou cancelado
    if (['concluido', 'cancelado'].includes((data.status || '').toLowerCase())) {
      isVisible.value = false
    } else {
      isVisible.value = true
    }
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
      const updated = payload.new as Order
      currentOrder.value = updated
      if (['concluido', 'cancelado'].includes((updated.status || '').toLowerCase())) {
        setTimeout(() => { isVisible.value = false }, 4000)
      } else {
        isVisible.value = true
      }
    })
    .subscribe()
}

const checkActiveOrder = () => {
  const savedId = localStorage.getItem('active_order_id')
  if (savedId) fetchOrder(savedId)
}

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
      return 'Pronto para Retirada'
    case 'saiu':
    case 'saiu_para_entrega':
      return 'Saiu para Entrega'
    case 'concluido':
      return 'Pedido Entregue'
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
      return 'Seu pedido chegou ao restaurante e está na fila da cozinha.'
    case 'preparo':
      return 'A cozinha já começou o preparo dos seus itens!'
    case 'pronto':
      return 'Seu pedido já foi finalizado e aguarda envio/retirada.'
    case 'saiu':
      return 'O entregador já está a caminho do seu endereço!'
    case 'concluido':
      return 'Bom apetite! Pedido finalizado.'
    case 'cancelado':
      return 'Este pedido foi cancelado pelo restaurante.'
    default:
      return 'Acompanhando atualizações em tempo real...'
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