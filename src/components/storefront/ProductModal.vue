<template>
  <div v-if="product" class="modal-overlay" @click.self="closeModal">
    <section
      class="modal-card"
      role="dialog"
      aria-modal="true"
      :aria-label="`Personalizar ${product.name}`"
    >
      <!-- PRODUCT HEADER -->
      <header class="modal-header">
        <div class="product-summary">
          <div v-if="product.image_url" class="product-image-wrap">
            <img :src="product.image_url" :alt="product.name" />
          </div>
          <div v-else class="product-image-wrap product-image-placeholder" aria-hidden="true">
            <span>✦</span>
          </div>

          <div class="product-copy">
            <span class="eyebrow">Personalize seu pedido</span>
            <h1>{{ product.name }}</h1>
            <p v-if="product.description" class="product-description">{{ product.description }}</p>
            <div class="product-price-line">
              <span>A partir de</span>
              <strong>R$ {{ Number(product.price).toFixed(2).replace('.', ',') }}</strong>
            </div>
          </div>
        </div>

        <button
          class="close-button"
          type="button"
          @click="closeModal"
          aria-label="Fechar personalização"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <!-- CURRENT CUP CONTEXT BANNER (EXIBIDO APENAS SE HOUVER MAIS DE 1 COPO) -->
      <div v-if="targetQuantity > 1" class="current-cup-bar">
        <div class="current-cup-left">
          <span class="current-cup-badge">
            Copo {{ currentStep }} de {{ targetQuantity }}
          </span>
          <span class="current-cup-message">
            <template v-if="getCupItemCount(currentStep - 1) > 0">
              {{ getCupItemCount(currentStep - 1) }} {{ getCupItemCount(currentStep - 1) === 1 ? 'adicional selecionado' : 'adicionais selecionados' }}
            </template>
            <template v-else>
              Comece a personalização deste copo
            </template>
          </span>
        </div>

        <span v-if="isCurrentCupValid && groups.length" class="current-cup-ready">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
          Tudo certo
        </span>
      </div>

      <!-- SCROLLABLE OPTIONS -->
      <div class="modal-body">
        <div v-if="groups.length" class="options-stack">
          <section
            v-for="(group, gIdx) in groups"
            :key="`${group.title}-${gIdx}`"
            class="option-group"
            :class="{ 'is-complete': isGroupValid(group), 'is-required': (group.min || 0) > 0 }"
          >
            <header class="group-header">
              <div class="group-header-main">
                <div class="group-title-line">
                  <h2>{{ group.title }}</h2>
                  <span v-if="(group.min || 0) > 0" class="required-badge">Obrigatório</span>
                </div>

                <p>
                  <template v-if="group.max === 1">Escolha 1 opção</template>
                  <template v-else>
                    {{ (group.min || 0) > 0 ? `Escolha de ${group.min} até ${group.max}` : `Escolha até ${group.max}` }} opções
                  </template>
                </p>
              </div>

              <div class="group-status">
                <span v-if="group.max && group.max > 1" class="selection-count">
                  {{ getGroupCount(group.title) }}/{{ group.max }}
                </span>
                <span v-else-if="isGroupValid(group)" class="selection-check" aria-label="Grupo completo">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
                </span>
              </div>
            </header>

            <div v-if="group.max && group.max > 1" class="group-progress" aria-hidden="true">
              <span :style="{ width: `${Math.min(100, (getGroupCount(group.title) / group.max) * 100)}%` }"></span>
            </div>

            <div class="option-list">
              <div
                v-for="(item, iIdx) in group.items"
                :key="`${item.name}-${iIdx}`"
                class="option-row"
                :class="{ 'is-selected': isItemSelected(group.title, item.name) }"
                role="button"
                tabindex="0"
                @click="group.max === 1 ? selectSingleOption(group.title, item) : increaseItem(group, item)"
                @keydown.enter="group.max === 1 ? selectSingleOption(group.title, item) : increaseItem(group, item)"
                @keydown.space.prevent="group.max === 1 ? selectSingleOption(group.title, item) : increaseItem(group, item)"
              >
                <span
                  v-if="group.max === 1"
                  class="selection-indicator selection-indicator--radio"
                  :class="{ 'is-selected': isItemSelected(group.title, item.name) }"
                  aria-hidden="true"
                >
                  <span></span>
                </span>

                <span v-else class="selection-indicator selection-indicator--check" :class="{ 'is-selected': isItemSelected(group.title, item.name) }" aria-hidden="true">
                  <svg v-if="isItemSelected(group.title, item.name)" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
                </span>

                <span class="option-copy">
                  <strong>{{ item.name }}</strong>
                  <span v-if="item.price > 0" class="option-price">+ R$ {{ Number(item.price).toFixed(2).replace('.', ',') }}</span>
                  <span v-else class="option-free">Grátis</span>
                </span>

                <span v-if="group.max === 1" class="radio-action" :class="{ 'is-selected': isItemSelected(group.title, item.name) }">
                  <svg v-if="isItemSelected(group.title, item.name)" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
                </span>

                <span v-else class="quantity-control" @click.stop>
                  <button
                    v-if="getItemQuantity(group.title, item.name) > 0"
                    type="button"
                    class="qty-btn qty-btn--minus"
                    @click="decreaseItem(group.title, item)"
                    aria-label="Remover uma unidade"
                  >−</button>
                  <span v-if="getItemQuantity(group.title, item.name) > 0" class="qty-value">
                    {{ getItemQuantity(group.title, item.name) }}
                  </span>
                  <button
                    type="button"
                    class="qty-btn qty-btn--plus"
                    :disabled="isGroupFull(group)"
                    @click="increaseItem(group, item)"
                    aria-label="Adicionar uma unidade"
                  >+</button>
                </span>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="no-options">
          <div class="no-options-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
          </div>
          <h2>Pronto para pedir</h2>
          <p>Este item não possui opções de personalização.</p>
        </div>
      </div>

      <!-- STICKY ACTION BAR -->
      <footer class="modal-footer">
        <div class="footer-quantity">
          <span class="footer-label">Quantidade</span>
          <div class="quantity-picker">
            <button
              type="button"
              @click="handleDecreaseTargetQuantity"
              :disabled="targetQuantity <= 1"
              aria-label="Diminuir quantidade"
            >−</button>
            <strong>{{ targetQuantity }}</strong>
            <button
              type="button"
              @click="handleIncreaseTargetQuantity"
              aria-label="Aumentar quantidade"
            >+</button>
          </div>
        </div>

        <button
          type="button"
          class="primary-action"
          :class="{ 'is-disabled': !isCurrentCupValid }"
          :disabled="!isCurrentCupValid"
          @click="handleNextOrFinish"
        >
          <span class="primary-action-copy">
            <small>{{ targetQuantity > 1 ? `Copo ${currentStep} de ${targetQuantity}` : 'Pedido' }}</small>
            <strong>{{ buttonActionLabel }}</strong>
          </span>
          <span class="primary-action-total">
            <small>Total</small>
            <strong>R$ {{ calculatedTotal.toFixed(2).replace('.', ',') }}</strong>
          </span>
          <svg v-if="isCurrentCupValid" viewBox="0 0 24 24" aria-hidden="true" class="primary-action-arrow">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'

