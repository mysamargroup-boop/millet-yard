import { supabaseAdmin } from './supabase';

export interface SlidingCard {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_hint?: string;
  link_url?: string;
  order_num: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSlidingCards(): Promise<SlidingCard[]> {
  const { data, error } = await supabaseAdmin()
    .from('sliding_cards')
    .select('*')
    .order('order_num', { ascending: true });

  if (error) {
    console.error('Error fetching sliding cards:', error);
    return [];
  }

  return data || [];
}

export async function getActiveSlidingCards(): Promise<SlidingCard[]> {
  const { data, error } = await supabaseAdmin()
    .from('sliding_cards')
    .select('*')
    .eq('active', true)
    .order('order_num', { ascending: true });

  if (error) {
    console.error('Error fetching active sliding cards:', error);
    return [];
  }

  return data || [];
}
