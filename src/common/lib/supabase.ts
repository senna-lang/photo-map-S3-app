import {
  SupabaseClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { extractDate } from './utils';
import { Album } from '../types/types';

export const getAllAlbum = async (
  supabase: SupabaseClient<Database>
): Promise<Album[]> => {
  const { data } = await supabase.from('album').select();
  const res = data!.map(data => {
    const coordinate = JSON.parse(data.coordinate!);
    const created_at = extractDate(data.created_at);
    const newObj = { ...data, coordinate, created_at };
    return newObj;
  });
  return res;
};

export const insertAlbum = async (
  supabase: SupabaseClient<Database>,
  coordinate: string,
  image_url: string[]
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const res = await supabase
    .from('album')
    .insert({ coordinate, image_url, user_id: user?.id });
  console.log(res);
};

export const deleteAlbum = async (
  supabase: SupabaseClient<Database>,
  id: number
): Promise<void> => {
  const res = await supabase.from('album').delete().eq('id', id);
  console.log(res);
};
