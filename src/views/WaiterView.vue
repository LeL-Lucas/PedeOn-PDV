<template>
  <div class="waiter-page">
    <!-- Kitchen alert -->
    <Transition name="alert">
      <div v-if="kitchenAlert" class="kitchen-alert" role="alert">
        <div class="alert-symbol">!</div>
        <div class="alert-copy">
          <strong>Pedido pronto</strong>
          <span>{{ kitchenAlert }}</span>
        </div>
        <button class="alert-close" @click="kitchenAlert = null" aria-label="Fechar alerta">×</button>
      </div>
    </Transition>

    <header class="topbar">
      <div class="topbar-left">
        <div class="brand-mark">S</div>
        <div>
          <span class="eyebrow">Operação de salão</span>
          <h1>Painel do garçom</h1>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="ghost-btn" @click="loadTables" title="Atualizar mesas" aria-label="Atualizar mesas">
          <span class="btn-icon">↻</span>
          <span>Atualizar</span>
        </button>
        <button class="primary-btn" @click="showOpenModal = true">
          <span class="plus">+</span>
          Abrir mesa
        </button>
      </div>
    </header>

    <main class="page-shell">
      <section class="overview">
        <div>
          <p class="section-kicker">Visão geral</p>
          <h2>Mesas</h2>
          <p class="section-subtitle">Toque em uma mesa para iniciar ou continuar o atendimento.</p>
        </div>

        <div class="status-summary">
          <div class="summary-item">
            <span class="summary-dot free"></span>
            <strong>{{ freeTablesCount }}</strong>
            <span>livres</span>
          </div>
          <div class="summary-item">
            <span class="summary-dot busy"></span>
            <strong>{{ busyTablesCount }}</strong>
            <span>ocupadas</span>
          </div>
          <div class="summary-item">
            <span class="summary-dot cleaning"></span>
            <strong>{{ cleaningTablesCount }}</strong>
            <span>limpeza</span>
          </div>
        </div>
      </section>

      <section class="tables-grid">
        <button
          v-for="table in tables"
          :key="table.id"
          :class="['table-card', table.status]"
          @click="handleTableClick(table)"
        >
          <div class="table-card-head">
            <span class="table-label">MESA</span>
            <span :class="['table-status', table.status]">{{ getStatusLabel(table.status) }}</span>
          </div>
          <div class="table-number">{{ table.table_number }}</div>
          <div class="table-footer">
            <span>{{ getTableSubtitle(table) }}</span>
            <span class="table-arrow">→</span>
          </div>
        </button>

        <div v-if="tables.length === 0" class="empty-tables">
          <div class="empty-visual">◌</div>
          <strong>Nenhuma mesa encontrada</strong>
          <span>Abra uma mesa para começar o atendimento.</span>
        </div>
      </section>
    </main>

    <!-- Open table -->
    <Transition name="modal">
      <div v-if="showOpenModal" class="overlay" @click.self="showOpenModal = false">
        <div class="modal modal-small">
          <div class="modal-head">
            <div>
              <span class="modal-kicker">Novo atendimento</span>
              <h3>Abrir mesa</h3>
            </div>
            <button class="close-btn" @click="showOpenModal = false" aria-label="Fechar">×</button>
          </div>
          <form @submit.prevent="handleOpenTable" class="modal-form">
            <label>
              <span>Número da mesa</span>
              <input v-model.trim="formTableNumber" type="text" placeholder="Ex.: 12" required autofocus />
            </label>
            <label>
              <span>Nome do cliente <em>opcional</em></span>
              <input v-model.trim="formCustomerName" type="text" placeholder="Ex.: João" />
            </label>
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="showOpenModal = false">Cancelar</button>
              <button type="submit" class="primary-btn">Abrir mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Occupy free table -->
    <Transition name="modal">
      <div v-if="showOccupyModal" class="overlay" @click.self="showOccupyModal = false">
        <div class="modal modal-small">
          <div class="modal-head">
            <div>
              <span class="modal-kicker">Mesa {{ tableToOccupy?.table_number }}</span>
              <h3>Iniciar atendimento</h3>
            </div>
            <button class="close-btn" @click="showOccupyModal = false" aria-label="Fechar">×</button>
          </div>
          <form @submit.prevent="confirmOccupyTable" class="modal-form">
            <label>
              <span>Nome do cliente</span>
              <input v-model.trim="occupyCustomerName" type="text" placeholder="Ex.: Maria" required autofocus />
            </label>
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="showOccupyModal = false">Cancelar</button>
              <button type="submit" class="primary-btn">Confirmar mesa</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Table workspace -->
    <Transition name="modal">
      <div v-if="selectedTable" class="overlay workspace-overlay" @click.self="closeTableModal">
        <div class="modal modal-workspace">
          <div class="workspace-header">
            <div class="workspace-title">
              <button class="back-btn" @click="closeTableModal" aria-label="Voltar">←</button>
              <div>
                <div class="table-title-line">
                  <span class="workspace-kicker">Mesa</span>
                  <h3>{{ selectedTable.table_number }}</h3>
                  <span v-if="selectedTable.customer_name" class="customer-pill">{{ selectedTable.customer_name }}</span>
                </div>
                <p>{{ selectedTable.status === 'cleaning' ? 'Mesa aguardando higienização.' : 'Gerencie o consumo e envie novos itens para a cozinha.' }}</p>
              </div>
            </div>
            <button class="close-btn" @click="closeTableModal" aria-label="Fechar">×</button>
          </div>

          <div v-if="selectedTable.status === 'cleaning'" class="cleaning-panel">
            <div class="cleaning-icon">✦</div>
            <h4>Mesa aguardando limpeza</h4>
            <p>Quando estiver tudo pronto, libere a mesa para o próximo atendimento.</p>
            <button class="primary-btn wide" @click="setTableStatusToFree(selectedTable.id)">Liberar mesa</button>
          </div>

          <div v-else class="workspace-grid">
            <!-- Consumption -->
            <section class="consumption-panel">
              <div class="panel-head">
                <div>
                  <span class="panel-kicker">Comanda</span>
                  <h4>Consumo da mesa</h4>
                </div>
                <span class="items-count">{{ tableItems.length }} itens</span>
              </div>

              <div v-if="tableItems.length === 0" class="empty-consumption">
                <div class="empty-plate">＋</div>
                <strong>Nenum item lançado</strong>
                <span>Adicione produtos para começar o consumo.</span>
              </div>

              <div v-else class="consumption-list">
                <div v-for="item in tableItems" :key="item.id" class="consumption-item">
                  <div class="item-main">
                    <div class="item-qty">{{ item.quantity }}×</div>
                    <div>
                      <strong>{{ item.product_name }}</strong>
                      <span v-if="item.addons_description">{{ item.addons_description }}</span>
                      <small v-if="item.printed">Enviado à cozinha</small>
                    </div>
                  </div>
                  <strong class="item-price">R$ {{ (Number(item.price) * Number(item.quantity)).toFixed(2) }}</strong>
                </div>
              </div>

              <div class="total-row">
                <span>Total</span>
                <strong>R$ {{ calculateTotal.toFixed(2) }}</strong>
              </div>

              <div class="operation-actions">
                <button class="primary-btn wide" @click="openProductCatalog">+ Lançar produtos</button>
                <div class="operation-subactions">
                  <button class="light-btn kitchen" @click="printPartialKitchen" :disabled="unprintedItemsCount === 0">
                    Cozinha <b>{{ unprintedItemsCount }}</b>
                  </button>
                  <button class="light-btn" @click="printFullReceipt" :disabled="tableItems.length === 0">Conta</button>
                  <button class="light-btn danger" @click="setTableStatusToCleaning(selectedTable.id)">Encerrar</button>
                </div>
              </div>
            </section>

            <!-- Catalog -->
            <section v-if="showCatalogInline" class="catalog-panel">
              <div class="panel-head">
                <div>
                  <span class="panel-kicker">Cardápio</span>
                  <h4>Adicionar produtos</h4>
                </div>
                <button class="close-btn small" @click="showCatalogInline = false" aria-label="Fechar cardápio">×</button>
              </div>

              <div class="search-box">
                <span>⌕</span>
                <input v-model="searchQuery" type="text" placeholder="Buscar produto..." />
                <button v-if="searchQuery" @click="searchQuery = ''" aria-label="Limpar busca">×</button>
              </div>

              <div v-if="categories.length" class="category-row">
                <button :class="{ active: selectedCategory === 'all' }" @click="selectedCategory = 'all'">Todos</button>
                <button
                  v-for="cat in categories"
                  :key="cat"
                  :class="{ active: selectedCategory === cat }"
                  @click="selectedCategory = cat"
                >{{ cat }}</button>
              </div>

              <div v-if="filteredProducts.length" class="product-picker">
                <button
                  v-for="prod in filteredProducts"
                  :key="prod.id"
                  class="picker-item"
                  @click="selectProductForAddons(prod)"
                >
                  <span>{{ prod.name }}</span>
                  <strong>R$ {{ Number(prod.price).toFixed(2) }}</strong>
                </button>
              </div>
              <div v-else class="empty-search">Nenhum produto encontrado.</div>

              <div v-if="activeProductForAddon" class="product-config">
                <div class="selected-product">
                  <div>
                    <span class="panel-kicker">Personalização</span>
                    <strong>{{ activeProductForAddon.name }}</strong>
                  </div>
                  <button @click="activeProductForAddon = null" aria-label="Fechar personalização">×</button>
                </div>

                <div v-if="availableAddons.length" class="addons">
                  <label v-for="addon in availableAddons" :key="addon.id" class="addon-option">
                    <input type="checkbox" v-model="selectedAddons" :value="addon" />
                    <span>{{ addon.name }}</span>
                    <strong>+ R$ {{ Number(addon.price).toFixed(2) }}</strong>
                  </label>
                </div>
                <p v-else class="no-addon">Nenhum adicional disponível para este produto.</p>

                <label class="observation">
                  <span>Observação</span>
                  <input v-model="itemObservation" type="text" placeholder="Ex.: sem cebola, bem passado..." />
                </label>

                <button class="secondary-btn wide" @click="addProductToPendingCart">Adicionar à prévia</button>
              </div>

              <div v-if="pendingItems.length" class="pending-box">
                <div class="pending-head">
                  <span>Prévia do lançamento</span>
                  <strong>{{ pendingItems.length }} item(ns)</strong>
                </div>
                <div v-for="(pItem, idx) in pendingItems" :key="idx" class="pending-row">
                  <div>
                    <strong>{{ pItem.product_name }}</strong>
                    <span v-if="pItem.addons_description">{{ pItem.addons_description }}</span>
                  </div>
                  <div>
                    <b>R$ {{ Number(pItem.price).toFixed(2) }}</b>
                    <button @click="removePendingItem(idx)" aria-label="Remover item">×</button>
                  </div>
                </div>
                <button class="primary-btn wide" @click="confirmAllPendingItems">Confirmar lançamento</button>
              </div>
            </section>

            <button v-else class="catalog-launch" @click="openProductCatalog">
              <span class="catalog-plus">+</span>
              <div>
                <strong>Adicionar produtos</strong>
                <span>Abra o cardápio para lançar itens na mesa.</span>
              </div>
              <span class="catalog-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
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
  category?: string;
  category_name?: string;
  tags?: string[];
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
  observation?: string;
}

