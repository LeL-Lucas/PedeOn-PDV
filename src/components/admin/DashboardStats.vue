<template>
  <div class="metrics-dashboard">
    <!-- Header e Filtros de Período -->
    <div class="metrics-header">
      <div>
        <h2>📊 Painel de Métricas e Desempenho</h2>
        <p class="subtitle">Acompanhe faturamento, ticket médio e volume de vendas em tempo real.</p>
      </div>

      <div class="period-filters">
        <button
          v-for="period in periods"
          :key="period.key"
          :class="['filter-btn', { active: selectedPeriod === period.key }]"
          @click="selectedPeriod = period.key"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Cards de KPIs Principais -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-content">
          <span class="kpi-label">Faturamento Total</span>
          <h3 class="kpi-value">{{ formatCurrency(metrics.totalRevenue) }}</h3>
          <span class="kpi-subtext">Considera apenas pedidos concluídos/pagos</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🛍️</div>
        <div class="kpi-content">
          <span class="kpi-label">Total de Pedidos</span>
          <h3 class="kpi-value">{{ metrics.totalOrders }}</h3>
          <span class="kpi-subtext">{{ metrics.completedOrders }} concluídos ({{ metrics.completionRate }}%)</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">📈</div>
        <div class="kpi-content">
          <span class="kpi-label">Ticket Médio</span>
          <h3 class="kpi-value">{{ formatCurrency(metrics.averageTicket) }}</h3>
          <span class="kpi-subtext">Média por pedido concluído</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🚫</div>
        <div class="kpi-content">
          <span class="kpi-label">Cancelamentos</span>
          <h3 class="kpi-value">{{ metrics.canceledOrders }}</h3>
          <span class="kpi-subtext">{{ metrics.cancellationRate }}% do total de pedidos</span>
        </div>
      </div>
    </div>

    <!-- Seção de Gráficos e Distribuição -->
    <div class="charts-grid">
      <!-- Gráfico de Vendas por Período -->
      <div class="chart-card">
        <div class="card-header">
          <h3>Evolução das Vendas (Faturamento Diário)</h3>
        </div>
        <div v-if="chartData.length === 0" class="empty-chart">
          Nenhum dado de vendas concluídas registrado no período selecionado.
        </div>
        <div v-else class="bar-chart-container">
          <div class="bar-chart">
            <div
              v-for="(item, index) in chartData"
              :key="index"
              class="bar-group"
            >
              <div class="bar-wrapper">
                <div
                  class="bar-fill"
                  :style="{ height: `${(item.total / maxChartValue) * 100}%` }"
                >
                  <span class="bar-tooltip">{{ formatCurrency(item.total) }} ({{ item.count }} pds)</span>
                </div>
              </div>
              <span class="bar-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribuição por Status -->
      <div class="chart-card">
        <div class="card-header">
          <h3>Status dos Pedidos</h3>
        </div>
        <div class="status-list">
          <div v-for="st in statusBreakdown" :key="st.key" class="status-item">
            <div class="status-info">
              <span class="status-name">{{ st.label }}</span>
              <span class="status-count">{{ st.count }} ({{ st.percentage }}%)</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${st.percentage}%`, backgroundColor: st.color }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Origem e Formas de Pagamento -->
    <div class="secondary-grid">
      <!-- Formas de Pagamento -->
      <div class="chart-card">
        <div class="card-header">
          <h3>Formas de Pagamento</h3>
        </div>
        <div v-if="paymentBreakdown.length === 0" class="empty-state">
          Sem dados de pagamento no período.
        </div>
        <div v-else class="payment-list">
          <div v-for="pay in paymentBreakdown" :key="pay.method" class="payment-item">
            <div class="pay-details">
              <span class="pay-name">{{ pay.method }}</span>
              <span class="pay-amount">{{ formatCurrency(pay.total) }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill pay-fill" :style="{ width: `${pay.percentage}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tipo de Atendimento -->
      <div class="chart-card">
        <div class="card-header">
          <h3>Origem dos Pedidos</h3>
        </div>
        <div class="origin-list">
          <div v-for="orig in originBreakdown" :key="orig.type" class="origin-item">
            <div class="origin-icon">{{ orig.icon }}</div>
            <div class="origin-info">
              <span class="origin-title">{{ orig.label }}</span>
              <span class="origin-sub">{{ orig.count }} pedidos ({{ orig.percentage }}%)</span>
            </div>
            <span class="origin-total">{{ formatCurrency(orig.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface OrderItem {
  id?: string
  product_name?: string
  quantity?: number
  price?: number
  valor?: number
  qtd?: number
}

export interface Order {
  id: string
  created_at: string
  total?: number
  total_amount?: number
  status: string
  payment_method?: string
  table_id?: number | string | null
  delivery_type?: string
  address?: string
  items?: OrderItem[]
  order_items?: OrderItem[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    orders?: Order[]
  }>(),
  {
    orders: () => []
  }
)

type PeriodKey = 'today' | '7days' | '30days' | 'month' | 'all'
const selectedPeriod = ref<PeriodKey>('30days')

const periods: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7days', label: 'Últimos 7 dias' },
  { key: '30days', label: 'Últimos 30 dias' },
  { key: 'month', label: 'Mês Atual' },
  { key: 'all', label: 'Todo Período' }
]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0)
}

