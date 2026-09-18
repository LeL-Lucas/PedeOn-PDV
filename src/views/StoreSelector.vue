<template>
  <div class="store-selector">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <main class="shell">
      <header class="page-header">
        <div>
          <div class="eyebrow">Painel de gestão</div>
          <div class="header-row">
            <div>
              <h1>Seus comércios</h1>
              <p>Escolha uma operação para continuar ou crie uma nova loja.</p>
            </div>
            <button type="button" class="logout-button" @click="handleLogout">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <section v-if="loading" class="loading-panel" aria-live="polite">
        <div class="loading-mark"><span></span><span></span><span></span></div>
        <strong>Carregando seus comércios</strong>
        <span>Preparando seu painel...</span>
      </section>

      <section v-else class="stores-area">
        <div class="area-head">
          <div>
            <span class="section-kicker">Workspace</span>
            <h2>{{ stores.length ? `${stores.length} ${stores.length === 1 ? 'operação ativa' : 'operações ativas'}` : 'Comece sua primeira operação' }}</h2>
          </div>
          <span class="secure-note">Acesso seguro</span>
        </div>

        <div class="stores-grid">
          <button type="button" class="store-card create-card" @click="showCreateModal = true">
            <span class="create-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>
            <span class="card-eyebrow">Nova operação</span>
            <strong>Criar novo comércio</strong>
            <span>Configure uma nova loja e entre automaticamente no painel.</span>
            <span class="create-link">Criar agora <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </button>

          <article
            v-for="store in stores"
            :key="store.id"
            class="store-card shop-card"
            @click="selectStore(store)"
          >
            <div class="card-topline">
              <div
                class="store-logo"
                :style="{ background: `linear-gradient(145deg, ${store.theme_color || '#111827'} 0%, #111827 130%)` }"
              >
                <span>{{ store.name?.charAt(0)?.toUpperCase() || 'L' }}</span>
              </div>
              <span class="live-pill"><i></i> Loja</span>
            </div>

            <div class="shop-copy">
              <span class="shop-label">Estabelecimento</span>
              <h3>{{ store.name }}</h3>
              <span class="shop-url">{{ store.slug }}</span>
            </div>

            <div class="shop-actions">
              <span class="manage-action">Gerenciar painel <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
              <button type="button" class="preview-button" @click.stop="router.push(`/s/${store.slug}`)">
                Ver vitrine
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <section class="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div class="modal-intro">
          <span class="modal-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg></span>
          <div>
            <span class="section-kicker">Nova operação</span>
            <h2 id="create-title">Criar novo comércio</h2>
            <p>Defina a identidade inicial. O acesso administrativo será gerado automaticamente.</p>
          </div>
          <button type="button" class="close-button" aria-label="Fechar" @click="showCreateModal = false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <form class="create-form" @submit.prevent="handleCreateStore">
          <label class="field">
            <span>Nome do comércio</span>
            <input v-model="newStoreName" @input="generateSlugAndCredentials" type="text" placeholder="Ex.: Pizzaria do Chefe" required />
          </label>

          <label class="field">
            <span>Endereço da vitrine</span>
            <div class="url-field">
              <span>app.com/s/</span>
              <input v-model="newStoreSlug" type="text" placeholder="pizzaria-do-chefe" required />
            </div>
          </label>

          <div v-if="generatedEmail" class="credentials-panel">
            <div class="credentials-header">
              <div>
                <span class="section-kicker">Acesso automático</span>
                <strong>Credenciais administrativas</strong>
              </div>
              <span class="generated-badge">Gerado</span>
            </div>
            <div class="credential-row"><span>E-mail</span><code>{{ generatedEmail }}</code></div>
            <div class="credential-row"><span>Senha</span><code>{{ generatedPassword }}</code></div>
          </div>

          <label class="field">
            <span>Cor principal</span>
            <div class="color-field">
              <input v-model="newStoreColor" type="color" aria-label="Escolher cor principal" />
              <div :style="{ background: newStoreColor }"></div>
              <code>{{ newStoreColor.toUpperCase() }}</code>
              <span>Aparecerá na identidade da loja</span>
            </div>
          </label>

          <div class="modal-actions">
            <button type="button" class="secondary-button" @click="showCreateModal = false">Cancelar</button>
            <button type="submit" class="primary-button" :disabled="creating">
              <span v-if="creating" class="mini-spinner"></span>
              {{ creating ? 'Criando comércio...' : 'Criar e acessar' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

export interface Store {
  id: string
  owner_id?: string
  name: string
  slug: string
  theme_color?: string
}

const router = useRouter()
const stores = ref<Store[]>([])
const loading = ref(true)
const creating = ref(false)

const showCreateModal = ref(false)
const newStoreName = ref('')
const newStoreSlug = ref('')
const newStoreColor = ref('#0284c7')

const generatedEmail = ref('')
const generatedPassword = ref('')
const cleanStoreName = ref('')

// Trata o nome da loja para gerar o e-mail e senha limpos
const generateSlugAndCredentials = () => {
  // 1. Gera Slug (ex: pizzaria-do-chefe)
  newStoreSlug.value = newStoreName.value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  // 2. Trata nome limpo sem espaço, traço nem hífen (ex: pizzariadochefe)
  cleanStoreName.value = newStoreName.value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

  if (cleanStoreName.value) {
    generatedEmail.value = `admin${cleanStoreName.value}@minhaloja.com`

    // Capitaliza primeira letra do nome limpo para a senha
    const formattedPassName = cleanStoreName.value.charAt(0).toUpperCase() + cleanStoreName.value.slice(1)
    generatedPassword.value = `admin${formattedPassName}2026?@`
  } else {
    generatedEmail.value = ''
    generatedPassword.value = ''
  }
}

const loadStores = async () => {
  loading.value = true
  const { data } = await supabase.from('stores').select('*')
  stores.value = (data as Store[]) || []
  loading.value = false
}

const selectStore = (store: Store) => {
  localStorage.setItem('active_store_id', store.id)
  localStorage.setItem('active_store_slug', store.slug)
  // Redireciona diretamente para o PAINEL ADMIN
  router.push(`/${store.slug}/admin`)
}

const handleCreateStore = async () => {
  if (!newStoreName.value || !newStoreSlug.value) return
  creating.value = true

  // 1. Cadastra o usuário admin no Supabase
  const { error: signUpError } = await supabase.auth.signUp({
    email: generatedEmail.value,
    password: generatedPassword.value,
  })

  if (signUpError && !signUpError.message.includes('User already registered')) {
    alert(`Erro ao criar conta administrativa: ${signUpError.message}`)
    creating.value = false
    return
  }

  // 2. Insere a loja na tabela `stores`
  const { data: createdStore, error: storeError } = await supabase
    .from('stores')
    .insert([{
      name: newStoreName.value,
      slug: newStoreSlug.value,
      theme_color: newStoreColor.value
    }])
    .select()
    .single()

  creating.value = false

  if (storeError) {
    alert(`Erro ao criar comércio: ${storeError.message}`)
  } else {
    alert(`Loja e Usuário Criados com Sucesso!\n\nE-mail: ${generatedEmail.value}\nSenha: ${generatedPassword.value}`)
    showCreateModal.value = false
    selectStore(createdStore as Store)
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

onMounted(() => {
  loadStores()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

.store-selector {
  min-height: 100vh;
  background: #f6f6f3;
  color: #111315;
  position: relative;
  overflow: hidden;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.store-selector *, .store-selector *::before, .store-selector *::after { box-sizing: border-box; }
.ambient { position: absolute; border-radius: 999px; filter: blur(80px); pointer-events: none; opacity: .45; }
.ambient-one { width: 430px; height: 430px; background: #ece7db; top: -160px; right: -100px; }
.ambient-two { width: 360px; height: 360px; background: #e6ebdf; left: -160px; bottom: -170px; }
.shell { max-width: 1180px; margin: 0 auto; padding: 44px 28px 64px; position: relative; z-index: 1; }
.page-header { margin-bottom: 42px; }
.eyebrow, .section-kicker, .shop-label, .card-eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .68rem; font-weight: 700; color: #7e817c; }
.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-top: 8px; }
h1, h2, h3, strong { font-family: 'Manrope', sans-serif; }
h1 { margin: 0; font-size: clamp(2.1rem, 4vw, 3.4rem); line-height: .98; letter-spacing: -.055em; max-width: 700px; }
.selector-header p { margin: 14px 0 0; color: #70746f; font-size: 1rem; max-width: 620px; }
.logout-button { border: 1px solid #dedfda; background: rgba(255,255,255,.72); color: #343733; height: 44px; padding: 0 15px; border-radius: 12px; display: inline-flex; align-items: center; gap: 9px; font-weight: 700; cursor: pointer; transition: .2s ease; }
.logout-button svg, .create-link svg, .manage-action svg, .preview-button svg, .close-button svg, .create-icon svg, .modal-icon svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.logout-button:hover { transform: translateY(-1px); background: white; border-color: #cfd1cb; }
.area-head { display:flex; justify-content:space-between; align-items:end; gap:16px; margin-bottom:18px; }
.area-head h2 { margin: 7px 0 0; font-size: 1.15rem; letter-spacing: -.02em; }
.secure-note { color:#6e756c; background:#edf0e9; border:1px solid #dfe4da; padding:7px 10px; border-radius:999px; font-size:.73rem; font-weight:700; }
.stores-grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(290px,1fr)); gap:16px; }
.store-card { appearance:none; border:0; text-align:left; border-radius:22px; padding:22px; min-height:286px; transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
.shop-card { cursor:pointer; background:rgba(255,255,255,.88); border:1px solid #e5e4df; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 10px 30px rgba(26,29,24,.04); }
.shop-card:hover { transform:translateY(-4px); box-shadow:0 20px 44px rgba(26,29,24,.09); border-color:#d5d6ce; }
.create-card { cursor:pointer; background:#171917; color:white; display:flex; flex-direction:column; justify-content:flex-end; position:relative; overflow:hidden; }
.create-card::after { content:''; width:180px; height:180px; position:absolute; right:-58px; top:-56px; border-radius:50%; background:radial-gradient(circle, rgba(255,255,255,.13), transparent 68%); }
.create-icon { width:52px; height:52px; border:1px solid rgba(255,255,255,.18); border-radius:16px; display:grid; place-items:center; margin-bottom:auto; position:relative; z-index:1; }
.create-card .card-eyebrow { color:#9aa198; position:relative; z-index:1; }
.create-card strong { display:block; font-size:1.4rem; letter-spacing:-.03em; margin-top:7px; position:relative; z-index:1; }
.create-card > span:not(.create-icon):not(.card-eyebrow):not(.create-link) { color:#afb4ad; line-height:1.55; font-size:.86rem; margin-top:8px; max-width:250px; position:relative; z-index:1; }
.create-link { margin-top:24px; display:inline-flex; align-items:center; gap:8px; color:#fff; font-weight:700; font-size:.82rem; position:relative; z-index:1; }
.card-topline { display:flex; justify-content:space-between; align-items:center; }
.store-logo { width:54px; height:54px; border-radius:17px; color:white; display:grid; place-items:center; box-shadow:inset 0 1px rgba(255,255,255,.25); }
.store-logo span { font-family:'Manrope'; font-size:1.25rem; font-weight:800; }
.live-pill { display:inline-flex; align-items:center; gap:6px; background:#f2f4ef; color:#737970; border:1px solid #e4e8df; padding:7px 9px; border-radius:999px; font-size:.69rem; font-weight:700; }
.live-pill i { width:6px; height:6px; border-radius:50%; background:#6f9c59; }
.shop-copy { margin-top:28px; }
.shop-copy h3 { font-size:1.45rem; letter-spacing:-.04em; margin:6px 0 7px; line-height:1.05; }
.shop-url { display:inline-block; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:#8b9088; background:#f4f4f0; border:1px solid #e9e9e3; border-radius:8px; padding:6px 8px; font-size:.76rem; }
.shop-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:26px; padding-top:17px; border-top:1px solid #ecece7; }
.manage-action { display:inline-flex; align-items:center; gap:6px; color:#181a18; font-size:.78rem; font-weight:800; }
.preview-button { display:inline-flex; align-items:center; gap:6px; border:1px solid #e2e3de; background:#fff; border-radius:10px; padding:8px 10px; color:#626760; font-size:.72rem; font-weight:700; cursor:pointer; }
.preview-button:hover { background:#f7f7f4; color:#151715; }
.loading-panel { min-height:340px; background:rgba(255,255,255,.68); border:1px solid #e8e7e1; border-radius:26px; display:grid; place-items:center; align-content:center; gap:10px; }
.loading-panel strong { font-size:1rem; }
.loading-panel span:last-child { color:#898d87; font-size:.82rem; }
.loading-mark { display:flex; gap:5px; margin-bottom:5px; }
.loading-mark span { width:8px; height:8px; border-radius:50%; background:#20231f; animation:pulse 1s infinite ease-in-out; }
.loading-mark span:nth-child(2){ animation-delay:.12s; opacity:.7 } .loading-mark span:nth-child(3){ animation-delay:.24s; opacity:.45 }
@keyframes pulse { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-5px) } }
.modal-overlay { position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding:20px; background:rgba(17,19,17,.58); backdrop-filter:blur(12px); }
.create-modal { width:min(560px,100%); max-height:calc(100vh - 40px); overflow:auto; background:#fbfbf8; border:1px solid rgba(255,255,255,.35); border-radius:26px; padding:26px; box-shadow:0 30px 90px rgba(0,0,0,.22); }
.modal-intro { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:start; margin-bottom:24px; }
.modal-icon { width:44px; height:44px; border-radius:14px; background:#1a1c19; color:white; display:grid; place-items:center; }
.modal-intro h2 { margin:5px 0 5px; font-size:1.45rem; letter-spacing:-.04em; }
.modal-intro p { margin:0; color:#7b7f78; font-size:.81rem; line-height:1.5; max-width:410px; }
.close-button { width:38px; height:38px; border:1px solid #e2e3de; border-radius:12px; background:#fff; color:#767b73; cursor:pointer; display:grid; place-items:center; }
.create-form { display:grid; gap:16px; }
.field { display:grid; gap:7px; }
.field > span { font-size:.74rem; font-weight:800; color:#363a35; }
.field input[type=text], .url-field { height:48px; border:1px solid #dfe1db; background:white; border-radius:13px; outline:none; transition:.2s ease; }
.field input[type=text] { width:100%; padding:0 14px; color:#20231f; font:inherit; }
.field input[type=text]:focus { border-color:#83897d; box-shadow:0 0 0 4px rgba(131,137,125,.11); }
.url-field { display:flex; align-items:center; overflow:hidden; }
.url-field span { padding:0 0 0 13px; color:#92978e; font:700 .76rem ui-monospace,SFMono-Regular,Menlo,monospace; }
.url-field input { border:0 !important; box-shadow:none !important; padding-left:8px !important; }
.credentials-panel { background:#f1f4ef; border:1px solid #dde4d9; border-radius:15px; padding:14px; }
.credentials-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:11px; border-bottom:1px solid #dde4d9; }
.credentials-header strong { display:block; margin-top:4px; font-size:.87rem; }
.generated-badge { font-size:.67rem; font-weight:800; color:#60715a; background:#e1ebdc; padding:6px 8px; border-radius:999px; }
.credential-row { display:grid; grid-template-columns:70px 1fr; gap:12px; padding-top:11px; font-size:.74rem; align-items:center; }
.credential-row span { color:#7f877c; }
.credential-row code { overflow-wrap:anywhere; color:#2c3629; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.72rem; }
.color-field { display:flex; align-items:center; gap:10px; min-height:48px; padding:7px 10px; border:1px solid #dfe1db; background:white; border-radius:13px; }
.color-field input[type=color] { width:38px; height:34px; border:0; padding:0; background:none; cursor:pointer; }
.color-field > div { width:18px; height:18px; border-radius:6px; border:1px solid rgba(0,0,0,.08); }
.color-field code { font:700 .74rem ui-monospace,SFMono-Regular,Menlo,monospace; color:#3f433d; }
.color-field > span { margin-left:auto; color:#979b94; font-size:.69rem; }
.modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:8px; }
.secondary-button,.primary-button { min-height:46px; border-radius:12px; padding:0 16px; font:700 .78rem 'DM Sans', sans-serif; cursor:pointer; }
.secondary-button { border:1px solid #dedfd9; background:white; color:#60655e; }
.primary-button { border:1px solid #171917; background:#171917; color:white; min-width:160px; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
.primary-button:disabled { opacity:.68; cursor:wait; }
.mini-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .65s linear infinite; }
@keyframes spin { to { transform:rotate(360deg) } }
@media (max-width:760px){
  .shell{padding:28px 16px 44px}.header-row{align-items:end}.logout-button span{display:none}.logout-button{width:44px;padding:0;justify-content:center}
  .area-head{align-items:center}.stores-grid{grid-template-columns:1fr}.store-card{min-height:254px}.create-card{min-height:250px}.shop-actions{flex-wrap:wrap}.modal-intro{grid-template-columns:auto 1fr auto}.color-field > span{display:none}
}
</style>
