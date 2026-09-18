import { ref } from 'vue'
import { supabase } from '@/services/supabase'

const store = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useStore() {
  const fetchStoreBySlug = async (slug: string) => {
    if (!slug) return

    loading.value = true
    error.value = null

    console.log(`Carregando loja com slug: ${slug}`)

    const { data, error: fetchError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()

    if (fetchError || !data) {
      console.warn(`Loja não encontrada para o slug: ${slug}`)
      store.value = null
      error.value = 'Loja não encontrada'
    } else {
      console.log(`Loja encontrada: ${data.name}`)
      store.value = data
      error.value = null
    }

    loading.value = false
    return data
  }

  return {
    store,
    currentStore: store, // Alias para compatibilidade
    loading,
    error,
    fetchStoreBySlug
  }
}