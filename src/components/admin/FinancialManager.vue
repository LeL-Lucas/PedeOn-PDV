<template>
  <div class="financial-container">
    <!-- Header Principal -->
    <div class="main-header">
      <div>
        <h2>Gestão Financeira & Inteligência de Negócio</h2>
        <p class="subtitle">Acompanhe métricas, DRE, caixa e precificação técnica em um só lugar.</p>
      </div>

      <div class="header-controls">
        <select v-model="selectedPeriod" @change="loadAllData" class="select-period">
          <option value="today">📅 Hoje</option>
          <option value="week">📅 Últimos 7 dias</option>
          <option value="month">📅 Este Mês</option>
          <option value="all">♾️ Todo o Histórico</option>
        </select>

        <button class="btn-refresh" @click="loadAllData" :disabled="loading">
          {{ loading ? '...' : '🔄 Atualizar' }}
        </button>
      </div>
    </div>

    <!-- Navegação por Submenus / Abas -->
    <div class="tabs-header">
      <button
        :class="['tab-btn', activeTab === 'analytics' ? 'active' : '']"
        @click="activeTab = 'analytics'"
      >
        📊 Visão Geral & Gráficos
      </button>
      <button
        :class="['tab-btn', activeTab === 'dre' ? 'active' : '']"
        @click="activeTab = 'dre'"
      >
        📈 DRE & Caixa Real
      </button>
      <button
        :class="['tab-btn', activeTab === 'calculator' ? 'active' : '']"
        @click="activeTab = 'calculator'"
      >
        🧮 Calculadora de Preço
      </button>
    </div>

    <!-- SUBMENU 1: VISÃO GERAL & GRÁFICOS -->
    <div v-if="activeTab === 'analytics'" class="tab-content">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Faturamento Total</span>
            <h3 class="kpi-value">R$ {{ formatCurrency(totalRevenue) }}</h3>
            <span class="kpi-subtext">{{ orderMetrics.completedCount }} pedidos confirmados</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🛍️</div>
          <div class="kpi-content">
            <span class="kpi-label">Total de Pedidos</span>
            <h3 class="kpi-value">{{ totalOrdersCount }}</h3>
            <span class="kpi-subtext">{{ orderMetrics.completedCount }} concluídos ({{ orderMetrics.completionRate }}%)</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-content">
            <span class="kpi-label">Ticket Médio</span>
            <h3 class="kpi-value">R$ {{ formatCurrency(orderMetrics.averageTicket) }}</h3>
            <span class="kpi-subtext">Média por pedido concluído</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🚫</div>
          <div class="kpi-content">
            <span class="kpi-label">Cancelamentos</span>
            <h3 class="kpi-value">{{ orderMetrics.canceledCount }}</h3>
            <span class="kpi-subtext">{{ orderMetrics.cancellationRate }}% taxa de cancelamento</span>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="panel-box">
          <div class="panel-header-item">
            <h3>Evolução das Vendas (Faturamento Diário)</h3>
          </div>
          <div v-if="dailyChartData.length === 0" class="empty-chart">
            Nenhum dado de vendas registrado no período selecionado.
          </div>
          <div v-else class="bar-chart-container">
            <div class="bar-chart">
              <div
                v-for="(item, index) in dailyChartData"
                :key="index"
                class="bar-group"
              >
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{ height: `${(item.total / maxChartValue) * 100}%` }"
                  >
                    <span class="bar-tooltip">R$ {{ formatCurrency(item.total) }} ({{ item.count }} pds)</span>
                  </div>
                </div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-box">
          <div class="panel-header-item">
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

      <div class="secondary-grid">
        <div class="panel-box">
          <div class="panel-header-item">
            <h3>Origem dos Pedidos</h3>
          </div>
          <div class="origin-list">
            <div v-for="orig in originBreakdown" :key="orig.type" class="origin-item">
              <div class="origin-icon">{{ orig.icon }}</div>
              <div class="origin-info">
                <span class="origin-title">{{ orig.label }}</span>
                <span class="origin-sub">{{ orig.count }} pedidos ({{ orig.percentage }}%)</span>
              </div>
              <span class="origin-total">R$ {{ formatCurrency(orig.total) }}</span>
            </div>
          </div>
        </div>

        <div class="panel-box">
          <div class="panel-header-item">
            <h3>Formas de Pagamento</h3>
          </div>
          <div v-if="paymentSummary.length === 0" class="empty-state">
            Sem dados de pagamento no período.
          </div>
          <div v-else class="payment-list">
            <div v-for="pay in paymentSummary" :key="pay.key" class="payment-item">
              <div class="pay-details">
                <span class="pay-name">{{ pay.label }}</span>
                <span class="pay-amount">R$ {{ formatCurrency(pay.total) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill pay-fill" :style="{ width: `${pay.percentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SUBMENU 2: DRE & CAIXA REAL -->
    <div v-if="activeTab === 'dre'" class="tab-content">
      <div class="cards-grid">
        <div class="card-stat">
          <span class="card-label">Receita Bruta (Vendas)</span>
          <span class="card-value text-green">R$ {{ formatCurrency(totalRevenue) }}</span>
          <span class="card-sub">{{ orderMetrics.completedCount }} pedidos confirmados</span>
        </div>

        <div class="card-stat">
          <span class="card-label">Insumos & Compras (CMV)</span>
          <span class="card-value text-red">R$ {{ formatCurrency(activeCmvValue) }}</span>
          <span class="card-sub">{{ cmvMode === 'real' ? 'Via Saídas Lançadas' : `Estimado (${costsForm.cmvPercent}%)` }}</span>
        </div>

        <div class="card-stat">
          <span class="card-label">Margem de Contribuição</span>
          <span class="card-value text-blue">R$ {{ formatCurrency(contributionMarginVal) }}</span>
          <span class="card-sub">{{ contributionMarginPercent.toFixed(1) }}% de margem</span>
        </div>

        <div class="card-stat">
          <span class="card-label">Resultado Líquido do Período</span>
          <span :class="['card-value', netProfit >= 0 ? 'text-green' : 'text-red']">
            R$ {{ formatCurrency(netProfit) }}
          </span>
          <span class="card-sub">Lucro final real proporcional</span>
        </div>
      </div>

      <!-- Lançamento Rápido de Saídas -->
      <div class="panel-box expense-launcher">
        <div class="panel-header-item">
          <h3>🛒 Lançar Compra ou Despesa (Saída de Caixa)</h3>
          <span class="badge-info">Registro Rápido</span>
        </div>
        <p class="panel-desc">Ex: Compra de R$ 1.500 no mercado, embalagens ou pagamento de conta local.</p>

        <form @submit.prevent="addExpense" class="expense-form">
          <div class="input-field flex-2">
            <label>Descrição do Gasto</label>
            <input type="text" v-model="newExpense.description" placeholder="Ex: Mercado, Carne, Hortifruti..." required />
          </div>

          <div class="input-field flex-1">
            <label>Valor (R$)</label>
            <input type="number" step="0.01" v-model.number="newExpense.amount" placeholder="1500.00" min="0.01" required />
          </div>

          <div class="input-field flex-1">
            <label>Categoria</label>
            <select v-model="newExpense.category">
              <option value="insumo">Insumo / Mercado (CMV)</option>
              <option value="fixo">Custo Fixo / Conta</option>
            </select>
          </div>

          <button type="submit" class="btn-add-expense">+ Lançar Saída</button>
        </form>

        <div v-if="filteredExpensesList.length > 0" class="expense-history">
          <h4>Saídas Registradas no Período Selecionado:</h4>
          <div class="expense-tags">
            <span v-for="exp in filteredExpensesList" :key="exp.id" class="expense-tag">
              <strong>{{ exp.description }}</strong>: R$ {{ formatCurrency(exp.amount) }}
              <small>({{ exp.category === 'insumo' ? 'Insumo' : 'Custo Fixo' }})</small>
              <button @click="removeExpense(exp.id)" class="btn-remove">×</button>
            </span>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="panel-box">
          <div class="panel-header-item">
            <h3>💳 Vendas por Forma de Pagamento</h3>
          </div>
          <p class="panel-desc">Soma exata das entradas confirmadas no período.</p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Método</th>
                <th>Qtd.</th>
                <th>Total Bruto</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="method in paymentSummary" :key="method.key">
                <td>
                  <span :class="['badge-payment', method.key]">{{ method.label }}</span>
                </td>
                <td>{{ method.count }}x</td>
                <td><strong>R$ {{ formatCurrency(method.total) }}</strong></td>
                <td>{{ method.percentage.toFixed(1) }}%</td>
              </tr>
              <tr v-if="paymentSummary.length === 0">
                <td colspan="4" class="empty-cell">Nenhuma venda no período selecionado.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel-box">
          <div class="panel-header-item">
            <h3>⚙️ Alíquotas e Custos Fixos</h3>
          </div>
          <p class="panel-desc">Defina os parâmetros operacionais para alimentar o DRE e a Calculadora.</p>

          <div class="cmv-mode-toggle">
            <label>Cálculo de Insumos (CMV):</label>
            <div class="toggle-buttons">
              <button :class="{ active: cmvMode === 'real' }" @click="cmvMode = 'real'">
                Saídas Lançadas (R$ {{ formatCurrency(realInsumosTotal) }})
              </button>
              <button :class="{ active: cmvMode === 'percent' }" @click="cmvMode = 'percent'">
                Estimado ({{ costsForm.cmvPercent }}%)
              </button>
            </div>
          </div>

          <form @submit.prevent class="costs-form">
            <div v-if="cmvMode === 'percent'" class="form-group-inline">
              <label>CMV Estimado (% do Faturamento)</label>
              <div class="input-symbol">
                <input type="number" step="0.1" v-model.number="costsForm.cmvPercent" min="0" max="100" />
                <span>%</span>
              </div>
            </div>

            <div class="form-group-inline">
              <label>Taxa Cartão (Aplica só em Cartão)</label>
              <div class="input-symbol">
                <input type="number" step="0.1" v-model.number="costsForm.cardFeePercent" min="0" max="100" />
                <span>%</span>
              </div>
            </div>

            <div class="form-group-inline">
              <label>Imposto sobre Vendas (Simples/MEI)</label>
              <div class="input-symbol">
                <input type="number" step="0.1" v-model.number="costsForm.taxPercent" min="0" max="100" />
                <span>%</span>
              </div>
            </div>

            <hr class="divider" />
            <span class="form-section-title">Custos Fixos Mensais (Base 30 dias)</span>

            <div class="form-group-inline">
              <label>Aluguel / Condomínio</label>
              <div class="input-symbol">
                <span>R$</span>
                <input type="number" v-model.number="costsForm.rent" min="0" />
              </div>
            </div>

            <div class="form-group-inline">
              <label>Equipe & Pró-labore</label>
              <div class="input-symbol">
                <span>R$</span>
                <input type="number" v-model.number="costsForm.payroll" min="0" />
              </div>
            </div>

            <div class="form-group-inline">
              <label>Contas (Luz, Água, Net, Sistemas)</label>
              <div class="input-symbol">
                <span>R$</span>
                <input type="number" v-model.number="costsForm.utilities" min="0" />
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- DRE Estruturado -->
      <div class="panel-box dre-box">
        <h3>📊 Demonstrativo de Resultado (DRE) - {{ periodLabelText }}</h3>

        <div class="dre-table">
          <div class="dre-row highlight">
            <span>(=) RECEITA BRUTA DE VENDAS</span>
            <span>R$ {{ formatCurrency(totalRevenue) }}</span>
          </div>

          <div class="dre-row sub text-red">
            <span>(-) Impostos ({{ costsForm.taxPercent }}%)</span>
            <span>- R$ {{ formatCurrency(taxesTotal) }}</span>
          </div>

          <div class="dre-row sub text-red">
            <span>(-) Taxas de Cartão/Maquininha ({{ costsForm.cardFeePercent }}% sobre R$ {{ formatCurrency(cardRevenueTotal) }})</span>
            <span>- R$ {{ formatCurrency(cardFeesTotal) }}</span>
          </div>

          <div class="dre-row highlight">
            <span>(=) RECEITA LÍQUIDA</span>
            <span>R$ {{ formatCurrency(netRevenue) }}</span>
          </div>

          <div class="dre-row sub text-red">
            <span>(-) Custo de Insumos e Mercadorias (CMV {{ cmvMode === 'real' ? 'Real' : 'Estimado' }})</span>
            <span>- R$ {{ formatCurrency(activeCmvValue) }}</span>
          </div>

          <div class="dre-row highlight text-blue">
            <span>(=) MARGEM DE CONTRIBUIÇÃO</span>
            <span>R$ {{ formatCurrency(contributionMarginVal) }}</span>
          </div>

          <div class="dre-row sub text-red">
            <span>(-) Custos Fixos Operacionais (Proporcional ao Período)</span>
            <span>- R$ {{ formatCurrency(totalFixedCostsActive) }}</span>
          </div>

          <div :class="['dre-row', 'result-row', netProfit >= 0 ? 'bg-green' : 'bg-red']">
            <span>(=) LUCRO LÍQUIDO DO PERÍODO</span>
            <span>R$ {{ formatCurrency(netProfit) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SUBMENU 3: CALCULADORA DE PREÇO -->
    <div v-if="activeTab === 'calculator'" class="tab-content">
      <div class="metrics-banner">
        <div class="banner-item">
          <span class="banner-label">Rateio Custo Fixo Usado</span>
          <span class="banner-val">{{ effectiveFixedCostPercent.toFixed(1) }}%</span>
          <small>{{ productCalc.useCustomFixedRate ? 'Definido Manualmente' : 'Normalizado via DRE' }}</small>
        </div>
        <div class="banner-item">
          <span class="banner-label">Imposto + Taxa Médio</span>
          <span class="banner-val">{{ (costsForm.taxPercent + effectiveCardFeePercent).toFixed(1) }}%</span>
          <small>Desconto de cada venda</small>
        </div>
        <div class="banner-item">
          <span class="banner-label">Custo Operacional Total</span>
          <span class="banner-val text-red">{{ totalOverheadPercent.toFixed(1) }}%</span>
          <small>Total descontado antes do lucro</small>
        </div>
      </div>

      <div class="main-grid">
        <div class="panel-box">
          <h3>📦 Dados do Produto</h3>
          <p class="panel-desc">Informe os insumos, o preço de venda e os parâmetros de rateio.</p>

          <div class="calc-form">
            <div class="input-field">
              <label>Nome do Produto / Item</label>
              <input type="text" v-model="productCalc.name" placeholder="Ex: X-Burguer Especial, Marmita Fit..." />
            </div>

            <div class="input-field">
              <label>Custo Unitário de Insumos + Embalagem (R$)</label>
              <input type="number" step="0.01" v-model.number="productCalc.ingredientCost" placeholder="8.50" min="0" />
              <small class="field-hint">Soma do pão, carne, queijo, molho, caixa e sacola.</small>
            </div>

            <div class="input-field">
              <label>Preço Atual de Venda (R$) [Opcional]</label>
              <input type="number" step="0.01" v-model.number="productCalc.currentPrice" placeholder="25.00" min="0" />
              <small class="field-hint">Para simular a margem do preço praticado hoje.</small>
            </div>

            <div class="input-field">
              <label>Margem de Lucro Pretendida (%)</label>
              <div class="input-symbol">
                <input type="number" step="0.5" v-model.number="productCalc.targetMarginPercent" min="0" max="60" />
                <span>%</span>
              </div>
              <small class="field-hint">Lucro limpo desejado após pagar custos fixos e impostos.</small>
            </div>

            <hr class="divider" />

            <div class="input-field">
              <div class="toggle-mode-box">
                <label>Modo de Rateio de Custo Fixo</label>
                <div class="toggle-buttons">
                  <button
                    type="button"
                    :class="{ active: productCalc.useCustomFixedRate }"
                    @click="productCalc.useCustomFixedRate = true"
                  >
                    Manual (%)
                  </button>
                  <button
                    type="button"
                    :class="{ active: !productCalc.useCustomFixedRate }"
                    @click="productCalc.useCustomFixedRate = false"
                  >
                    DRE Real ({{ dreCalculatedFixedRate.toFixed(1) }}%)
                  </button>
                </div>
              </div>

              <div v-if="productCalc.useCustomFixedRate" class="input-symbol mt-2">
                <input type="number" step="0.5" v-model.number="productCalc.customFixedRate" min="0" max="50" />
                <span>%</span>
              </div>
              <small class="field-hint">
                {{ productCalc.useCustomFixedRate ? 'Percentual fixado manualmente pelo usuário.' : 'Normalizado automaticamente com base nas vendas e custos fixos registrados no DRE.' }}
              </small>
            </div>
          </div>
        </div>

        <div class="panel-box bg-slate">
          <h3>🎯 Diagnóstico de Preço e Margem</h3>
          <p class="panel-desc">Valores calculados em tempo real com os custos corrigidos da sua loja.</p>

          <div class="calc-results">
            <!-- 1. Preço Mínimo / Zero a Zero -->
            <div class="result-card warning">
              <div class="res-title">Preço de Custo Mínimo (Ponto de Equilíbrio)</div>
              <div v-if="totalOverheadPercent >= 100" class="res-price text-red">Inviável (>100% custos)</div>
              <div v-else class="res-price">R$ {{ formatCurrency(breakEvenPrice) }}</div>
              <p class="res-desc">
                Cobrando menos que isso você tem <strong>PREJUÍZO</strong>! Paga os insumos e a fatia do custo fixo.
              </p>
            </div>

            <!-- 2. Preço Sugerido -->
            <div class="result-card success">
              <div class="res-title">Preço Recomendado (Margem Pretendida: {{ productCalc.targetMarginPercent }}%)</div>
              <div v-if="suggestedTargetPrice === 0" class="res-price text-red">Inviável (Soma > 100%)</div>
              <div v-else class="res-price text-green">R$ {{ formatCurrency(suggestedTargetPrice) }}</div>

              <div v-if="suggestedTargetPrice > 0" class="res-breakdown">
                <span>Insumos: R$ {{ formatCurrency(productCalc.ingredientCost) }}</span>
                <span>Impostos/Taxas: R$ {{ formatCurrency(suggestedTargetPrice * ((costsForm.taxPercent + effectiveCardFeePercent)/100)) }}</span>
                <span>Custo Fixo: R$ {{ formatCurrency(suggestedTargetPrice * (effectiveFixedCostPercent/100)) }}</span>
                <span>Lucro Líquido: <strong>R$ {{ formatCurrency(suggestedTargetPrice * (productCalc.targetMarginPercent/100)) }}</strong></span>
              </div>
              <div v-else class="field-hint text-red">
                A soma das taxas ({{ totalOverheadPercent.toFixed(1) }}%) e da margem pretendida ({{ productCalc.targetMarginPercent }}%) atinge ou supera 100%. Reduza a margem ou os custos.
              </div>
            </div>

            <!-- 3. Análise do Preço Atual -->
            <div v-if="productCalc.currentPrice > 0" class="result-card current-analysis">
              <div class="res-title">Análise do Preço Atual (R$ {{ formatCurrency(productCalc.currentPrice) }})</div>

              <div class="analysis-grid">
                <div>
                  <span class="lbl">Lucro Líquido em R$:</span>
                  <span :class="['val', currentProfitAmount >= 0 ? 'text-green' : 'text-red']">
                    R$ {{ formatCurrency(currentProfitAmount) }} / un
                  </span>
                </div>

                <div>
                  <span class="lbl">Margem Real Atual:</span>
                  <span :class="['val', currentMarginPercent >= 0 ? 'text-green' : 'text-red']">
                    {{ currentMarginPercent.toFixed(1) }}%
                  </span>
                </div>
              </div>

              <div :class="['status-pill', currentProfitAmount >= 0 ? 'pill-green' : 'pill-red']">
                {{ currentProfitAmount >= 0 ? '✅ Este preço gera LUCRO para a loja.' : '⚠️ ALERTA: Você está perdendo dinheiro neste preço!' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

type PaymentKey = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'outros'

export interface OrderItem {
  id?: string
  product_name?: string
  quantity?: number
  price?: number
  valor?: number
  qtd?: number
}

export interface OrderRow {
  id: string
  created_at: string
  total?: number
  total_amount?: number
  status: string
  payment_method?: string | null
  table_id?: number | string | null
  delivery_type?: string
  address?: string
  items?: OrderItem[]
  order_items?: OrderItem[]
  [key: string]: unknown
}

interface ExpenseItem {
  id: string
  description: string
  amount: number
  category: 'insumo' | 'fixo'
  date: string
}

const props = defineProps<{ storeId?: string }>()

const activeTab = ref<'analytics' | 'dre' | 'calculator'>('analytics')
const loading = ref(false)
const rawOrders = ref<OrderRow[]>([])
const selectedPeriod = ref<'today' | 'week' | 'month' | 'all'>('month')
const cmvMode = ref<'real' | 'percent'>('real')

const expensesList = ref<ExpenseItem[]>([])
const newExpense = ref({
  description: '',
  amount: null as number | null,
  category: 'insumo' as 'insumo' | 'fixo'
})

const costsForm = ref({
  cmvPercent: 35.0,
  cardFeePercent: 2.5,
  taxPercent: 4.0,
  rent: 1200,
  payroll: 2500,
  utilities: 450
})

const productCalc = ref({
  name: 'X-Burguer Especial',
  ingredientCost: 8.50,
  currentPrice: 34.00,
  targetMarginPercent: 30.0,
  customFixedRate: 15.0,
  useCustomFixedRate: true
})

// Persistência com LocalStorage
onMounted(() => {
  const savedCosts = localStorage.getItem('fm_costs_form')
  if (savedCosts) {
    try { Object.assign(costsForm.value, JSON.parse(savedCosts)) } catch (e) { console.error(e) }
  }
  const savedExpenses = localStorage.getItem('fm_expenses_list')
  if (savedExpenses) {
    try { expensesList.value = JSON.parse(savedExpenses) } catch (e) { console.error(e) }
  }
})

watch(costsForm, (val) => localStorage.setItem('fm_costs_form', JSON.stringify(val)), { deep: true })
watch(expensesList, (val) => localStorage.setItem('fm_expenses_list', JSON.stringify(val)), { deep: true })

const formatCurrency = (val: number) => {
  return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getOrderTotal = (o: OrderRow): number => {
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

const getPeriodStartDate = (): string | null => {
  const now = new Date()
  if (selectedPeriod.value === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString()
  }
  if (selectedPeriod.value === 'week') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0)
    return d.toISOString()
  }
  if (selectedPeriod.value === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString()
  }
  return null
}

const periodLabelText = computed(() => {
  if (selectedPeriod.value === 'today') return 'Visão de Hoje'
  if (selectedPeriod.value === 'week') return 'Últimos 7 dias'
  if (selectedPeriod.value === 'month') return 'Este Mês'
  return 'Geral'
})

// Multiplicador temporal para proporcionalizar custos fixos
const periodDaysMultiplier = computed(() => {
  switch (selectedPeriod.value) {
    case 'today': return 1 / 30
    case 'week': return 7 / 30
    case 'month': return 1.0
    case 'all': default: return 1.0
  }
})

const loadAllData = async () => {
  if (!props.storeId) return
  loading.value = true

  try {
    const startDate = getPeriodStartDate()

    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', props.storeId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      rawOrders.value = []
    } else {
      rawOrders.value = (data as OrderRow[]) || []
    }
  } catch (e) {
    console.error('Erro inesperado ao carregar dados:', e)
  } finally {
    loading.value = false
  }
}

// Única fonte de gatilho para buscar dados do Supabase na montagem e mudança de storeId
watch(() => props.storeId, () => loadAllData(), { immediate: true })

// Gestão e Filtro de Despesas
const addExpense = () => {
  if (!newExpense.value.description || !newExpense.value.amount) return

  expensesList.value.push({
    id: Date.now().toString(),
    description: newExpense.value.description,
    amount: Number(newExpense.value.amount),
    category: newExpense.value.category,
    date: new Date().toISOString()
  })

  newExpense.value.description = ''
  newExpense.value.amount = null
}

const removeExpense = (id: string) => {
  expensesList.value = expensesList.value.filter(e => e.id !== id)
}

const filteredExpensesList = computed(() => {
  const startDateStr = getPeriodStartDate()
  if (!startDateStr) return expensesList.value

  const startTime = new Date(startDateStr).getTime()
  return expensesList.value.filter((exp) => {
    const expTime = new Date(exp.date).getTime()
    return expTime >= startTime
  })
})

const realInsumosTotal = computed(() => {
  return filteredExpensesList.value
    .filter((e) => e.category === 'insumo')
    .reduce((acc, e) => acc + e.amount, 0)
})

const realFixedTotal = computed(() => {
  return filteredExpensesList.value
    .filter((e) => e.category === 'fixo')
    .reduce((acc, e) => acc + e.amount, 0)
})

const completedOrdersList = computed(() => {
  return rawOrders.value.filter((o) =>
    ['concluido', 'delivered', 'entregue', 'pago'].includes((o.status || '').toLowerCase())
  )
})

const totalRevenue = computed(() => {
  return completedOrdersList.value.reduce((acc, o) => acc + getOrderTotal(o), 0)
})

const totalOrdersCount = computed(() => rawOrders.value.length)

const orderMetrics = computed(() => {
  const total = rawOrders.value.length
  const completedCount = completedOrdersList.value.length
  const canceledCount = rawOrders.value.filter((o) =>
    ['cancelado', 'canceled'].includes((o.status || '').toLowerCase())
  ).length

  const averageTicket = completedCount > 0 ? totalRevenue.value / completedCount : 0
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const cancellationRate = total > 0 ? Math.round((canceledCount / total) * 100) : 0

  return { completedCount, canceledCount, averageTicket, completionRate, cancellationRate }
})

// Agrupamento e ordenação cronológica das vendas diárias
const dailyChartData = computed(() => {
  const mapByDate = new Map<string, { dateObj: Date; total: number; count: number }>()

  completedOrdersList.value.forEach((order) => {
    if (!order.created_at) return
    const dateObj = new Date(order.created_at)
    if (isNaN(dateObj.getTime())) return

    const dateKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`
    const current = mapByDate.get(dateKey) || { dateObj: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()), total: 0, count: 0 }

    mapByDate.set(dateKey, {
      dateObj: current.dateObj,
      total: current.total + getOrderTotal(order),
      count: current.count + 1
    })
  })

  return Array.from(mapByDate.values())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(-14)
    .map((item) => ({
      label: `${item.dateObj.getDate().toString().padStart(2, '0')}/${(item.dateObj.getMonth() + 1).toString().padStart(2, '0')}`,
      total: item.total,
      count: item.count
    }))
})