export interface PendingItem {
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  addons_description: string | null;
  observation?: string;
  selected_options: Array<{ name: string; price: number }>;
}

const props = defineProps<{
  storeId?: string;
  slug?: string;
}>();

const route = useRoute();
const activeStoreId = ref<string>('');

const tables = ref<TableTab[]>([]);
const storeProducts = ref<Product[]>([]);
const availableAddons = ref<Addon[]>([]);
const selectedAddons = ref<Addon[]>([]);
const itemObservation = ref<string>('');
const activeProductForAddon = ref<Product | null>(null);
const pendingItems = ref<PendingItem[]>([]);
const tableItems = ref<OrderItem[]>([]);
const activeOrderId = ref<string | null>(null);
const kitchenAlert = ref<string | null>(null);

const searchQuery = ref('');
const selectedCategory = ref('all');

let realtimeChannel: RealtimeChannel | null = null;
let kitchenAlertChannel: RealtimeChannel | null = null;

const showOpenModal = ref(false);
const formTableNumber = ref('');
const formCustomerName = ref('');

const showOccupyModal = ref(false);
const tableToOccupy = ref<TableTab | null>(null);
const occupyCustomerName = ref('');

const selectedTable = ref<TableTab | null>(null);
const showCatalogInline = ref(false);

const freeTablesCount = computed(() => tables.value.filter(t => t.status === 'free').length);
const busyTablesCount = computed(() => tables.value.filter(t => t.status === 'busy').length);
const cleaningTablesCount = computed(() => tables.value.filter(t => t.status === 'cleaning').length);

