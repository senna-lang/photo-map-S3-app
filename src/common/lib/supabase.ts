import {
  SupabaseClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '../types/supabase';

export const supabaseServer = () => {
  cookies().getAll();
  return createServerComponentClient<Database>({ cookies });
};

export const getAllAlbum = async (supabase: SupabaseClient<Database>) => {
  const { data } = await supabase.from('album').select();
  const res = data!.map(data => {
    const coordinate = JSON.parse(data.coordinate!);
    const newObj = { ...data, coordinate };
    return newObj;
  });
  return res;
};
