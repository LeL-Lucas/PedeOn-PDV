<template>
  <transition name="modal-fade" @after-enter="handleAfterEnter">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <section class="cart-drawer" aria-label="Seu carrinho">
        <header class="cart-header">
          <div v-if="!isOrderCompleted">
            <div class="eyebrow">Seu pedido</div>
            <h2>Seu carrinho</h2>
            <p>{{ cartStore.items.length }} {{ cartStore.items.length === 1 ? 'item' : 'itens' }} no pedido</p>
          </div>
          <div v-else>
            <div class="eyebrow">Pagamento</div>
            <h2>{{ pixData ? 'Pague com Pix' : 'Pedido Recebido!' }}</h2>
            <p>{{ pixData ? 'Escaneie o QR Code ou copie o código abaixo' : 'Acompanhe o status do seu pedido' }}</p>
          </div>
          <button type="button" @click="closeModal" class="btn-close" aria-label="Fechar carrinho">&times;</button>
        </header>

        <!-- TELA 1: TELA DO PIX / SUCESSO -->
        <div v-if="isOrderCompleted" class="success-screen">
          <!-- EXIBIÇÃO DO PIX -->
          <div v-if="pixData" class="pix-container">
            <div class="pix-qr-wrapper" v-if="pixData.qrCodeBase64">
              <img :src="`data:image/png;base64,${pixData.qrCodeBase64}`" alt="QR Code Pix" class="pix-qr-img" />
            </div>

            <div class="pix-copy-box">
              <label>Código Pix Copia e Cola:</label>
              <textarea readonly :value="pixData.qrCode" rows="3" class="pix-textarea"></textarea>
              <button type="button" @click="copyPixCode" class="btn-copy-pix">
                {{ copiedPix ? '✓ Código Copiado!' : 'Copiar Código Pix' }}
              </button>
            </div>

            <p class="pix-instructions">
              Abra o app do seu banco, escolha a opção <strong>Pix Copia e Cola</strong> ou <strong>Escanear QR Code</strong> e finalize o pagamento.
            </p>
          </div>

          <!-- PAGO / CONFIRMADO -->
          <div v-else class="order-confirmed">
            <div class="success-icon">✓</div>
            <h3>Pedido Registrado!</h3>
            <p>Seu pedido foi registrado com sucesso e a cozinha já foi notificada.</p>
          </div>

          <div class="order-badge" v-if="createdOrderId">
            <span>NÚMERO DO PEDIDO</span>
            <strong>#{{ createdOrderId.slice(0, 8).toUpperCase() }}</strong>
          </div>

          <button type="button" @click="closeSuccessModal" class="btn-primary-action">
            Concluir
          </button>
        </div>

        <!-- TELA 2: CARRINHO COM ITENS E FORMULÁRIO -->
        <div v-else-if="cartStore.items.length > 0" class="cart-content">
          <div class="order-section">
            <div class="section-heading">
              <div><span>01</span>
                <h3>Itens</h3>
              </div>
              <span class="section-meta">Revise antes de pagar</span>
            </div>

            <div class="items-list">
              <article v-for="(item, idx) in cartStore.items" :key="`${item.id}-${idx}`" class="cart-item">
                <div class="item-thumb">
                  <span>{{ item.name?.charAt(0) || '•' }}</span>
                </div>
                <div class="item-main">
                  <div class="item-info">
                    <strong>{{ item.name }}</strong>
                    <span v-if="item.selected_options?.length" class="item-addons">
                      <template v-for="(opt, oIdx) in item.selected_options" :key="oIdx">
                        {{ oIdx ? ' · ' : '' }}{{ opt.name }}
                      </template>
                    </span>
                    <span class="item-unit-price">R$ {{ Number(item.price).toFixed(2) }} un.</span>
                  </div>
                  <div class="item-bottom">
                    <strong class="item-price">R$ {{ (Number(item.price) * item.quantity).toFixed(2) }}</strong>
                    <div class="quantity-controls">
                      <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity - 1)" class="btn-qty">−</button>
                      <span>{{ item.quantity }}</span>
                      <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity + 1)" class="btn-qty">+</button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <form @submit.prevent class="checkout-form">
            <div class="order-section">
              <div class="section-heading">
                <div><span>02</span>
                  <h3>Seus dados</h3>
                </div>
              </div>
              <div class="form-grid">
                <label class="field full">
                  <span>Nome completo</span>
                  <input type="text" v-model="customerName" placeholder="Como podemos te chamar?" required />
                </label>
                <label class="field full">
                  <span>Telefone / WhatsApp</span>
                  <input type="tel" v-model="customerPhone" placeholder="(00) 00000-0000" required />
                </label>
              </div>
            </div>

            <div class="order-section">
              <div class="section-heading">
                <div><span>03</span>
                  <h3>Como receber</h3>
                </div>
              </div>

              <div class="delivery-switch">
                <label :class="['delivery-option', { active: deliveryType === 'delivery' }]">
                  <input type="radio" v-model="deliveryType" value="delivery" name="deliveryType" />
                  <span class="delivery-icon">⌂</span>
                  <span><strong>Entrega</strong><small>Receba no seu endereço</small></span>
                </label>
                <label :class="['delivery-option', { active: deliveryType === 'pickup' }]">
                  <input type="radio" v-model="deliveryType" value="pickup" name="deliveryType" />
                  <span class="delivery-icon">↗</span>
                  <span><strong>Retirada</strong><small>Busque no balcão</small></span>
                </label>
              </div>

              <label v-if="deliveryType === 'delivery'" class="field address-field">
                <span>Endereço completo</span>
                <input type="text" v-model="customerAddress" placeholder="Rua, número, bairro" :required="deliveryType === 'delivery'" />
              </label>
            </div>

            <div class="order-section payment-block">
              <div class="section-heading">
                <div><span>04</span>
                  <h3>Pagamento</h3>
                </div>
                <span class="secure-label">Pagamento seguro</span>
              </div>
              <div class="payment-shell">
                <div id="paymentBrick_container"></div>
              </div>
            </div>
          </form>
        </div>

        <!-- TELA 3: CARRINHO VAZIO -->
        <div v-else class="empty-cart">
          <div class="empty-mark">＋</div>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione alguns itens deliciosos e volte aqui para finalizar.</p>
          <button type="button" @click="closeModal" class="btn-back-shopping">Voltar ao cardápio</button>
        </div>

        <footer v-if="cartStore.items.length > 0 && !isOrderCompleted" class="cart-footer">
          <div class="total-copy"><span>Total do pedido</span><strong>R$ {{ (Number(cartStore.totalAmount) || 0).toFixed(2) }}</strong></div>
        </footer>
      </section>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/services/supabase'
