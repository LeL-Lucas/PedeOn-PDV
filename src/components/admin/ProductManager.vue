<template>
  <div class="product-manager">
    <section class="page-hero">
      <div>
        <div class="eyebrow">CATÁLOGO</div>
        <h2>Seus produtos, apresentados do jeito certo.</h2>
        <p>Gerencie itens, preços, categorias, visibilidade e opções do cardápio em um só lugar.</p>
      </div>
      <button @click="openModal()" class="btn-primary">
        <span class="plus">+</span>
        Novo produto
      </button>
    </section>

    <section class="catalog-toolbar">
      <div class="catalog-summary">
        <span class="summary-count">{{ products.length }}</span>
        <span>produto{{ products.length === 1 ? '' : 's' }} cadastrado{{ products.length === 1 ? '' : 's' }}</span>
      </div>
      <div class="toolbar-note">A vitrine usa os produtos marcados como visíveis.</div>
    </section>

    <section v-if="products.length" class="product-grid">
      <article v-for="product in products" :key="product.id" class="product-card">
        <div class="product-media">
          <img :src="product.image_url || 'https://via.placeholder.com/600x480?text=Produto'" :alt="product.name" />
          <div class="media-fade"></div>
          <span :class="['visibility-pill', product.show_in_storefront !== false ? 'visible' : 'private']">
            {{ product.show_in_storefront !== false ? 'Visível' : 'Só garçons' }}
          </span>
        </div>

        <div class="product-body">
          <div class="product-meta">
            <span class="category-label">{{ getCategoryName(product.category_id) }}</span>
            <span v-if="product.complement_groups?.length" class="options-label">
              {{ product.complement_groups.length }} grupo{{ product.complement_groups.length > 1 ? 's' : '' }}
            </span>
          </div>

          <h3>{{ product.name }}</h3>
          <p class="product-description">
            {{ product.description || 'Sem descrição cadastrada para este produto.' }}
          </p>

          <div class="product-bottom">
            <strong>R$ {{ Number(product.price || 0).toFixed(2) }}</strong>
            <div class="product-actions">
              <button @click="openModal(product)" class="action-button edit">Editar</button>
              <button @click="deleteProduct(product.id)" class="action-button delete" aria-label="Excluir produto">Excluir</button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <div class="empty-orb">+</div>
      <h3>Seu catálogo começa aqui</h3>
      <p>Cadastre seu primeiro produto para começar a montar sua vitrine.</p>
      <button @click="openModal()" class="btn-primary">Criar primeiro produto</button>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <div>
            <div class="eyebrow">CATÁLOGO</div>
            <h3>{{ editingId ? 'Editar produto' : 'Novo produto' }}</h3>
            <p>Deixe as informações claras para quem vai pedir.</p>
          </div>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Fechar">×</button>
        </header>

        <form @submit.prevent="saveProduct" class="modal-form">
          <div class="editor-layout">
            <div class="editor-main">
              <section class="form-section">
                <div class="section-heading">
                  <span class="section-number">01</span>
                  <div>
                    <h4>Informações do produto</h4>
                    <p>Nome, descrição, preço e categoria.</p>
                  </div>
                </div>

                <div class="form-grid two">
                  <div class="form-group span-2">
                    <label>Nome do produto</label>
                    <input v-model="form.name" type="text" required placeholder="Ex.: Smash Bacon" />
                  </div>

                  <div class="form-group span-2">
                    <label>Descrição</label>
                    <textarea v-model="form.description" rows="3" placeholder="Explique o que torna esse produto especial..."></textarea>
                  </div>

                  <div class="form-group">
                    <label>Preço base</label>
                    <div class="money-field">
                      <span>R$</span>
                      <input v-model.number="form.price" type="number" step="0.01" required placeholder="0,00" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Categoria</label>
                    <select v-model="form.category_id" required>
                      <option value="" disabled>Selecione uma categoria</option>
                      <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                    </select>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <span class="section-number">02</span>
                  <div>
                    <h4>Imagem</h4>
                    <p>Uma boa foto aumenta muito a percepção do produto.</p>
                  </div>
                </div>

                <div class="image-editor">
                  <div class="image-preview">
                    <img v-if="form.image_url" :src="form.image_url" alt="Preview do produto" />
                    <div v-else class="image-placeholder">
                      <span>＋</span>
                      <small>Sem imagem</small>
                    </div>
                  </div>

                  <div class="image-copy">
                    <label class="upload-button">
                      <input type="file" accept="image/*" @change="handleImageUpload" :disabled="uploading" />
                      {{ uploading ? 'Processando imagem...' : 'Escolher imagem' }}
                    </label>
                    <p>Usaremos uma versão otimizada para carregar rápido na vitrine.</p>
                  </div>
                </div>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <span class="section-number">03</span>
                  <div>
                    <h4>Visibilidade</h4>
                    <p>Controle onde esse produto pode aparecer.</p>
                  </div>
                </div>

                <label class="visibility-toggle">
                  <span>
                    <strong>Exibir no cardápio online</strong>
                    <small>Desative para deixar disponível apenas para os garçons.</small>
                  </span>
                  <input type="checkbox" v-model="form.show_in_storefront" />
                  <span class="toggle-ui"></span>
                </label>
              </section>
            </div>

            <aside class="editor-aside">
              <div class="live-card">
                <div class="live-label">PRÉVIA DO PRODUTO</div>
                <div class="live-image">
                  <img v-if="form.image_url" :src="form.image_url" alt="" />
                  <div v-else class="live-placeholder"></div>
                </div>
                <div class="live-content">
                  <span>{{ getCategoryName(form.category_id) }}</span>
                  <h5>{{ form.name || 'Nome do produto' }}</h5>
                  <p>{{ form.description || 'Sua descrição aparecerá aqui.' }}</p>
                  <strong>R$ {{ Number(form.price || 0).toFixed(2) }}</strong>
                </div>
              </div>
            </aside>
          </div>

          <section class="form-section complements">
            <div class="section-heading section-heading-inline">
              <div>
                <span class="eyebrow">04 · PERSONALIZAÇÃO</span>
                <h4>Escolhas e adicionais</h4>
                <p>Monte grupos para tamanhos, sabores, extras ou pontos de preparo.</p>
              </div>
              <button type="button" class="btn-secondary" @click="addGroup">+ Novo grupo</button>
            </div>

            <div v-if="form.complement_groups.length === 0" class="groups-empty">
              <strong>Nenhum grupo criado</strong>
              <span>Adicione grupos apenas quando o cliente precisar fazer escolhas.</span>
            </div>

            <div v-for="(group, gIdx) in form.complement_groups" :key="gIdx" class="group-card">
              <div class="group-top">
                <div class="group-index">{{ String(gIdx + 1).padStart(2, '0') }}</div>
                <div class="group-title">
                  <label>Nome do grupo</label>
                  <input v-model="group.title" type="text" placeholder="Ex.: Escolha o tamanho" required />
                </div>
                <div class="limit-field">
                  <label>Mín.</label>
                  <input v-model.number="group.min" type="number" min="0" />
                </div>
                <div class="limit-field">
                  <label>Máx.</label>
                  <input v-model.number="group.max" type="number" min="1" required />
                </div>
                <div class="group-controls">
                  <button type="button" @click="moveGroupUp(gIdx)" :disabled="gIdx === 0">↑</button>
                  <button type="button" @click="moveGroupDown(gIdx)" :disabled="gIdx === form.complement_groups.length - 1">↓</button>
                  <button type="button" class="danger" @click="removeGroup(gIdx)">×</button>
                </div>
              </div>

              <div class="items-area">
                <div v-for="(item, iIdx) in group.items" :key="iIdx" class="item-row">
                  <input v-model="item.name" type="text" placeholder="Nome da opção" required />
                  <div class="item-price">
                    <span>R$</span>
                    <input v-model.number="item.price" type="number" step="0.50" min="0" placeholder="0,00" />
                  </div>
                  <button type="button" @click="removeItem(gIdx, iIdx)" class="item-delete">×</button>
                </div>
                <button type="button" class="add-item" @click="addItem(gIdx)">+ Adicionar opção</button>
              </div>
            </div>
          </section>

          <footer class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="saving || uploading">
              {{ saving ? 'Salvando...' : 'Salvar produto' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { compressImage } from '@/utils/compressor'

interface ComplementItem {
  name: string
  price: number
}

interface ComplementGroup {
  title: string
  min: number
  max: number
  items: ComplementItem[]
}

interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  category_id?: string
  image_url?: string
  show_in_storefront?: boolean
  complement_groups?: ComplementGroup[]
}

interface Category {
  id: string
  name: string
  store_id: string
}

interface ProductForm {
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  show_in_storefront: boolean
  complement_groups: ComplementGroup[]
}

const props = defineProps<{ storeId: string }>()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

const form = ref<ProductForm>({
  name: '',
  description: '',
  price: 0,
  category_id: '',
  image_url: '',
  show_in_storefront: true,
  complement_groups: []
})

const fetchProducts = async () => {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', props.storeId)
    .order('created_at', { ascending: false })

  products.value = (data as Product[]) || []
}

const fetchCategories = async () => {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', props.storeId)

  categories.value = (data as Category[]) || []
}

const getCategoryName = (catId?: string) => {
  if (!catId) return 'Geral'
  const cat = categories.value.find(c => c.id === catId)
  return cat ? cat.name : 'Geral'
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0 || !target.files[0]) return

  const file = target.files[0]
  uploading.value = true

  try {
    const compressed = await compressImage(file, 800, 0.8)
    const fileExt = compressed.name.split('.').pop() || 'jpg'
    const fileName = `product-${props.storeId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, compressed, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    form.value.image_url = data.publicUrl
  } catch (err: unknown) {
    const error = err as Error
    alert(`Erro no envio da imagem: ${error.message}`)
  } finally {
    uploading.value = false
  }
}

const addGroup = () => {
  form.value.complement_groups.push({
    title: '',
    min: 0,
    max: 1,
    items: [{ name: '', price: 0 }]
  })
}

const removeGroup = (index: number) => {
  form.value.complement_groups.splice(index, 1)
}

const moveGroupUp = (index: number) => {
  if (index <= 0) return
  const itemToMove = form.value.complement_groups[index]
  if (!itemToMove) return

  form.value.complement_groups.splice(index, 1)
  form.value.complement_groups.splice(index - 1, 0, itemToMove)
}

const moveGroupDown = (index: number) => {
  if (index >= form.value.complement_groups.length - 1) return
  const itemToMove = form.value.complement_groups[index]
  if (!itemToMove) return

  form.value.complement_groups.splice(index, 1)
  form.value.complement_groups.splice(index + 1, 0, itemToMove)
}

const addItem = (groupIndex: number) => {
  if (form.value.complement_groups[groupIndex]) {
    form.value.complement_groups[groupIndex].items.push({ name: '', price: 0 })
  }
}

const removeItem = (groupIndex: number, itemIndex: number) => {
  if (form.value.complement_groups[groupIndex]) {
    form.value.complement_groups[groupIndex].items.splice(itemIndex, 1)
  }
}

const openModal = (product?: Product) => {
  if (product) {
    editingId.value = product.id
    form.value = {
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      show_in_storefront: product.show_in_storefront ?? true,
      complement_groups: Array.isArray(product.complement_groups)
        ? JSON.parse(JSON.stringify(product.complement_groups))
        : []
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      description: '',
      price: 0,
      category_id: categories.value[0]?.id || '',
      image_url: '',
      show_in_storefront: true,
      complement_groups: []
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveProduct = async () => {
  saving.value = true
  const payload = {
    store_id: props.storeId,
    name: form.value.name,
    description: form.value.description,
    price: form.value.price,
    category_id: form.value.category_id || null,
    image_url: form.value.image_url,
    show_in_storefront: form.value.show_in_storefront,
    complement_groups: form.value.complement_groups
  }

  if (editingId.value) {
    await supabase.from('products').update(payload).eq('id', editingId.value)
  } else {
    await supabase.from('products').insert([payload])
  }

  saving.value = false
  closeModal()
  fetchProducts()
}

const deleteProduct = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script><style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

.product-manager{
  --ink:#162018;
  --muted:#758079;
  --line:#e7ebe7;
  --surface:#ffffff;
  --soft:#f6f8f5;
  --accent:#1c7a4c;
  --accent-dark:#145c39;
  --danger:#c84a46;
  font-family:'DM Sans',system-ui,sans-serif;
  background:#f4f6f3;
  min-height:100%;
  padding:2rem;
  color:var(--ink);
}
.page-hero{
  display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;
  margin-bottom:1.5rem;
}
.eyebrow{font-size:.66rem;font-weight:800;letter-spacing:.14em;color:var(--accent);text-transform:uppercase}
.page-hero h2{font-family:Manrope,sans-serif;font-size:clamp(1.7rem,2.4vw,2.5rem);letter-spacing:-.045em;margin:.35rem 0 .55rem;max-width:720px}
.page-hero p{margin:0;color:var(--muted);max-width:720px;font-size:.95rem;line-height:1.55}
.btn-primary,.btn-save,.btn-secondary,.upload-button{
  border:0;cursor:pointer;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;
  transition:.2s ease;
}
.btn-primary,.btn-save{background:var(--ink);color:white;border-radius:14px;padding:.88rem 1.15rem;box-shadow:0 10px 22px rgba(22,32,24,.12)}
.btn-primary:hover,.btn-save:hover{transform:translateY(-1px);background:#0e1510}
.plus{font-size:1.05rem}
.catalog-toolbar{
  display:flex;align-items:center;justify-content:space-between;background:white;border:1px solid var(--line);
  border-radius:16px;padding:.8rem 1rem;margin-bottom:1rem;
}
.catalog-summary{display:flex;gap:.5rem;align-items:center;font-size:.82rem;font-weight:700;color:#4c5750}
.summary-count{font-family:Manrope;font-size:1.15rem;color:var(--ink)}
.toolbar-note{font-size:.75rem;color:#919a94}
.product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
.product-card{background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 7px 25px rgba(31,43,35,.04);transition:.22s ease}
.product-card:hover{transform:translateY(-3px);box-shadow:0 15px 32px rgba(31,43,35,.08)}
.product-media{aspect-ratio:1.35;position:relative;background:#e9ece8;overflow:hidden}
.product-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}
.product-card:hover .product-media img{transform:scale(1.035)}
.media-fade{position:absolute;inset:auto 0 0;height:45%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.42))}
.visibility-pill{
  position:absolute;top:.85rem;right:.85rem;padding:.42rem .62rem;border-radius:999px;font-size:.66rem;font-weight:800;
  backdrop-filter:blur(8px);background:rgba(255,255,255,.9)
}
.visibility-pill.visible{color:var(--accent)}
.visibility-pill.private{color:#8b5b00}
.product-body{padding:1rem}
.product-meta{display:flex;justify-content:space-between;gap:.5rem;margin-bottom:.5rem}
.category-label,.options-label{font-size:.68rem;font-weight:800;color:#8b958e}
.category-label{text-transform:uppercase;letter-spacing:.08em}
.product-body h3{font-family:Manrope;font-size:1.08rem;margin:0 0 .35rem;letter-spacing:-.03em}
.product-description{color:var(--muted);font-size:.78rem;line-height:1.5;min-height:2.35em;margin:0}
.product-bottom{display:flex;justify-content:space-between;align-items:center;gap:.75rem;margin-top:1rem}
.product-bottom strong{font-family:Manrope;font-size:1.05rem}
.product-actions{display:flex;gap:.4rem}
.action-button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:.52rem .68rem;font-size:.73rem;font-weight:800;cursor:pointer}
.action-button.edit:hover{border-color:#b8c7be;background:#f7faf7}
.action-button.delete{color:var(--danger)}
.action-button.delete:hover{background:#fff3f1;border-color:#f2d1ce}
.empty-state{background:#fff;border:1px dashed #d9dfda;border-radius:20px;padding:4rem 1.5rem;text-align:center}
.empty-orb{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:#eef4ee;color:var(--accent);font-size:1.35rem;font-weight:700;margin:0 auto 1rem}
.empty-state h3{font-family:Manrope;font-size:1.2rem;margin:0 0 .4rem}
.empty-state p{color:var(--muted);margin:0 auto 1.2rem;font-size:.85rem}
.modal-overlay{position:fixed;inset:0;background:rgba(17,24,19,.52);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:100}
.modal-content{width:min(1100px,100%);max-height:94vh;overflow:auto;background:#f7f8f6;border:1px solid rgba(255,255,255,.4);border-radius:24px;box-shadow:0 35px 80px rgba(0,0,0,.22)}
.modal-header{display:flex;justify-content:space-between;gap:1rem;padding:1.5rem 1.6rem 1rem;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:2}
.modal-header h3{font-family:Manrope;font-size:1.65rem;letter-spacing:-.04em;margin:.25rem 0 .25rem}
.modal-header p{margin:0;color:var(--muted);font-size:.8rem}
.modal-close{width:38px;height:38px;border:1px solid var(--line);background:#fff;border-radius:12px;font-size:1.5rem;color:#657069;cursor:pointer}
.modal-form{padding:1.25rem 1.35rem 1.35rem}
.editor-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(240px,.7fr);gap:1rem}
.form-section{background:#fff;border:1px solid var(--line);border-radius:18px;padding:1.15rem;margin-bottom:1rem}
.section-heading{display:flex;gap:.8rem;align-items:flex-start;margin-bottom:1rem}
.section-number{font-family:Manrope;font-size:.7rem;color:var(--accent);font-weight:800;background:#edf5ef;padding:.42rem .5rem;border-radius:8px}
.section-heading h4{margin:0;font-family:Manrope;font-size:.95rem}
.section-heading p{margin:.2rem 0 0;color:var(--muted);font-size:.75rem}
.form-grid{display:grid;gap:.8rem}
.form-grid.two{grid-template-columns:1fr 1fr}
.span-2{grid-column:span 2}
.form-group{display:flex;flex-direction:column;gap:.35rem}
.form-group label,.group-title label,.limit-field label{font-size:.7rem;font-weight:800;color:#5d675f}
.form-group input,.form-group select,.form-group textarea,.group-title input,.limit-field input,.item-row input{
  width:100%;border:1px solid var(--line);background:#fbfcfb;color:var(--ink);padding:.78rem .82rem;border-radius:11px;outline:none;font:inherit;font-size:.82rem;transition:.2s
}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus,.group-title input:focus,.limit-field input:focus,.item-row input:focus{border-color:#91b5a0;box-shadow:0 0 0 3px rgba(28,122,76,.08)}
.money-field{display:flex;align-items:center;border:1px solid var(--line);background:#fbfcfb;border-radius:11px;padding-left:.78rem}
.money-field span{font-size:.78rem;color:#8b958e;font-weight:700}
.money-field input{border:0;background:transparent;padding-left:.3rem}
.money-field input:focus{box-shadow:none}
.image-editor{display:flex;gap:1rem;align-items:center}
.image-preview{width:150px;aspect-ratio:1.1;border-radius:16px;overflow:hidden;background:#eef1ee;flex:none}
.image-preview img{width:100%;height:100%;object-fit:cover}
.image-placeholder,.live-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#a0aaa4}
.image-placeholder span{font-size:2rem}
.image-copy p{font-size:.75rem;color:var(--muted);line-height:1.5;max-width:320px;margin:.7rem 0 0}
.upload-button{background:#eff5f0;color:var(--accent);border-radius:11px;padding:.72rem .9rem;font-size:.75rem}
.upload-button input{display:none}
.visibility-toggle{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:.95rem 1rem;border:1px solid var(--line);background:#fafcf9;border-radius:14px;cursor:pointer;position:relative}
.visibility-toggle strong{display:block;font-size:.8rem}.visibility-toggle small{display:block;color:var(--muted);font-size:.7rem;margin-top:.2rem}
.visibility-toggle input{position:absolute;opacity:0;pointer-events:none}
.toggle-ui{width:45px;height:25px;border-radius:999px;background:#d5ddd6;position:relative;flex:none;transition:.2s}
.toggle-ui::after{content:'';position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:50%;background:white;box-shadow:0 2px 5px rgba(0,0,0,.12);transition:.2s}
.visibility-toggle input:checked + .toggle-ui{background:var(--accent)}
.visibility-toggle input:checked + .toggle-ui::after{transform:translateX(20px)}
.editor-aside{position:sticky;top:5.5rem;height:max-content}
.live-card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 8px 20px rgba(31,43,35,.04)}
.live-label{padding:.8rem 1rem;font-size:.62rem;letter-spacing:.12em;font-weight:800;color:#7d877f;border-bottom:1px solid var(--line)}
.live-image{aspect-ratio:1.1;background:#eef1ee}
.live-image img{width:100%;height:100%;object-fit:cover}
.live-content{padding:1rem}
.live-content>span{font-size:.64rem;color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.live-content h5{font-family:Manrope;font-size:1rem;margin:.3rem 0}
.live-content p{font-size:.74rem;line-height:1.45;color:var(--muted);min-height:2.1em;margin:0 0 .7rem}
.live-content strong{font-family:Manrope;font-size:1rem}
.complements{padding:1.2rem}
.section-heading-inline{justify-content:space-between}
.section-heading-inline h4{font-family:Manrope;font-size:1rem;margin:.25rem 0 .25rem}
.btn-secondary{background:#eff5f0;color:var(--accent);padding:.68rem .88rem;border-radius:11px;font-size:.74rem}
.btn-secondary:hover{background:#e5f0e7}
.groups-empty{border:1px dashed #d8dfd9;border-radius:14px;padding:1.4rem;text-align:center;background:#fbfcfb}
.groups-empty strong{display:block;font-size:.8rem}.groups-empty span{display:block;color:var(--muted);font-size:.7rem;margin-top:.25rem}
.group-card{border:1px solid var(--line);border-radius:15px;padding:.95rem;background:#fbfcfb;margin-top:.8rem}
.group-top{display:grid;grid-template-columns:auto minmax(0,1fr) 72px 72px auto;gap:.55rem;align-items:end}
.group-index{font-family:Manrope;font-size:.73rem;font-weight:800;color:var(--accent);background:#edf5ef;border-radius:9px;padding:.65rem .55rem}
.limit-field{display:flex;flex-direction:column;gap:.35rem}
.limit-field input{text-align:center;padding:.65rem}
.group-controls{display:flex;gap:.25rem}
.group-controls button{width:32px;height:34px;border-radius:9px;border:1px solid var(--line);background:#fff;color:#657069;cursor:pointer}
.group-controls button:hover:not(:disabled){border-color:#bad0bf;color:var(--accent)}
.group-controls .danger{color:var(--danger)}
.group-controls button:disabled{opacity:.35;cursor:not-allowed}
.items-area{margin-top:.75rem;padding-left:2.15rem}
.item-row{display:grid;grid-template-columns:minmax(0,1fr) 125px 34px;gap:.4rem;margin-bottom:.45rem;align-items:center}
.item-price{display:flex;align-items:center;border:1px solid var(--line);border-radius:10px;background:#fff;padding-left:.6rem}
.item-price span{font-size:.7rem;color:#909a93}
.item-price input{border:0;background:transparent;padding:.65rem .45rem}
.item-price input:focus{box-shadow:none}
.item-delete{width:34px;height:34px;border-radius:9px;border:1px solid #f0d8d5;background:#fff7f6;color:var(--danger);cursor:pointer;font-size:1rem}
.add-item{border:1px dashed #b9c9bd;background:transparent;color:var(--accent);padding:.55rem .7rem;border-radius:9px;font-size:.7rem;font-weight:800;cursor:pointer}
.modal-actions{display:flex;justify-content:flex-end;gap:.55rem;padding-top:.2rem}
.btn-cancel{border:1px solid var(--line);background:#fff;color:#57625a;border-radius:11px;padding:.78rem 1rem;font-weight:800;cursor:pointer}
.btn-save{padding:.78rem 1.1rem}
.btn-save:disabled{opacity:.55;cursor:not-allowed;transform:none}
@media (max-width:1100px){
  .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:900px){
  .product-manager{padding:1rem}
  .editor-layout{grid-template-columns:1fr}
  .editor-aside{position:static}
}
@media (max-width:680px){
  .page-hero{align-items:flex-start;flex-direction:column}
  .page-hero .btn-primary{width:100%}
  .catalog-toolbar{align-items:flex-start;gap:.35rem;flex-direction:column}
  .toolbar-note{display:none}
  .product-grid{grid-template-columns:1fr}
  .form-grid.two{grid-template-columns:1fr}
  .span-2{grid-column:auto}
  .image-editor{align-items:flex-start;flex-direction:column}
  .group-top{grid-template-columns:auto 1fr 62px 62px}
  .group-controls{grid-column:2 / -1}
  .items-area{padding-left:0}
  .item-row{grid-template-columns:1fr 110px 34px}
  .modal-content{border-radius:18px}
}
</style>
