import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Category, Gender, Season } from '@/types/catalog';

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    supabase
      .from('seasons')
      .select('id, name, slug, is_active')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setSeasons((data ?? []) as unknown as Season[]));
  }, []);

  return seasons;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, parent_id, name, slug')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setCategories((data ?? []) as unknown as Category[]));
  }, []);

  return categories;
}

export function useGenders() {
  const [genders, setGenders] = useState<Gender[]>([]);

  useEffect(() => {
    supabase
      .from('genders')
      .select('id, name, slug, is_active')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setGenders((data ?? []) as unknown as Gender[]));
  }, []);

  return genders;
}
