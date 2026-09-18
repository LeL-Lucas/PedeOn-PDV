<template>
  <div class="store-login-container">
    <div v-if="loadingStore" class="loading-box">
      <p>Carregando informações do comércio...</p>
    </div>

    <div v-else-if="!store" class="error-box">
      <h2>Comércio não encontrado</h2>
      <p>Verifique a URL digitada.</p>
    </div>

    <div v-else class="login-card" :style="{ borderTop: `6px solid ${store.theme_color || '#2563eb'}` }">
      <div class="brand-header">
        <h1>{{ store.name }}</h1>
        <p class="subtitle">Acesso Administrativo da Loja</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>E-mail do Gerente</label>
          <input
            type="email"
            v-model="email"
            placeholder="gerente@loja.com"
            required
          />
        </div>

        <div class="input-group">
          <label>Senha</label>
          <input
            type="password"
            v-model="password"
            placeholder="********"
            required
          />
        </div>

        <button type="submit" :disabled="submitting" class="btn-login" :style="{ background: store.theme_color || '#2563eb' }">
          {{ submitting ? 'Entrando...' : 'Acessar Painel' }}
        </button>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

interface StoreInfo {
  id: string
  name: string
  slug: string
  theme_color?: string
}

const route = useRoute()
const router = useRouter()

const slug = route.params.slug as string
const store = ref<StoreInfo | null>(null)
const loadingStore = ref(true)

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const fetchStoreInfo = async () => {
  loadingStore.value = true
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, slug, theme_color')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    store.value = null
  } else {
    store.value = data
  }
  loadingStore.value = false
}

const handleLogin = async () => {
  submitting.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      errorMessage.value = 'E-mail ou senha inválidos.'
      return
    }

    if (data.user) {
      router.push(`/${slug}/admin`)
    }
  } catch (err: unknown) {
    const errorObj = err as Error
    errorMessage.value = errorObj.message || 'Erro ao realizar login.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchStoreInfo()
})
</script>

<style scoped>
.store-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 20px;
}
.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
}
.brand-header h1 {
  margin: 0 0 4px 0;
  font-size: 1.75rem;
  color: #0f172a;
}
.subtitle {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 0.9rem;
}
.input-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.input-group input {
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
}
.btn-login {
  width: 100%;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 8px;
}
.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 1rem;
  text-align: center;
}
.loading-box, .error-box {
  text-align: center;
  color: #64748b;
}
</style>
