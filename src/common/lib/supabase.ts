import {
  SupabaseClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '../types/supabase';
import { extractDate } from './utils';

export const supabaseServer = () => {
  cookies().getAll();
  return createServerComponentClient<Database>({ cookies });
};

export const getAllAlbum = async (supabase: SupabaseClient<Database>) => {
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
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const res = await supabase
    .from('album')
    .insert({ coordinate, image_url, user_id: user?.id });
    console.log(res)
};
export const deleteAlbum = async (
  supabase: SupabaseClient<Database>,
  id: number
) => {
  const res = await supabase.from('album').delete().eq('id', id);
  return res;
};