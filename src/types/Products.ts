export interface ComplementItem {
  name: string
  price: number
}

export interface ComplementGroup {
  title: string
  min: number
  max: number
  items: ComplementItem[]
}

export interface Product {
  id: string
  store_id: string
  category_id?: string | null
  name: string
  description?: string
  price: number
  image_url?: string
  active?: boolean
  show_in_storefront?: boolean
  complement_groups?: ComplementGroup[]
  created_at?: string
}
