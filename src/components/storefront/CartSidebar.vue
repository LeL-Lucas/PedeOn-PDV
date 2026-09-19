<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <section class="cart-drawer" aria-label="Seu carrinho">
        <header class="cart-header">
          <div>
            <div class="eyebrow">Seu pedido</div>
            <h2>Seu carrinho</h2>
            <p>{{ cartStore.items.length }} {{ cartStore.items.length === 1 ? 'item' : 'itens' }}</p>
          </div>
          <button type="button" @click="closeModal" class="btn-close" aria-label="Fechar">&times;</button>
        </header>

        <div v-if="cartStore.items.length > 0" class="cart-content">
          <!-- LISTA DE ITENS -->
          <div class="order-section">
            <span class="section-title">01. Itens no pedido</span>
            <div class="items-list">
              <article v-for="(item, idx) in cartStore.items" :key="`${item.id}-${idx}`" class="cart-item">
                <div class="item-main">
                  <strong>{{ item.name }}</strong>
                  <span class="item-price">R$ {{ (Number(item.price) * item.quantity).toFixed(2) }}</span>
                </div>
                <div class="quantity-controls">
                  <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity - 1)" class="btn-qty">−</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity + 1)" class="btn-qty">+</button>
                </div>
              </article>
            </div>
          </div>

          <!-- FORMULÁRIO DO CLIENTE -->
          <form @submit.prevent="handleSubmitOrder" class="checkout-form">
            <div class="order-section">
              <span class="section-title">02. Seus dados</span>
              <div class="form-grid">
                <label class="field">
                  <span>Nome completo</span>
                  <input type="text" v-model="customerName" placeholder="Digite seu nome" required />
                </label>
                <label class="field">
                  <span>Telefone / WhatsApp</span>
                  <input type="tel" v-model="customerPhone" placeholder="(00) 00000-0000" required />
                </label>
              </div>
            </div>

            <div class="order-section">
              <span class="section-title">03. Forma de recebimento</span>
              <div class="delivery-switch">
                <button type="button" :class="['btn-toggle', { active: deliveryType === 'delivery' }]" @click="deliveryType = 'delivery'">Entrega</button>
                <button type="button" :class="['btn-toggle', { active: deliveryType === 'pickup' }]" @click="deliveryType = 'pickup'">Retirada</button>
              </div>

              <label v-if="deliveryType === 'delivery'" class="field">
                <span>Endereço de entrega</span>
                <input type="text" v-model="customerAddress" placeholder="Rua, número, bairro" required />
              </label>
            </div>

            <button type="submit" :disabled="isLoading" class="btn-submit">
              {{ isLoading ? 'Gravando pedido...' : 'Finalizar Pedido' }}
            </button>
          </form>
        </div>

        <div v-else class="empty-cart">
          <p>Seu carrinho está vazio.</p>
          <button type="button" @click="closeModal" class="btn-back">Voltar ao cardápio</button>
        </div>
      </section>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/services/supabase'

interface StoreProps {
  id?: string
  name?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    store?: StoreProps | null
  }>(),
  { isOpen: false, store: null }
)

const emit = defineEmits(['update:isOpen', 'close'])
const cartStore = useCartStore()

const customerName = ref('')
const customerPhone = ref('')
const deliveryType = ref<'delivery' | 'pickup'>('delivery')
const customerAddress = ref('')
const isLoading = ref(false)

const closeModal = () => {
  emit('update:isOpen', false)
  emit('close')
}

const handleSubmitOrder = async () => {
  if (!props.store?.id) {
    alert('Erro: Dados da loja não foram identificados.')
    return
  }

  isLoading.value = true

  try {
    const isDelivery = deliveryType.value === 'delivery'
    const finalAddress = isDelivery ? customerAddress.value : 'RETIRADA NO BALCAO'

    // 1. Grava o pedido no Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        store_id: props.store.id,
        customer_name: customerName.value,
        customer_phone: customerPhone.value,
        delivery_type: deliveryType.value,
        address: finalAddress,
        payment_method: 'A combinar',
        total: cartStore.totalAmount,
        status: 'pendente',
        preparation_time: '30'
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Grava os itens vinculados ao pedido
    if (orderData && cartStore.items.length > 0) {
      const itemsToInsert = cartStore.items.map(item => ({
        order_id: orderData.id,
        product_id: item.id ? String(item.id) : null,
        product_name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        selected_options: item.selected_options || []
      }))

      await supabase.from('order_items').insert(itemsToInsert)
    }

    // 3. Grava o ID no navegador e dispara o evento para o Mini Modal abrir
    localStorage.setItem('active_order_id', orderData.id)
    window.dispatchEvent(new CustomEvent('order-created'))

    // 4. Limpa o carrinho e fecha a gaveta
    cartStore.clearCart()
    closeModal()

  } catch (err: unknown) {
    const error = err as Error
    alert(`Erro ao salvar pedido: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; z-index: 9999; }
.cart-drawer { width: min(100%, 480px); height: 100vh; background: #fff; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.15); }
.cart-header { padding: 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-start; }
.eyebrow { font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; }
.cart-header h2 { margin: 4px 0 0; font-size: 22px; }
.cart-header p { margin: 2px 0 0; font-size: 13px; color: #666; }
.btn-close { border: none; background: transparent; font-size: 28px; cursor: pointer; color: #333; }

.cart-content { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; }
.order-section { display: flex; flex-direction: column; gap: 12px; }
.section-title { font-size: 12px; font-weight: 800; color: #888; text-transform: uppercase; }

.items-list { display: flex; flex-direction: column; gap: 10px; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9f9f9; border-radius: 10px; }
.item-main { display: flex; flex-direction: column; }
.item-price { font-size: 13px; color: #666; }
.quantity-controls { display: flex; align-items: center; gap: 8px; }
.btn-qty { width: 28px; height: 28px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-size: 16px; }

.form-grid { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field span { font-size: 12px; font-weight: 700; color: #444; }
.field input { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }

.delivery-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-toggle { padding: 12px; border: 1px solid #ddd; background: #fff; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-toggle.active { background: #111; color: #fff; border-color: #111; }

.btn-submit { width: 100%; padding: 16px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: 800; cursor: pointer; margin-top: 10px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.empty-cart { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.btn-back { padding: 10px 20px; background: #111; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
