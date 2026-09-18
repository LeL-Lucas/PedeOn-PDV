<template>
  <div class="login-view">
    <div class="login-noise"></div>
    <div class="login-orb orb-a"></div><div class="login-orb orb-b"></div>

    <main class="login-shell">
      <section class="brand-column">
        <div class="brand-lockup">
          <span class="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5C6 8.9 8.7 6 12 6s6 2.9 6 6.5S15.3 19 12 19s-6-2.9-6-6.5Z"/><path d="M9.5 12.5h5M12 10v5"/></svg></span>
          <span>minha<span>loja</span></span>
        </div>
        <div class="brand-copy">
          <span class="eyebrow">Gestão para operações de alimentação</span>
          <h1>Seu negócio,<br><em>no controle.</em></h1>
          <p>Acesse o painel para acompanhar pedidos, produtos, mesas e resultados em um só lugar.</p>
        </div>
        <div class="brand-footer">
          <span>Ambiente protegido</span><i></i><span>Acesso administrativo</span>
        </div>
      </section>

      <section class="auth-column">
        <div class="login-card">
          <div class="card-top">
            <div>
              <span class="auth-kicker">{{ storeSlug ? 'Área administrativa' : 'Acesso ao sistema' }}</span>
              <h2>{{ storeSlug ? storeSlug : 'Bem-vindo de volta' }}</h2>
              <p>{{ isSignUp ? 'Crie sua conta para continuar.' : 'Entre com seus dados para acessar o painel.' }}</p>
            </div>
            <span class="secure-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z"/></svg></span>
          </div>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <label class="field">
              <span>E-mail</span>
              <div class="input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m5 7 7 6 7-6"/></svg>
                <input v-model="email" type="email" placeholder="voce@empresa.com" autocomplete="email" required />
              </div>
            </label>

            <label class="field">
              <span>Senha</span>
              <div class="input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/></svg>
                <input v-model="password" type="password" placeholder="Sua senha" autocomplete="current-password" minlength="6" required />
              </div>
            </label>

            <button class="submit-button" type="submit" :disabled="loading">
              <span v-if="loading" class="submit-spinner"></span>
              <span>{{ loading ? 'Processando...' : (isSignUp ? 'Criar conta' : 'Entrar no painel') }}</span>
              <svg v-if="!loading" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>

          <div class="mode-switch">
            <span>{{ isSignUp ? 'Já possui acesso?' : 'Ainda não possui uma conta?' }}</span>
            <button type="button" @click="isSignUp = !isSignUp">
              {{ isSignUp ? 'Entrar' : 'Criar conta' }}
            </button>
          </div>
        </div>

        <p class="auth-footnote">Ao continuar, você acessa um ambiente destinado à gestão do estabelecimento.</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const loading = ref(false)

const storeSlug = computed(() => route.params.slug as string || '')