// Leitura unificada e segura do Total do Pedido
const getOrderTotal = (o: Order): number => {
  const direct = Number(o.total || o.total_amount || 0)
  if (direct > 0) return direct

  const rawItems = o.items || o.order_items
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.reduce((sum, item) => {
      const qty = Number(item.quantity || item.qtd || 1)
      const price = Number(item.price || item.valor || 0)
      return sum + (price * qty)
    }, 0)
  }
  return 0
}

// Filtra os pedidos com base na data selecionada
const filteredOrders = computed(() => {
  if (!props.orders || !Array.isArray(props.orders)) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  return props.orders.filter((order) => {
    if (!order.created_at) return true
    const orderTime = new Date(order.created_at).getTime()
    if (isNaN(orderTime)) return true

    switch (selectedPeriod.value) {
      case 'today':
        return orderTime >= todayStart
      case '7days': {
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
        return orderTime >= sevenDaysAgo
      }
      case '30days': {
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000
        return orderTime >= thirtyDaysAgo
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        return orderTime >= monthStart
      }
      case 'all':
      default:
        return true
    }
  })
})

// Métricas KPI
const metrics = computed(() => {
  const list = filteredOrders.value
  const totalOrders = list.length

  const completedList = list.filter((o) =>
    ['concluido', 'delivered', 'entregue', 'pago'].includes((o.status || '').toLowerCase())
  )
  const canceledList = list.filter((o) =>
    ['cancelado', 'canceled'].includes((o.status || '').toLowerCase())
  )

  const totalRevenue = completedList.reduce((acc, o) => acc + getOrderTotal(o), 0)
  const completedOrders = completedList.length
  const canceledOrders = canceledList.length

  const averageTicket = completedOrders > 0 ? totalRevenue / completedOrders : 0
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
  const cancellationRate = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0

  return {
    totalRevenue,
    totalOrders,
    completedOrders,
    canceledOrders,
    averageTicket,
    completionRate,
    cancellationRate
  }
})