const getStatusLabel = (status: string) => {
  if (status === 'busy') return 'Ocupada';
  if (status === 'cleaning') return 'Em Limpeza';
  return 'Livre';
};

const getTableSubtitle = (table: TableTab) => {
  if (table.status === 'busy') return table.customer_name || 'Cliente';
  if (table.status === 'cleaning') return 'Higienização';
  return 'Disponível';
};

const unprintedItemsCount = computed(() => {
  return tableItems.value.filter(i => !i.printed).length;
});

const groupItemsForPrinting = (items: OrderItem[]) => {
  const groupedMap = new Map<string, {
    product_name: string;
    quantity: number;
    price: number;
    selected_options: unknown;
    addons_description?: string;
  }>();

  items.forEach((item) => {
    const addonsKey = item.addons_description || JSON.stringify(item.selected_options || []);
    const groupKey = `${item.product_name}___${addonsKey}`;

    if (groupedMap.has(groupKey)) {
      const existing = groupedMap.get(groupKey)!;
      existing.quantity += item.quantity || 1;
    } else {
      groupedMap.set(groupKey, {
        product_name: item.product_name,
        quantity: item.quantity || 1,
        price: Number(item.price || 0),
        selected_options: item.selected_options || [],
        addons_description: item.addons_description
      });
    }
  });

  return Array.from(groupedMap.values());
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const categories = computed(() => {
  const cats = storeProducts.value
    .map((p) => p.category || p.category_name)
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set(cats));
});

const filteredProducts = computed(() => {
  const query = normalizeText(searchQuery.value.trim());

  return storeProducts.value.filter((product) => {
    const prodCategory = product.category || product.category_name || '';

    if (selectedCategory.value !== 'all' && prodCategory !== selectedCategory.value) {
      return false;
    }

    if (!query) return true;

    const nameMatch = normalizeText(product.name).includes(query);
    const categoryMatch = normalizeText(prodCategory).includes(query);
    const tagMatch = product.tags?.some((tag) => normalizeText(tag).includes(query)) ?? false;

    return nameMatch || categoryMatch || tagMatch;
  });
});