import { loadMercadoPago } from '@mercadopago/sdk-js'

interface MercadoPagoBrickController {
  unmount: () => Promise<void>
}

declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale?: string }
    ) => {
      bricks: () => {
        create: (
          type: string,
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<MercadoPagoBrickController>
      }
    }
  }
}

interface StoreProps {
  id?: string
  name?: string
  whatsapp_number?: string
  phone?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    store?: StoreProps | null
  }>(),
  {
    isOpen: false,
    store: null
  }
)

const emit = defineEmits(['update:isOpen', 'close'])

const cartStore = useCartStore()

const customerName = ref('')
const customerPhone = ref('')
const deliveryType = ref<'delivery' | 'pickup'>('delivery')
const customerAddress = ref('')

const isOrderCompleted = ref(false)
const createdOrderId = ref<string | null>(null)

const brickController = ref<MercadoPagoBrickController | null>(null)
const isInitializing = ref(false)

const pixData = ref<{
  qrCode: string
  qrCodeBase64: string
} | null>(null)

const copiedPix = ref(false)

const closeModal = async () => {
  try {
    if (brickController.value?.unmount) {
      await brickController.value.unmount()
      brickController.value = null
    }
  } catch(error) {
    console.warn('Erro fechando Brick:', error)
  }

  emit('update:isOpen', false)
  emit('close')

  setTimeout(() => {
    isOrderCompleted.value = false
    createdOrderId.value = null
    pixData.value = null
  }, 300)
}

const closeSuccessModal = () => {
  closeModal()
}

const copyPixCode = () => {
  if (pixData.value?.qrCode) {
    navigator.clipboard.writeText(pixData.value.qrCode)
    copiedPix.value = true

    setTimeout(() => {
      copiedPix.value = false
    }, 3000)
  }
}

const initPaymentBrick = async () => {
  if (isInitializing.value) return
  isInitializing.value = true

  try {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 250))

    const container = document.getElementById('paymentBrick_container')
    if (!container) return

    if (brickController.value) {
      try {
        await brickController.value.unmount()
      } catch {}
      brickController.value = null
    }

    container.innerHTML = ''
    await loadMercadoPago()

    const mp = new window.MercadoPago(
      import.meta.env.VITE_MP_PUBLIC_KEY,
      { locale: 'pt-BR' }
    )

    const bricksBuilder = mp.bricks()

    const settings = {
      initialization: {
        amount: Number(cartStore.totalAmount) || 0
      },
      customization: {
        paymentMethods: {
          creditCard: 'all',
          bankTransfer: 'all'
        }
      },
      callbacks: {
        onReady: () => {
          console.log('✅ Mercado Pago Brick pronto')
        },
        onSubmit: ({
          selectedPaymentMethod,
          formData
        }: {
          selectedPaymentMethod: string
          formData: Record<string, any>
        }) => {
          return processOrderAndPayment(
            selectedPaymentMethod,
            formData
          )
        },
        onError: (error: unknown) => {
          console.error('Erro Brick:', error)
        }
      }
    }

    brickController.value = await bricksBuilder.create(
      'payment',
      'paymentBrick_container',
      settings
    )
  } catch(error) {
    console.error('Erro inicializando MP:', error)
  } finally {
    isInitializing.value = false
  }
}