const handleSubmit = async () => {
  loading.value = true

  if (isSignUp.value) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    })

    if (signUpError) {
      alert(`Erro no cadastro: ${signUpError.message}`)
      loading.value = false
      return
    }
  }

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })

  loading.value = false

  if (loginError) {
    alert(`Erro ao entrar: ${loginError.message}`)
    return
  }

  // Redireciona dependendo do contexto
  if (storeSlug.value) {
    router.push(`/${storeSlug.value}/admin`)
  } else {
    router.push('/stores')
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.login-view { min-height:100vh; background:#151714; color:#f5f5f0; position:relative; overflow:hidden; font-family:'DM Sans',system-ui,sans-serif; }
.login-view *, .login-view *::before, .login-view *::after { box-sizing:border-box; }
.login-noise { position:absolute; inset:0; opacity:.035; background-image:radial-gradient(#fff .65px, transparent .65px); background-size:5px 5px; pointer-events:none; }
.login-orb { position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; }
.orb-a{width:440px;height:440px;background:#31402e;left:-190px;top:-150px;opacity:.35}.orb-b{width:360px;height:360px;background:#6d6552;right:-160px;bottom:-130px;opacity:.18}
.login-shell { min-height:100vh; width:min(1180px,100%); margin:0 auto; padding:34px 30px; display:grid; grid-template-columns:minmax(0,1.05fr) minmax(420px,.8fr); gap:80px; align-items:center; position:relative; z-index:1; }
.brand-column{min-height:580px; display:flex; flex-direction:column; justify-content:space-between; padding:28px 0 14px;}
.brand-lockup{display:flex;align-items:center;gap:12px;font:800 1.05rem 'Manrope',sans-serif;letter-spacing:-.04em}.brand-lockup > span:last-child span{color:#9caf8e}.brand-mark{width:40px;height:40px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);border-radius:13px;display:grid;place-items:center}.brand-mark svg{width:20px;height:20px;fill:none;stroke:#dbe5d3;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.brand-copy{max-width:580px;margin-top:70px}.eyebrow,.auth-kicker{font-size:.67rem;text-transform:uppercase;letter-spacing:.15em;font-weight:800;color:#92978e}.brand-copy h1{font:800 clamp(3.3rem,7vw,6.3rem)/.9 'Manrope',sans-serif;letter-spacing:-.075em;margin:14px 0 20px;color:#f4f5ef}.brand-copy h1 em{color:#9aaf8f;font-style:normal}.brand-copy p{max-width:510px;color:#a4aaa0;font-size:1rem;line-height:1.7;margin:0}.brand-footer{display:flex;align-items:center;gap:9px;color:#787e74;font-size:.72rem}.brand-footer i{width:4px;height:4px;border-radius:50%;background:#8ea37f}
.auth-column{display:flex;flex-direction:column;align-items:center}.login-card{width:min(470px,100%);background:#fafaf7;color:#171a17;border-radius:28px;padding:30px;border:1px solid rgba(255,255,255,.12);box-shadow:0 28px 100px rgba(0,0,0,.28)}
.card-top{display:flex;justify-content:space-between;gap:20px}.card-top h2{font:800 1.75rem/1.05 'Manrope',sans-serif;letter-spacing:-.05em;margin:6px 0 8px;word-break:break-word}.card-top p{margin:0;color:#7d827a;font-size:.82rem;line-height:1.5}.secure-chip{width:38px;height:38px;border-radius:12px;background:#eff2ec;border:1px solid #e1e7dc;display:grid;place-items:center;color:#75806f;flex-shrink:0}.secure-chip svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.auth-form{display:grid;gap:15px;margin-top:26px}.field{display:grid;gap:7px}.field>span{font-size:.74rem;font-weight:800;color:#353a33}.input-wrap{height:50px;display:flex;align-items:center;gap:10px;padding:0 13px;border:1px solid #dedfd9;background:#fff;border-radius:13px;transition:.2s}.input-wrap:focus-within{border-color:#7d8877;box-shadow:0 0 0 4px rgba(125,136,119,.1)}.input-wrap svg{width:17px;height:17px;fill:none;stroke:#8b9187;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}.input-wrap input{width:100%;height:100%;border:0;outline:0;background:transparent;font:inherit;color:#1d201c}.input-wrap input::placeholder{color:#adb1aa}.submit-button{height:51px;margin-top:6px;border-radius:13px;border:1px solid #151815;background:#171a17;color:#fff;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:800;cursor:pointer;transition:.2s}.submit-button:hover:not(:disabled){transform:translateY(-1px);background:#232723}.submit-button:disabled{opacity:.7;cursor:wait}.submit-button svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.submit-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}.mode-switch{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:20px;color:#8d928b;font-size:.73rem}.mode-switch button{border:0;background:none;padding:0;color:#465641;font:800 .73rem 'DM Sans';cursor:pointer}.mode-switch button:hover{text-decoration:underline}.auth-footnote{margin:14px 0 0;color:#666c63;font-size:.68rem;text-align:center;max-width:390px;line-height:1.5}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:900px){.login-shell{grid-template-columns:1fr;gap:32px;padding:24px 18px}.brand-column{min-height:auto;padding:0;display:block}.brand-copy{margin-top:48px;max-width:620px}.brand-copy h1{font-size:clamp(3rem,13vw,5rem)}.brand-copy p{font-size:.9rem}.brand-footer{margin-top:30px}.auth-column{align-items:stretch}.login-card{width:100%;max-width:none}}
@media(max-width:560px){.login-shell{padding:20px 14px 28px}.brand-copy{margin-top:34px}.brand-copy h1{font-size:3.25rem}.brand-footer{display:none}.login-card{padding:22px;border-radius:23px}.card-top h2{font-size:1.5rem}.secure-chip{display:none}}
</style>
