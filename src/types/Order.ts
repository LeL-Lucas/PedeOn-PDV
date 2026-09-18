export interface Order {
  id: string
  store_id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  items: any[]
  total: number
  status: 'pendente' | 'producao' | 'entrega' | 'concluido'
  created_at: string
}