interface OptionItem {
  name: string
  price: number
}

interface OptionGroup {
  title: string
  min?: number
  max?: number
  items: OptionItem[]
}

interface Product {
  id?: string
  name: string
  description?: string
  price: number
  image_url?: string
  complement_groups?: OptionGroup[]
  options_config?: OptionGroup[]
}

interface SelectedOption {
  group: string
  name: string
  price: number
}

interface CupData {
  selectedOptions: SelectedOption[]
}

const props = defineProps<{ product: Product | null }>()
const emit = defineEmits(['close'])
const cart = useCartStore()

const targetQuantity = ref(1)
const currentStep = ref(1)
const cups = ref<CupData[]>([{ selectedOptions: [] }])

watch(() => props.product, () => {
  targetQuantity.value = 1
  currentStep.value = 1
  cups.value = [{ selectedOptions: [] }]
}, { immediate: true })

const groups = computed<OptionGroup[]>(() => {
  return props.product?.complement_groups || props.product?.options_config || []
})

const activeCup = computed(() => {
  const idx = currentStep.value - 1
  if (!cups.value[idx]) {
    cups.value[idx] = { selectedOptions: [] }
  }
  return cups.value[idx]
})

const isItemSelected = (groupTitle: string, itemName: string) => {
  return activeCup.value.selectedOptions.some(o => o.group === groupTitle && o.name === itemName)
}