const handleAfterEnter = () => {
  if (cartStore.items.length > 0 && !isOrderCompleted.value) {
    initPaymentBrick()
  }
}

watch(
  () => props.isOpen,
  async (value) => {
    if (!value && brickController.value) {
      try {
        if (brickController.value.unmount) {
          await brickController.value.unmount()
        }
      } catch(error) {
        console.warn('Erro ao desmontar Mercado Pago Brick:', error)
      }
      brickController.value = null
    }
  }
)

onBeforeUnmount(async () => {
  if (brickController.value) {
    try {
      await brickController.value.unmount()
    } catch {}
  }
})

// ==============================
// PAGAMENTO
// ==============================

const processOrderAndPayment = async (
  selectedPaymentMethod: string,
  formData: Record<string, any>
) => {
  if (!customerName.value || !customerPhone.value) {
    throw new Error('Preencha seus dados')
  }

  if (deliveryType.value === 'delivery' && !customerAddress.value) {
    throw new Error('Informe o endereço')
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const payload = {
    transaction_amount: Number(cartStore.totalAmount),
    token: formData.token || null,
    payment_method_id: formData.payment_method_id || null,
    installments: Number(formData.installments || 1),
    issuer_id: formData.issuer_id ? Number(formData.issuer_id) : null,
    payer: {
      email: formData.payer?.email || 'cliente@email.com',
      identification: formData.payer?.identification || null
    },
    description: `Pedido ${props.store?.name || 'Loja'}`
  }

  const res = await fetch(
    'https://misntxirajngjcdpqwwn.supabase.co/functions/v1/create-payment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      },
      body: JSON.stringify(payload)
    }
  )

  const paymentResult = await res.json()

  if (!res.ok) {
    throw new Error(
      paymentResult.message ||
      paymentResult.error ||
      'Erro pagamento'
    )
  }

  // ==========================
  // PIX
  // ==========================
  if (
    paymentResult.payment_method_id === 'pix' &&
    paymentResult.point_of_interaction?.transaction_data
  ) {
    const txData = paymentResult.point_of_interaction.transaction_data
    pixData.value = {
      qrCode: txData.qr_code,
      qrCodeBase64: txData.qr_code_base64
    }
  }

  // ==========================
  // CARTÃO
  // ==========================
  if (
    selectedPaymentMethod === 'credit_card' &&
    paymentResult.status !== 'approved'
  ) {
    throw new Error(
      paymentResult.status_detail ||
      'Pagamento não aprovado'
    )
  }

  await executeOrderFlow(paymentResult)
}

const executeOrderFlow = async (
  mpPaymentData: Record<string, any>
) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      store_id: props.store?.id,
      customer_name: customerName.value,
      customer_phone: customerPhone.value,
      address: deliveryType.value === 'delivery' ? customerAddress.value : 'RETIRADA NO BALCAO',
      delivery_type: deliveryType.value,
      total: cartStore.totalAmount,
      payment_method: mpPaymentData.payment_method_id,
      mercado_pago_id: String(mpPaymentData.id),
      status: mpPaymentData.status === 'approved' ? 'recebido' : 'aguardando_pagamento',
      preparation_time: '30',
      pix_qr_code: pixData.value?.qrCode || null,
      pix_qr_code_base64: pixData.value?.qrCodeBase64 || null
    }])
    .select()
    .single()

  if (error) throw error

  createdOrderId.value = data.id

  // 👉 DISPARO AUTOMÁTICO DA IMPRESSORA (Utilizando o domínio fixo do Ngrok)
  try {
    await fetch('https://fragrance-chirpy-broom.ngrok-free.dev/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeName: props.store?.name || 'Purple Açaí',
        type: 'receipt',
        order: {
          ...data,
          items: cartStore.items
        }
      })
    })
    console.log('✅ Impressão automática disparada com sucesso!')
  } catch (printErr) {
    console.warn('⚠️ Servidor de impressão local offline no momento:', printErr)
  }

  localStorage.setItem('active_order_id', data.id)
  window.dispatchEvent(new CustomEvent('order-created'))

  cartStore.clearCart()
  isOrderCompleted.value = true
}
</script>

<style scoped>
:global(body) {
  margin: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 17, 15, .48);
  backdrop-filter: blur(7px);
  display: flex;
  justify-content: flex-end;
  z-index: 9999;
}

