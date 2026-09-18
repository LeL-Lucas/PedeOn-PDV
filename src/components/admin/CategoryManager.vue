<template>
  <section class="categories-shell">
    <div class="page-heading">
      <div>
        <span class="eyebrow">ORGANIZAÇÃO DO CARDÁPIO</span>
        <h2>Categorias</h2>
        <p>Estruture seu cardápio para que o cliente encontre o que quer sem esforço.</p>
      </div>
      <div class="count-pill"><strong>{{ categories.length }}</strong><span>{{ categories.length === 1 ? 'categoria' : 'categorias' }}</span></div>
    </div>

    <div class="category-layout">
      <div class="main-panel">
        <article class="panel-card add-panel">
          <div>
            <span class="section-kicker">Nova categoria</span>
            <h3>Adicione uma seção ao cardápio</h3>
            <p>Ex.: Hambúrgueres, Espetos, Bebidas, Sobremesas…</p>
          </div>
          <div class="add-form">
            <input type="text" v-model="newCategoryName" @keyup.enter="handleAddCategory" placeholder="Nome da categoria" />
            <button @click="handleAddCategory">Adicionar <span>+</span></button>
          </div>
        </article>

        <article class="panel-card list-panel">
          <div class="list-head">
            <div>
              <span class="section-kicker">Ordem de exibição</span>
              <h3>Seu cardápio começa aqui</h3>
            </div>
            <span class="list-hint">Arraste mentalmente a experiência: o topo recebe mais atenção.</span>
          </div>

          <div v-if="categories.length" class="category-list">
            <div v-for="(cat, index) in categories" :key="cat.id" class="category-item">
              <div class="drag-grip" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div class="category-index">{{ String(index + 1).padStart(2, '0') }}</div>
              <div class="category-icon">{{ cat.name?.charAt(0)?.toUpperCase() || 'C' }}</div>
              <div class="category-copy">
                <strong>{{ cat.name }}</strong>
                <span>{{ index === 0 ? 'Primeiro destaque do cardápio' : 'Posição ' + (index + 1) }}</span>
              </div>
              <div class="category-actions">
                <button @click="moveCategory(index, 'up')" :disabled="index === 0" title="Mover para cima">↑</button>
                <button @click="moveCategory(index, 'down')" :disabled="index === categories.length - 1" title="Mover para baixo">↓</button>
                <button @click="handleEditCategory(cat)" title="Editar">✎</button>
                <button class="danger" @click="handleDeleteCategory(cat.id)" title="Excluir">×</button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">+</div>
            <strong>Nenhuma categoria ainda</strong>
            <span>Crie a primeira seção para começar a montar o cardápio.</span>
          </div>
        </article>
      </div>

      <aside class="side-panel">
        <article class="panel-card tip-panel">
          <span class="section-kicker">Boa prática</span>
          <h3>Ordene pelo que mais vende.</h3>
          <p>Coloque as categorias mais importantes primeiro. Isso reduz o caminho até o pedido e melhora a descoberta dos produtos.</p>
          <div class="tip-example">
            <span class="tip-rank">01</span><strong>Mais pedidos</strong>
          </div>
          <div class="tip-example muted">
            <span class="tip-rank">02</span><strong>Entradas</strong>
          </div>
          <div class="tip-example muted">
            <span class="tip-rank">03</span><strong>Bebidas</strong>
          </div>
        </article>

        <article class="panel-card preview-panel">
          <span class="section-kicker">Visão rápida</span>
          <h3>Assim elas aparecem</h3>
          <div class="chip-preview">
            <span v-for="(cat, index) in categories.slice(0, 5)" :key="cat.id" :class="['chip', { active: index === 0 }]">{{ cat.name }}</span>
            <span v-if="categories.length > 5" class="chip more">+{{ categories.length - 5 }}</span>
          </div>
        </article>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategories } from '@/composables/useCategories'

const props = defineProps<{ storeId: string }>()

const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories(props.storeId)

const newCategoryName = ref('')

onMounted(async () => {
  await fetchCategories()
})

async function handleAddCategory() {
  if (!newCategoryName.value.trim()) return
  await addCategory(newCategoryName.value)
  newCategoryName.value = ''
  await fetchCategories()
}

async function handleDeleteCategory(id: string) {
  if (confirm('Excluir esta categoria?')) {
    await deleteCategory(id)
    await fetchCategories()
  }
}

async function handleEditCategory(cat: { id: string; name: string }) {
  const newName = prompt('Novo nome:', cat.name)
  if (newName && newName.trim() && newName !== cat.name) {
    try {
      await updateCategory(cat.id, { name: newName.trim() })
      await fetchCategories()
    } catch (err: unknown) {
      console.error('Erro ao atualizar categoria:', err)
      alert('Erro ao atualizar categoria.')
    }
  }
}

async function moveCategory(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= categories.value.length) return

  const items = [...categories.value]
  const temp = items[index]!
  items[index] = items[newIndex]!
  items[newIndex] = temp

  categories.value = items
  await reorderCategories(categories.value)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
