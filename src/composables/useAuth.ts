import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    loading.value = false
    if (!error && data.user) {
      user.value = data.user
    }
    return { data, error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) user.value = data.user
  }

  const isStoreAdmin = async (storeId: string): Promise<boolean> => {
    if (!user.value) return false
    const { data } = await supabase
      .from('store_admins')
      .select('store_id')
      .eq('user_id', user.value.id)
      .eq('store_id', storeId)
      .single()
    return !!data
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    loadUser,
    isStoreAdmin
  }
}