import { ref, unref } from 'vue'
import { supabase } from '@/services/supabase'

import type { Product } from '@/types/Products'

// mantém compatibilidade com imports antigos
export type { Product }



export interface ComplementItem {
  name:string
  price:number
}


export interface ComplementGroup {

  title:string

  min:number

  max:number

  items:ComplementItem[]

}




const products = ref<Product[]>([])

const loading = ref(false)



export function useProducts(
  storeId?:string | (()=>string) | null
){



  const getStoreId = ():string=>{

    const resolved =
      unref(storeId)


    return typeof resolved === 'string'
      ?
      resolved
      :
      ''

  }





  const fetchProducts = async(
    customStoreId?:string,
    onlyStorefront=false
  )=>{


    const id =
      customStoreId || getStoreId()


    if(!id) return



    loading.value=true



    let query =
      supabase
      .from('products')
      .select('*')
      .eq(
        'store_id',
        id
      )



    if(onlyStorefront){

      query =
        query.or(
          'show_in_storefront.is.null,show_in_storefront.eq.true'
        )

    }



    const {
      data,
      error
    } =
      await query.order(
        'created_at',
        {
          ascending:false
        }
      )



    if(error){

      console.error(
        'Erro ao buscar produtos:',
        error
      )

    }else{


      products.value =
        (data as Product[]) || []


    }



    loading.value=false


  }







  const addProduct = async(
    productData:Product
  )=>{


    loading.value=true


    const payload={

      ...productData,

      store_id:
        productData.store_id ||
        getStoreId()

    }



    const {
      data,
      error
    }=
      await supabase
      .from('products')
      .insert([payload])
      .select()



    if(error){

      console.error(
        error
      )

      loading.value=false

      throw error
    }



    if(data && data.length){

      products.value.unshift(
        data[0] as Product
      )

    }else{

      await fetchProducts()

    }



    loading.value=false


    return data

  }







  const updateProduct = async(
    productId:string,
    updates:Partial<Product>
  )=>{


    loading.value=true



    const {error}=await supabase
      .from('products')
      .update(updates)
      .eq(
        'id',
        productId
      )



    if(error){

      loading.value=false

      throw error

    }



    await fetchProducts()


    loading.value=false

  }







  const deleteProduct = async(
    productId:string
  )=>{


    loading.value=true



    await supabase
      .from('products')
      .delete()
      .eq(
        'id',
        productId
      )



    products.value =
      products.value.filter(
        p=>p.id !== productId
      )



    loading.value=false

  }







  const subscribeToProducts = ()=>{


    const id=getStoreId()


    if(!id)
      return null



    return supabase
      .channel(
        `products-realtime-${id}`
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'products',
          filter:`store_id=eq.${id}`
        },
        ()=>{
          fetchProducts(id)
        }
      )
      .subscribe()

  }





  return {

    products,

    loading,

    fetchProducts,

    addProduct,

    updateProduct,

    deleteProduct,

    subscribeToProducts

  }


}
