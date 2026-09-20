<template>
  <section class="settings-shell">
    <div class="page-heading">
      <div>
        <span class="eyebrow">IDENTIDADE DA LOJA</span>
        <h2>Configurações</h2>
        <p>Defina como sua operação aparece para você e para seus clientes.</p>
      </div>
      <div class="save-state" :class="{ saving }">
        <span class="save-dot"></span>
        {{ saving ? 'Salvando alterações' : 'Tudo pronto para salvar' }}
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="settings-layout">
      <div class="settings-main">
        <article class="panel-card brand-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Marca</span>
              <h3>Como sua loja é apresentada</h3>
              <p>Nome, endereço e identidade visual usados no sistema.</p>
            </div>
            <div class="mini-brand">
              <div class="mini-brand-avatar">{{ form.name?.charAt(0) || 'L' }}</div>
            </div>
          </div>

          <div class="field-grid">
            <label class="field field-wide">
              <span>Nome da loja</span>
              <input v-model="form.name" type="text" required placeholder="Ex.: Colono Espetos" />
            </label>

            <label class="field">
              <span>Slug da loja</span>
              <div class="input-with-prefix">
                <span>/</span>
                <input v-model="form.slug" type="text" required placeholder="minha-loja" />
              </div>
              <small>Será usado no endereço público da sua vitrine.</small>
            </label>

            <label class="field">
              <span>WhatsApp de pedidos</span>
              <input v-model="form.whatsapp_number" type="text" inputmode="numeric" placeholder="5511999999999" />
              <small>Inclua país + DDD + número. Ex.: 5511999999999</small>
            </label>
          </div>
        </article>

        <!-- NOVO: CONFIGURAÇÃO DE LOCALIZAÇÃO E TAXA DE ENTREGA -->
        <article class="panel-card location-panel">
          <div class="panel-head">
            <div>
              <span class="section-kicker">Logística e Frete</span>
              <h3>Localização e Taxa de Entrega por Distância</h3>
              <p>Informe o endereço da loja e os valores do frete calculados via Google Maps.</p>
            </div>
          </div>

          <div class="field-grid">
            <label class="field field-wide">
              <span>Endereço físico da loja (Origem)</span>
              <input v-model="form.address" type="text" placeholder="Rua, número, cidade - UF" />
            </label>

            <label class="field">
              <span>Latitude da Loja</span>
              <input v-model.number="form.latitude" type="text" step="0.00000001" placeholder="-23.550520" />
            </label>

            <label class="field">
              <span>Longitude da Loja</span>
              <input v-model.number="form.longitude" type="text" step="0.00000001" placeholder="-46.633308" />
            </label>

            <label class="field">
              <span>Taxa Base de Entrega (R$)</span>
              <input v-model.number="form.delivery_base_fee" type="number" step="0.01" min="0" placeholder="5.00" />
            </label>

            <label class="field">
              <span>Valor por Quilómetro (R$/km)</span>
              <input v-model.number="form.delivery_fee_per_km" type="number" step="0.01" min="0" placeholder="1.50" />
            </label>
          </div>
        </article>

        <article class="panel-card banner-panel">
          <div class="panel-head compact">
            <div>
              <span class="section-kicker">Vitrine</span>
              <h3>Imagem principal</h3>
              <p>Uma boa foto cria a primeira impressão do seu cardápio.</p>
            </div>
          </div>

          <div class="banner-stage" :class="{ 'has-image': form.banner_url }">
            <img v-if="form.banner_url" :src="form.banner_url" alt="Banner da Loja" />
            <div v-else class="banner-empty">
              <div class="upload-icon">＋</div>
              <strong>Escolha uma imagem de destaque</strong>
              <span>Use uma foto horizontal de boa qualidade.</span>
            </div>
            <div class="banner-overlay">
              <span>CAPA DA VITRINE</span>
              <strong>{{ form.name || 'Sua loja' }}</strong>
            </div>
          </div>

          <div class="upload-row">
            <label class="upload-button">
              <input type="file" accept="image/*" @change="handleBannerFileSelect" :disabled="uploadingBanner" />
              <span>{{ uploadingBanner ? 'Processando imagem…' : (form.banner_url ? 'Trocar imagem' : 'Escolher imagem') }}</span>
            </label>
            <small>Imagem comprimida automaticamente antes do envio.</small>
          </div>
        </article>

        <article class="panel-card theme-panel">
          <div class="panel-head compact">
            <div>
              <span class="section-kicker">Personalidade</span>
              <h3>Cor da marca</h3>
              <p>A cor escolhida será usada como destaque na experiência da loja.</p>
            </div>
          </div>
          <div class="theme-controls">
            <input v-model="form.theme_color" type="color" class="color-swatch" aria-label="Selecionar cor da marca" />
            <div class="theme-copy">
              <strong>Cor principal</strong>
              <div class="hex-row">
                <span>#</span>
                <input v-model="form.theme_color" type="text" maxlength="7" class="hex-input" />
              </div>
            </div>
            <div class="theme-preview" :style="{ '--preview-color': form.theme_color || '#ea1d2c' }">
              <span class="preview-pill">Destaque</span>
              <button type="button">Adicionar</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="settings-side">
        <article class="panel-card live-panel">
          <div class="panel-head compact">
            <div>
              <span class="section-kicker">Operação</span>
              <h3>Status da loja</h3>
              <p>Controle se novos pedidos podem ser realizados agora.</p>
            </div>
          </div>

          <button type="button" :class="['status-switch', { open: form.is_open }]" @click="form.is_open = !form.is_open">
            <span class="switch-icon">{{ form.is_open ? '✓' : '×' }}</span>
            <span>
              <strong>{{ form.is_open ? 'Aberto para pedidos' : 'Fechado no momento' }}</strong>
              <small>{{ form.is_open ? 'Clientes podem comprar normalmente.' : 'A vitrine fica disponível para consulta.' }}</small>
            </span>
            <span class="switch-track"><span></span></span>
          </button>
        </article>

        <article class="panel-card preview-panel">
          <div class="panel-head compact">
            <div>
              <span class="section-kicker">Prévia</span>
              <h3>Como sua marca aparece</h3>
            </div>
          </div>
          <div class="store-preview">
            <div class="preview-cover" :style="{ backgroundImage: form.banner_url ? `url(${form.banner_url})` : 'none' }">
              <div class="preview-shade"></div>
            </div>
            <div class="preview-body">
              <div class="preview-avatar" :style="{ background: form.theme_color || '#ea1d2c' }">{{ form.name?.charAt(0) || 'L' }}</div>
              <div>
                <strong>{{ form.name || 'Nome da loja' }}</strong>
                <span :class="['preview-status', { closed: !form.is_open }]">
                  <i></i>{{ form.is_open ? 'Aberto agora' : 'Fechado' }}
                </span>
              </div>
            </div>
          </div>
        </article>

        <div class="save-card">
          <div>
            <strong>Pronto para publicar?</strong>
            <span>Suas alterações entram no ar ao salvar.</span>
          </div>
          <button type="submit" class="save-button" :disabled="saving || uploadingBanner">
            <span>{{ saving ? 'Salvando…' : 'Salvar alterações' }}</span>
            <span class="save-arrow">→</span>
          </button>
        </div>
      </aside>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { compressImage } from '@/utils/compressor'