const getItemQuantity = (groupTitle: string, itemName: string) => {
  return activeCup.value.selectedOptions.filter(o => o.group === groupTitle && o.name === itemName).length
}

const getGroupCount = (groupTitle: string, cupIndex: number = currentStep.value - 1) => {
  const cup = cups.value[cupIndex]
  if (!cup) return 0
  return cup.selectedOptions.filter(o => o.group === groupTitle).length
}

const isGroupFull = (group: OptionGroup) => {
  if (!group.max) return false
  return getGroupCount(group.title) >= group.max
}

const isGroupValid = (group: OptionGroup, cupIndex: number = currentStep.value - 1) => {
  const minRequired = group.min || 0
  if (minRequired === 0) return getGroupCount(group.title, cupIndex) > 0
  return getGroupCount(group.title, cupIndex) >= minRequired
}

const isCupValid = (cupIndex: number) => {
  for (const group of groups.value) {
    const minRequired = group.min || 0
    if (minRequired > 0 && getGroupCount(group.title, cupIndex) < minRequired) {
      return false
    }
  }
  return true
}

const isCurrentCupValid = computed(() => isCupValid(currentStep.value - 1))

const getCupItemCount = (cupIndex: number) => {
  return cups.value[cupIndex]?.selectedOptions.length || 0
}

const canAddToCart = computed(() => {
  return cups.value.every((_, idx) => isCupValid(idx))
})

const selectSingleOption = (groupTitle: string, item: OptionItem) => {
  activeCup.value.selectedOptions = activeCup.value.selectedOptions.filter(o => o.group !== groupTitle)
  activeCup.value.selectedOptions.push({
    group: groupTitle,
    name: item.name,
    price: Number(item.price || 0)
  })
}

const increaseItem = (group: OptionGroup, item: OptionItem) => {
  if (isGroupFull(group)) return

  activeCup.value.selectedOptions.push({
    group: group.title,
    name: item.name,
    price: Number(item.price || 0)
  })
}

const decreaseItem = (groupTitle: string, item: OptionItem) => {
  const index = activeCup.value.selectedOptions.findIndex(o => o.group === groupTitle && o.name === item.name)
  if (index > -1) {
    activeCup.value.selectedOptions.splice(index, 1)
  }
}

const getCupUnitPrice = (cup: CupData) => {
  if (!props.product) return 0
  const extras = cup.selectedOptions.reduce((acc, opt) => acc + (opt.price || 0), 0)
  return Number(props.product.price) + extras
}

const calculatedTotal = computed(() => {
  return cups.value.reduce((acc, cup) => acc + getCupUnitPrice(cup), 0)
})

const buttonActionLabel = computed(() => {
  if (!isCurrentCupValid.value) return 'Selecione os obrigatórios'

  if (currentStep.value < targetQuantity.value) {
    return `Avançar para o Copo ${currentStep.value + 1} de ${targetQuantity.value} →`
  }

  if (!canAddToCart.value) return 'Verifique os copos pendentes'

  return targetQuantity.value > 1
    ? `Adicionar os ${targetQuantity.value} copos ao pedido`
    : 'Adicionar ao pedido'
})

const updateTargetQuantity = (newQty: number) => {
  if (newQty < 1) return
  targetQuantity.value = newQty

  while (cups.value.length < newQty) {
    cups.value.push({ selectedOptions: [] })
  }
  while (cups.value.length > newQty) {
    cups.value.pop()
  }

  if (currentStep.value > newQty) {
    currentStep.value = newQty
  }
}

const handleIncreaseTargetQuantity = () => {
  updateTargetQuantity(targetQuantity.value + 1)
}

const handleDecreaseTargetQuantity = () => {
  updateTargetQuantity(targetQuantity.value - 1)
}

const handleNextOrFinish = () => {
  if (!props.product) return

  if (currentStep.value < targetQuantity.value) {
    if (isCurrentCupValid.value) {
      currentStep.value++
    }
    return
  }

  if (canAddToCart.value) {
    cups.value.forEach((cup) => {
      const optionSignature = cup.selectedOptions
        .map(o => `${o.group}:${o.name}`)
        .sort()
        .join('|')

      const uniqueCartId = optionSignature
        ? `${props.product!.id}__${optionSignature}`
        : `${props.product!.id}`

      cart.addItem({
        ...props.product!,
        id: uniqueCartId,
        product_id: props.product!.id,
        price: getCupUnitPrice(cup),
        selected_options: cup.selectedOptions,
        quantity: 1
      })
    })

    closeModal()
  }
}

