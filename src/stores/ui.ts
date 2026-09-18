import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const toast = ref<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  function showLoading() { isLoading.value = true }
  function hideLoading() { isLoading.value = false }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 3000)
  }

  return {
    isLoading,
    toast,
    showLoading,
    hideLoading,
    showToast
  }
})