const playNotificationSound = () => {
  try {
    const windowWithWebkit = window as unknown as {
      AudioContext: typeof AudioContext;
      webkitAudioContext: typeof AudioContext;
    };
    const AudioContextClass = windowWithWebkit.AudioContext || windowWithWebkit.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Não foi possível tocar o áudio de notificação:', e);
  }
};

const resolveStoreId = async () => {
  if (props.storeId) {
    activeStoreId.value = props.storeId;
    return;
  }

  const currentSlug = props.slug || (route.params.slug as string);
  if (!currentSlug) return;

  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', currentSlug)
    .maybeSingle();

  if (!error && data?.id) {
    activeStoreId.value = data.id;
  }
};

const loadTables = async () => {
  if (!activeStoreId.value) return;

  const { data, error } = await supabase
    .from('tables_tabs')
    .select('*')
    .eq('company_id', activeStoreId.value);

  if (!error && data) {
    const rawTables = data as TableTab[];
    tables.value = rawTables.sort((a, b) => {
      const numA = parseInt(a.table_number, 10);
      const numB = parseInt(b.table_number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.table_number.localeCompare(b.table_number, undefined, { numeric: true });
    });
  }
};

const loadProducts = async () => {
  if (!activeStoreId.value) return;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', activeStoreId.value)
    .eq('active', true);

  if (!error && data) {
    storeProducts.value = data as Product[];
  }
};

const loadAddons = async () => {
  availableAddons.value = [];
  const { data: optionData, error: optionError } = await supabase.from('option_items').select('*');
  if (!optionError && optionData && optionData.length > 0) {
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
  pendingItems.value = [];
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
  // Busca pedido ativo ignorando apenas pedidos já totalmente encerrados/pagos da comanda
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .neq('status', 'pago')
    .neq('status', 'fechado')
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (orderError || !orderData) {
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
    realtimeChannel = null;
  }

  if (!orderId) return;

  realtimeChannel = supabase
    .channel(`public:order_items:order_id=eq.${orderId}`)
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${orderId}`
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
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

const subscribeToKitchenNotifications = () => {
  if (!activeStoreId.value) return;

  if (kitchenAlertChannel) {
    supabase.removeChannel(kitchenAlertChannel);
    kitchenAlertChannel = null;
  }

  kitchenAlertChannel = supabase
    .channel('kitchen_notifications')
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${activeStoreId.value}`
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const updatedOrder = payload.new as { id: string; table_id?: number | string; status?: string };
        if (updatedOrder && updatedOrder.status && updatedOrder.status.toLowerCase() === 'pronto' && updatedOrder.table_id) {
          const matchedTable = tables.value.find(t => String(t.id) === String(updatedOrder.table_id));
          const tableNum = matchedTable ? matchedTable.table_number : updatedOrder.table_id;
          kitchenAlert.value = `O pedido da Mesa ${tableNum} está PRONTO na cozinha!`;
          playNotificationSound();
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
  pendingItems.value = [];
  searchQuery.value = '';
  selectedCategory.value = 'all';
};

const calculateTotal = computed(() => {
  return tableItems.value.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
});

const openProductCatalog = () => {
  loadProducts();
  loadAddons();
  pendingItems.value = [];
  searchQuery.value = '';
  selectedCategory.value = 'all';
  showCatalogInline.value = true;
  activeProductForAddon.value = null;
  itemObservation.value = '';
};

const selectProductForAddons = (prod: Product) => {
  activeProductForAddon.value = prod;
  selectedAddons.value = [];
  itemObservation.value = '';
  loadAddons();
};

const addProductToPendingCart = () => {
  if (!activeProductForAddon.value) return;

  const prod = activeProductForAddon.value;
  const addonsTotal = selectedAddons.value.reduce((sum, a) => sum + Number(a.price), 0);
  const finalUnitPrice = Number(prod.price) + addonsTotal;

  let addonsDesc = selectedAddons.value.map(a => a.name).join(', ');
  if (itemObservation.value.trim()) {
    addonsDesc = addonsDesc
      ? `${addonsDesc} (Obs: ${itemObservation.value.trim()})`
      : `Obs: ${itemObservation.value.trim()}`;
  }

  pendingItems.value.push({
    product_id: prod.id ? String(prod.id) : null,
    product_name: prod.name,
    price: finalUnitPrice,
    quantity: 1,
    addons_description: addonsDesc || null,
    observation: itemObservation.value.trim() || undefined,
    selected_options: selectedAddons.value.map(a => ({ name: a.name, price: a.price }))
  });

  activeProductForAddon.value = null;
  selectedAddons.value = [];
  itemObservation.value = '';
};

const removePendingItem = (index: number) => {
  pendingItems.value.splice(index, 1);
};

const confirmAllPendingItems = async () => {
  if (!selectedTable.value || !activeStoreId.value || pendingItems.value.length === 0) return;

  let orderId: string | null = activeOrderId.value;

  if (!orderId) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', selectedTable.value.id)
      .neq('status', 'pago')
      .neq('status', 'fechado')
      .neq('status', 'cancelado')
      .maybeSingle();

    if (existingOrder) {
      orderId = existingOrder.id;
    } else {
      const newOrderPayload = {
        store_id: activeStoreId.value,
        table_id: selectedTable.value.id,
        status: 'open',
        customer_name: selectedTable.value.customer_name || `Mesa ${selectedTable.value.table_number}`,
        customer_phone: '00000000000',
        total: 0
      };

      const { data: newOrder, error: newOrderError } = await supabase
        .from('orders')
        .insert([newOrderPayload])
        .select('id')
        .single();

      if (newOrderError || !newOrder) {
        alert('Erro ao iniciar comanda da mesa.');
        return;
      }
      orderId = newOrder.id;
    }

    activeOrderId.value = orderId;
    subscribeToRealtime(orderId);
  }

  const payloadList = pendingItems.value.map(item => ({
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price,
    quantity: item.quantity,
    printed: false,
    addons_description: item.addons_description,
    selected_options: item.selected_options
  }));

  const { error } = await supabase.from('order_items').insert(payloadList);

  if (!error) {
    pendingItems.value = [];
    showCatalogInline.value = false;
    await loadTableConsumption(selectedTable.value.id);
  } else {
    alert('Erro ao lançar itens.');
  }
};

const printPartialKitchen = async () => {
  const unprintedItems = tableItems.value.filter(item => !item.printed);

  if (unprintedItems.length === 0) {
    alert('Não há novos itens pendentes para a cozinha.');
    return;
  }

  const unprintedIds = unprintedItems.map(i => i.id);

  const { error } = await supabase
    .from('order_items')
    .update({ printed: true })
    .in('id', unprintedIds);

  if (error) {
    alert('Erro ao atualizar o status no banco de dados.');
    return;
  }

  tableItems.value = tableItems.value.map(item => {
    if (unprintedIds.includes(item.id)) {
      return { ...item, printed: true };
    }
    return item;
  });

  const groupedKitchenItems = groupItemsForPrinting(unprintedItems);

  try {
    await fetch('http://localhost:3000/print-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'kitchen',
        table_number: selectedTable.value?.table_number,
        customer_name: selectedTable.value?.customer_name || 'Mesa',
        items: groupedKitchenItems,
        notes: selectedTable.value?.notes || ''
      })
    });
  } catch (err) {
    console.warn('Servidor de impressão offline.', err);
  }

  if (selectedTable.value) {
    await loadTableConsumption(selectedTable.value.id);
  }
};