// Gráfico em Barras
const chartData = computed(() => {
  const mapByDate = new Map<string, { total: number; count: number }>()

  filteredOrders.value.forEach((order) => {
    const isCompleted = ['concluido', 'delivered', 'entregue', 'pago'].includes((order.status || '').toLowerCase())
    if (!isCompleted || !order.created_at) return

    const dateObj = new Date(order.created_at)
    if (isNaN(dateObj.getTime())) return

    const dateKey = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`

    const current = mapByDate.get(dateKey) || { total: 0, count: 0 }
    mapByDate.set(dateKey, {
      total: current.total + getOrderTotal(order),
      count: current.count + 1
    })
  })

  return Array.from(mapByDate.entries()).map(([label, data]) => ({
    label,
    total: data.total,
    count: data.count
  })).slice(-14)
})

const maxChartValue = computed(() => {
  const max = Math.max(...chartData.value.map((d) => d.total), 0)
  return max === 0 ? 1 : max
})

// Distribuição de Status
const statusBreakdown = computed(() => {
  const total = filteredOrders.value.length || 1
  const counts = {
    concluido: { label: 'Concluído / Entregue', count: 0, color: '#22c55e' },
    preparing: { label: 'Em Produção', count: 0, color: '#3b82f6' },
    open: { label: 'Pendente / Aberto', count: 0, color: '#eab308' },
    cancelado: { label: 'Cancelado', count: 0, color: '#ef4444' }
  }

  filteredOrders.value.forEach((o) => {
    const st = (o.status || '').toLowerCase()
    if (['concluido', 'delivered', 'entregue', 'pago'].includes(st)) {
      counts.concluido.count++
    } else if (['preparo', 'preparing', 'em_preparo', 'pronto', 'saiu', 'em_producao'].includes(st)) {
      counts.preparing.count++
    } else if (['cancelado', 'canceled'].includes(st)) {
      counts.cancelado.count++
    } else {
      counts.open.count++
    }
  })

  return Object.entries(counts).map(([key, val]) => ({
    key,
    label: val.label,
    count: val.count,
    color: val.color,
    percentage: Math.round((val.count / total) * 100)
  }))
})

// Formas de Pagamento
const paymentBreakdown = computed(() => {
  const map = new Map<string, number>()
  let totalRev = 0

  filteredOrders.value.forEach((o) => {
    const isCompleted = ['concluido', 'delivered', 'entregue', 'pago'].includes((o.status || '').toLowerCase())
    if (!isCompleted) return

    const method = o.payment_method || 'Não Especificado'
    const amt = getOrderTotal(o)
    map.set(method, (map.get(method) || 0) + amt)
    totalRev += amt
  })

  const safeRev = totalRev || 1
  return Array.from(map.entries())
    .map(([method, total]) => ({
      method,
      total,
      percentage: Math.round((total / safeRev) * 100)
    }))
    .sort((a, b) => b.total - a.total)
})

// Origem do Pedido
const originBreakdown = computed(() => {
  const totalCount = filteredOrders.value.length || 1
  let mesaCount = 0, mesaTotal = 0
  let deliveryCount = 0, deliveryTotal = 0
  let balcaoCount = 0, balcaoTotal = 0

  filteredOrders.value.forEach((o) => {
    const isCompleted = ['concluido', 'delivered', 'entregue', 'pago'].includes((o.status || '').toLowerCase())
    const val = isCompleted ? getOrderTotal(o) : 0

    if (o.table_id) {
      mesaCount++
      mesaTotal += val
    } else if (o.delivery_type === 'delivery' || o.address) {
      deliveryCount++
      deliveryTotal += val
    } else {
      balcaoCount++
      balcaoTotal += val
    }
  })

  return [
    {
      type: 'table',
      label: 'Salão / Mesas',
      icon: '🍽️',
      count: mesaCount,
      total: mesaTotal,
      percentage: Math.round((mesaCount / totalCount) * 100)
    },
    {
      type: 'delivery',
      label: 'Delivery / Entrega',
      icon: '🛵',
      count: deliveryCount,
      total: deliveryTotal,
      percentage: Math.round((deliveryCount / totalCount) * 100)
    },
    {
      type: 'counter',
      label: 'Balcão / Retirada',
      icon: '🛍️',
      count: balcaoCount,
      total: balcaoTotal,
      percentage: Math.round((balcaoCount / totalCount) * 100)
    }
  ]
})
</script>

<style scoped>
.metrics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.metrics-header h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.period-filters {
  display: flex;
  gap: 0.4rem;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.filter-btn {
  background: transparent;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.kpi-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.kpi-icon {
  font-size: 1.75rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.kpi-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.2rem 0;
}

.kpi-subtext {
  font-size: 0.725rem;
  color: #94a3b8;
}

.charts-grid,
.secondary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;
}

.chart-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.card-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
}

.bar-chart-container {
  height: 180px;
  display: flex;
  align-items: flex-end;
  padding-top: 1rem;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  gap: 0.5rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.bar-wrapper {
  width: 100%;
  max-width: 28px;
  height: 80%;
  display: flex;
  align-items: flex-end;
  background: #f1f5f9;
  border-radius: 6px;
  position: relative;
}

.bar-fill {
  width: 100%;
  background: #2563eb;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
  position: relative;
}

.bar-wrapper:hover .bar-tooltip {
  opacity: 1;
  visibility: visible;
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: white;
  font-size: 0.7rem;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  z-index: 10;
  pointer-events: none;
}

.bar-label {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 6px;
}

.status-list,
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.status-info,
.pay-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.825rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-name,
.pay-name {
  color: #334155;
}

.status-count,
.pay-amount {
  color: #0f172a;
}

.progress-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.pay-fill {
  background: #0284c7;
}

.origin-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.origin-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.origin-icon {
  font-size: 1.25rem;
}

.origin-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.origin-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.origin-sub {
  font-size: 0.725rem;
  color: #64748b;
}

.origin-total {
  font-size: 0.85rem;
  font-weight: 700;
  color: #16a34a;
}

.empty-chart,
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
