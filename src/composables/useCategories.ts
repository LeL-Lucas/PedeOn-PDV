import { ref, unref } from 'vue'
import { supabase } from '@/services/supabase'

const categories = ref<any[]>([])
const loading = ref(false)

export function useCategories(storeId?: any) {

  const getStoreId = () => unref(storeId) || ''


  const fetchCategories = async (customStoreId?: string) => {

    const id = customStoreId || getStoreId()

    if (!id) return

    loading.value = true

    let { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', id)
      .order('sort_order', { ascending: true })


    // fallback caso não exista sort_order
    if (error) {

      const fallback = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', id)
        .order('created_at', { ascending: true })


      data = fallback.data
    }


    categories.value = data || []

    loading.value = false
  }



  const addCategory = async (categoryData:any) => {

    loading.value = true

    const currentStoreId = getStoreId()


    const payload =
      typeof categoryData === 'string'
      ?
      {
        name: categoryData,
        store_id: currentStoreId,
        sort_order: categories.value.length
      }
      :
      {
        ...categoryData,
        store_id: categoryData.store_id || currentStoreId,
        sort_order: categories.value.length
      }



    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()



    if(error){

      delete payload.sort_order

      const retry = await supabase
        .from('categories')
        .insert([payload])
        .select()


      if(retry.data){
        categories.value.push(retry.data[0])
      }

    }else if(data){

      categories.value.push(data[0])

    }


    loading.value=false
  }




  // NOVO - corrigido
  const updateCategory = async (
    categoryId:string,
    updates:any
  )=>{

    loading.value=true


    const {error}=await supabase
      .from('categories')
      .update(updates)
      .eq('id',categoryId)



    if(error){

      console.error(
        'Erro ao atualizar categoria:',
        error
      )

      loading.value=false

      throw error
    }


    await fetchCategories()


    loading.value=false
  }




  const deleteCategory = async(categoryId:string)=>{

    loading.value=true


    const {error}=await supabase
      .from('categories')
      .delete()
      .eq('id',categoryId)



    if(!error){

      categories.value =
        categories.value.filter(
          c=>c.id !== categoryId
        )

    }


    loading.value=false
  }





  const reorderCategories = async(
    newCategoriesOrder:any[]
  )=>{


    categories.value=[
      ...newCategoriesOrder
    ]


    try{


      const updates =
        newCategoriesOrder.map(
          (cat,index)=>

          supabase
            .from('categories')
            .update({
              sort_order:index
            })
            .eq(
              'id',
              cat.id
            )

        )


      await Promise.all(updates)



    }catch(err){

      console.error(
        'Erro ao salvar ordem:',
        err
      )

    }

  }




  return {

    categories,

    loading,

    fetchCategories,

    addCategory,

    updateCategory,

    deleteCategory,

    reorderCategories

  }

}