const printFullReceipt = async () => {
  if (!selectedTable.value || tableItems.value.length === 0) return;

  const groupedReceiptItems = groupItemsForPrinting(tableItems.value);

  const printPayload = {
    type: 'receipt',
    table_number: selectedTable.value.table_number,
    customer_name: selectedTable.value.customer_name || 'Mesa',
    items: groupedReceiptItems,
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
      alert('✅ Conta enviada para impressão!');
    } else {
      alert('❌ Falha na impressão da conta.');
    }
  } catch {
    alert('❌ Não foi possível conectar ao impressor local.');
  }
};

const handleOpenTable = async () => {
  if (!formTableNumber.value || !activeStoreId.value) return;

  const { error } = await supabase.from('tables_tabs').insert([{
    company_id: activeStoreId.value,
    table_number: formTableNumber.value,
    customer_name: formCustomerName.value || 'Geral',
    status: 'busy'
  }]);

  if (error) {
    alert('Erro ao abrir a mesa.');
    return;
  }

  formTableNumber.value = '';
  formCustomerName.value = '';
  showOpenModal.value = false;
  await loadTables();
};

const confirmOccupyTable = async () => {
  if (!tableToOccupy.value || !occupyCustomerName.value) return;

  const { error } = await supabase
    .from('tables_tabs')
    .update({ customer_name: occupyCustomerName.value, status: 'busy' })
    .eq('id', tableToOccupy.value.id);

  if (error) {
    alert('Erro ao ocupar a mesa.');
    return;
  }

  showOccupyModal.value = false;
  await loadTables();
};

const setTableStatusToCleaning = async (tableId: number) => {
  if (activeOrderId.value) {
    await supabase.from('orders').update({ status: 'fechado' }).eq('id', activeOrderId.value);
  }
  await supabase.from('tables_tabs').update({ status: 'cleaning', customer_name: null }).eq('id', tableId);
  closeTableModal();
  await loadTables();
};

const setTableStatusToFree = async (tableId: number) => {
  if (activeOrderId.value) {
    await supabase.from('orders').update({ status: 'fechado' }).eq('id', activeOrderId.value);
  }
  await supabase.from('tables_tabs').update({ status: 'free', customer_name: null }).eq('id', tableId);
  closeTableModal();
  await loadTables();
};

