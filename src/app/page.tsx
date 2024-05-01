import { getAllAlbum } from '@/common/lib/supabase';
import { supabaseServer } from '@/common/lib/supabaseServerClient';
import Mapbox from '@/components/features/Map';

export default async function Home() {
  const album = await getAllAlbum(supabaseServer());
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Mapbox album={album} />
    </main>
  );
}