const props = defineProps<{ store: any }>()
const emit = defineEmits(['update'])

const saving = ref(false)
const uploadingBanner = ref(false)

const form = ref({
  name: '',
  slug: '',
  whatsapp_number: '',
  theme_color: '#ea1d2c',
  banner_url: '',
  is_open: true,
  address: '',
  latitude: 0,
  longitude: 0,
  delivery_base_fee: 5.00,
  delivery_fee_per_km: 1.50
})

watch(() => props.store, (newStore) => {
  if (newStore) {
    form.value = {
      name: newStore.name || '',
      slug: newStore.slug || '',
      whatsapp_number: newStore.whatsapp_number || '',
      theme_color: newStore.theme_color || '#ea1d2c',
      banner_url: newStore.banner_url || '',
      is_open: newStore.is_open ?? true,
      address: newStore.address || '',
      latitude: newStore.latitude || 0,
      longitude: newStore.longitude || 0,
      delivery_base_fee: newStore.delivery_base_fee ?? 5.00,
      delivery_fee_per_km: newStore.delivery_fee_per_km ?? 1.50
    }
  }
}, { immediate: true })

const handleBannerFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0 || !target.files[0]) return

  const selectedFile = target.files[0]
  uploadingBanner.value = true

  try {
    const compressed = await compressImage(selectedFile, 1200, 0.8)

    const fileExt = compressed.name.split('.').pop()
    const fileName = `banner-${props.store?.id || 'store'}-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, compressed, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    form.value.banner_url = data.publicUrl
  } catch (err: unknown) {
    const error = err as Error
    console.error('Erro no upload do banner:', error)
    alert(`Erro ao fazer upload do banner: ${error.message || 'Verifique o bucket no Supabase'}`)
  } finally {
    uploadingBanner.value = false
  }
}

const handleSubmit = async () => {
  if (!props.store?.id) return
  saving.value = true

  const newSlug = form.value.slug.trim().toLowerCase().replace(/\s+/g, '-')

  const payload = {
    name: form.value.name,
    slug: newSlug,
    whatsapp_number: form.value.whatsapp_number.replace(/\D/g, ''),
    theme_color: form.value.theme_color,
    banner_url: form.value.banner_url,
    is_open: form.value.is_open,
    address: form.value.address,
    latitude: form.value.latitude ? Number(form.value.latitude) : null,
    longitude: form.value.longitude ? Number(form.value.longitude) : null,
    delivery_base_fee: Number(form.value.delivery_base_fee) || 0,
    delivery_fee_per_km: Number(form.value.delivery_fee_per_km) || 0
  }

  const { error } = await supabase
    .from('stores')
    .update(payload)
    .eq('id', props.store.id)

  saving.value = false

  if (error) {
    console.error('Erro ao salvar loja:', error)
    alert(`Erro ao salvar: ${error.message}`)
  } else {
    alert('Configurações salvas com sucesso!')
    emit('update', newSlug)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.settings-shell { --ink:#171717; --muted:#75716c; --line:#ebe6df; --soft:#f8f6f2; background:#f7f5f1; color:var(--ink); padding:32px; min-height:100%; font-family:'DM Sans',system-ui,sans-serif; }
.page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin:0 auto 24px; max-width:1280px; }
.eyebrow,.section-kicker { display:block; font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#a1978b; margin-bottom:8px; }
.page-heading h2 { margin:0; font:800 clamp(30px,4vw,42px)/1 'Manrope',sans-serif; letter-spacing:-.04em; }
.page-heading p { margin:9px 0 0; color:var(--muted); font-size:14px; }
.save-state { display:flex; align-items:center; gap:9px; padding:10px 13px; border:1px solid var(--line); border-radius:999px; background:#fff; color:#67615a; font-size:12px; font-weight:700; white-space:nowrap; }
.save-state.saving { color:#171717; }
.save-dot { width:7px; height:7px; border-radius:50%; background:#2ba56b; box-shadow:0 0 0 4px rgba(43,165,107,.1); }
.settings-layout { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:minmax(0,1.45fr) minmax(320px,.72fr); gap:20px; align-items:start; }
.settings-main,.settings-side { display:flex; flex-direction:column; gap:20px; min-width:0; }
.panel-card { background:#fff; border:1px solid var(--line); border-radius:22px; padding:24px; box-shadow:0 14px 40px rgba(32,24,16,.035); }
.panel-head { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; margin-bottom:22px; }
.panel-head.compact { margin-bottom:18px; }
.panel-head h3 { margin:0; font:800 18px/1.2 'Manrope',sans-serif; letter-spacing:-.025em; }
.panel-head p { margin:7px 0 0; color:var(--muted); font-size:13px; line-height:1.5; max-width:620px; }
.mini-brand { width:44px; height:44px; border:1px solid var(--line); border-radius:14px; padding:4px; background:#faf8f5; }
.mini-brand-avatar { width:100%; height:100%; border-radius:10px; display:grid; place-items:center; background:#171717; color:#fff; font-weight:800; }
.field-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.field { display:flex; flex-direction:column; gap:7px; min-width:0; }
.field-wide { grid-column:1/-1; }
.field > span { font-size:12px; font-weight:800; letter-spacing:.01em; }
.field input,.hex-input { width:100%; height:46px; border:1px solid #ded7ce; border-radius:12px; background:#fcfbf9; padding:0 13px; color:var(--ink); font:500 14px 'DM Sans',sans-serif; outline:none; transition:.2s; }
.field input:focus,.hex-input:focus { border-color:#a99d90; background:#fff; box-shadow:0 0 0 4px rgba(169,157,144,.1); }
.field small,.upload-row small { color:#999189; font-size:11px; line-height:1.45; }
.input-with-prefix { display:flex; align-items:center; border:1px solid #ded7ce; background:#fcfbf9; border-radius:12px; overflow:hidden; }
.input-with-prefix > span { padding-left:13px; color:#9d958d; font-weight:700; }
.input-with-prefix input { border:0; background:transparent; box-shadow:none; }
.banner-stage { position:relative; min-height:220px; border:1px dashed #d9d0c6; background:linear-gradient(135deg,#f4f0eb,#fbfaf8); border-radius:18px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.banner-stage.has-image { border-style:solid; }
.banner-stage img { width:100%; height:100%; min-height:220px; object-fit:cover; display:block; }
.banner-empty { text-align:center; display:flex; flex-direction:column; align-items:center; gap:6px; color:#8f877f; }
.banner-empty strong { color:#4f4942; font-size:13px; }
.banner-empty span { font-size:11px; }
.upload-icon { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; background:#fff; border:1px solid var(--line); font-size:22px; margin-bottom:4px; }
.banner-overlay { position:absolute; inset:auto 14px 14px; display:flex; flex-direction:column; gap:3px; padding:16px; border-radius:14px; color:#fff; background:linear-gradient(180deg,transparent,rgba(0,0,0,.72)); pointer-events:none; }
.banner-overlay span { font-size:9px; font-weight:800; letter-spacing:.15em; opacity:.72; }
.banner-overlay strong { font:800 20px 'Manrope',sans-serif; }
.upload-row { display:flex; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap; }
.upload-button { position:relative; display:inline-flex; align-items:center; justify-content:center; height:42px; padding:0 15px; border-radius:11px; background:#171717; color:#fff; font-size:12px; font-weight:800; cursor:pointer; overflow:hidden; }
.upload-button input { position:absolute; inset:0; opacity:0; cursor:pointer; }
.theme-controls { display:grid; grid-template-columns:auto 1fr minmax(180px,.8fr); gap:18px; align-items:center; }
.color-swatch { width:66px; height:66px; border:0; padding:0; border-radius:18px; overflow:hidden; background:transparent; cursor:pointer; }
.theme-copy { display:flex; flex-direction:column; gap:8px; }
.theme-copy strong { font-size:13px; }
.hex-row { display:flex; align-items:center; width:min(220px,100%); height:40px; border:1px solid #ded7ce; border-radius:10px; background:#fcfbf9; overflow:hidden; color:#aaa099; font-weight:700; padding-left:11px; }
.hex-input { height:38px; border:0; background:transparent; padding-left:3px; }
.theme-preview { border:1px solid var(--line); border-radius:16px; padding:14px; display:flex; justify-content:space-between; align-items:center; gap:12px; background:#faf8f5; }
.preview-pill { font-size:10px; font-weight:800; color:var(--preview-color); background:color-mix(in srgb,var(--preview-color) 11%,white); padding:7px 9px; border-radius:999px; }
.theme-preview button { border:0; background:var(--preview-color); color:#fff; padding:9px 12px; border-radius:9px; font-weight:800; font-size:11px; }
.status-switch { width:100%; border:1px solid #e5dfd7; background:#faf8f5; border-radius:16px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:12px; padding:15px; text-align:left; cursor:pointer; }
.status-switch.open { background:#f3fbf6; border-color:#d4eadb; }
.switch-icon { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; background:#efeae4; color:#8d8379; font-weight:900; }
.status-switch.open .switch-icon { background:#dff4e6; color:#23824f; }
.status-switch strong { display:block; font-size:12px; }
.status-switch small { display:block; margin-top:3px; font-size:10px; color:#8c857d; line-height:1.4; }
.switch-track { width:42px; height:24px; padding:3px; border-radius:99px; background:#d9d3cc; }
.switch-track span { display:block; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,.15); transition:.2s; }
.status-switch.open .switch-track { background:#2ea76a; }
.status-switch.open .switch-track span { transform:translateX(18px); }
.store-preview { border:1px solid var(--line); border-radius:18px; overflow:hidden; background:#fff; }
.preview-cover { height:110px; background:#eee8e0 center/cover no-repeat; position:relative; }
.preview-shade { position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.3)); }
.preview-body { display:flex; align-items:center; gap:11px; padding:12px; }
.preview-avatar { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; color:#fff; font-weight:900; flex:none; }
.preview-body strong { display:block; font-size:13px; }
.preview-status { display:flex; align-items:center; gap:5px; margin-top:4px; color:#26804e; font-size:10px; font-weight:700; }
.preview-status.closed { color:#9a655f; }
.preview-status i { width:6px; height:6px; border-radius:50%; background:#32a96f; }
.preview-status.closed i { background:#b66c62; }
.save-card { position:sticky; top:20px; background:#171717; color:#fff; border-radius:22px; padding:20px; box-shadow:0 20px 50px rgba(23,23,23,.16); }
.save-card strong,.save-card span { display:block; }
.save-card strong { font:800 16px 'Manrope',sans-serif; }
.save-card > div > span { margin-top:5px; color:#aaa7a2; font-size:11px; }
.save-button { margin-top:16px; width:100%; min-height:48px; border:0; border-radius:13px; background:#fff; color:#171717; display:flex; align-items:center; justify-content:space-between; padding:0 15px; font-weight:800; cursor:pointer; }
.save-button:disabled { opacity:.5; cursor:not-allowed; }
.save-arrow { font-size:18px; }
@media (max-width: 1024px) { .settings-shell{padding:24px;} .settings-layout{grid-template-columns:1fr;} .save-card{position:static;} }
@media (max-width: 720px) { .settings-shell{padding:18px;} .page-heading{align-items:flex-start; flex-direction:column;} .save-state{display:none;} .field-grid{grid-template-columns:1fr;} .field-wide{grid-column:auto;} .theme-controls{grid-template-columns:auto 1fr;} .theme-preview{grid-column:1/-1;} .panel-card{padding:18px; border-radius:18px;} }
</style>