const maxChartValue = computed(() => {
  const max = Math.max(...dailyChartData.value.map((d) => d.total), 0)
  return max === 0 ? 1 : max
})

const statusBreakdown = computed(() => {
  const total = rawOrders.value.length || 1
  const counts = {
    concluido: { label: 'Concluído / Entregue', count: 0, color: '#22c55e' },
    preparing: { label: 'Em Produção', count: 0, color: '#3b82f6' },
    open: { label: 'Pendente / Aberto', count: 0, color: '#eab308' },
    cancelado: { label: 'Cancelado', count: 0, color: '#ef4444' }
  }

  rawOrders.value.forEach((o) => {
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

const originBreakdown = computed(() => {
  const totalCount = rawOrders.value.length || 1
  let mesaCount = 0, mesaTotal = 0
  let deliveryCount = 0, deliveryTotal = 0
  let balcaoCount = 0, balcaoTotal = 0

  rawOrders.value.forEach((o) => {
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
    { type: 'table', label: 'Salão / Mesas', icon: '🍽️', count: mesaCount, total: mesaTotal, percentage: Math.round((mesaCount / totalCount) * 100) },
    { type: 'delivery', label: 'Delivery / Entrega', icon: '🛵', count: deliveryCount, total: deliveryTotal, percentage: Math.round((deliveryCount / totalCount) * 100) },
    { type: 'counter', label: 'Balcão / Retirada', icon: '🛍️', count: balcaoCount, total: balcaoTotal, percentage: Math.round((balcaoCount / totalCount) * 100) }
  ]
})

// DRE & MEIOS DE PAGAMENTO
const paymentSummary = computed(() => {
  const map: Record<PaymentKey, { label: string; count: number; total: number }> = {
    pix: { label: 'Pix', count: 0, total: 0 },
    dinheiro: { label: 'Dinheiro', count: 0, total: 0 },
    cartao_credito: { label: 'Cartão de Crédito', count: 0, total: 0 },
    cartao_debito: { label: 'Cartão de Débito', count: 0, total: 0 },
    outros: { label: 'Outros', count: 0, total: 0 }
  }

  completedOrdersList.value.forEach((order) => {
    const keyStr = (order.payment_method || '').toLowerCase().trim()
    let key: PaymentKey = 'outros'

    if (keyStr.includes('pix')) key = 'pix'
    else if (keyStr.includes('dinheiro') || keyStr.includes('especie')) key = 'dinheiro'
    else if (keyStr.includes('credito')) key = 'cartao_credito'
    else if (keyStr.includes('debito')) key = 'cartao_debito'

    const target = map[key]
    if (target) {
      target.total += getOrderTotal(order)
      target.count += 1
    }
  })

  const grandTotal = totalRevenue.value || 1
  const keys = Object.keys(map) as PaymentKey[]

  return keys
    .map((k) => ({
      key: k,
      label: map[k].label,
      count: map[k].count,
      total: map[k].total,
      percentage: (map[k].total / grandTotal) * 100
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.total - a.total)
})

// Vendas exclusivas de cartão
const cardRevenueTotal = computed(() => {
  return paymentSummary.value
    .filter(p => p.key === 'cartao_credito' || p.key === 'cartao_debito')
    .reduce((acc, p) => acc + p.total, 0)
})

const taxesTotal = computed(() => totalRevenue.value * (costsForm.value.taxPercent / 100))
const cardFeesTotal = computed(() => cardRevenueTotal.value * (costsForm.value.cardFeePercent / 100))
const netRevenue = computed(() => totalRevenue.value - taxesTotal.value - cardFeesTotal.value)

const activeCmvValue = computed(() => {
  if (cmvMode.value === 'real') {
    return realInsumosTotal.value
  }
  return totalRevenue.value * (costsForm.value.cmvPercent / 100)
})

const contributionMarginVal = computed(() => netRevenue.value - activeCmvValue.value)

const contributionMarginPercent = computed(() => {
  return totalRevenue.value > 0 ? (contributionMarginVal.value / totalRevenue.value) * 100 : 0
})

const baseMonthlyFixed = computed(() => {
  return (costsForm.value.rent || 0) + (costsForm.value.payroll || 0) + (costsForm.value.utilities || 0)
})

// Custos fixos proporcionalizados para o período ativo
const totalFixedCostsActive = computed(() => {
  const monthlyProrated = baseMonthlyFixed.value * periodDaysMultiplier.value
  return monthlyProrated + realFixedTotal.value
})

const netProfit = computed(() => contributionMarginVal.value - totalFixedCostsActive.value)

// CALCULADORA DE PRECIFICAÇÃO
const dreCalculatedFixedRate = computed(() => {
  if (totalRevenue.value > 0) {
    const rawRate = (totalFixedCostsActive.value / totalRevenue.value) * 100
    return Math.min(Math.max(rawRate, 0), 40.0)
  }
  return 15.0
})

const effectiveFixedCostPercent = computed(() => {
  if (productCalc.value.useCustomFixedRate) {
    return productCalc.value.customFixedRate || 0
  }
  return dreCalculatedFixedRate.value
})

// Taxa de cartão ponderada na receita total
const effectiveCardFeePercent = computed(() => {
  if (totalRevenue.value > 0) {
    return (cardFeesTotal.value / totalRevenue.value) * 100
  }
  return costsForm.value.cardFeePercent
})

const totalOverheadPercent = computed(() => {
  return costsForm.value.taxPercent + effectiveCardFeePercent.value + effectiveFixedCostPercent.value
})

const breakEvenPrice = computed(() => {
  const cost = productCalc.value.ingredientCost || 0
  const deductions = totalOverheadPercent.value
  if (deductions >= 100) return 0
  return cost / (1 - deductions / 100)
})

const suggestedTargetPrice = computed(() => {
  const cost = productCalc.value.ingredientCost || 0
  const targetMargin = productCalc.value.targetMarginPercent || 0
  const deductions = totalOverheadPercent.value + targetMargin

  if (deductions >= 100) return 0
  return cost / (1 - deductions / 100)
})

const currentProfitAmount = computed(() => {
  const price = productCalc.value.currentPrice || 0
  const cost = productCalc.value.ingredientCost || 0
  if (price === 0) return 0

  const taxAndCardDeduction = price * ((costsForm.value.taxPercent + effectiveCardFeePercent.value) / 100)
  const fixedCostShare = price * (effectiveFixedCostPercent.value / 100)

  return price - cost - taxAndCardDeduction - fixedCostShare
})

const currentMarginPercent = computed(() => {
  const price = productCalc.value.currentPrice || 0
  if (price === 0) return 0
  return (currentProfitAmount.value / price) * 100
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');

.financial-container {
  --ink: #111827;
  --muted: #667085;
  --line: #e9edf2;
  --surface: #ffffff;
  --soft: #f7f8fa;
  --positive: #087f5b;
  --negative: #c2413b;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  color: var(--ink);
  font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.financial-container *,
.financial-container *::before,
.financial-container *::after { box-sizing: border-box; }

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.25rem;
  padding: 1.4rem 1.5rem;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 14px 35px rgba(16, 24, 40, .05);
}

.main-header h2 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  font-weight: 800;
  letter-spacing: -.035em;
  color: #101828;
}

.subtitle { margin: .38rem 0 0; color: var(--muted); font-size: .88rem; }
.header-controls { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }

.select-period,
.btn-refresh {
  min-height: 42px;
  border-radius: 11px;
  border: 1px solid #dfe4ea;
  background: #fff;
  color: #344054;
  padding: .6rem .82rem;
  font: inherit;
  font-size: .83rem;
  font-weight: 700;
}

.select-period { cursor: pointer; }
.btn-refresh { cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
.btn-refresh:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(16,24,40,.08); }
.btn-refresh:disabled { opacity: .5; cursor: default; }

.tabs-header {
  display: flex;
  gap: .3rem;
  padding: .3rem;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #f7f8fa;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
}

.tab-btn {
  border: 0;
  background: transparent;
  color: #667085;
  padding: .72rem 1rem;
  border-radius: 11px;
  font: inherit;
  font-size: .84rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: .22s ease;
}
.tab-btn:hover { color: #1d2939; background: #eef1f4; }
.tab-btn.active { color: #fff; background: #17212b; box-shadow: 0 6px 16px rgba(23,33,43,.14); }

.tab-content { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }

.kpi-grid,
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .9rem;
}

.kpi-card,
.card-stat {
  position: relative;
  min-width: 0;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1.15rem;
  box-shadow: 0 10px 26px rgba(16,24,40,.035);
}

.kpi-card { display: flex; align-items: center; gap: .9rem; }
.kpi-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #f0fdfa;
  border: 1px solid #d7f5ef;
  font-size: 1.25rem;
}

.kpi-label,
.card-label {
  display: block;
  font-size: .69rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #98a2b3;
}

.kpi-value,
.card-value {
  display: block;
  margin: .25rem 0 .16rem;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -.045em;
  color: #111827;
}

.kpi-subtext,
.card-sub { color: #98a2b3; font-size: .73rem; }

.text-green { color: var(--positive) !important; }
.text-red { color: var(--negative) !important; }
.text-blue { color: #1565c0 !important; }

.charts-grid,
.secondary-grid,
.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, .95fr);
  gap: 1rem;
}

.panel-box {
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 0 10px 26px rgba(16,24,40,.028);
}
.panel-box.bg-slate { background: #f9fafb; }
.panel-header-item { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin-bottom: .85rem; }
.panel-header-item h3,
.panel-box > h3 {
  margin: 0;
  color: #182230;
  font-family: 'Manrope', sans-serif;
  font-size: .96rem;
  font-weight: 800;
}
.panel-desc { margin: .35rem 0 1rem; color: #667085; font-size: .8rem; }

.bar-chart-container { height: 205px; display: flex; align-items: flex-end; padding-top: 1.3rem; }
.bar-chart { width: 100%; height: 100%; display: flex; align-items: flex-end; gap: .55rem; }
.bar-group { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.bar-wrapper { position: relative; width: min(100%, 30px); height: 84%; display: flex; align-items: flex-end; background: #f2f4f7; border-radius: 9px; }
.bar-fill { width: 100%; background: linear-gradient(180deg, #2ab7a9 0%, #0f766e 100%); border-radius: 9px; transition: height .35s ease; position: relative; }
.bar-tooltip { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%); opacity: 0; visibility: hidden; white-space: nowrap; background: #17212b; color: #fff; border-radius: 8px; padding: .38rem .5rem; font-size: .66rem; transition: .18s ease; z-index: 4; }
.bar-wrapper:hover .bar-tooltip { opacity: 1; visibility: visible; }
.bar-label { margin-top: .5rem; color: #98a2b3; font-size: .66rem; }

.status-list,
.payment-list,
.origin-list { display: flex; flex-direction: column; gap: .82rem; }
.status-info,
.pay-details { display: flex; justify-content: space-between; gap: .75rem; margin-bottom: .38rem; font-size: .76rem; font-weight: 700; }
.progress-bar { height: 8px; background: #eef1f4; border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: inherit; transition: width .35s ease; }
.pay-fill { background: #159a90; }

.origin-item { display: flex; align-items: center; gap: .75rem; padding: .72rem; border: 1px solid #edf0f3; border-radius: 13px; background: #fbfcfd; }
.origin-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; background: #f2f5f7; font-size: 1.05rem; }
.origin-info { flex: 1; display: flex; flex-direction: column; gap: .1rem; }
.origin-title { color: #344054; font-size: .8rem; font-weight: 800; }
.origin-sub { color: #98a2b3; font-size: .7rem; }
.origin-total { color: #087f5b; font-size: .8rem; font-weight: 800; }

.expense-launcher { background: linear-gradient(180deg, #fbfdfd 0%, #f7faf9 100%); border-color: #dfeae7; }
.badge-info { padding: .32rem .55rem; border-radius: 999px; background: #e8f7f4; color: #0f766e; font-size: .68rem; font-weight: 800; }
.expense-form { display: grid; grid-template-columns: 2fr 1fr 1.2fr auto; gap: .75rem; align-items: end; margin-top: 1rem; }
.input-field { display: flex; flex-direction: column; gap: .32rem; margin-bottom: .45rem; }
.input-field label { color: #344054; font-size: .73rem; font-weight: 800; }
.input-field input,
.input-field select { width: 100%; min-height: 43px; padding: .65rem .72rem; border: 1px solid #dfe4ea; border-radius: 11px; background: #fff; font: inherit; font-size: .82rem; }
.btn-add-expense { min-height: 43px; padding: .65rem .9rem; border: 0; border-radius: 11px; background: #17212b; color: #fff; font: inherit; font-size: .78rem; font-weight: 800; cursor: pointer; }

.expense-history { margin-top: 1rem; padding-top: .9rem; border-top: 1px dashed #d9e1df; }
.expense-tags { display: flex; flex-wrap: wrap; gap: .45rem; }
.expense-tag { display: inline-flex; align-items: center; gap: .35rem; padding: .4rem .52rem; border: 1px solid #e3e9e7; border-radius: 10px; background: #fff; font-size: .7rem; }
.btn-remove { border: 0; background: transparent; color: #c2413b; font-size: .92rem; cursor: pointer; }

.data-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: .79rem; }
.data-table th { padding: .68rem .62rem; text-align: left; border-bottom: 1px solid #e8edf1; color: #98a2b3; font-size: .67rem; font-weight: 800; text-transform: uppercase; }
.data-table td { padding: .72rem .62rem; border-bottom: 1px solid #f0f2f4; color: #475467; }
.badge-payment { display: inline-flex; padding: .28rem .48rem; border-radius: 7px; background: #f2f4f7; font-size: .68rem; font-weight: 800; }
.badge-payment.pix { background: #e7f8f5; color: #0f766e; }
.badge-payment.dinheiro { background: #ecf8ef; color: #087f5b; }
.badge-payment.cartao_credito,
.badge-payment.cartao_debito { background: #edf2ff; color: #4759b8; }

.cmv-mode-toggle { padding: .72rem; margin-bottom: 1rem; border: 1px solid #e8edf1; border-radius: 13px; background: #f9fafb; }
.toggle-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; }
.toggle-buttons button { min-height: 38px; border: 1px solid #dfe4ea; border-radius: 99px; background: #fff; color: #667085; font: inherit; font-size: .69rem; font-weight: 800; cursor: pointer; }
.toggle-buttons button.active { background: #17212b; border-color: #17212b; color: #fff; }

.costs-form { display: flex; flex-direction: column; gap: .7rem; }
.form-group-inline { display: flex; justify-content: space-between; align-items: center; gap: .8rem; color: #475467; font-size: .76rem; }
.input-symbol { min-width: 92px; min-height: 39px; display: flex; align-items: center; justify-content: flex-end; gap: .25rem; padding: .2rem .45rem; background: #fff; border: 1px solid #dfe4ea; border-radius: 10px; }
.input-symbol input { width: 66px; border: 0; outline: 0; background: transparent; text-align: right; font: inherit; font-size: .77rem; font-weight: 800; }
.divider { width: 100%; height: 1px; margin: .25rem 0; border: 0; background: #edf0f2; }
.form-section-title { color: #344054; font-size: .72rem; font-weight: 800; }

.dre-box { background: #fcfdfd; }
.dre-table { display: flex; flex-direction: column; gap: .32rem; }
.dre-row { display: flex; justify-content: space-between; gap: 1rem; padding: .72rem .8rem; border-radius: 10px; color: #475467; font-size: .78rem; }
.dre-row.highlight { background: #f5f7f8; color: #1d2939; font-weight: 800; }
.dre-row.sub { padding-left: 1.3rem; font-size: .73rem; }
.dre-row.result-row { margin-top: .35rem; font-size: .88rem; font-weight: 800; }
.bg-green { background: #e9f8f0; color: #087f5b; }
.bg-red { background: #fdecea; color: #b42318; }

.metrics-banner { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-radius: 18px; background: #17212b; }
.banner-item { padding: 1.05rem 1.15rem; }
.banner-label { display: block; margin-bottom: .28rem; color: #98a2b3; font-size: .66rem; font-weight: 800; text-transform: uppercase; }
.banner-val { display: block; color: #fff; font-family: 'Manrope', sans-serif; font-size: 1.45rem; font-weight: 800; }
.banner-item small { color: #c5cbd3; font-size: .67rem; }

.toggle-mode-box label { display: block; margin-bottom: 0.4rem; font-size: 0.73rem; font-weight: 800; color: #344054; }
.mt-2 { margin-top: 0.5rem; }

.calc-form { display: flex; flex-direction: column; gap: .15rem; }
.calc-results { display: flex; flex-direction: column; gap: .75rem; }
.result-card { padding: 1rem; background: #fff; border: 1px solid #e8edf1; border-left: 3px solid #cbd5df; border-radius: 13px; }
.result-card.warning { border-color: #f2e6bd; border-left-color: #d49a15; background: #fffdf7; }
.result-card.success { border-color: #dbeee6; border-left-color: #159a90; background: #fbfefd; }
.result-card.current-analysis { border-color: #dce8f8; border-left-color: #3d7ecc; }
.res-title { color: #667085; font-size: .67rem; font-weight: 800; text-transform: uppercase; }
.res-price { margin: .28rem 0 .3rem; color: #101828; font-family: 'Manrope', sans-serif; font-size: 1.62rem; font-weight: 800; }
.res-desc { margin: 0; color: #667085; font-size: .75rem; }
.res-breakdown { display: flex; flex-wrap: wrap; gap: .42rem .72rem; margin-top: .62rem; padding-top: .62rem; border-top: 1px dashed #dfe4ea; color: #667085; font-size: .67rem; }
.analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: .85rem 0; }
.status-pill { padding: .55rem .65rem; border-radius: 9px; font-size: .71rem; font-weight: 800; text-align: center; }
.pill-green { background: #e9f8f0; color: #087f5b; }
.pill-red { background: #fdecea; color: #b42318; }

.empty-chart,
.empty-state,
.empty-cell { text-align: center; padding: 1.5rem; color: #98a2b3; font-size: .77rem; }

@media (max-width: 1100px) {
  .kpi-grid, .cards-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid, .secondary-grid, .main-grid { grid-template-columns: 1fr; }
  .expense-form { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 700px) {
  .kpi-grid, .cards-grid { grid-template-columns: 1fr; }
  .metrics-banner { grid-template-columns: 1fr; }
  .expense-form { grid-template-columns: 1fr; }
}
</style>