.categories-shell{--ink:#171717;--muted:#766f68;--line:#ebe6df;--soft:#f8f6f2;background:#f7f5f1;min-height:100%;padding:32px;color:var(--ink);font-family:'DM Sans',system-ui,sans-serif;}
.page-heading{max-width:1180px;margin:0 auto 24px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;}
.eyebrow,.section-kicker{display:block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#a19890;margin-bottom:8px;}
.page-heading h2{margin:0;font:800 clamp(30px,4vw,42px)/1 'Manrope',sans-serif;letter-spacing:-.04em;}
.page-heading p{margin:9px 0 0;color:var(--muted);font-size:14px;}
.count-pill{display:flex;align-items:baseline;gap:7px;padding:10px 13px;background:#fff;border:1px solid var(--line);border-radius:999px;white-space:nowrap;}
.count-pill strong{font:800 14px 'Manrope',sans-serif;}.count-pill span{font-size:11px;color:#918980;}
.category-layout{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.65fr);gap:20px;align-items:start;}
.main-panel,.side-panel{display:flex;flex-direction:column;gap:20px;min-width:0;}
.panel-card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:24px;box-shadow:0 14px 40px rgba(32,24,16,.035);}
.panel-card h3{margin:0;font:800 18px/1.2 'Manrope',sans-serif;letter-spacing:-.025em;}.panel-card p{color:var(--muted);font-size:13px;line-height:1.5;}
.add-panel{display:grid;grid-template-columns:.9fr 1.1fr;gap:24px;align-items:end;}
.add-panel p{margin-bottom:0;}.add-form{display:flex;gap:9px;}.add-form input{flex:1;height:46px;border:1px solid #ded7ce;background:#fcfbf9;border-radius:12px;padding:0 13px;outline:none;font:500 13px 'DM Sans',sans-serif;}.add-form input:focus{border-color:#aaa095;box-shadow:0 0 0 4px rgba(170,160,149,.1);}.add-form button{height:46px;padding:0 15px;border:0;border-radius:12px;background:#171717;color:#fff;font-size:12px;font-weight:800;cursor:pointer;}.add-form button span{font-size:16px;margin-left:5px;}
.list-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px;}.list-hint{max-width:260px;text-align:right;color:#a39a91;font-size:10px;line-height:1.4;}
.category-list{display:flex;flex-direction:column;gap:8px;}.category-item{display:grid;grid-template-columns:16px 30px 42px 1fr auto;align-items:center;gap:12px;min-height:72px;padding:10px 12px;border:1px solid #eee9e3;border-radius:15px;background:#fcfbf9;transition:.2s;}.category-item:hover{background:#fff;border-color:#dfd8cf;transform:translateY(-1px);box-shadow:0 10px 25px rgba(32,24,16,.04);}.drag-grip{display:grid;grid-template-columns:repeat(2,4px);gap:3px;opacity:.25;}.drag-grip i{width:4px;height:4px;background:#655e57;border-radius:50%;}.category-index{font:800 11px 'Manrope',sans-serif;color:#b0a79f;}.category-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#efeae4;color:#514a44;font-weight:800;}.category-copy strong{display:block;font-size:13px;}.category-copy span{display:block;margin-top:3px;font-size:10px;color:#a09992;}.category-actions{display:flex;gap:5px;}.category-actions button{width:32px;height:32px;border:1px solid #e3ddd6;background:#fff;border-radius:9px;color:#5e5750;cursor:pointer;font-size:15px;}.category-actions button:hover:not(:disabled){background:#f3f0eb;}.category-actions button:disabled{opacity:.28;cursor:not-allowed;}.category-actions .danger{color:#a05d55;}.empty-state{min-height:250px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;gap:6px;border:1px dashed #ded7ce;border-radius:17px;background:#fcfbf9;color:#8c847c;}.empty-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:#f0ece7;font-size:22px;color:#6f675f;margin-bottom:5px;}.empty-state strong{color:#4c4640;font-size:14px;}.empty-state span{font-size:11px;}.tip-panel{background:#171717;color:#fff;border-color:#171717;}.tip-panel .section-kicker{color:#8f8a84;}.tip-panel h3{max-width:240px;font-size:22px;}.tip-panel p{color:#aca8a3;margin:10px 0 18px;}.tip-example{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid rgba(255,255,255,.08);font-size:12px;}.tip-example.muted{opacity:.6;}.tip-rank{font:800 10px 'Manrope',sans-serif;color:#85807b;width:22px;}.preview-panel h3{margin-bottom:14px;}.chip-preview{display:flex;flex-wrap:wrap;gap:7px;}.chip{display:inline-flex;align-items:center;padding:9px 11px;border-radius:999px;background:#f1ede8;color:#676059;font-size:10px;font-weight:700;}.chip.active{background:#171717;color:#fff;}.chip.more{background:#fff;border:1px solid var(--line);color:#918980;}
@media(max-width:960px){.category-layout{grid-template-columns:1fr;}.add-panel{grid-template-columns:1fr;}.list-hint{display:none;}}
@media(max-width:680px){.categories-shell{padding:18px;}.page-heading{align-items:flex-start;flex-direction:column;}.count-pill{display:none;}.panel-card{padding:18px;border-radius:18px;}.add-form{flex-direction:column;}.category-item{grid-template-columns:14px 26px 38px 1fr;}.category-icon{width:38px;height:38px;}.category-actions{grid-column:4;justify-content:flex-start;margin-top:4px;}.category-copy{min-width:0;}.category-copy strong,.category-copy span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.category-actions button{width:30px;height:30px;}}
</style>