const closeModal = () => {
  targetQuantity.value = 1
  currentStep.value = 1
  cups.value = [{ selectedOptions: [] }]
  emit('close')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

:global(body) { margin: 0; }

* { box-sizing: border-box; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(26, 22, 19, 0.58);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: overlay-in .2s ease;
}

.modal-card {
  --ink: #241f1a;
  --ink-soft: #514940;
  --muted: #82786d;
  --line: #e9e1d9;
  --line-strong: #d8cec3;
  --paper: #fffdfa;
  --soft: #f7f2ec;
  --accent: #b65d28;
  --accent-dark: #9b4d20;
  --accent-soft: #fff3e9;
  --success: #278151;

  width: min(780px, 100%);
  max-height: min(94svh, 900px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid rgba(55, 43, 32, .14);
  border-radius: 26px;
  box-shadow: 0 36px 100px rgba(20, 16, 12, .3);
  font-family: 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  animation: modal-in .22s cubic-bezier(.22, 1, .36, 1);
}

button,
input { font: inherit; }
button { -webkit-tap-highlight-color: transparent; }

.modal-header {
  position: relative;
  flex: 0 0 auto;
  padding: 22px 70px 20px 22px;
  background: linear-gradient(180deg, #fffefa 0%, #fbf6f0 100%);
  border-bottom: 1px solid var(--line);
}

.product-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.product-image-wrap {
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  overflow: hidden;
  border-radius: 18px;
  background: #eee6dc;
  box-shadow: 0 7px 22px rgba(71, 51, 35, .1), inset 0 0 0 1px rgba(50, 38, 28, .07);
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.product-image-placeholder {
  display: grid;
  place-items: center;
  color: var(--accent);
  font-size: 26px;
}

.product-copy { min-width: 0; }

.eyebrow,
.footer-label {
  display: block;
  margin-bottom: 6px;
  color: #9a8d80;
  font-size: 11px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.product-copy h1 {
  margin: 0;
  color: var(--ink);
  font: 800 clamp(1.35rem, 3vw, 1.8rem)/1.05 'Manrope', sans-serif;
  letter-spacing: -.03em;
}

.product-description {
  max-width: 560px;
  margin: 7px 0 7px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.45;
}

.product-price-line {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
}

.product-price-line strong {
  color: var(--accent-dark);
  font: 800 17px/1 'Manrope', sans-serif;
}

.close-button {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: rgba(255,255,255,.9);
  color: #695f56;
  cursor: pointer;
  transition: transform .16s ease, background .16s ease, color .16s ease, border-color .16s ease;
}

.close-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
}

.close-button:hover {
  transform: translateY(-1px);
  background: #f5ede6;
  color: var(--ink);
  border-color: #cfc3b8;
}

.close-button:focus-visible,
.option-row:focus-visible,
.qty-btn:focus-visible,
.quantity-picker button:focus-visible,
.primary-action:focus-visible {
  outline: 3px solid rgba(182, 93, 40, .2);
  outline-offset: 2px;
}

.current-cup-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 18px;
  background: #29231f;
  color: #fff;
}

.current-cup-left { min-width: 0; display: flex; align-items: center; gap: 10px; }
.current-cup-badge {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.current-cup-message { min-width: 0; color: #e9e0d7; font-size: 13px; line-height: 1.3; }
.current-cup-ready { display: inline-flex; align-items: center; gap: 5px; color: #a9e1bb; font-size: 12px; font-weight: 800; white-space: nowrap; }
.current-cup-ready svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }

.modal-body {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #fffdfa;
  scrollbar-color: #c8bdb1 transparent;
  scrollbar-width: thin;
}

.modal-body::-webkit-scrollbar { width: 9px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb { background: #cfc3b8; border-radius: 99px; border: 2px solid #fffdfa; }

.options-stack { padding: 4px 0 6px; }

.option-group + .option-group {
  border-top: 9px solid #f6f0e9;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px 11px;
  background: #fffdfa;
}

.group-header-main { min-width: 0; }
.group-title-line { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.group-header h2 { margin: 0; color: var(--ink); font: 800 16px/1.2 'Manrope', sans-serif; letter-spacing: -.015em; }
.group-header p { margin: 5px 0 0; color: #756b62; font-size: 12px; line-height: 1.3; }

.required-badge {
  padding: 3px 7px;
  border-radius: 999px;
  background: #fff0ea;
  color: #a84e27;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .02em;
}

.group-status { flex: 0 0 auto; }
.selection-count {
  padding: 5px 9px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: #fff;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 800;
}

.selection-check {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e8f5ec;
  color: var(--success);
}
.selection-check svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

.group-progress {
  height: 3px;
  margin: 0 20px 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #eee6dd;
}
.group-progress span { display: block; height: 100%; border-radius: inherit; background: var(--accent); transition: width .2s ease; }

.option-list { padding: 0 20px 8px; }

.option-row {
  width: 100%;
  min-height: 66px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid #f0eae4;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .14s ease, padding .14s ease;
}
.option-row:last-child { border-bottom: 0; }
.option-row:hover { padding-left: 6px; padding-right: 6px; background: #fffbf7; border-radius: 12px; }
.option-row.is-selected { padding-left: 10px; padding-right: 10px; border-radius: 12px; background: linear-gradient(90deg, #fff7f0, #fffdfa); }

.selection-indicator {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: grid;
  place-items: center;
  border: 1.5px solid #cfc4b9;
  background: #fff;
  color: #fff;
  transition: border-color .14s ease, background .14s ease, box-shadow .14s ease;
}
.selection-indicator--radio { border-radius: 50%; }
.selection-indicator--radio span { width: 9px; height: 9px; border-radius: 50%; background: transparent; }
.selection-indicator--radio.is-selected { border-color: var(--accent); box-shadow: inset 0 0 0 5px #fff; background: var(--accent); }
.selection-indicator--check { border-radius: 7px; }
.selection-indicator--check.is-selected { background: var(--accent); border-color: var(--accent); }
.selection-indicator--check svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }

.option-copy { min-width: 0; flex: 1 1 auto; }
.option-copy strong { display: block; color: var(--ink); font-size: 14px; line-height: 1.25; font-weight: 700; }
.option-price { display: inline-block; margin-top: 3px; color: var(--accent-dark); font-size: 12px; font-weight: 800; }
.option-free { display: inline-block; margin-top: 3px; color: #7f766d; font-size: 12px; font-weight: 700; }

.radio-action {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #f3eee9;
  color: transparent;
}
.radio-action.is-selected { background: var(--accent); color: #fff; }
.radio-action svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

.quantity-control { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; }
.qty-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
  font-size: 18px;
  line-height: 1;
  font-weight: 800;
  cursor: pointer;
  transition: transform .14s ease, background .14s ease, border-color .14s ease, color .14s ease;
}
.qty-btn--plus { background: var(--ink); border-color: var(--ink); color: #fff; }
.qty-btn:hover:not(:disabled) { transform: translateY(-1px); }
.qty-btn--minus:hover:not(:disabled) { background: #f5eee7; border-color: #cbbfb3; }
.qty-btn--plus:hover:not(:disabled) { background: #3b342e; }
.qty-btn:disabled { opacity: .28; cursor: not-allowed; }
.qty-value { min-width: 22px; text-align: center; color: var(--ink); font-size: 13px; font-weight: 800; }

.no-options { padding: 56px 24px; text-align: center; }
.no-options-icon { width: 52px; height: 52px; display: grid; place-items: center; margin: 0 auto 14px; border-radius: 50%; background: #ecf7ef; color: var(--success); }
.no-options-icon svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.no-options h2 { margin: 0; color: var(--ink); font: 800 17px/1.2 'Manrope', sans-serif; }
.no-options p { margin: 7px auto 0; max-width: 340px; color: var(--muted); font-size: 13px; line-height: 1.5; }

.modal-footer {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: end;
  padding: 13px 16px calc(14px + env(safe-area-inset-bottom));
  background: rgba(255, 253, 250, .98);
  border-top: 1px solid var(--line);
  box-shadow: 0 -12px 28px rgba(50, 38, 28, .07);
}

.footer-quantity { min-width: 108px; }
.footer-label { margin-bottom: 6px; color: #847a70; font-size: 9px; }
.quantity-picker {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: #fff;
}
.quantity-picker button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ink);
  font-size: 21px;
  font-weight: 800;
  cursor: pointer;
}
.quantity-picker button:hover:not(:disabled) { background: #f5eee7; }
.quantity-picker button:disabled { opacity: .3; cursor: not-allowed; }
.quantity-picker strong { min-width: 28px; text-align: center; color: var(--ink); font-size: 15px; font-weight: 800; }

.primary-action {
  min-width: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 15px 8px 17px;
  border: 0;
  border-radius: 15px;
  background: var(--ink);
  color: #fff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(36,31,26,.16);
  transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
}
.primary-action:hover:not(:disabled) { transform: translateY(-1px); background: #332d27; box-shadow: 0 14px 28px rgba(36,31,26,.2); }
.primary-action.is-disabled,
.primary-action:disabled { background: #c7bdb4; box-shadow: none; cursor: not-allowed; }

.primary-action-copy { min-width: 0; flex: 1 1 auto; }
.primary-action-copy small,
.primary-action-total small { display: block; margin-bottom: 3px; color: #c8beb5; font-size: 9px; line-height: 1; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.primary-action-copy strong { display: block; overflow: hidden; color: #fff; font-size: 14px; line-height: 1.15; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.primary-action-total { flex: 0 0 auto; text-align: right; }
.primary-action-total strong { color: #fff; font: 800 18px/1 'Manrope', sans-serif; white-space: nowrap; }
.primary-action-arrow { width: 18px; height: 18px; flex: 0 0 18px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-in { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }

@media (max-width: 680px) {
  .modal-overlay { align-items: flex-end; padding: 0; }
  .modal-card { width: 100%; max-height: 96svh; border-radius: 24px 24px 0 0; }
  .modal-header { padding: 16px 58px 16px 16px; }
  .product-summary { gap: 12px; }
  .product-image-wrap { width: 70px; height: 70px; flex-basis: 70px; border-radius: 15px; }
  .product-copy h1 { font-size: 1.26rem; }
  .product-description { font-size: 12px; line-height: 1.4; }
  .product-price-line strong { font-size: 15px; }
  .close-button { top: 14px; right: 14px; width: 40px; height: 40px; }

  .current-cup-bar { padding: 9px 13px; }
  .current-cup-left { gap: 8px; }
  .current-cup-badge { font-size: 10px; padding: 4px 8px; }
  .current-cup-message { font-size: 11px; }
  .current-cup-ready { display: none; }

  .group-header { padding: 14px 15px 10px; }
  .group-header h2 { font-size: 15px; }
  .group-header p { font-size: 11px; }
  .option-list { padding: 0 15px 6px; }
  .option-row { min-height: 62px; gap: 10px; }
  .option-copy strong { font-size: 13px; }
  .option-price, .option-free { font-size: 11px; }
  .qty-btn { width: 35px; height: 35px; }
  .selection-indicator { width: 21px; height: 21px; flex-basis: 21px; }
  .radio-action { width: 27px; height: 27px; flex-basis: 27px; }
  .group-progress { margin: 0 15px 5px; }

  .modal-footer { grid-template-columns: 102px minmax(0, 1fr); gap: 8px; padding: 10px 10px calc(10px + env(safe-area-inset-bottom)); }
  .footer-quantity { min-width: 102px; }
  .footer-label { margin-left: 2px; }
  .quantity-picker { width: 100%; }
  .quantity-picker button { width: 34px; height: 38px; }
  .primary-action { min-height: 54px; padding: 7px 12px 7px 13px; gap: 8px; }
  .primary-action-copy strong { font-size: 12px; }
  .primary-action-total strong { font-size: 16px; }
  .primary-action-arrow { display: none; }
}

@media (max-width: 390px) {
  .modal-header { padding-right: 54px; }
  .product-image-wrap { width: 62px; height: 62px; flex-basis: 62px; }
  .product-copy h1 { font-size: 1.15rem; }
  .product-description { display: none; }
  .product-price-line { font-size: 11px; }
  .product-price-line strong { font-size: 14px; }
  .current-cup-message { font-size: 10px; }
  .group-header h2 { font-size: 14px; }
  .option-copy strong { font-size: 12px; }
  .primary-action-copy small { font-size: 8px; }
  .primary-action-copy strong { font-size: 11px; }
  .primary-action-total strong { font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .modal-overlay, .modal-card { animation: none; }
  .option-row, .qty-btn, .primary-action, .close-button { transition: none; }
}
</style>
