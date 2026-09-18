export interface TableTab {
  id: number;
  company_id: string;
  table_number: string;
  customer_name: string | null;
  status: 'free' | 'busy';
  opened_at?: string;
}
