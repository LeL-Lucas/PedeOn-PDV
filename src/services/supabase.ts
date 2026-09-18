import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://misntxirajngjcdpqwwn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_XiTXsF2XEeK_mFIJRMkJ1w_lD3F5HN-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)