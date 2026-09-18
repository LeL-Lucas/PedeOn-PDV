<template>
  <div class="table-manager">
    <header class="page-header">
      <div class="heading-block">
        <span class="eyebrow">SALÃO</span>
        <div class="title-row">
          <div class="title-mark">⌂</div>
          <div>
            <h2>Mesas e comandas</h2>
            <p>Tenha uma visão clara do salão e resolva cada mesa sem perder tempo.</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="action-btn action-btn--ghost" @click="loadTables">
          <span class="btn-icon">↻</span>
          Atualizar
        </button>
        <button class="action-btn action-btn--soft" @click="showBatchModal = true">
          <span class="btn-icon">✦</span>
          Gerar mesas
        </button>
        <button class="action-btn action-btn--primary" @click="showOpenModal = true">
          <span class="btn-icon">＋</span>
          Abrir mesa
        </button>
      </div>
    </header>

    <section class="summary-strip" aria-label="Resumo do salão">
      <button
        :class="['summary-card', { active: filterStatus === 'all' }]"
        @click="filterStatus = 'all'"
      >
        <span class="summary-dot summary-dot--all"></span>
        <span class="summary-copy">
          <strong>{{ tables.length }}</strong>
          <small>Todas</small>
        </span>
      </button>

      <button
        :class="['summary-card', 'summary-card--green', { active: filterStatus === 'free' }]"
        @click="filterStatus = 'free'"
      >
        <span class="summary-dot"></span>
        <span class="summary-copy">
          <strong>{{ countFree }}</strong>
          <small>Livres</small>
        </span>
      </button>

      <button
        :class="['summary-card', 'summary-card--red', { active: filterStatus === 'busy' }]"
        @click="filterStatus = 'busy'"
      >
        <span class="summary-dot"></span>
        <span class="summary-copy">
          <strong>{{ countBusy }}</strong>
          <small>Ocupadas</small>
        </span>
      </button>

      <button
        :class="['summary-card', 'summary-card--amber', { active: filterStatus === 'cleaning' }]"
        @click="filterStatus = 'cleaning'"
      >
        <span class="summary-dot"></span>
        <span class="summary-copy">
          <strong>{{ countCleaning }}</strong>
          <small>Em limpeza</small>
        </span>
      </button>
    </section>

    <section class="tables-section">
      <div class="section-heading">
        <div>
          <h3>Mapa do salão</h3>
          <p>Clique em uma mesa para abrir a comanda ou acompanhar o consumo.</p>
        </div>
        <span class="results-count">{{ filteredTables.length }} mesas</span>
      </div>

      <div class="tables-grid">
        <button
          v-for="table in filteredTables"
          :key="table.id"
          :class="['table-card', `table-card--${table.status}`]"
          @click="handleTableClick(table)"
        >
          <div class="table-card__top">
            <span class="table-number">Mesa {{ table.table_number }}</span>
            <span class="status-pill">
              <span class="status-pill__dot"></span>
              {{ getStatusLabel(table.status) }}
            </span>
          </div>

          <div class="table-card__middle">
            <span class="table-glyph">{{ table.status === 'busy' ? '●' : table.status === 'cleaning' ? '◌' : '○' }}</span>
          </div>

          <div class="table-card__bottom">
            <strong>{{ getTableSubtitle(table) }}</strong>
            <span class="open-hint">Abrir detalhes <span>→</span></span>
          </div>
        </button>

        <div v-if="filteredTables.length === 0" class="empty-state-card">
          <div class="empty-state-icon">⌂</div>
          <h4>Nenhuma mesa encontrada</h4>
          <p>Não há mesas neste filtro no momento.</p>
        </div>
      </div>
    </section>

    <!-- MODAL: Gerar Mesas em Lote -->
    <Transition name="modal">
      <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
        <div class="modal-card modal-card--compact">
          <div class="modal-topline">
            <div class="modal-icon modal-icon--purple">✦</div>
            <button type="button" @click="showBatchModal = false" class="modal-close">×</button>
          </div>
          <span class="modal-kicker">CONFIGURAÇÃO</span>
          <h3>Gerar mesas</h3>
          <p class="modal-subtitle">Crie várias mesas de uma vez informando apenas o intervalo.</p>

          <form @submit.prevent="handleBatchCreate">
            <div class="form-grid">
              <label class="field">
                <span>Mesa inicial</span>
                <input type="number" v-model.number="batchStart" min="1" required />
              </label>
              <label class="field">
                <span>Mesa final</span>
                <input type="number" v-model.number="batchEnd" min="1" required />
              </label>
            </div>

            <div class="modal-preview">
              <span>Prévia</span>
              <strong>{{ Math.max(0, batchEnd - batchStart + 1) }} mesas</strong>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showBatchModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-confirm">Gerar mesas</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- MODAL: Abrir Nova Mesa -->
    <Transition name="modal">
      <div v-if="showOpenModal" class="modal-overlay" @click.self="showOpenModal = false">
        <div class="modal-card modal-card--compact">
          <div class="modal-topline">
            <div class="modal-icon modal-icon--green">＋</div>
            <button type="button" @click="showOpenModal = false" class="modal-close">×</button>
          </div>
          <span class="modal-kicker">NOVA COMANDA</span>
          <h3>Abrir mesa</h3>
          <p class="modal-subtitle">Defina a mesa e identifique o cliente quando necessário.</p>

          <form @submit.prevent="handleOpenTable">
            <label class="field">
              <span>Número da mesa</span>
              <input type="text" v-model="formTableNumber" placeholder="Ex.: 12" required />
            </label>

            <label class="field">
              <span>Cliente <em>opcional</em></span>
              <input type="text" v-model="formCustomerName" placeholder="Ex.: João" />
            </label>

            <div class="modal-actions">
              <button type="button" @click="showOpenModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-confirm">Abrir mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- MODAL: Ocupar Mesa Livre -->
    <Transition name="modal">
      <div v-if="showOccupyModal" class="modal-overlay" @click.self="showOccupyModal = false">
        <div class="modal-card modal-card--compact">
          <div class="modal-topline">
            <div class="modal-icon modal-icon--green">○</div>
            <button type="button" @click="showOccupyModal = false" class="modal-close">×</button>
          </div>
          <span class="modal-kicker">MESA {{ tableToOccupy?.table_number }}</span>
          <h3>Iniciar atendimento</h3>
          <p class="modal-subtitle">Informe o cliente para liberar a comanda desta mesa.</p>

          <form @submit.prevent="confirmOccupyTable">
            <label class="field">
              <span>Nome do cliente</span>
              <input type="text" v-model="occupyCustomerName" placeholder="Ex.: Maria" required autofocus />
            </label>

            <div class="modal-actions">
              <button type="button" @click="showOccupyModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-confirm">Iniciar mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- MODAL: Gerenciamento da Mesa -->
    <Transition name="modal">
      <div v-if="selectedTable" class="modal-overlay modal-overlay--workspace" @click.self="closeTableModal">
        <div class="modal-card modal-card--workspace">
          <div class="workspace-header">
            <div class="workspace-heading">
              <div class="workspace-avatar">
                {{ selectedTable.table_number }}
              </div>
              <div>
                <div class="workspace-meta">
                  <span>MESA {{ selectedTable.table_number }}</span>
                  <span class="status-pill" :class="`status-pill--${selectedTable.status}`">
                    <span class="status-pill__dot"></span>
                    {{ getStatusLabel(selectedTable.status) }}
                  </span>
                </div>
                <h3>{{ selectedTable.customer_name || 'Atendimento em aberto' }}</h3>
                <p>Acompanhe consumo, lançamentos e impressão da comanda.</p>
              </div>
            </div>

            <button @click="closeTableModal" class="modal-close modal-close--large" aria-label="Fechar">×</button>
          </div>

          <div class="workspace-divider"></div>

          <div v-if="selectedTable.status === 'cleaning'" class="cleaning-view">
            <div class="cleaning-illustration">✦</div>
            <span class="modal-kicker">LIMPEZA</span>
            <h4>Mesa em higienização</h4>
            <p>Assim que o salão estiver pronto, libere a mesa novamente para o próximo atendimento.</p>
            <button @click="setTableStatusToFree(selectedTable.id)" class="btn-confirm btn-confirm--wide">
              Liberar mesa
            </button>
          </div>

          <div v-else class="workspace-body">
            <section class="consumption-panel">
              <div class="panel-head">
                <div>
                  <span class="panel-kicker">COMANDA</span>
                  <h4>Itens lançados</h4>
                </div>
                <span v-if="tableItems.length" class="item-counter">{{ tableItems.length }} itens</span>
              </div>

              <div v-if="tableItems.length === 0" class="empty-list">
                <div class="empty-list__icon">＋</div>
                <strong>Nenhum item ainda</strong>
                <span>Adicione produtos para começar o consumo.</span>
              </div>

              <div v-else class="items-list">
                <div v-for="item in tableItems" :key="item.id" class="consumed-item">
                  <div class="consumed-item__left">
                    <div class="item-qty">{{ item.quantity }}×</div>
                    <div class="item-info">
                      <strong>{{ item.product_name }}</strong>
                      <span v-if="item.printed" class="printed-badge">Enviado</span>
                      <div v-if="item.addons_description" class="item-addons-text">
                        {{ item.addons_description }}
                      </div>
                    </div>
                  </div>
                  <span class="item-price">R$ {{ Number(item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>

              <div class="consumption-total">
                <div>
                  <span>Total da mesa</span>
                  <strong>R$ {{ calculateTotal.toFixed(2) }}</strong>
                </div>
                <small>{{ unprintedItemsCount }} item(ns) aguardando envio</small>
              </div>

              <div class="quick-actions">
                <button @click="openProductCatalog" class="quick-action quick-action--primary">
                  <span>＋</span> Adicionar produto
                </button>
                <button @click="printPartialKitchen" class="quick-action quick-action--orange" :disabled="unprintedItemsCount === 0">
                  <span>↗</span> Cozinha
                  <b v-if="unprintedItemsCount">{{ unprintedItemsCount }}</b>
                </button>
                <button @click="printFullReceipt" class="quick-action quick-action--neutral" :disabled="tableItems.length === 0">
                  <span>▤</span> Conta
                </button>
              </div>
            </section>

            <aside v-if="showCatalogInline" class="catalog-panel">
              <div class="panel-head">
                <div>
                  <span class="panel-kicker">CATÁLOGO</span>
                  <h4>Adicionar produtos</h4>
                </div>
                <button @click="showCatalogInline = false" class="inline-close">×</button>
              </div>

              <div class="catalog-grid-wrap">
                <button
                  v-for="prod in storeProducts"
                  :key="prod.id"
                  class="catalog-item-box"
                  @click="selectProductForAddons(prod)"
                >
                  <span class="prod-name">{{ prod.name }}</span>
                  <span class="prod-price">R$ {{ Number(prod.price).toFixed(2) }}</span>
                </button>
              </div>

              <div v-if="activeProductForAddon" class="addons-selection-box">
                <div class="selected-product">
                  <span>Selecionado</span>
                  <strong>{{ activeProductForAddon.name }}</strong>
                </div>

                <div class="addons-section-title">
                  <span>Adicionais</span>
                  <small>toque para selecionar</small>
                </div>

                <div v-if="availableAddons.length === 0" class="no-addons">
                  Nenhum adicional cadastrado.
                </div>

                <div v-else class="addons-list-wrap">
                  <label v-for="addon in availableAddons" :key="addon.id" class="addon-option">
                    <input type="checkbox" v-model="selectedAddons" :value="addon" />
                    <span class="addon-check"></span>
                    <span class="addon-option__copy">{{ addon.name }}</span>
                    <strong>+R$ {{ Number(addon.price).toFixed(2) }}</strong>
                  </label>
                </div>

                <button @click="confirmAddProductWithAddons" class="btn-confirm btn-confirm--wide">
                  Confirmar lançamento
                </button>
              </div>
            </aside>
          </div>

          <div class="workspace-footer">
            <button @click="isTransferring = !isTransferring" class="footer-link">
              <span>↔</span> Transferir mesa
            </button>
            <div class="footer-danger">
              <button @click="setTableStatusToCleaning(selectedTable.id)" class="footer-link footer-link--warning">
                <span>✦</span> Fechar mesa
              </button>
              <button @click="deleteTablePermanently(selectedTable.id)" class="footer-link footer-link--danger">
                <span>⌫</span> Excluir
              </button>
            </div>
          </div>

          <div v-if="isTransferring" class="transfer-box">
            <div>
              <span class="panel-kicker">TRANSFERÊNCIA</span>
              <strong>Escolha o novo número da mesa</strong>
            </div>
            <div class="transfer-control">
              <input type="text" v-model="newTableNumber" placeholder="Novo número" />
              <button type="button" @click="confirmTransfer" class="btn-confirm">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TableTab {
  id: number;
  company_id: string;
  table_number: string;
  customer_name: string | null;
  status: 'free' | 'busy' | 'cleaning';
  notes?: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  active: boolean;
  complement_groups?: unknown[];
  options_config?: unknown[];
  addons?: unknown[];
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  price: number;
  quantity: number;
  printed?: boolean;
  addons_description?: string;
  selected_options?: unknown;
}

const props = defineProps<{
  storeId: string;
}>();

const tables = ref<TableTab[]>([]);
const storeProducts = ref<Product[]>([]);
const availableAddons = ref<Addon[]>([]);
const selectedAddons = ref<Addon[]>([]);
const activeProductForAddon = ref<Product | null>(null);
const tableItems = ref<OrderItem[]>([]);
const activeOrderId = ref<string | null>(null);
const filterStatus = ref<string>('all');

let realtimeChannel: RealtimeChannel | null = null;

const showOpenModal = ref(false);
const formTableNumber = ref('');
const formCustomerName = ref('');

const showBatchModal = ref(false);
const batchStart = ref<number>(1);
const batchEnd = ref<number>(10);

const showOccupyModal = ref(false);
const tableToOccupy = ref<TableTab | null>(null);
const occupyCustomerName = ref('');

const selectedTable = ref<TableTab | null>(null);
const showCatalogInline = ref(false);
const isTransferring = ref(false);
const newTableNumber = ref('');

const getStatusLabel = (status: string) => {
  if (status === 'busy') return 'Ocupada';
  if (status === 'cleaning') return 'Em Limpeza';
  return 'Livre';
};

const getTableSubtitle = (table: TableTab) => {
  if (table.status === 'busy') return table.customer_name || 'Cliente';
  if (table.status === 'cleaning') return 'Aguardando limpeza';
  return 'Disponível';
};

const countFree = computed(() => tables.value.filter(t => t.status === 'free').length);
const countBusy = computed(() => tables.value.filter(t => t.status === 'busy').length);
const countCleaning = computed(() => tables.value.filter(t => t.status === 'cleaning').length);

const filteredTables = computed(() => {
  if (filterStatus.value === 'all') return tables.value;
  return tables.value.filter(t => t.status === filterStatus.value);
});

const unprintedItemsCount = computed(() => {
  return tableItems.value.filter(i => !i.printed).length;
});

const loadTables = async () => {
  if (!props.storeId) return;

  const { data, error } = await supabase
    .from('tables_tabs')
    .select('*')
    .eq('company_id', props.storeId);

  if (!error) {
    const rawTables = (data as TableTab[]) || [];
    tables.value = rawTables.sort((a, b) => {
      const numA = parseInt(a.table_number, 10);
      const numB = parseInt(b.table_number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.table_number.localeCompare(b.table_number);
    });
  }
};

const loadProducts = async () => {
  if (!props.storeId) return;
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', props.storeId)
    .eq('active', true);

  if (data) storeProducts.value = data as Product[];
};

const loadAddons = async () => {
  availableAddons.value = [];

  const { data: optionData } = await supabase.from('option_items').select('*');
  if (optionData && optionData.length > 0) {
    availableAddons.value = optionData as Addon[];
    return;
  }

  if (activeProductForAddon.value) {
    const prod = activeProductForAddon.value;
    const groups = (prod.complement_groups || prod.options_config || prod.addons) as Array<{ items?: Addon[] }> | undefined;

    if (groups && Array.isArray(groups)) {
      const extracted: Addon[] = [];
      groups.forEach((g) => {
        if (g.items) {
          g.items.forEach((i) => {
            extracted.push({ id: String(i.id || i.name), name: i.name, price: Number(i.price || 0) });
          });
        }
      });
      availableAddons.value = extracted;
    }
  }
};

const handleTableClick = async (table: TableTab) => {
  tableItems.value = [];
  activeOrderId.value = null;

  if (table.status === 'free') {
    tableToOccupy.value = table;
    occupyCustomerName.value = '';
    showOccupyModal.value = true;
  } else {
    selectedTable.value = table;
    showCatalogInline.value = false;
    activeProductForAddon.value = null;

    if (table.status === 'busy') {
      await loadTableConsumption(table.id);
    }
  }
};

const loadTableConsumption = async (tableId: number) => {
  const { data: orderData } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .neq('status', 'concluido')
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!orderData) {
    tableItems.value = [];
    activeOrderId.value = null;
    return;
  }

  activeOrderId.value = orderData.id;

  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderData.id);

  if (!itemsError && itemsData) {
    tableItems.value = itemsData as OrderItem[];
  } else {
    tableItems.value = [];
  }

  subscribeToRealtime(orderData.id);
};

const subscribeToRealtime = (orderId: string | null) => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  if (!orderId) return;

  realtimeChannel = supabase
    .channel(`public:order_items:order_id=eq.${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${orderId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as OrderItem;
          if (!tableItems.value.some(i => i.id === newItem.id)) {
            tableItems.value.push(newItem);
          }
        } else if (payload.eventType === 'DELETE') {
          tableItems.value = tableItems.value.filter(i => i.id !== (payload.old as OrderItem).id);
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = payload.new as OrderItem;
          const index = tableItems.value.findIndex(i => i.id === updatedItem.id);
          if (index !== -1) {
            tableItems.value[index] = updatedItem;
          }
        }
      }
    )
    .subscribe();
};

const closeTableModal = () => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  selectedTable.value = null;
  activeOrderId.value = null;
  tableItems.value = [];
};

const calculateTotal = computed(() => {
  return tableItems.value.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
});

const openProductCatalog = () => {
  loadProducts();
  loadAddons();
  showCatalogInline.value = true;
  activeProductForAddon.value = null;
};

const selectProductForAddons = (prod: Product) => {
  activeProductForAddon.value = prod;
  selectedAddons.value = [];
  loadAddons();
};

const confirmAddProductWithAddons = async () => {
  if (!selectedTable.value || !activeProductForAddon.value) return;

  const prod = activeProductForAddon.value;
  const addonsTotal = selectedAddons.value.reduce((sum, a) => sum + Number(a.price), 0);
  const finalUnitPrice = Number(prod.price) + addonsTotal;

  let orderId: string | null = activeOrderId.value;

  if (!orderId) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', selectedTable.value.id)
      .neq('status', 'concluido')
      .neq('status', 'cancelado')
      .maybeSingle();

    if (existingOrder) {
      orderId = existingOrder.id;
    } else {
      const newOrderPayload = {
        store_id: props.storeId,
        table_id: selectedTable.value.id,
        status: 'open',
        customer_name: selectedTable.value.customer_name || `Mesa ${selectedTable.value.table_number}`,
        customer_phone: '00000000000',
        total: finalUnitPrice
      };

      const { data: newOrder, error: newOrderError } = await supabase
        .from('orders')
        .insert([newOrderPayload])
        .select('id')
        .single();

      if (newOrderError || !newOrder) {
        console.error('Erro ao criar pedido para a mesa:', newOrderError);
        alert('Erro ao iniciar comanda da mesa.');
        return;
      }
      orderId = newOrder.id;
    }

    activeOrderId.value = orderId;
    subscribeToRealtime(orderId);
  }

  const addonsDesc = selectedAddons.value.map(a => a.name).join(', ');

  const payload = {
    order_id: orderId,
    product_id: prod.id ? String(prod.id) : null,
    product_name: prod.name,
    price: finalUnitPrice,
    quantity: 1,
    printed: false,
    addons_description: addonsDesc || null,
    selected_options: selectedAddons.value.map(a => ({ name: a.name, price: a.price }))
  };

  const { error } = await supabase.from('order_items').insert([payload]);

  if (!error) {
    activeProductForAddon.value = null;
    selectedAddons.value = [];
    showCatalogInline.value = false;
    await loadTableConsumption(selectedTable.value.id);
  } else {
    console.error('Erro ao inserir item:', error);
    alert('Erro ao lançar item com adicionais.');
  }
};

const printPartialKitchen = async () => {
  const unprintedItems = tableItems.value.filter(item => !item.printed);

  if (unprintedItems.length === 0) {
    alert('Não há novos itens pendentes para enviar à cozinha.');
    return;
  }

  const unprintedIds = unprintedItems.map(i => i.id);

  const { error } = await supabase
    .from('order_items')
    .update({ printed: true })
    .in('id', unprintedIds);

  if (error) {
    console.error('Erro ao salvar status impresso no Supabase:', error);
    alert('Erro ao atualizar o status no banco de dados.');
    return;
  }

  tableItems.value = tableItems.value.map(item => {
    if (unprintedIds.includes(item.id)) {
      return { ...item, printed: true };
    }
    return item;
  });

  try {
    await fetch('http://localhost:3000/print-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'kitchen',
        table_number: selectedTable.value?.table_number,
        customer_name: selectedTable.value?.customer_name || 'Mesa',
        items: unprintedItems.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity || 1,
          price: Number(item.price || 0),
          selected_options: item.selected_options || []
        })),
        notes: selectedTable.value?.notes || ''
      })
    });
  } catch (err) {
    console.warn('Impressora offline, mas o status foi salvo como impresso no banco.', err);
  }

  if (selectedTable.value) {
    await loadTableConsumption(selectedTable.value.id);
  }
};

const printFullReceipt = async () => {
  if (!selectedTable.value || tableItems.value.length === 0) return;

  const printPayload = {
    type: 'receipt',
    table_number: selectedTable.value.table_number,
    customer_name: selectedTable.value.customer_name || 'Mesa',
    items: tableItems.value.map(item => ({
      product_name: item.product_name,
      quantity: item.quantity,
      price: Number(item.price),
      selected_options: item.selected_options || []
    })),
    total: calculateTotal.value,
    created_at: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:3000/print-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printPayload)
    });

    if (response.ok) {
      alert('✅ Extrato impresso com sucesso!');
    } else {
      alert('❌ Erro ao imprimir extrato.');
    }
  } catch {
    alert('❌ Falha ao comunicar com o servidor de impressão.');
  }
};

const handleBatchCreate = async () => {
  if (batchStart.value > batchEnd.value) return;
  const existingNumbers = new Set(tables.value.map(t => t.table_number));
  const newTablesToInsert = [];

  for (let i = batchStart.value; i <= batchEnd.value; i++) {
    const tableNumStr = i.toString();
    if (!existingNumbers.has(tableNumStr)) {
      newTablesToInsert.push({ company_id: props.storeId, table_number: tableNumStr, status: 'free' });
    }
  }

  if (newTablesToInsert.length > 0) {
    await supabase.from('tables_tabs').insert(newTablesToInsert);
    showBatchModal.value = false;
    loadTables();
  }
};

const handleOpenTable = async () => {
  if (!formTableNumber.value) return;
  await supabase.from('tables_tabs').insert([{
    company_id: props.storeId,
    table_number: formTableNumber.value,
    customer_name: formCustomerName.value || 'Geral',
    status: 'busy'
  }]);
  formTableNumber.value = '';
  formCustomerName.value = '';
  showOpenModal.value = false;
  loadTables();
};

const confirmOccupyTable = async () => {
  if (!tableToOccupy.value || !occupyCustomerName.value) return;
  await supabase.from('tables_tabs').update({ customer_name: occupyCustomerName.value, status: 'busy' }).eq('id', tableToOccupy.value.id);
  showOccupyModal.value = false;
  loadTables();
};

const setTableStatusToCleaning = async (tableId: number) => {
  if (activeOrderId.value) {
    await supabase
      .from('orders')
      .update({ status: 'concluido' })
      .eq('id', activeOrderId.value);
  }

  await supabase
    .from('tables_tabs')
    .update({ status: 'cleaning', customer_name: null })
    .eq('id', tableId);

  closeTableModal();
  loadTables();
};

const setTableStatusToFree = async (tableId: number) => {
  if (activeOrderId.value) {
    await supabase
      .from('orders')
      .update({ status: 'concluido' })
      .eq('id', activeOrderId.value);
  }

  await supabase
    .from('tables_tabs')
    .update({ status: 'free', customer_name: null })
    .eq('id', tableId);

  closeTableModal();
  loadTables();
};

const confirmTransfer = async () => {
  if (!selectedTable.value || !newTableNumber.value) return;
  await supabase.from('tables_tabs').update({ table_number: newTableNumber.value }).eq('company_id', props.storeId).eq('table_number', selectedTable.value.table_number);
  isTransferring.value = false;
  newTableNumber.value = '';
  closeTableModal();
  loadTables();
};

const deleteTablePermanently = async (tableId: number) => {
  if (!confirm('Deseja excluir esta mesa?')) return;

  if (activeOrderId.value) {
    await supabase
      .from('orders')
      .update({ status: 'cancelado' })
      .eq('id', activeOrderId.value);
  }

  await supabase.from('tables_tabs').delete().eq('id', tableId);
  closeTableModal();
  loadTables();
};

onMounted(() => {
  loadTables();
});

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
});

</script>

<style scoped>
.table-manager {
  --ink: #171717;
  --muted: #737373;
  --line: #e9e7e3;
  --surface: #ffffff;
  --canvas: #f5f3ef;
  --accent: #121212;
  --green: #2b8a57;
  --green-bg: #edf8f1;
  --red: #c95555;
  --red-bg: #fff1f1;
  --amber: #ba7a22;
  --amber-bg: #fff7e9;
  min-height: 100vh;
  width: 100%;
  padding: 34px clamp(18px, 3vw, 44px) 60px;
  background:
    radial-gradient(circle at 93% 0%, rgba(215, 188, 138, .16), transparent 30%),
    var(--canvas);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-sizing: border-box;
}

.table-manager *,
.table-manager *::before,
.table-manager *::after { box-sizing: border-box; }

.page-header {
  max-width: 1440px;
  margin: 0 auto 28px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.eyebrow,
.modal-kicker,
.panel-kicker {
  display: block;
  font-size: 11px;
  line-height: 1.1;
  letter-spacing: .14em;
  font-weight: 800;
  color: #716c65;
}

.title-row { display: flex; align-items: center; gap: 14px; margin-top: 9px; }

.title-mark,
.workspace-avatar,
.modal-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 16px;
  font-weight: 800;
}

.title-mark {
  width: 50px;
  height: 50px;
  background: #171717;
  color: #fff;
  font-size: 19px;
  box-shadow: 0 12px 26px rgba(0,0,0,.12);
}

.page-header h2 { margin: 0; font-size: clamp(1.8rem, 2vw, 2.35rem); letter-spacing: -.045em; line-height: 1; }
.page-header p { margin: 7px 0 0; color: var(--muted); font-size: 14px; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

.action-btn,
.quick-action,
.btn-confirm,
.btn-cancel {
  border: 0;
  cursor: pointer;
  font: inherit;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}

.action-btn {
  min-height: 42px;
  padding: 0 15px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 750;
}
.action-btn:hover, .quick-action:hover, .btn-confirm:hover, .btn-cancel:hover { transform: translateY(-1px); }
.action-btn--ghost { background: rgba(255,255,255,.65); color: #444; border: 1px solid var(--line); }
.action-btn--soft { background: #eeeae3; color: #332f2a; }
.action-btn--primary { background: #171717; color: white; box-shadow: 0 10px 22px rgba(0,0,0,.13); }
.btn-icon { font-size: 15px; }

.summary-strip {
  max-width: 1440px;
  margin: 0 auto 32px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  appearance: none;
  border: 1px solid rgba(25,25,25,.05);
  background: rgba(255,255,255,.72);
  border-radius: 18px;
  padding: 15px 16px;
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 13px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 7px 22px rgba(29,26,22,.035);
  transition: .2s ease;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(29,26,22,.07); }
.summary-card.active { background: #171717; color: #fff; border-color: #171717; }
.summary-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--green); flex: 0 0 auto; }
.summary-dot--all { background: #171717; }
.summary-card--red .summary-dot { background: var(--red); }
.summary-card--amber .summary-dot { background: #d79b4a; }
.summary-copy { display: flex; flex-direction: column; gap: 2px; }
.summary-copy strong { font-size: 21px; line-height: 1; letter-spacing: -.04em; }
.summary-copy small { font-size: 12px; color: #5f5a54; font-weight: 700; }
.summary-card.active .summary-copy small { color: #a7a7a7; }

.tables-section { max-width: 1440px; margin: 0 auto; }
.section-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 14px; }
.section-heading h3 { margin: 0; font-size: 17px; letter-spacing: -.02em; }
.section-heading p { margin: 5px 0 0; font-size: 12px; color: var(--muted); }
.results-count { font-size: 12px; font-weight: 750; color: #625d56; }

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 13px;
}

.table-card {
  border: 1px solid rgba(25,25,25,.06);
  background: rgba(255,255,255,.88);
  border-radius: 20px;
  min-height: 188px;
  padding: 17px;
  text-align: left;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(33,29,24,.04);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.table-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: #191919;
  opacity: .9;
}
.table-card--free::before { background: var(--green); }
.table-card--busy::before { background: var(--red); }
.table-card--cleaning::before { background: #d09a45; }
.table-card:hover { transform: translateY(-3px); box-shadow: 0 18px 34px rgba(33,29,24,.09); border-color: rgba(25,25,25,.11); }

.table-card__top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.table-number { font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 6px 8px;
  background: #f1efe9;
  color: #666159;
  font-size: 10px;
  line-height: 1.1;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.status-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: #999; }
.table-card--free .status-pill { background: var(--green-bg); color: #2c754d; }
.table-card--free .status-pill__dot { background: var(--green); }
.table-card--busy .status-pill { background: var(--red-bg); color: #a24747; }
.table-card--busy .status-pill__dot { background: var(--red); }
.table-card--cleaning .status-pill { background: var(--amber-bg); color: #9e681c; }
.table-card--cleaning .status-pill__dot { background: #d09a45; }

.table-card__middle { display: grid; place-items: center; padding: 14px 0 10px; }
.table-glyph {
  width: 74px;
  height: 74px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 22px;
  color: #2d2b29;
  background: #f1eee8;
}
.table-card--free .table-glyph { color: var(--green); background: var(--green-bg); }
.table-card--busy .table-glyph { color: var(--red); background: var(--red-bg); }
.table-card--cleaning .table-glyph { color: #b77a2a; background: var(--amber-bg); }

.table-card__bottom { display: flex; flex-direction: column; gap: 8px; }
.table-card__bottom strong { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.open-hint { font-size: 11px; color: #68635c; font-weight: 700; }
.open-hint span { margin-left: 3px; }

.empty-state-card {
  grid-column: 1 / -1;
  padding: 58px 20px;
  border: 1px dashed #d8d2c9;
  border-radius: 20px;
  text-align: center;
  color: var(--muted);
  background: rgba(255,255,255,.44);
}
.empty-state-icon, .empty-list__icon { display: grid; place-items: center; margin: 0 auto 12px; width: 42px; height: 42px; border-radius: 14px; background: #ebe7df; color: #5d5953; font-weight: 800; }
.empty-state-card h4 { margin: 0; color: #302e2a; font-size: 14px; }
.empty-state-card p { margin: 6px 0 0; font-size: 13px; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(19,18,17,.43);
  backdrop-filter: blur(11px);
  -webkit-backdrop-filter: blur(11px);
}

.modal-overlay--workspace { padding: 0; align-items: stretch; }
.modal-card {
  width: 100%;
  max-width: 450px;
  max-height: min(760px, 92vh);
  overflow-y: auto;
  background: rgba(255,255,255,.97);
  border: 1px solid rgba(20,20,20,.08);
  border-radius: 28px;
  padding: 28px;
  color: var(--ink);
  box-shadow: 0 35px 90px rgba(0,0,0,.22);
}
.modal-card--compact { padding: 28px; }
.modal-card--workspace {
  max-width: 1120px;
  max-height: none;
  height: 100%;
  border-radius: 0;
  padding: clamp(22px, 4vw, 38px);
  overflow: auto;
}

.modal-topline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-icon { width: 42px; height: 42px; font-size: 17px; }
.modal-icon--purple { background: #eee8fb; color: #7057ae; }
.modal-icon--green { background: #e8f5ec; color: var(--green); }
.modal-close {
  width: 34px; height: 34px; border: 0; border-radius: 10px; background: #f2f0ec;
  color: #77726c; font-size: 23px; line-height: 1; cursor: pointer;
}
.modal-close:hover { background: #eae7e2; color: #222; }
.modal-close--large { width: 42px; height: 42px; font-size: 28px; }

.modal-card h3 { margin: 9px 0 7px; font-size: 26px; letter-spacing: -.05em; line-height: 1.05; }
.modal-subtitle { margin: 0 0 23px; color: #625d56; font-size: 13px; line-height: 1.55; }

.field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.field > span { font-size: 12px; font-weight: 800; color: #3f3b36; }
.field em { color: #aaa49d; font-style: normal; font-weight: 600; }
.field input,
.transfer-control input {
  height: 46px; width: 100%; border-radius: 13px; border: 1px solid #e5e1da;
  background: #fcfbf9; padding: 0 14px; font: inherit; font-size: 13px; color: #222;
  outline: none; transition: .18s ease;
}
.field input:focus, .transfer-control input:focus { border-color: #171717; box-shadow: 0 0 0 4px rgba(23,23,23,.06); background: #fff; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-preview {
  margin: 5px 0 20px; border-radius: 14px; background: #f6f3ed; padding: 13px 14px;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-preview span { font-size: 11px; color: #89837b; font-weight: 700; }
.modal-preview strong { font-size: 15px; letter-spacing: -.02em; }

.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
.btn-cancel, .btn-confirm { min-height: 44px; padding: 0 16px; border-radius: 12px; font-size: 12px; font-weight: 800; }
.btn-cancel { background: #f1eee8; color: #544f48; }
.btn-confirm { background: #171717; color: #fff; box-shadow: 0 9px 20px rgba(0,0,0,.12); }
.btn-confirm--wide { width: 100%; }

.workspace-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.workspace-heading { display: flex; gap: 15px; align-items: center; min-width: 0; }
.workspace-avatar {
  width: 58px; height: 58px; border-radius: 18px; background: #171717; color: #fff; font-size: 18px;
  box-shadow: 0 10px 25px rgba(0,0,0,.14);
}
.workspace-meta { display: flex; align-items: center; gap: 8px; }
.workspace-meta > span:first-child { font-size: 10px; color: #aaa49d; font-weight: 850; letter-spacing: .1em; }
.workspace-header h3 { margin: 7px 0 4px; font-size: 25px; }
.workspace-header p { margin: 0; color: #625d56; font-size: 13px; }
.status-pill--busy { background: var(--red-bg); color: #a24747; }
.status-pill--busy .status-pill__dot { background: var(--red); }
.status-pill--free { background: var(--green-bg); color: #2c754d; }
.status-pill--free .status-pill__dot { background: var(--green); }
.status-pill--cleaning { background: var(--amber-bg); color: #9e681c; }
.status-pill--cleaning .status-pill__dot { background: #d09a45; }

.workspace-divider { height: 1px; background: var(--line); margin: 24px 0 22px; }
.workspace-body { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr); gap: 18px; }
.consumption-panel, .catalog-panel {
  background: #fbfaf8; border: 1px solid #ede9e3; border-radius: 20px; padding: 18px;
}
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.panel-head h4 { margin: 6px 0 0; font-size: 17px; letter-spacing: -.025em; }
.item-counter { border-radius: 999px; background: #efebe5; color: #6e685f; padding: 6px 9px; font-size: 11px; font-weight: 850; }

.empty-list {
  min-height: 270px; border: 1px dashed #ded8ce; border-radius: 15px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #8c877f; gap: 4px; padding: 22px;
}
.empty-list strong { font-size: 13px; color: #4f4a44; }
.empty-list span { font-size: 12px; }

.items-list { max-height: 310px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
.consumed-item {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  padding: 12px; background: #fff; border: 1px solid #ece7e0; border-radius: 14px;
}
.consumed-item__left { display: flex; gap: 10px; min-width: 0; }
.item-qty { min-width: 28px; height: 28px; display: grid; place-items: center; border-radius: 9px; background: #f2eee8; color: #4d4944; font-size: 11px; font-weight: 900; }
.item-info { min-width: 0; }
.item-info strong { display: block; font-size: 12px; line-height: 1.2; }
.item-price { white-space: nowrap; font-size: 13px; font-weight: 850; color: #24211f; }
.printed-badge { display: inline-block; margin-top: 5px; padding: 4px 7px; border-radius: 999px; background: #e9f6ee; color: #3a7a55; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
.item-addons-text { margin-top: 5px; color: #8d877e; font-size: 12px; line-height: 1.45; }

.consumption-total { margin-top: 12px; padding: 16px; border-radius: 16px; background: #171717; color: #fff; }
.consumption-total > div { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
.consumption-total span { color: #aaa; font-size: 12px; font-weight: 700; }
.consumption-total strong { font-size: 21px; letter-spacing: -.04em; }
.consumption-total small { display: block; margin-top: 6px; color: #8f8f8f; font-size: 10px; }

.quick-actions { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 8px; margin-top: 12px; }
.quick-action {
  min-height: 42px; border-radius: 12px; padding: 0 10px; font-size: 11px; font-weight: 850;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.quick-action span { font-size: 14px; }
.quick-action--primary { background: #171717; color: #fff; }
.quick-action--orange { background: #fff1e7; color: #ad5f25; }
.quick-action--neutral { background: #ebe8e2; color: #5b554e; }
.quick-action:disabled { opacity: .38; cursor: not-allowed; transform: none; }
.quick-action b { min-width: 17px; height: 17px; display: grid; place-items: center; border-radius: 50%; background: currentColor; color: #fff; font-size: 8px; }

.inline-close { border: 0; background: #efebe5; color: #777169; width: 30px; height: 30px; border-radius: 9px; cursor: pointer; font-size: 18px; }

.catalog-grid-wrap {
  display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px;
  max-height: 255px; overflow-y: auto;
}
.catalog-item-box {
  border: 1px solid #ebe6df; background: #fff; border-radius: 13px; padding: 12px;
  text-align: left; cursor: pointer; min-height: 68px; display: flex; flex-direction: column; justify-content: space-between;
  transition: .18s ease;
}
.catalog-item-box:hover { border-color: #bdb6ad; transform: translateY(-1px); }
.prod-name { font-size: 11px; font-weight: 800; color: #2a2724; line-height: 1.3; }
.prod-price { margin-top: 7px; color: #777168; font-size: 10px; }

.addons-selection-box { margin-top: 12px; padding-top: 13px; border-top: 1px solid #e5e0d8; }
.selected-product { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; padding: 10px 12px; background: #f2eee8; border-radius: 13px; }
.selected-product span { color: #8b857c; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.selected-product strong { font-size: 11px; }
.addons-section-title { display: flex; justify-content: space-between; margin: 13px 0 8px; }
.addons-section-title span { font-size: 11px; font-weight: 850; }
.addons-section-title small { font-size: 10px; color: #999188; }
.addons-list-wrap { display: flex; flex-direction: column; gap: 6px; max-height: 155px; overflow-y: auto; }
.addon-option { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; padding: 9px; background: #fff; border: 1px solid #ece8e1; border-radius: 11px; cursor: pointer; }
.addon-option input { position: absolute; opacity: 0; pointer-events: none; }
.addon-check { width: 15px; height: 15px; border-radius: 5px; border: 1.5px solid #d4cec4; background: #fff; transition: .16s ease; }
.addon-option:has(input:checked) { border-color: #171717; background: #f7f5f1; }
.addon-option:has(input:checked) .addon-check { border-color: #171717; background: #171717; box-shadow: inset 0 0 0 3px #f7f5f1; }
.addon-option__copy { min-width: 0; font-size: 12px; font-weight: 700; color: #4d4842; }
.addon-option strong { font-size: 11px; color: #59544d; }
.no-addons { padding: 12px; border-radius: 11px; background: #f3efe9; color: #8c857d; font-size: 10px; }

.cleaning-view { max-width: 560px; margin: 50px auto 70px; text-align: center; }
.cleaning-illustration { width: 84px; height: 84px; display: grid; place-items: center; margin: 0 auto 18px; border-radius: 28px; background: var(--amber-bg); color: #b27629; font-size: 26px; }
.cleaning-view h4 { margin: 10px 0 7px; font-size: 23px; letter-spacing: -.04em; }
.cleaning-view p { margin: 0 auto 20px; max-width: 430px; color: #878078; font-size: 13px; line-height: 1.65; }

.workspace-footer {
  margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line);
  display: flex; justify-content: space-between; gap: 10px; align-items: center;
}
.footer-danger { display: flex; gap: 8px; }
.footer-link { background: transparent; border: 0; color: #6f6961; padding: 8px 6px; cursor: pointer; font: inherit; font-size: 10px; font-weight: 800; }
.footer-link span { margin-right: 4px; }
.footer-link--warning { color: #9c6b27; }
.footer-link--danger { color: #b14e4e; }

.transfer-box {
  margin-top: 14px; padding: 13px; border: 1px solid #e9e4dc; background: #f7f4ee; border-radius: 15px;
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
}
.transfer-box > div:first-child { display: flex; flex-direction: column; gap: 5px; }
.transfer-box > div:first-child strong { font-size: 11px; }
.transfer-control { display: flex; gap: 8px; width: min(330px, 100%); }
.transfer-control input { height: 42px; background: #fff; }

.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform .22s cubic-bezier(.2,.7,.2,1), opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: translateY(14px) scale(.985); opacity: 0; }

@media (max-width: 960px) {
  .workspace-body { grid-template-columns: 1fr; }
  .catalog-panel { order: -1; }
}

@media (max-width: 720px) {
  .table-manager { padding: 22px 13px 45px; }
  .page-header { align-items: stretch; flex-direction: column; }
  .header-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .action-btn:last-child { grid-column: 1 / -1; }
  .summary-strip { grid-template-columns: 1fr 1fr; }
  .tables-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-card { min-height: 170px; padding: 14px; }
  .status-pill { padding: 5px 7px; font-size: 8px; }
  .modal-overlay { padding: 10px; align-items: flex-end; }
  .modal-card, .modal-card--compact { border-radius: 24px 24px 18px 18px; max-height: 92vh; padding: 20px; }
  .modal-card--workspace { height: 94vh; border-radius: 24px 24px 0 0; }
  .workspace-heading { align-items: flex-start; }
  .workspace-header h3 { font-size: 19px; }
  .workspace-footer { flex-direction: column; align-items: stretch; }
  .footer-danger { justify-content: space-between; }
  .transfer-box { align-items: stretch; flex-direction: column; }
  .transfer-control { width: 100%; }
}

@media (max-width: 430px) {
  .title-mark { width: 44px; height: 44px; border-radius: 13px; }
  .page-header h2 { font-size: 1.55rem; }
  .summary-card { min-height: 68px; padding: 12px; }
  .tables-grid { gap: 9px; }
  .table-card { min-height: 156px; border-radius: 17px; }
  .table-card__middle { padding: 11px 0; }
  .table-glyph { width: 58px; height: 58px; border-radius: 20px; }
  .table-card__bottom strong { font-size: 11px; }
  .open-hint { font-size: 10px; }
  .quick-actions { grid-template-columns: 1fr 1fr; }
  .quick-action:first-child { grid-column: 1 / -1; }
  .form-grid { grid-template-columns: 1fr; }
  .workspace-body { gap: 11px; }
}
</style>