.cart-drawer {
  width: min(100%, 560px);
  height: 100vh;
  background: #fffdf9;
  color: #171717;
  display: flex;
  flex-direction: column;
  box-shadow: -24px 0 70px rgba(0, 0, 0, .15);
  overflow: hidden;
}

.cart-header {
  padding: 30px 28px 22px;
  border-bottom: 1px solid #ece7df;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #9a948b;
  font-weight: 800;
  margin-bottom: 7px;
}

.cart-header h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.02;
  letter-spacing: -.045em;
  font-weight: 800;
}

.cart-header p {
  margin: 7px 0 0;
  color: #77716a;
  font-size: 13px;
}

.btn-close {
  width: 40px;
  height: 40px;
  border: 1px solid #e7e1d8;
  background: #fff;
  border-radius: 50%;
  color: #34312d;
  font-size: 24px;
  cursor: pointer;
}

.cart-content {
  overflow: auto;
  flex: 1;
  padding: 24px 28px 18px;
}

/* TELA DO PIX */
.success-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px;
  overflow-y: auto;
  gap: 16px;
}

.pix-container {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
}

.pix-qr-wrapper {
  width: 180px;
  height: 180px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pix-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pix-copy-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.pix-copy-box label {
  font-size: 11px;
  font-weight: 700;
  color: #4b5563;
}

.pix-textarea {
  width: 100%;
  padding: 10px;
  font-size: 11px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  resize: none;
  font-family: monospace;
  box-sizing: border-box;
}

.btn-copy-pix {
  width: 100%;
  background: #059669;
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s ease;
}

.btn-copy-pix:hover {
  background: #047857;
}

.pix-instructions {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.order-confirmed {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 12px;
}

.order-badge {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 320px;
}

.order-badge span {
  font-size: 10px;
  color: #6b7280;
  font-weight: 800;
}

.order-badge strong {
  font-size: 18px;
  color: #111827;
}

.btn-primary-action {
  width: 100%;
  max-width: 320px;
  background: #111827;
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.order-section {
  padding-bottom: 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid #eee9e2;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
}

.section-heading>div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-heading>div>span {
  color: #a29c92;
  font-size: 11px;
  font-weight: 800;
}

.section-heading h3 {
  margin: 0;
  font-size: 16px;
}

.section-meta,
.secure-label {
  color: #99928a;
  font-size: 11px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ece7df;
  background: #fff;
  border-radius: 14px;
}

.item-thumb {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 10px;
  background: #f2ece3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #61594f;
}

.item-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-info strong {
  font-size: 14px;
}

.item-addons {
  font-size: 11px;
  color: #7b746c;
  margin-top: 2px;
}

.item-unit-price {
  font-size: 11px;
  color: #9b948b;
  margin-top: 2px;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-price {
  font-size: 14px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-controls>span {
  width: 16px;
  text-align: center;
  font-weight: 800;
  font-size: 13px;
}

.btn-qty {
  width: 28px;
  height: 28px;
  border: 1px solid #ded7cd;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.checkout-form {
  display: flex;
  flex-direction: column;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 11px;
  font-weight: 800;
  color: #5f5952;
}

.field input {
  width: 100%;
  border: 1px solid #e1dbd2;
  background: #fff;
  border-radius: 10px;
  min-height: 44px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.delivery-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e4ded5;
  border-radius: 12px;
  cursor: pointer;
  background: #fff;
}

.delivery-option.active {
  border-color: #25231f;
  background: #faf8f4;
}

.delivery-option input {
  opacity: 0;
  position: absolute;
}

.delivery-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f1ece5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delivery-option>span:last-child {
  display: flex;
  flex-direction: column;
}

.delivery-option strong {
  font-size: 13px;
}

.delivery-option small {
  color: #8b837a;
  font-size: 10px;
}

.payment-block {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}

.payment-shell {
  background: #faf7f2;
  border: 1px solid #e6dfd6;
  border-radius: 14px;
  padding: 14px;
}

#paymentBrick_container {
  width: 100%;
  min-height: 420px;
  display: block;
}

.cart-footer {
  padding: 18px 28px;
  background: #fff;
  border-top: 1px solid #e7e1d8;
  flex-shrink: 0;
}

.total-copy {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.total-copy span {
  font-size: 12px;
  color: #807970;
}

.total-copy strong {
  font-size: 24px;
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.empty-mark {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1ece4;
  font-size: 24px;
  margin-bottom: 16px;
}

.empty-cart h3 {
  margin: 0;
  font-size: 20px;
}

.empty-cart p {
  margin: 8px 0 20px;
  color: #817a72;
  font-size: 13px;
}

.btn-back-shopping {
  border: 0;
  background: #1f1e1b;
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity .2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
