<template>
  <div v-if="activeOrder" class="floating-container">
    <!-- BOTÃO FLUTUANTE (QUANDO MINIMIZADO) -->
    <button
      v-if="isMinimized"
      class="minimized-pill"
      @click="isMinimized = false"
      aria-label="Abrir acompanhamento do pedido"
    >
      <span class="live-dot" :class="normalizedStatus"></span>
      <span>Pedido <strong>#{{ orderCode }}</strong></span>
      <span class="mini-status-badge">{{ statusInfo.label }}</span>
    </button>

    <!-- CARD EXPANDIDO DE ACOMPANHAMENTO -->
    <aside v-else class="floating-status-widget" aria-live="polite">
      <header class="widget-header">
        <div>
          <span class="overline">Acompanhamento</span>
          <strong>Pedido #{{ orderCode }}</strong>
        </div>
        <button type="button" class="btn-minimize" @click="isMinimized = true" title="Minimizar">−</button>
      </header>

      <div class="status-hero" :class="normalizedStatus">
        <div class="status-icon">
          <span>{{ statusInfo.icon }}</span>
        </div>
        <div class="status-info-text">
          <span class="status-label">{{ statusInfo.label }}</span>
          <p>{{ statusInfo.description }}</p>
        </div>
      </div>

      <div v-if="normalizedStatus === 'in_production' && activeOrder.preparation_time" class="prep-time">
        <span>Tempo estimado</span>
        <strong>{{ activeOrder.preparation_time }} min</strong>
      </div>

      <!-- BARRA DE PROGRESSO ESTILO IFOOD (PISCA NA ETAPA ATIVA) -->
      <div v-if="normalizedStatus !== 'canceled'" class="progress-track" :class="normalizedStatus">
        <span
          v-for="stepNum in 4"
          :key="stepNum"
          class="step"
          :class="{
            'done': stepNum < currentStepIndex,
            'active': stepNum === currentStepIndex,
            'pending': stepNum > currentStepIndex
          }"
        ></span>
      </div>

      <footer class="widget-footer">
        <button type="button" class="btn-new-order" @click="handleClearOrder">
          {{ ['completed', 'canceled'].includes(normalizedStatus) ? 'Fazer novo pedido' : 'Ocultar acompanhamento' }}
        </button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

interface OrderStatus {
  id: string
  status: string
  preparation_time?: string
  display_id?: string | number
  order_number?: string | number
  code?: string | number
  [key: string]: unknown
}

const activeOrder = ref<OrderStatus | null>(null)
const isMinimized = ref(false)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

// Função auxiliar para identificar se o pedido já foi concluído/cancelado
const isFinishedStatus = (statusStr?: string) => {
  if (!statusStr) return false
  const s = statusStr
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  return ['completed', 'concluido', 'entregue', 'finalizado', 'canceled', 'cancelado', 'cancelada'].includes(s)
}

// Formata o código do pedido para ficar idêntico ao painel admin (ex: #73)
const orderCode = computed(() => {
  if (!activeOrder.value) return ''
  const o = activeOrder.value
  const code = o.display_id ?? o.order_number ?? o.code ?? o.id
  const strCode = String(code).replace('#', '').trim()

  return strCode.length > 10 ? strCode.slice(0, 5).toUpperCase() : strCode
})

// Normaliza o status vindo do Admin
const normalizedStatus = computed(() => {
  if (!activeOrder.value?.status) return 'pending'

  const status = activeOrder.value.status
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  if (['pending', 'pago', 'recebido', 'pendente'].includes(status)) return 'pending'
  if (['in_production', 'preparando', 'em_preparo', 'em preparo', 'preparo'].includes(status)) return 'in_production'
  if (['delivering', 'saiu', 'em_transito', 'pronto', 'saiu para entrega', 'saiu p/ entrega'].includes(status)) return 'delivering'
  if (['completed', 'concluido', 'entregue', 'finalizado'].includes(status)) return 'completed'
  if (['canceled', 'cancelado', 'cancelada'].includes(status)) return 'canceled'

  return 'pending'
})

// Mapeamento dos 4 passos da barra de progresso
const currentStepIndex = computed(() => {
  switch (normalizedStatus.value) {
    case 'pending': return 1
    case 'in_production': return 2
    case 'delivering': return 3
    case 'completed': return 4
    case 'canceled': return 0
    default: return 1
  }
})

// Mensagens dinâmicas por etapa
const statusInfo = computed(() => {
  switch (normalizedStatus.value) {
    case 'pending':
      return {
        label: '⏳ Recebido',
        icon: '01',
        description: 'Seu pedido foi recebido e está aguardando confirmação da loja.'
      }
    case 'in_production':
      return {
        label: '👨‍🍳 Em Preparo',
        icon: '02',
        description: 'A cozinha já começou a preparar tudo com carinho para você.'
      }
    case 'delivering':
      return {
        label: '🛵 Saiu p/ Entrega',
        icon: '03',
        description: 'Seu pedido saiu do estabelecimento e já está a caminho!'
      }
    case 'completed':
      return {
        label: '✅ Entregue',
        icon: '✓',
        description: 'Tudo certo. Seu pedido foi entregue. Bom apetite!'
      }
    case 'canceled':
      return {
        label: '❌ Cancelado',
        icon: '!',
        description: 'Este pedido foi cancelado pela loja.'
      }
    default:
      return {
        label: 'Aguarde...',
        icon: '•',
        description: 'Processando atualização do seu pedido.'
      }
  }
})

