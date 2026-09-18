<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🍕 PedeOn</h1>
      <h2>Acesso Administrativo</h2>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>E-mail</label>
          <input
            type="email"
            v-model="email"
            placeholder="admin@loja.com"
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

        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../services/supabase'

defineOptions({
  name: 'LoginView'
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (loginError) {
      error.value = loginError.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : loginError.message
      return
    }

    if (data.user) {
      const redirectPath = route.query.redirect as string
      if (redirectPath) {
        router.push(redirectPath)
        return
      }

      // Redireciona para o seletor de lojas do usuário autenticado
      router.push('/stores')
    }
  } catch (err: unknown) {
    const errorObj = err as Error
    error.value = errorObj.message || 'Erro ao realizar login.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
}
.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}
.login-card h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}
.login-card h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
}
.input-group {
  margin-bottom: 1.25rem;
}
.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}
.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  box-sizing: border-box;
}
.input-group input:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
}
.btn-login {
  width: 100%;
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-login:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-login:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 1rem;
  text-align: center;
  font-weight: 500;
}
</style>
