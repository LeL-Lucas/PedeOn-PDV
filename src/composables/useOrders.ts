import { ref, unref, watch, onUnmounted, type Ref } from 'vue'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface OrderItem {
  id?: string
  order_id?: string
  product_id?: string | null
  product_name?: string
  name?: string
  quantity?: number
  price?: number
  printed?: boolean
  addons_description?: string
  selected_options?: unknown
}

export interface Order {
  id: string
  store_id?: string
  table_id?: number | string | null
  customer_name?: string
  customer_phone?: string
  total?: number
  total_amount?: number
  status: string
  payment_method?: string
  delivery_type?: string
  address?: string
  created_at: string
  items?: OrderItem[]
  order_items?: OrderItem[]
  [key: string]: unknown
}

export function useOrders(storeIdParam: Ref<string> | string) {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let realtimeChannel: RealtimeChannel | null = null

  const getStoreId = (): string => {
    return unref(storeIdParam) || ''
  }

  const fetchOrders = async () => {
    const id = getStoreId()

    if (!id || id.trim() === '') {
      orders.value = []
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      // 1. Busca os pedidos da loja sem forçar o join do Postgres
      const { data: fetchedOrders, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', id)
        .order('created_at', { ascending: false })

      if (fetchErr) {
        error.value = fetchErr.message
        orders.value = []
        return
      }

      if (!fetchedOrders || fetchedOrders.length === 0) {
        orders.value = []
        return
      }

      // 2. Busca os itens vinculados em separado para evitar Erro 400
      const orderIds = fetchedOrders.map((o) => o.id)
      const { data: fetchedItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      const itemsMap = new Map<string, OrderItem[]>()
      if (fetchedItems) {
        fetchedItems.forEach((item) => {
          if (!itemsMap.has(item.order_id)) {
            itemsMap.set(item.order_id, [])
          }
          itemsMap.get(item.order_id)!.push(item as OrderItem)
        })
      }

      // 3. Monta a lista combinada
      orders.value = fetchedOrders.map((order) => {
        const items = itemsMap.get(order.id) || order.items || order.order_items || []
        return {
          ...order,
          items,
          order_items: items
        } as Order
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Erro ao carregar os pedidos.'
      }
      orders.value = []
    } finally {
      loading.value = false
    }
  }

  const subscribeToOrders = (onNewOrder?: (order: Order) => void) => {
    const id = getStoreId()

    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }

    if (!id || id.trim() === '') return null

    realtimeChannel = supabase
      .channel(`public:orders:store=${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${id}`
        },
        (payload) => {
          fetchOrders()
          if (onNewOrder && payload.new) {
            onNewOrder(payload.new as Order)
          }
        }
      )
      .subscribe()

    return realtimeChannel
  }

  watch(
    () => getStoreId(),
    (newId) => {
      if (newId) {
        fetchOrders()
        subscribeToOrders()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }
  })

  return {
    orders,
    loading,
    error,
    fetchOrders,
    subscribeToOrders
  }
}
