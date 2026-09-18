import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as any[]
  }),

  getters: {
    totalAmount: (state): number => {
      if (!state.items || !Array.isArray(state.items)) return 0
      return state.items.reduce((total, item) => {
        const price = Number(item.price) || 0
        const qty = Number(item.quantity) || 1
        return total + (price * qty)
      }, 0)
    }
  },

  actions: {
    addItem(product: any) {
      if (!product) return
      
      const existing = this.items.find(i => i.id === product.id)
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + 1
      } else {
        this.items.push({
          ...product,
          price: Number(product.price) || 0,
          quantity: 1
        })
      }
    },

    updateQuantity(id: string, quantity: number) {
      if (quantity <= 0) {
        this.items = this.items.filter(i => i.id !== id)
      } else {
        const item = this.items.find(i => i.id === id)
        if (item) {
          item.quantity = quantity
        }
      }
    },

    clearCart() {
      this.items = []
    }
  }
})