onMounted(async () => {
  await resolveStoreId();
  if (activeStoreId.value) {
    await loadTables();
    subscribeToKitchenNotifications();
  }
});

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  if (kitchenAlertChannel) supabase.removeChannel(kitchenAlertChannel);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

:global(body) { margin:0; background:#f5f2ed; }
* { box-sizing:border-box; }
.waiter-page {
  min-height:100vh;
  color:#222522;
  background:
    radial-gradient(circle at top left, rgba(255,255,255,.8), transparent 32%),
    #f5f2ed;
  font-family:'DM Sans',system-ui,sans-serif;
  padding:28px;
}
.topbar{
  max-width:1260px;margin:0 auto 36px;display:flex;align-items:center;justify-content:space-between;
  gap:24px;
}
.topbar-left{display:flex;align-items:center;gap:14px}
.brand-mark{
  width:44px;height:44px;border-radius:13px;background:#252925;color:#fff;display:grid;place-items:center;
  font-family:Manrope,sans-serif;font-weight:800;font-size:18px;box-shadow:0 8px 20px rgba(37,41,37,.12)
}
.eyebrow,.section-kicker,.modal-kicker,.workspace-kicker,.panel-kicker{
  display:block;text-transform:uppercase;letter-spacing:.12em;font-size:10px;font-weight:700;color:#8b8c86
}
.topbar h1{margin:2px 0 0;font:800 25px/1.05 Manrope,sans-serif;letter-spacing:-.03em}
.topbar-actions{display:flex;gap:10px}
button{font:inherit;border:0}
.primary-btn,.ghost-btn,.secondary-btn,.light-btn{
  min-height:44px;padding:0 17px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  cursor:pointer;transition:.2s ease
}
.primary-btn{background:#252925;color:#fff;box-shadow:0 10px 24px rgba(37,41,37,.15);font-weight:700}
.primary-btn:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(37,41,37,.18)}
.ghost-btn{background:#fff;color:#343833;border:1px solid #e7e3dc;font-weight:600}
.ghost-btn:hover,.secondary-btn:hover,.light-btn:hover{border-color:#cfcac1;background:#fdfcf9}
.plus{font-size:19px;line-height:0}.btn-icon{font-size:18px}
.page-shell{max-width:1260px;margin:0 auto}
.overview{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:20px}
.overview h2{margin:5px 0 4px;font:800 33px/1 Manrope,sans-serif;letter-spacing:-.04em}
.section-subtitle{margin:0;color:#777a73;font-size:13px}
.status-summary{display:flex;align-items:center;gap:22px;background:#fff;border:1px solid #e7e3dc;border-radius:16px;padding:12px 16px}
.summary-item{display:flex;align-items:center;gap:6px;color:#81847e;font-size:12px}
.summary-item strong{color:#262a26;font-size:14px}.summary-dot{width:7px;height:7px;border-radius:50%}
.summary-dot.free{background:#51a97b}.summary-dot.busy{background:#c78136}.summary-dot.cleaning{background:#8d8c87}
.tables-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.table-card{
  text-align:left;padding:18px;border:1px solid #e5e1da;background:#fff;border-radius:18px;cursor:pointer;
  min-height:150px;display:flex;flex-direction:column;justify-content:space-between;transition:.22s ease;position:relative;overflow:hidden
}
.table-card:before{content:"";position:absolute;left:0;top:0;width:4px;height:100%;background:#d9d5cd;opacity:.8}
.table-card.busy:before{background:#c78136}.table-card.cleaning:before{background:#8d8c87}.table-card.free:before{background:#51a97b}
.table-card:hover{transform:translateY(-3px);box-shadow:0 16px 30px rgba(39,35,28,.08);border-color:#d7d1c8}
.table-card-head,.table-footer,.table-title-line{display:flex;align-items:center;justify-content:space-between;gap:8px}
.table-label{font-size:10px;letter-spacing:.12em;font-weight:800;color:#a0a098}
.table-status{font-size:10px;font-weight:700;padding:5px 8px;border-radius:999px;background:#f3f2ef;color:#7b7d77}
.table-status.busy{background:#fbf0e6;color:#a96828}.table-status.free{background:#eaf6ef;color:#3e8b61}.table-status.cleaning{background:#eeecea;color:#76756f}
.table-number{font:800 42px/1 Manrope,sans-serif;letter-spacing:-.05em;margin:8px 0}
.table-footer{font-size:12px;color:#83857f}.table-arrow{font-size:17px;color:#9c9d97}
.empty-tables{grid-column:1/-1;min-height:260px;display:grid;place-items:center;text-align:center;background:#fff;border:1px dashed #d9d5cd;border-radius:20px;padding:40px}
.empty-tables .empty-visual{font-size:38px;color:#aaa69e}.empty-tables strong{display:block;margin-top:8px;font:700 16px Manrope}.empty-tables span{color:#8b8c86;font-size:13px;margin-top:4px}

.kitchen-alert{
  position:fixed;right:24px;top:22px;z-index:100;max-width:430px;background:#252925;color:#fff;
  border-radius:16px;padding:14px 14px 14px 12px;display:flex;align-items:center;gap:12px;box-shadow:0 22px 50px rgba(28,31,27,.25)
}
.alert-symbol{width:34px;height:34px;border-radius:10px;background:#d68b3d;display:grid;place-items:center;font-weight:800}
.alert-copy{display:flex;flex-direction:column;gap:2px;flex:1}.alert-copy strong{font-size:12px}.alert-copy span{font-size:12px;color:#d7d9d4}
.alert-close{background:transparent;color:#fff;font-size:21px;cursor:pointer;padding:6px}

.overlay{position:fixed;inset:0;background:rgba(20,21,19,.48);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:80;padding:20px}
.modal{background:#fbfaf7;border-radius:24px;box-shadow:0 28px 80px rgba(25,23,19,.25);width:min(100%,960px);max-height:90vh;overflow:auto}
.modal-small{width:min(100%,470px)}
.modal-head,.workspace-header{display:flex;justify-content:space-between;align-items:flex-start;padding:26px 28px;border-bottom:1px solid #ebe7df}
.modal-head h3,.workspace-header h3{margin:5px 0 0;font:800 24px Manrope;letter-spacing:-.03em}
.close-btn,.back-btn{
  width:38px;height:38px;border-radius:10px;background:#efede8;color:#60625c;display:grid;place-items:center;cursor:pointer;font-size:21px
}
.close-btn.small{width:34px;height:34px}
.modal-form{padding:26px 28px;display:grid;gap:18px}
.modal-form label,.observation{display:grid;gap:8px}
.modal-form label span,.observation span{font-size:12px;font-weight:700;color:#565a54}.modal-form em{font-style:normal;font-weight:500;color:#969890}
input{
  width:100%;height:46px;border:1px solid #ddd8cf;background:#fff;border-radius:12px;padding:0 13px;color:#262a26;outline:none;
  font:500 14px 'DM Sans'
}
input:focus{border-color:#9a978f;box-shadow:0 0 0 3px rgba(154,151,143,.11)}
.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:4px}.secondary-btn{background:#fff;border:1px solid #ded9d1;color:#4d514b;font-weight:700}
.workspace-overlay{align-items:stretch}
.modal-workspace{width:min(100%,1180px);max-height:none;height:calc(100vh - 40px);overflow:hidden;display:flex;flex-direction:column}
.workspace-header{padding:20px 24px}.workspace-title{display:flex;gap:12px}.table-title-line{justify-content:flex-start}.table-title-line h3{font-size:24px;margin:0}
.workspace-header p{margin:5px 0 0;color:#7d7f78;font-size:12px}.back-btn{width:34px;height:34px;font-size:19px}
.customer-pill{padding:5px 9px;border-radius:999px;background:#eeeae3;color:#686a63;font-size:11px;font-weight:700}
.workspace-grid{flex:1;min-height:0;display:grid;grid-template-columns:minmax(420px,1fr) minmax(380px,1fr);gap:1px;background:#ebe6dd}
.consumption-panel,.catalog-panel{background:#fbfaf7;min-height:0;overflow:auto;padding:24px}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.panel-head h4{margin:4px 0 0;font:800 19px Manrope;letter-spacing:-.02em}
.items-count{font-size:11px;font-weight:700;color:#888a84}
.empty-consumption{min-height:260px;border:1px dashed #d9d4ca;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#8b8d86}
.empty-plate{width:50px;height:50px;border-radius:16px;background:#f0ede7;display:grid;place-items:center;font-size:28px;margin-bottom:10px}
.empty-consumption strong{font:700 14px Manrope;color:#555951}.empty-consumption span{font-size:12px;margin-top:4px}
.consumption-list{display:grid;gap:8px}.consumption-item{background:#fff;border:1px solid #ebe6dd;border-radius:14px;padding:13px;display:flex;justify-content:space-between;gap:12px;align-items:center}
.item-main{display:flex;gap:11px;min-width:0}.item-qty{width:32px;height:32px;border-radius:10px;background:#f1eee8;display:grid;place-items:center;font-size:11px;font-weight:800}
.item-main strong{display:block;font-size:13px}.item-main span{display:block;color:#7c7f78;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:330px}.item-main small{display:inline-block;color:#488061;font-size:10px;margin-top:4px}
.item-price{font-size:13px;white-space:nowrap}.total-row{border-top:1px solid #e7e2da;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end}.total-row span{font-size:12px;color:#858880}.total-row strong{font:800 25px Manrope}
.operation-actions{margin-top:18px;display:grid;gap:9px}.wide{width:100%}.operation-subactions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.light-btn{background:#fff;border:1px solid #ded9d1;color:#555951;font-weight:700;font-size:12px}.light-btn:disabled{opacity:.45;cursor:not-allowed}.light-btn.kitchen{color:#8d622d}.light-btn.danger{color:#a6544b}
.catalog-panel{border-left:1px solid #ebe6dd}.search-box{height:46px;border:1px solid #ddd8cf;background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 12px;gap:8px}.search-box span{font-size:22px;color:#aaa79f}.search-box input{border:0;box-shadow:none;height:44px;padding:0}.search-box button{background:none;cursor:pointer;color:#8a8c85;font-size:18px}
.category-row{display:flex;gap:7px;overflow:auto;padding:11px 0 3px;scrollbar-width:none}.category-row::-webkit-scrollbar{display:none}.category-row button{white-space:nowrap;border:1px solid #ded9d1;background:#fff;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:700;color:#777970;cursor:pointer}.category-row button.active{background:#252925;color:#fff;border-color:#252925}
.product-picker{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.picker-item{min-height:66px;padding:11px;text-align:left;background:#fff;border:1px solid #ebe6dd;border-radius:13px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;cursor:pointer}.picker-item:hover{border-color:#bdb8ae;background:#fdfcf9}.picker-item span{font-size:12px;font-weight:700;color:#373b35}.picker-item strong{font-size:11px;white-space:nowrap}.empty-search{padding:30px;text-align:center;color:#8a8c85;font-size:12px}
.product-config{margin-top:14px;padding:16px;background:#f1eee8;border-radius:16px}.selected-product{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.selected-product strong{display:block;font-size:14px;margin-top:4px}.selected-product button,.pending-row button{background:none;color:#858880;cursor:pointer;font-size:18px}
.addons{display:grid;gap:7px}.addon-option{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:10px;border-radius:10px;background:#fff;border:1px solid #e5e0d8}.addon-option input{width:15px;height:15px}.addon-option span{font-size:11px;font-weight:600}.addon-option strong{font-size:10px;color:#8a8c84}.no-addon{font-size:11px;color:#8a8c84}.observation{margin-top:11px}.observation input{height:42px}
.pending-box{margin-top:14px;background:#252925;color:#fff;border-radius:16px;padding:14px}.pending-head{display:flex;justify-content:space-between;font-size:11px;color:#cdd0c9;margin-bottom:8px}.pending-row{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.08)}.pending-row strong{font-size:12px;display:block}.pending-row span{font-size:10px;color:#aeb1a9;display:block;margin-top:2px}.pending-row b{font-size:11px}.pending-row button{color:#b6b9b2;margin-left:7px}.pending-box .primary-btn{margin-top:8px;background:#fff;color:#252925;box-shadow:none}
.catalog-launch{grid-column:2;background:#fbfaf7;border:0;border-left:1px solid #ebe6dd;padding:24px;display:flex;align-items:center;gap:14px;text-align:left;cursor:pointer}
.catalog-plus{width:54px;height:54px;border-radius:16px;background:#efebe4;display:grid;place-items:center;font:500 32px Manrope;color:#777970}.catalog-launch strong{display:block;font:800 16px Manrope}.catalog-launch span{display:block;color:#888a83;font-size:12px;margin-top:4px}.catalog-arrow{margin-left:auto;font-size:21px!important;color:#6c6f68!important}
.cleaning-panel{margin:auto;max-width:460px;text-align:center;padding:50px}.cleaning-icon{width:68px;height:68px;margin:0 auto 14px;border-radius:22px;background:#ede9e2;display:grid;place-items:center;font-size:26px;color:#7b7d75}.cleaning-panel h4{font:800 20px Manrope;margin:0}.cleaning-panel p{font-size:13px;color:#858880;line-height:1.5;margin:8px 0 20px}
.alert-enter-active,.alert-leave-active,.modal-enter-active,.modal-leave-active{transition:.2s ease}.alert-enter-from,.alert-leave-to{opacity:0;transform:translateY(-10px)}.modal-enter-from,.modal-leave-to{opacity:0}.modal-enter-from .modal,.modal-leave-to .modal{transform:translateY(14px) scale(.985)}

@media (max-width:1000px){
  .tables-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
  .workspace-grid{grid-template-columns:1fr}
  .catalog-panel{border-left:0;border-top:1px solid #ebe6dd}
  .catalog-launch{grid-column:1;border-left:0}
}
@media (max-width:760px){
  .waiter-page{padding:16px;padding-bottom:90px}.topbar{align-items:flex-start;margin-bottom:26px}.topbar-actions .ghost-btn span:not(.btn-icon){display:none}.topbar-actions .ghost-btn{width:44px;padding:0}
  .topbar h1{font-size:21px}.overview{display:block}.status-summary{margin-top:16px;justify-content:space-between}
  .tables-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.table-card{min-height:135px;padding:15px}.table-number{font-size:36px}
  .overlay{padding:0;align-items:flex-end}.modal-workspace{height:100dvh;width:100%;border-radius:22px 22px 0 0}.modal-small{width:100%;border-radius:22px 22px 0 0;max-height:92dvh}
  .workspace-grid{display:block;overflow:auto}.consumption-panel,.catalog-panel{padding:18px}.catalog-launch{padding:20px}.product-picker{grid-template-columns:1fr}
  .operation-subactions{grid-template-columns:1fr 1fr}.operation-subactions .danger{grid-column:1/-1}.kitchen-alert{left:12px;right:12px;top:12px}
}
</style>