const loadActiveOrder = async () => {
  const savedOrderId = localStorage.getItem('active_order_id')
  if (!savedOrderId) return

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', savedOrderId)
    .single()

  if (error || !data) {
    localStorage.removeItem('active_order_id')
    activeOrder.value = null
    return
  }

  // SE O PEDIDO JÁ ESTIVER ENTREGUE OU CANCELADO: LIMPA E NÃO EXIBE O POPUP
  if (isFinishedStatus(data.status)) {
    localStorage.removeItem('active_order_id')
    activeOrder.value = null
    return
  }

  activeOrder.value = data
  subscribeToRealtime(savedOrderId)
}

const subscribeToRealtime = (orderId: string) => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)

  realtimeChannel = supabase
    .channel(`order_status_${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        if (payload.new) {
          activeOrder.value = payload.new as OrderStatus
          isMinimized.value = false

          // Quando mudar para concluído/cancelado via Realtime:
          // Limpa do localStorage e esconde automaticamente após 15 segundos
          if (isFinishedStatus(payload.new.status)) {
            localStorage.removeItem('active_order_id')
            setTimeout(() => {
              if (activeOrder.value?.id === orderId) {
                activeOrder.value = null
              }
            }, 15000)
          }
        }
      }
    )
    .subscribe()
}

const handleClearOrder = () => {
  localStorage.removeItem('active_order_id')
  activeOrder.value = null
}

onMounted(() => {
  loadActiveOrder()
  window.addEventListener('order-created', loadActiveOrder)
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  window.removeEventListener('order-created', loadActiveOrder)
})
</script>

<style scoped>
.floating-container { position:fixed; right:22px; bottom:22px; z-index:9999; }

/* CARD EXPANDIDO */
.floating-status-widget { width:350px; background:rgba(255,253,249,.98); color:#1c1b18; border:1px solid #e7e1d7; border-radius:22px; box-shadow:0 22px 60px rgba(0,0,0,.18); overflow:hidden; backdrop-filter:blur(14px); }
.widget-header { display:flex; justify-content:space-between; align-items:flex-start; padding:18px 18px 14px; border-bottom:1px solid #eee8df; }
.widget-header > div { display:flex; flex-direction:column; gap:4px; }
.overline { color:#9c9489; font-size:9px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
.widget-header strong { font-size:16px; letter-spacing:-.02em; }
.btn-minimize { border:1px solid #e5dfd6; background:#fff; width:34px; height:34px; border-radius:10px; cursor:pointer; font-size:20px; color:#625d56; display:flex; align-items:center; justify-content:center; transition:.2s ease; }
.btn-minimize:hover { background:#f5f0e8; }

/* HERO DO STATUS */
.status-hero { display:flex; gap:12px; padding:19px 18px; background:#faf7f2; }
.status-hero.in_production { background:#f4f0e8; }
.status-hero.delivering { background:#f3f1ec; }
.status-hero.completed { background:#f0f5ef; }
.status-hero.canceled { background:#f8eeee; }

.status-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:13px; background:#1f1e1b; color:#fff; font-size:13px; font-weight:900; letter-spacing:.04em; }
.status-hero.completed .status-icon { background:#3d7048; }
.status-hero.canceled .status-icon { background:#a04949; }

.status-info-text { display:flex; flex-direction:column; min-width:0; }
.status-label { font-size:14px; font-weight:900; }
.status-hero p { margin:4px 0 0; color:#777068; font-size:11px; line-height:1.45; }

.prep-time { display:flex; justify-content:space-between; align-items:center; margin:0 18px; padding:12px 0; border-bottom:1px solid #eee8df; color:#857d73; font-size:11px; }
.prep-time strong { color:#1b1a18; font-size:13px; }

/* BARRA DE PROGRESSO */
.progress-track { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; padding:17px 18px 10px; }
.step { height:5px; border-radius:99px; background:#e7e1d8; transition:background .3s ease; }
.step.done { background:#1e1d1a; }
.progress-track.completed .step.done { background:#3d7048; }

.step.active {
  background:#1e1d1a;
  animation: pulse-step 1.2s infinite ease-in-out;
}
.progress-track.completed .step.active {
  background:#3d7048;
  animation: none;
}

.step.pending { background:#e7e1d8; }

@keyframes pulse-step {
  0%, 100% { opacity: 1; transform: scaleY(1); }
  50% { opacity: 0.3; transform: scaleY(0.85); }
}

.widget-footer { padding:12px 18px 18px; }
.btn-new-order { width:100%; border:1px solid #ded7ce; background:#fff; color:#282622; padding:11px 12px; border-radius:11px; cursor:pointer; font-size:11px; font-weight:800; transition:.2s ease; }
.btn-new-order:hover { background:#f7f3ed; }

/* PILL MINIMIZADA */
.minimized-pill { display:flex; align-items:center; gap:10px; border:1px solid #e7e1d7; background:rgba(255,253,249,.98); color:#23211e; padding:10px 16px; border-radius:999px; box-shadow:0 15px 40px rgba(0,0,0,.15); cursor:pointer; font-size:12px; backdrop-filter:blur(10px); transition:.2s ease; }
.minimized-pill:hover { transform:translateY(-2px); box-shadow:0 18px 45px rgba(0,0,0,.2); }
.minimized-pill strong { margin-left:2px; }
.mini-status-badge { background:#f0eae1; font-weight:800; padding:3px 9px; border-radius:12px; font-size:10px; color:#443f38; }

.live-dot { width:8px; height:8px; border-radius:50%; background:#5a9362; box-shadow:0 0 0 4px rgba(90,147,98,.16); animation: pulse-dot 1.5s infinite; }
.live-dot.canceled { background:#c04e4e; box-shadow:0 0 0 4px rgba(192,78,78,.16); animation: none; }

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.6; }
}

@media (max-width:640px) {
  .floating-container { left:14px; right:14px; bottom:14px; }
  .floating-status-widget { width:100%; }
  .minimized-pill { width:100%; justify-content:space-between; }
}
</style>
